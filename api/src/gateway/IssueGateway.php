<?php

class IssueGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    /**
     * Ambil semua issues.
     * - Superadmin : semua issues
     * - Provider   : issues milik provider tersebut
     * - Customer   : issues milik customer tersebut
     */
    public function getAll(string $role, int $id_ref): array
    {
        $sql = match ($role) {
            'superadmin' => "SELECT ni.*, 
                                c.full_name  AS customer_name,
                                p.name_company AS provider_name
                             FROM network_issues ni
                             JOIN customers c ON ni.id_customer = c.id_customer
                             JOIN providers p ON ni.id_provider = p.id_provider
                             ORDER BY ni.created_at DESC",

            'provider'   => "SELECT ni.*,
                                c.full_name AS customer_name
                             FROM network_issues ni
                             JOIN customers c ON ni.id_customer = c.id_customer
                             WHERE ni.id_provider = :id_ref
                             ORDER BY ni.created_at DESC",

            'customer'   => "SELECT ni.*,
                                p.name_company AS provider_name
                             FROM network_issues ni
                             JOIN providers p ON ni.id_provider = p.id_provider
                             WHERE ni.id_customer = :id_ref
                             ORDER BY ni.created_at DESC",

            default => throw new RuntimeException("Role tidak dikenali.", 403),
        };

        $stmt = $this->db->prepare($sql);

        if ($role !== 'superadmin') {
            $stmt->bindValue(':id_ref', $id_ref, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ambil satu issue berdasarkan id_issue.
     */
    public function getById(int $id_issue): array|false
    {
        $sql = "SELECT ni.*,
                    c.full_name    AS customer_name,
                    p.name_company AS provider_name
                FROM network_issues ni
                JOIN customers c ON ni.id_customer = c.id_customer
                JOIN providers p ON ni.id_provider = p.id_provider
                WHERE ni.id_issue = :id_issue";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id_issue' => $id_issue]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Buat laporan gangguan baru (oleh Customer).
     * Provider ditentukan otomatis dari paket aktif customer.
     */
    public function create(int $id_customer, array $data): int
    {
        // Cari id_provider dari subscription aktif customer
        $sqlProvider = "SELECT p.id_provider
                        FROM subscriptions s
                        JOIN packages pk ON s.id_package = pk.id_package
                        JOIN providers p  ON pk.id_provider = p.id_provider
                        WHERE s.id_customer = :id_customer
                          AND s.status_subscription = 'active'
                        LIMIT 1";

        $stmtProvider = $this->db->prepare($sqlProvider);
        $stmtProvider->execute([':id_customer' => $id_customer]);
        $provider = $stmtProvider->fetch(PDO::FETCH_ASSOC);

        if (!$provider) {
            throw new RuntimeException("Tidak ada langganan aktif. Laporan gangguan tidak dapat dibuat.", 422);
        }

        $sql = "INSERT INTO network_issues 
                    (id_provider, id_customer, title_issue, description_issue, severity)
                VALUES 
                    (:id_provider, :id_customer, :title_issue, :description_issue, :severity)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_provider'       => $provider['id_provider'],
            ':id_customer'       => $id_customer,
            ':title_issue'       => $data['title_issue'],
            ':description_issue' => $data['description_issue'],
            ':severity'          => $data['severity'] ?? 'medium',
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update status issue (oleh Provider).
     * Hanya kolom status_issue yang boleh diubah via endpoint ini.
     */
    public function updateStatus(int $id_issue, int $id_provider, string $status): bool
    {
        $allowed = ['open', 'investigating', 'progress', 'resolved'];
        if (!in_array($status, $allowed, true)) {
            throw new RuntimeException("Status tidak valid. Gunakan: " . implode(', ', $allowed), 422);
        }

        $sql = "UPDATE network_issues
                SET status_issue = :status
                WHERE id_issue    = :id_issue
                  AND id_provider = :id_provider";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':status'      => $status,
            ':id_issue'    => $id_issue,
            ':id_provider' => $id_provider,
        ]);

        return $stmt->rowCount() > 0;
    }
    /**
     * Ambil id_provider berdasarkan id_user yang login.
     */
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

    /**
     * Ambil id_customer berdasarkan id_user yang login.
     */
    public function findCustomerIdByUser(int $id_user): int
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
}