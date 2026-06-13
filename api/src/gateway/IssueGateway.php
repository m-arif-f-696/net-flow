<?php

class IssueGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // GET ALL dengan filter status
    // -------------------------------------------------------------------------

    public function getAll(string $role, int $id_ref, ?string $status = null): array
    {
        // Resolved dibatasi 5, status lain ambil semua
        $limitClause = $status === 'resolved' ? " LIMIT 5" : "";

        $baseSelect = match ($role) {
            'superadmin' => "SELECT ni.*, 
                                c.full_name    AS customer_name,
                                p.name_company AS provider_name
                             FROM network_issues ni
                             JOIN customers c ON ni.id_customer = c.id_customer
                             JOIN providers p ON ni.id_provider = p.id_provider",

            'provider'   => "SELECT ni.*,
                                c.full_name AS customer_name
                             FROM network_issues ni
                             JOIN customers c ON ni.id_customer = c.id_customer",

            'customer'   => "SELECT ni.*,
                                p.name_company AS provider_name
                             FROM network_issues ni
                             JOIN providers p ON ni.id_provider = p.id_provider",

            default => throw new RuntimeException("Role tidak dikenali.", 403),
        };

        $sql    = $baseSelect . " WHERE 1=1";
        $params = [];

        // Filter by role
        if ($role === 'provider') {
            $sql             .= " AND ni.id_provider = :id_ref";
            $params[':id_ref'] = $id_ref;
        } elseif ($role === 'customer') {
            $sql             .= " AND ni.id_customer = :id_ref";
            $params[':id_ref'] = $id_ref;
        }

        // Filter by status (opsional)
        if ($status !== null) {
            $sql              .= " AND ni.status_issue = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY ni.created_at DESC" . $limitClause;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------------------------

    public function getById(int $id_issue): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT ni.*,
                c.full_name    AS customer_name,
                p.name_company AS provider_name
             FROM network_issues ni
             JOIN customers c ON ni.id_customer = c.id_customer
             JOIN providers p ON ni.id_provider = p.id_provider
             WHERE ni.id_issue = :id_issue"
        );
        $stmt->execute([':id_issue' => $id_issue]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public function create(int $id_customer, array $data): int
    {
        // Validasi: pastikan subscription ini milik customer yang login
        $stmtProvider = $this->db->prepare(
            "SELECT pk.id_provider
            FROM subscriptions s
            JOIN packages pk ON s.id_package = pk.id_package
            WHERE s.id_subscription      = :id_subscription
            AND s.id_customer          = :id_customer
            AND s.status_subscription  = 'active'
            LIMIT 1"
        );

        $stmtProvider->execute([
            ':id_subscription' => $data['id_subscription'],
            ':id_customer'     => $id_customer,
        ]);

        $provider = $stmtProvider->fetch(PDO::FETCH_ASSOC);

        if (!$provider) {
            throw new RuntimeException(
                "Langganan tidak ditemukan, bukan milik Anda, atau sudah tidak aktif.", 422
            );
        }

        $stmt = $this->db->prepare(
            "INSERT INTO network_issues 
                (id_provider, id_customer, title_issue, description_issue, severity)
            VALUES 
                (:id_provider, :id_customer, :title_issue, :description_issue, :severity)"
        );

        $stmt->execute([
            ':id_provider'       => $provider['id_provider'],
            ':id_customer'       => $id_customer,
            ':title_issue'       => $data['title_issue'],
            ':description_issue' => $data['description_issue'],
            ':severity'          => $data['severity'] ?? 'medium',
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function createNotification(int $id_user, string $notification_title, string $notification_message, string $notification_category): void
    {
        $stmtNotification = $this->db->prepare(
            "INSERT INTO notifications 
                (id_user, notification_title, notification_message, notification_category)
            VALUES 
                (:id_user, :notification_title, :notification_message, :notification_category)"
        );

        $stmtNotification->execute([
            ':id_user'           => $id_user,
            ':notification_title' => $notification_title,
            ':notification_message' => $notification_message,
            ':notification_category'  => $notification_category,
        ]);
    }

    // -------------------------------------------------------------------------
    // UPDATE STATUS (oleh Provider)
    // -------------------------------------------------------------------------

    public function updateStatus(int $id_issue, int $id_provider, string $status): bool
    {
        $allowed = ['open', 'investigating', 'progress', 'resolved'];
        if (!in_array($status, $allowed, true)) {
            throw new RuntimeException("Status tidak valid. Gunakan: " . implode(', ', $allowed), 422);
        }

        $stmt = $this->db->prepare(
            "UPDATE network_issues
             SET status_issue = :status
             WHERE id_issue    = :id_issue
               AND id_provider = :id_provider"
        );

        $stmt->execute([
            ':status'      => $status,
            ':id_issue'    => $id_issue,
            ':id_provider' => $id_provider,
        ]);

        return $stmt->rowCount() > 0;
    }

    // -------------------------------------------------------------------------
    // UPDATE SEVERITY (oleh Provider )
    // -------------------------------------------------------------------------

    public function updateSeverity(int $id_issue, int $id_provider, string $severity): bool
    {
        $allowed = ['low', 'medium', 'high'];
        if (!in_array($severity, $allowed, true)) {
            throw new RuntimeException("Severity tidak valid. Gunakan: " . implode(', ', $allowed), 422);
        }

        // Provider bisa ubah severity di status apapun (open, investigating, progress)
        // kecuali yang sudah resolved
        $stmt = $this->db->prepare(
            "UPDATE network_issues
            SET severity = :severity
            WHERE id_issue    = :id_issue
            AND id_provider = :id_provider
            AND status_issue != 'resolved'"
        );

        $stmt->execute([
            ':severity'    => $severity,
            ':id_issue'    => $id_issue,
            ':id_provider' => $id_provider,
        ]);

        return $stmt->rowCount() > 0;
    }

    // -------------------------------------------------------------------------
    // Lookup Helpers
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

    public function findUserIdByIdIssue(int $id_issue): int
    {
        $stmt = $this->db->prepare(
            "SELECT p.id_user 
            FROM providers p
            JOIN network_issues ni ON p.id_provider = ni.id_provider
            WHERE ni.id_issue = :id_issue
            LIMIT 1"
        );
        $stmt->execute([':id_issue' => $id_issue]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException("Profil user tidak ditemukan.", 404);
        }

        return (int) $row['id_user'];
    }
}