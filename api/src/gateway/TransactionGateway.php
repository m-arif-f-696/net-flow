<?php

class TransactionGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // Lookup
    // -------------------------------------------------------------------------

    public function findProviderIdByUser(int $id_user): int
    {
        $stmt = $this->db->prepare(
            "SELECT id_provider FROM providers WHERE id_user = :id_user LIMIT 1"
        );
        $stmt->execute([':id_user' => $id_user]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException("Profil provider tidak ditemukan.", 404);
        }

        return (int) $row['id_provider'];
    }

    // -------------------------------------------------------------------------
    // Summary (MRR, Growth, ARPU, Active Subs)
    // -------------------------------------------------------------------------

    public function getSummary(int $id_provider, int $month, int $year): array
    {
        // MRR bulan yang dipilih
        $stmtMrr = $this->db->prepare(
            "SELECT COALESCE(SUM(t.amount), 0) AS mrr
             FROM transactions t
             JOIN subscriptions s ON t.id_subscription = s.id_subscription
             JOIN packages pk     ON s.id_package = pk.id_package
             WHERE pk.id_provider   = :id_provider
               AND t.payment_status = 'settlement'
               AND t.payment_type   = 'monthly'
               AND MONTH(t.paid_at) = :month
               AND YEAR(t.paid_at)  = :year"
        );
        $stmtMrr->execute([
            ':id_provider' => $id_provider,
            ':month'       => $month,
            ':year'        => $year,
        ]);
        $mrr = (int) $stmtMrr->fetchColumn();

        // Active subscriptions (realtime, tidak tergantung bulan)
        $stmtSubs = $this->db->prepare(
            "SELECT COUNT(*) 
             FROM subscriptions s
             JOIN packages pk ON s.id_package = pk.id_package
             WHERE pk.id_provider        = :id_provider
               AND s.status_subscription = 'active'"
        );
        $stmtSubs->execute([':id_provider' => $id_provider]);
        $activeSubs = (int) $stmtSubs->fetchColumn();

        // Churn rate bulan ini
        // Churn = terminated bulan ini / (active + terminated bulan ini) * 100
        $stmtChurn = $this->db->prepare(
            "SELECT COUNT(*) 
             FROM subscriptions s
             JOIN packages pk ON s.id_package = pk.id_package
             WHERE pk.id_provider        = :id_provider
               AND s.status_subscription = 'terminated'
               AND MONTH(s.updated_at)   = :month
               AND YEAR(s.updated_at)    = :year"
        );
        $stmtChurn->execute([
            ':id_provider' => $id_provider,
            ':month'       => $month,
            ':year'        => $year,
        ]);
        $terminated = (int) $stmtChurn->fetchColumn();
        $churnBase  = $activeSubs + $terminated;
        $churnRate  = $churnBase > 0 ? round(($terminated / $churnBase) * 100, 2) : 0;

        // Growth: bandingkan MRR bulan ini vs bulan sebelumnya dari monthly_reports
        $prevMonth = $month === 1 ? 12 : $month - 1;
        $prevYear  = $month === 1 ? $year - 1 : $year;

        $stmtPrev = $this->db->prepare(
            "SELECT total_revenue FROM monthly_reports
             WHERE id_provider  = :id_provider
               AND report_month = :month
               AND report_year  = :year"
        );
        $stmtPrev->execute([
            ':id_provider' => $id_provider,
            ':month'       => $prevMonth,
            ':year'        => $prevYear,
        ]);
        $prevRevenue = (int) ($stmtPrev->fetchColumn() ?: 0);

        $growth = $prevRevenue > 0
            ? round((($mrr - $prevRevenue) / $prevRevenue) * 100, 1)
            : 0;

        return [
            'mrr'                        => $mrr,
            'growth_percent'             => $growth,
            'total_active_subscriptions' => $activeSubs,
            'arpu'                       => $activeSubs > 0 ? (int) round($mrr / $activeSubs) : 0,
            'churn_rate'                 => $churnRate,
            'period'                     => [
                'month' => $month,
                'year'  => $year,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Outstanding (tagihan belum dibayar)
    // -------------------------------------------------------------------------

    public function getOutstanding(int $id_provider): array
    {
        // Total unpaid
        $stmtTotal = $this->db->prepare(
            "SELECT COALESCE(SUM(t.amount), 0) AS total
             FROM transactions t
             JOIN subscriptions s ON t.id_subscription = s.id_subscription
             JOIN packages pk     ON s.id_package = pk.id_package
             WHERE pk.id_provider   = :id_provider
               AND t.payment_status = 'pending'"
        );
        $stmtTotal->execute([':id_provider' => $id_provider]);
        $totalUnpaid = (int) $stmtTotal->fetchColumn();

        // Jatuh tempo 1-30 hari
        $stmt30 = $this->db->prepare(
            "SELECT COALESCE(SUM(t.amount), 0) AS total
             FROM transactions t
             JOIN subscriptions s ON t.id_subscription = s.id_subscription
             JOIN packages pk     ON s.id_package = pk.id_package
             WHERE pk.id_provider            = :id_provider
               AND t.payment_status          = 'pending'
               AND DATEDIFF(NOW(), t.created_at) BETWEEN 1 AND 30"
        );
        $stmt30->execute([':id_provider' => $id_provider]);
        $pastDue30 = (int) $stmt30->fetchColumn();

        // Jatuh tempo 31+ hari
        $stmt31 = $this->db->prepare(
            "SELECT COALESCE(SUM(t.amount), 0) AS total
             FROM transactions t
             JOIN subscriptions s ON t.id_subscription = s.id_subscription
             JOIN packages pk     ON s.id_package = pk.id_package
             WHERE pk.id_provider            = :id_provider
               AND t.payment_status          = 'pending'
               AND DATEDIFF(NOW(), t.created_at) > 30"
        );
        $stmt31->execute([':id_provider' => $id_provider]);
        $pastDue31 = (int) $stmt31->fetchColumn();

        // Sudah terbayar bulan ini (untuk hitung persentase collected)
        $stmtPaid = $this->db->prepare(
            "SELECT COALESCE(SUM(t.amount), 0) AS total
             FROM transactions t
             JOIN subscriptions s ON t.id_subscription = s.id_subscription
             JOIN packages pk     ON s.id_package = pk.id_package
             WHERE pk.id_provider   = :id_provider
               AND t.payment_status = 'settlement'
               AND MONTH(t.paid_at) = MONTH(NOW())
               AND YEAR(t.paid_at)  = YEAR(NOW())"
        );
        $stmtPaid->execute([':id_provider' => $id_provider]);
        $totalPaid = (int) $stmtPaid->fetchColumn();

        $grandTotal       = $totalUnpaid + $totalPaid;
        $collectedPercent = $grandTotal > 0
            ? (int) round(($totalPaid / $grandTotal) * 100)
            : 0;

        return [
            'total_unpaid'       => $totalUnpaid,
            'collected_percent'  => $collectedPercent,
            'past_due_30'        => $pastDue30,
            'past_due_31_plus'   => $pastDue31,
        ];
    }

    // -------------------------------------------------------------------------
    // Transaction list (dengan filter bulan, tahun, status, pagination)
    // -------------------------------------------------------------------------

    public function countTransactions(
        int     $id_provider,
        int     $month,
        int     $year,
        ?string $status
    ): int {
        $sql = "SELECT COUNT(*) 
                FROM transactions t
                JOIN subscriptions s ON t.id_subscription = s.id_subscription
                JOIN packages pk     ON s.id_package = pk.id_package
                WHERE pk.id_provider     = :id_provider
                AND MONTH(t.created_at) = :month
                AND YEAR(t.created_at)  = :year";

        $params = [
            ':id_provider' => $id_provider,
            ':month'       => $month,
            ':year'        => $year,
        ];

        $allowedStatus = ['pending', 'settlement', 'expire', 'cancel'];
        if ($status !== null && in_array($status, $allowedStatus, true)) {
            $sql             .= " AND t.payment_status = :status";
            $params[':status'] = $status;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }
    
    public function getTransactions(
        int     $id_provider,
        int     $month,
        int     $year,
        ?string $status,
        int     $limit  = 10,
        int     $offset = 0
    ): array {
        $allowedStatus = ['pending', 'settlement', 'expire', 'cancel'];

        $sql = "SELECT 
                    t.id_transaction,
                    t.invoice_number,
                    c.full_name        AS customer_name,
                    pk.name_package    AS package_name,
                    t.payment_type,
                    t.amount,
                    t.payment_status,
                    t.paid_at,
                    t.created_at
                FROM transactions t
                JOIN subscriptions s ON t.id_subscription = s.id_subscription
                JOIN packages pk     ON s.id_package = pk.id_package
                JOIN customers c     ON s.id_customer = c.id_customer
                WHERE pk.id_provider     = :id_provider
                AND MONTH(t.created_at) = :month
                AND YEAR(t.created_at)  = :year";

        $params = [
            ':id_provider' => $id_provider,
            ':month'       => $month,
            ':year'        => $year,
        ];

        $filter = null;
        if ($status !== null && in_array($status, $allowedStatus, true)) {
            $sql             .= " AND t.payment_status = :status";
            $filter = $status;
        }

        $sql .= " ORDER BY t.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);

        // LIMIT & OFFSET wajib bind sebagai INT, tidak bisa lewat array execute
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_INT);
        }

        if($filter){
            $stmt->bindValue(':status', $filter, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}