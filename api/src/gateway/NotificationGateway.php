<?php

class NotificationGateway
{
    private PDO $db;

    public function __construct(Database $database) {
        $this->db = $database->connect();
    }

    /**
     * Ambil semua notifikasi milik user (terbaru di atas)
     */
    public function getWithPagination(int $id_user, int $limit, int $offset): array
    {
        $sql = "SELECT * FROM notifications 
                WHERE id_user = :id_user 
                ORDER BY created_at DESC 
                LIMIT :limit 
                OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        
        $stmt->bindValue(':id_user', $id_user, PDO::PARAM_INT);
        $stmt->bindValue(':limit',   $limit,   PDO::PARAM_INT);
        $stmt->bindValue(':offset',  $offset,  PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Hitung notifikasi yang belum dibaca (untuk badge lonceng)
     */
    public function countUnread(int $id_user): int
    {
        $sql = "SELECT COUNT(*) FROM notifications 
                WHERE id_user = :id_user AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id_user' => $id_user]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Tandai semua notifikasi user sebagai sudah dibaca
     */
    public function markAllAsRead(int $id_user): int
    {
        $sql = "UPDATE notifications 
                SET is_read = 1 
                WHERE id_user = :id_user AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id_user' => $id_user]);
        return $stmt->rowCount(); // jumlah baris yang diupdate
    }

    /**
     * Tandai satu notifikasi sebagai sudah dibaca
     * Pastikan notifikasi milik user yang bersangkutan (ownership check)
     */
    public function markOneAsRead(int $id_notification, int $id_user): bool
    {
        $sql = "UPDATE notifications 
                SET is_read = 1 
                WHERE id_notification = :id_notification 
                  AND id_user = :id_user 
                  AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':id_notification' => $id_notification,
            ':id_user'         => $id_user,
        ]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Kirim notifikasi ke user tertentu
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO notifications 
                (id_user, notification_title, notification_message, notification_category)
            VALUES 
                (:id_user, :title, :message, :category)"
        );

        $stmt->execute([
            ':id_user'  => $data['id_user'],
            ':title'    => $data['notification_title'],
            ':message'  => $data['notification_message'],
            ':category' => $data['notification_category'] ?? 'system',
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Validasi apakah user target adalah customer dari provider yang mengirim
     */
    public function isCustomerOfProvider(int $id_user_target, int $id_user_provider): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) 
            FROM subscriptions s
            JOIN customers c    ON s.id_customer  = c.id_customer
            JOIN packages p     ON s.id_package   = p.id_package
            JOIN providers pr   ON p.id_provider  = pr.id_provider
            WHERE c.id_user     = :id_user_target
            AND pr.id_user    = :id_user_provider
            AND s.status_subscription = 'active'"
        );

        $stmt->execute([
            ':id_user_target'   => $id_user_target,
            ':id_user_provider' => $id_user_provider,
        ]);

        return (int) $stmt->fetchColumn() > 0;
    }
}