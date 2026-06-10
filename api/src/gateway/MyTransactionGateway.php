<?php

class MyTransactionGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // Lookup
    // -------------------------------------------------------------------------

    private function findCustomerIdByUser(int $id_user): int
    {
        $stmt = $this->db->prepare(
            "SELECT id_customer FROM customers WHERE id_user = :id_user LIMIT 1"
        );
        $stmt->execute([':id_user' => $id_user]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException("Profil customer tidak ditemukan.", 404);
        }

        return (int) $row['id_customer'];
    }

    // -------------------------------------------------------------------------
    // Hitung total transaksi (untuk pagination)
    // -------------------------------------------------------------------------

    public function countTransactions(int $id_user, ?string $status): int
    {
        $id_customer = $this->findCustomerIdByUser($id_user);

        $sql = "SELECT COUNT(*) 
                FROM transactions t
                JOIN subscriptions s ON t.id_subscription = s.id_subscription
                WHERE s.id_customer = :id_customer";

        $params = [':id_customer' => $id_customer];

        if ($status !== null) {
            $sql             .= " AND t.payment_status = :status";
            $params[':status'] = $status;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    // -------------------------------------------------------------------------
    // Ambil daftar transaksi customer (dengan pagination & filter status)
    // -------------------------------------------------------------------------

    public function getTransactions(
        int     $id_user,
        ?string $status,
        int     $limit,
        int     $offset
    ): array {
        $id_customer = $this->findCustomerIdByUser($id_user);

        $allowedStatus = ['pending', 'settlement', 'expire', 'cancel'];

        $sql = "SELECT
                    t.id_transaction,
                    t.invoice_number,
                    t.payment_type,
                    t.amount,
                    t.payment_status,
                    t.paid_at,
                    t.created_at,
                    p.name_package,
                    p.speed_mbps,
                    pr.name_company AS provider_name
                FROM transactions t
                JOIN subscriptions s ON t.id_subscription = s.id_subscription
                JOIN packages p      ON s.id_package      = p.id_package
                JOIN providers pr    ON p.id_provider     = pr.id_provider
                WHERE s.id_customer = :id_customer";

        $params = [':id_customer' => $id_customer];

        if ($status !== null && in_array($status, $allowedStatus, true)) {
            $sql             .= " AND t.payment_status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY t.created_at DESC";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        // Tambahkan LIMIT & OFFSET setelah binding params lain
        $sql  .= " LIMIT :limit OFFSET :offset";
        $stmt  = $this->db->prepare($sql);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // Detail satu transaksi (pastikan milik customer yang login)
    // -------------------------------------------------------------------------

    public function getTransactionById(int $id_user, int $id_transaction): array|false
    {
        $id_customer = $this->findCustomerIdByUser($id_user);

        $stmt = $this->db->prepare(
            "SELECT
                t.id_transaction,
                t.invoice_number,
                t.payment_type,
                t.amount,
                t.payment_status,
                t.snap_token,
                t.paid_at,
                t.created_at,
                p.name_package,
                p.speed_mbps,
                p.price_per_month,
                p.installation_cost,
                pr.name_company  AS provider_name,
                pr.contact_cs    AS provider_contact
            FROM transactions t
            JOIN subscriptions s ON t.id_subscription = s.id_subscription
            JOIN packages p      ON s.id_package      = p.id_package
            JOIN providers pr    ON p.id_provider     = pr.id_provider
            WHERE t.id_transaction = :id_transaction
              AND s.id_customer    = :id_customer"
        );

        $stmt->execute([
            ':id_transaction' => $id_transaction,
            ':id_customer'    => $id_customer,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}