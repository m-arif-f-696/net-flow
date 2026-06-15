<?php

class PaymentCallbackGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // Lookup: Cari transaksi by invoice_number (= order_id dari Midtrans)
    // Juga ambil data relasi untuk notifikasi (id_user customer & provider)
    // -------------------------------------------------------------------------

    public function findTransactionByInvoiceNumber(string $invoice_number): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT
                t.id_transaction,
                t.id_subscription,
                t.invoice_number,
                t.payment_type,
                t.payment_status,
                t.amount,
                c.full_name      AS customer_name,
                uc.id_user       AS id_user_customer,
                up.id_user       AS id_user_provider,
                pk.name_package
             FROM transactions t
             JOIN subscriptions s  ON t.id_subscription = s.id_subscription
             JOIN customers c      ON s.id_customer      = c.id_customer
             JOIN users uc         ON c.id_user          = uc.id_user
             JOIN packages pk      ON s.id_package       = pk.id_package
             JOIN providers pr     ON pk.id_provider     = pr.id_provider
             JOIN users up         ON pr.id_user         = up.id_user
             WHERE t.invoice_number = :invoice_number
             LIMIT 1"
        );
        $stmt->execute([':invoice_number' => $invoice_number]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Tandai transaksi sebagai settlement (lunas)
    // -------------------------------------------------------------------------

    public function updateTransactionSettlement(int $id_transaction): void
    {
        $stmt = $this->db->prepare(
            "UPDATE transactions
             SET payment_status = 'settlement',
                 paid_at        = NOW()
             WHERE id_transaction = :id_transaction"
        );
        $stmt->execute([':id_transaction' => $id_transaction]);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Tandai transaksi gagal/kadaluarsa (expire / cancel)
    // -------------------------------------------------------------------------

    public function updateTransactionStatus(int $id_transaction, string $status): void
    {
        $allowed = ['expire', 'cancel'];
        if (!in_array($status, $allowed, true)) return;

        $stmt = $this->db->prepare(
            "UPDATE transactions
             SET payment_status = :status
             WHERE id_transaction = :id_transaction"
        );
        $stmt->execute([
            ':status'         => $status,
            ':id_transaction' => $id_transaction,
        ]);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Update status schedule menjadi approved
    // -------------------------------------------------------------------------

    public function approvedSchedule(int $id_subscription): void
    {
        $stmt = $this->db->prepare(
            "UPDATE installation_schedules 
            SET status_schedule = 'approved' 
            WHERE id_subscription = :id_subscription"
        );
        $stmt->execute([':id_subscription' => $id_subscription]);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Perpanjang end_date +30 hari untuk pembayaran bulanan
    // -------------------------------------------------------------------------

    public function extendSubscription(int $id_subscription): void
    {
        $stmt = $this->db->prepare(
            "UPDATE subscriptions
             SET end_date = DATE_ADD(end_date, INTERVAL 30 DAY), status_subscription='active'
             WHERE id_subscription = :id_subscription"
        );
        $stmt->execute([':id_subscription' => $id_subscription]);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Terminate subscription jika pembayaran gagal/expire
    // -------------------------------------------------------------------------

    public function terminateSubscription(int $id_subscription): void
    {
        $stmt = $this->db->prepare(
            "UPDATE subscriptions
             SET status_subscription = 'terminated'
             WHERE id_subscription = :id_subscription"
        );
        $stmt->execute([':id_subscription' => $id_subscription]);
    }

    // -------------------------------------------------------------------------
    // INSERT: Buat notifikasi untuk user tertentu (customer atau provider)
    // -------------------------------------------------------------------------

    public function insertNotification(
        int    $id_user,
        string $title,
        string $message,
        string $category = 'billing'
    ): void {
        $stmt = $this->db->prepare(
            "INSERT INTO notifications
                (id_user, notification_title, notification_message, notification_category)
             VALUES
                (:id_user, :title, :message, :category)"
        );
        $stmt->execute([
            ':id_user'  => $id_user,
            ':title'    => $title,
            ':message'  => $message,
            ':category' => $category,
        ]);
    }
}
