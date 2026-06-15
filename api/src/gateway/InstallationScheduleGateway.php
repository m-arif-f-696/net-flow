<?php

class InstallationScheduleGateway
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
    // GET ALL jadwal instalasi milik provider (dengan filter status)
    // -------------------------------------------------------------------------

    public function getAll(int $id_provider, ?string $status = null): array
    {
        $allowedStatus = ['pending', 'approved', 'completed', 'rescheduled', 'cancelled'];

        $sql = "SELECT
                sch.id_schedule,
                sch.installation_date,
                sch.installation_time,
                sch.additional_message,
                sch.status_schedule,
                sch.created_at,

                -- Data subscription
                s.id_subscription,
                s.status_subscription,
                s.start_date,
                s.end_date,

                -- Data paket
                pk.name_package,
                pk.speed_mbps,

                -- Data customer
                c.id_customer,
                c.full_name         AS customer_name,
                c.phone             AS customer_phone,
                c.address           AS customer_address,
                c.area_code,

                -- Wilayah bertingkat via JOIN langsung
                w_kelurahan.nama    AS kelurahan,
                w_kecamatan.nama    AS kecamatan,
                w_kota.nama         AS kota,
                w_provinsi.nama     AS provinsi

            FROM installation_schedules sch
            JOIN subscriptions  s            ON sch.id_subscription  = s.id_subscription
            JOIN packages       pk           ON s.id_package         = pk.id_package
            JOIN customers      c            ON s.id_customer        = c.id_customer

            -- Kelurahan = area_code customer itu sendiri (level terdalam)
            LEFT JOIN wilayah   w_kelurahan  ON w_kelurahan.kode     = c.area_code

            -- Kecamatan = 3 segmen pertama  cth: 11.01.01
            LEFT JOIN wilayah   w_kecamatan  ON w_kecamatan.kode     = SUBSTRING_INDEX(c.area_code, '.', 3)

            -- Kota/Kabupaten = 2 segmen pertama  cth: 11.01
            LEFT JOIN wilayah   w_kota       ON w_kota.kode          = SUBSTRING_INDEX(c.area_code, '.', 2)

            -- Provinsi = 1 segmen pertama  cth: 11
            LEFT JOIN wilayah   w_provinsi   ON w_provinsi.kode      = SUBSTRING_INDEX(c.area_code, '.', 1)

            WHERE pk.id_provider = :id_provider";

        $params = [':id_provider' => $id_provider];

        if ($status !== null && in_array($status, $allowedStatus, true)) {
            $sql             .= " AND sch.status_schedule = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY sch.installation_date ASC, sch.installation_time ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Susun alamat lengkap dari komponen wilayah
        foreach ($rows as &$row) {
            $parts = array_filter([
                $row['customer_address'],
                $row['kelurahan'],
                $row['kecamatan'],
                $row['kota'],
                $row['provinsi'],
            ]);

            $row['full_address'] = implode(', ', $parts);
        }
        unset($row);

        return $rows;
    }

    // -------------------------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------------------------

    public function getById(int $id_schedule): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT
                sch.*,
                s.id_subscription,
                s.status_subscription,
                s.start_date,
                s.end_date,
                pk.name_package,
                pk.speed_mbps,
                c.full_name     AS customer_name,
                c.phone         AS customer_phone,
                c.address       AS customer_address,
                w.nama          AS area_name
             FROM installation_schedules sch
             JOIN subscriptions s  ON sch.id_subscription = s.id_subscription
             JOIN packages      pk ON s.id_package        = pk.id_package
             JOIN customers     c  ON s.id_customer       = c.id_customer
             JOIN wilayah       w  ON c.area_code         = w.kode
             WHERE sch.id_schedule = :id_schedule"
        );

        $stmt->execute([':id_schedule' => $id_schedule]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // PATCH: Tandai instalasi selesai
    // Update status_schedule → completed
    // Update subscriptions   → active, start_date = hari ini, end_date = +30 hari
    // -------------------------------------------------------------------------

    public function markAsCompleted(int $id_schedule, int $id_provider): bool
    {
        // Validasi: pastikan jadwal ini milik provider yang login & statusnya approved
        $stmtCheck = $this->db->prepare(
            "SELECT sch.id_schedule, sch.id_subscription, sch.status_schedule
             FROM installation_schedules sch
             JOIN subscriptions s  ON sch.id_subscription = s.id_subscription
             JOIN packages      pk ON s.id_package        = pk.id_package
             WHERE sch.id_schedule  = :id_schedule
               AND pk.id_provider   = :id_provider
             LIMIT 1"
        );

        $stmtCheck->execute([
            ':id_schedule'  => $id_schedule,
            ':id_provider'  => $id_provider,
        ]);

        $schedule = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            throw new RuntimeException("Jadwal tidak ditemukan atau bukan milik provider ini.", 404);
        }

        if ($schedule['status_schedule'] === 'completed') {
            throw new RuntimeException("Instalasi ini sudah ditandai selesai sebelumnya.", 422);
        }

        if ($schedule['status_schedule'] === 'cancelled') {
            throw new RuntimeException("Instalasi yang dibatalkan tidak dapat diselesaikan.", 422);
        }

        $today   = date('Y-m-d');
        $endDate = date('Y-m-d', strtotime('+30 days'));

        // Jalankan dalam transaksi agar kedua update atomic
        $this->db->beginTransaction();

        try {
            // 1. Update status jadwal → completed
            $stmtSchedule = $this->db->prepare(
                "UPDATE installation_schedules
                 SET status_schedule = 'completed'
                 WHERE id_schedule = :id_schedule"
            );
            $stmtSchedule->execute([':id_schedule' => $id_schedule]);

            // 2. Update subscription → active + set start & end date
            $stmtSub = $this->db->prepare(
                "UPDATE subscriptions
                 SET status_subscription = 'active',
                     start_date          = :start_date,
                     end_date            = :end_date
                 WHERE id_subscription = :id_subscription"
            );
            $stmtSub->execute([
                ':start_date'      => $today,
                ':end_date'        => $endDate,
                ':id_subscription' => $schedule['id_subscription'],
            ]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new RuntimeException("Gagal memperbarui data instalasi: " . $e->getMessage(), 500);
        }
    }
}