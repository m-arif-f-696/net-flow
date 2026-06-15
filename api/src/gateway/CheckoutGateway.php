<?php

class CheckoutGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // Lookup: Customer dengan detail email & phone untuk Midtrans
    // -------------------------------------------------------------------------

    public function findCustomerWithDetails(int $id_user): array
    {
        $stmt = $this->db->prepare(
            "SELECT c.id_customer, c.full_name, c.phone, u.email
             FROM customers c
             JOIN users u ON c.id_user = u.id_user
             WHERE c.id_user = :id_user
             LIMIT 1"
        );
        $stmt->execute([':id_user' => $id_user]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException("Profil customer tidak ditemukan. Lengkapi profil Anda terlebih dahulu.", 404);
        }

        return $row;
    }

    // -------------------------------------------------------------------------
    // Lookup: Detail paket + harga untuk kalkulasi amount & Midtrans item_details
    // -------------------------------------------------------------------------

    public function findPackageById(int $id_package): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT
                p.id_package,
                p.id_provider,
                p.name_package,
                p.price_per_month,
                p.installation_cost,
                p.package_status
             FROM packages p
             WHERE p.id_package = :id_package
             LIMIT 1"
        );
        $stmt->execute([':id_package' => $id_package]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // Generate: Nomor invoice unik INV-YYYYMM-XXXX
    // -------------------------------------------------------------------------

    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ym') . '-';

        $stmt = $this->db->prepare(
            "SELECT invoice_number
             FROM transactions
             WHERE invoice_number LIKE :prefix
             ORDER BY id_transaction DESC
             LIMIT 1"
        );
        $stmt->execute([':prefix' => $prefix . '%']);
        $last = $stmt->fetchColumn();

        $nextNum = $last
            ? (int) substr($last, -4) + 1
            : 1;

        return $prefix . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
    }

    // -------------------------------------------------------------------------
    // INSERT: Buat subscription baru (status = suspended, menunggu pembayaran)
    // -------------------------------------------------------------------------

    public function createSubscription(int $id_customer, int $id_package): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO subscriptions
                (id_customer, id_package, status_subscription, start_date, end_date)
             VALUES
                (:id_customer, :id_package, 'pending', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))"
        );
        $stmt->execute([
            ':id_customer' => $id_customer,
            ':id_package'  => $id_package,
        ]);
        return (int) $this->db->lastInsertId();
    }

    // -------------------------------------------------------------------------
    // INSERT: Buat record transaksi activation (status = pending)
    // -------------------------------------------------------------------------

    public function createTransaction(int $id_subscription, string $invoice_number, int $amount): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO transactions
                (id_subscription, invoice_number, amount, payment_type, payment_status)
             VALUES
                (:id_subscription, :invoice_number, :amount, 'activation', 'pending')"
        );
        $stmt->execute([
            ':id_subscription' => $id_subscription,
            ':invoice_number'  => $invoice_number,
            ':amount'          => $amount,
        ]);
        return (int) $this->db->lastInsertId();
    }

    // -------------------------------------------------------------------------
    // INSERT: Buat jadwal instalasi yang terhubung ke subscription
    // -------------------------------------------------------------------------

    public function createInstallationSchedule(
        int     $id_subscription,
        string  $installation_date,
        string  $installation_time,
        ?string $additional_message
    ): void {
        $stmt = $this->db->prepare(
            "INSERT INTO installation_schedules
                (id_subscription, installation_date, installation_time, additional_message, status_schedule)
             VALUES
                (:id_subscription, :installation_date, :installation_time, :additional_message, 'pending')"
        );
        $stmt->execute([
            ':id_subscription'   => $id_subscription,
            ':installation_date' => $installation_date,
            ':installation_time' => $installation_time,
            ':additional_message'=> $additional_message,
        ]);
    }

    // -------------------------------------------------------------------------
    // UPDATE: Simpan snap_token ke transaksi setelah dapat dari Midtrans
    // -------------------------------------------------------------------------

    public function saveSnapToken(int $id_transaction, string $snap_token): void
    {
        $stmt = $this->db->prepare(
            "UPDATE transactions
             SET snap_token = :snap_token
             WHERE id_transaction = :id_transaction"
        );
        $stmt->execute([
            ':snap_token'      => $snap_token,
            ':id_transaction'  => $id_transaction,
        ]);
    }

    // -------------------------------------------------------------------------
    // ROLLBACK: Hapus semua record jika panggilan Midtrans gagal
    // Urutan DELETE harus mengikuti arah FK (anak dulu, baru induk)
    // -------------------------------------------------------------------------

    public function rollbackCheckout(int $id_transaction, int $id_subscription): void
    {
        // 1. Hapus jadwal instalasi (FK → subscriptions)
        $this->db->prepare(
            "DELETE FROM installation_schedules WHERE id_subscription = :id"
        )->execute([':id' => $id_subscription]);

        // 2. Hapus transaksi (FK → subscriptions)
        $this->db->prepare(
            "DELETE FROM transactions WHERE id_transaction = :id"
        )->execute([':id' => $id_transaction]);

        // 3. Hapus subscription
        $this->db->prepare(
            "DELETE FROM subscriptions WHERE id_subscription = :id"
        )->execute([':id' => $id_subscription]);
    }
}
