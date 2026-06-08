<?php

class ProviderReportGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // 1. Mencari ID Provider berdasarkan ID User (dari Token JWT)
    public function getProviderIdByUserId(int $id_user): ?int
    {
        $sql = "SELECT id_provider FROM providers WHERE id_user = :id_user LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int) $result['id_provider'] : null;
    }

    // 2. Fungsi Utama: Menghitung, Menyimpan (Upsert), dan Mengambil Laporan
    public function generateAndGetReport(int $id_provider): array
    {
        $currentMonth = (int) date('n'); // Angka bulan 1-12
        $currentYear = (int) date('Y');  // Angka tahun (Contoh: 2026)

        // A. Hitung Pendapatan Bulan Ini (Hanya transaksi 'settlement')
        $sqlRevenue = "SELECT COALESCE(SUM(t.amount), 0) as revenue
                       FROM transactions t
                       JOIN subscriptions s ON t.id_subscription = s.id_subscription
                       JOIN packages p ON s.id_package = p.id_package
                       WHERE p.id_provider = :id_provider 
                         AND MONTH(COALESCE(t.paid_at, t.created_at)) = :month 
                         AND YEAR(COALESCE(t.paid_at, t.created_at)) = :year
                         AND t.payment_status = 'settlement'";
        $stmtRev = $this->db->prepare($sqlRevenue);
        $stmtRev->execute(['id_provider' => $id_provider, 'month' => $currentMonth, 'year' => $currentYear]);
        $revenue = (int) $stmtRev->fetchColumn();

        // B. Hitung Langganan Baru Bulan Ini
        $sqlNewSubs = "SELECT COUNT(s.id_subscription) 
                       FROM subscriptions s
                       JOIN packages p ON s.id_package = p.id_package
                       WHERE p.id_provider = :id_provider 
                         AND MONTH(s.start_date) = :month 
                         AND YEAR(s.start_date) = :year";
        $stmtSubs = $this->db->prepare($sqlNewSubs);
        $stmtSubs->execute(['id_provider' => $id_provider, 'month' => $currentMonth, 'year' => $currentYear]);
        $newSubs = (int) $stmtSubs->fetchColumn();

        // C. Hitung Total Pelanggan Aktif Keseluruhan
        $sqlActive = "SELECT COUNT(DISTINCT s.id_customer) 
                      FROM subscriptions s
                      JOIN packages p ON s.id_package = p.id_package
                      WHERE p.id_provider = :id_provider 
                        AND s.status_subscription = 'active'";
        $stmtActive = $this->db->prepare($sqlActive);
        $stmtActive->execute(['id_provider' => $id_provider]);
        $activeCust = (int) $stmtActive->fetchColumn();

        // E. NEW: Hitung Total Laporan Gangguan (Issues) Bulan Ini
        $sqlIssues = "SELECT COUNT(id_issue) 
                      FROM network_issues
                      WHERE id_provider = :id_provider
                        AND MONTH(created_at) = :month
                        AND YEAR(created_at) = :year";
        $stmtIssues = $this->db->prepare($sqlIssues);
        $stmtIssues->execute(['id_provider' => $id_provider, 'month' => $currentMonth, 'year' => $currentYear]);
        $totalIssues = (int) $stmtIssues->fetchColumn();

        // F. NEW: Hitung Total Paket yang Dimiliki Provider
        $sqlPackages = "SELECT COUNT(id_package) 
                        FROM packages
                        WHERE id_provider = :id_provider";
        $stmtPackages = $this->db->prepare($sqlPackages);
        $stmtPackages->execute(['id_provider' => $id_provider]);
        $totalPackages = (int) $stmtPackages->fetchColumn();

        // G. Fitur UPSERT: Masukkan atau Perbarui ke tabel `monthly_reports` (Sudah diperbarui)
        $sqlUpsert = "INSERT INTO monthly_reports 
                        (id_provider, report_month, report_year, total_revenue, total_new_subscriptions, total_active_customers, total_issues, total_packages)
                      VALUES 
                        (:id_provider, :month, :year, :revenue, :new_subs, :active_cust, :issues, :packages)
                      ON DUPLICATE KEY UPDATE 
                        total_revenue = VALUES(total_revenue),
                        total_new_subscriptions = VALUES(total_new_subscriptions),
                        total_active_customers = VALUES(total_active_customers),
                        total_issues = VALUES(total_issues),
                        total_packages = VALUES(total_packages)";
        
        $stmtUpsert = $this->db->prepare($sqlUpsert);
        $stmtUpsert->execute([
            'id_provider' => $id_provider,
            'month'       => $currentMonth,
            'year'        => $currentYear,
            'revenue'     => $revenue,
            'new_subs'    => $newSubs,
            'active_cust' => $activeCust,
            'issues'      => $totalIssues,
            'packages'    => $totalPackages
        ]);

        // Mengembalikan data hasil kalkulasi real-time ke Frontend
        return [
            "report_month"            => $currentMonth,
            "report_year"             => $currentYear,
            "total_revenue"           => $revenue,
            "total_new_subscriptions" => $newSubs,
            "total_active_customers"  => $activeCust,
            "total_issues"            => $totalIssues,
            "total_packages"          => $totalPackages
        ];
    }
}