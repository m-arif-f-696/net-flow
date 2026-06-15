<?php

class CustomerProfileGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    public function getProfileByIdUser(int $id_user): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM customers WHERE id_user = :id_user LIMIT 1"
        );
        $stmt->bindValue(':id_user', $id_user, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createProfile(array $data): bool
    {
        try {
            $this->db->beginTransaction();

            // 1. Insert ke tabel customers
            $stmt = $this->db->prepare(
                "INSERT INTO customers 
                    (id_user, nik, full_name, gender, phone, address, area_code, coordinate_point, photo_profile)
                 VALUES 
                    (:id_user, :nik, :full_name, :gender, :phone, :address, :area_code, :coordinate_point, :photo_profile)"
            );
            $stmt->bindValue(':id_user',           $data['id_user'],           PDO::PARAM_INT);
            $stmt->bindValue(':nik',               $data['nik'],               PDO::PARAM_STR);
            $stmt->bindValue(':full_name',         $data['full_name'],         PDO::PARAM_STR);
            $stmt->bindValue(':gender',            $data['gender'],            PDO::PARAM_STR);
            $stmt->bindValue(':phone',             $data['phone'],             PDO::PARAM_STR);
            $stmt->bindValue(':address',           $data['address'],           PDO::PARAM_STR);
            $stmt->bindValue(':area_code',         $data['area_code'],         PDO::PARAM_STR);
            $stmt->bindValue(':coordinate_point',  $data['coordinate_point'],  PDO::PARAM_STR);
            $stmt->bindValue(':photo_profile',     $data['photo_profile'],     PDO::PARAM_STR);
            $stmt->execute();

            // 2. Update status_onboarding → completed
            $stmtUser = $this->db->prepare(
                "UPDATE users SET status_onboarding = 'completed' WHERE id_user = :id_user"
            );
            $stmtUser->bindValue(':id_user', $data['id_user'], PDO::PARAM_INT);
            $stmtUser->execute();

            // 3. Kirim notifikasi selamat datang
            $stmtNotif = $this->db->prepare(
                "INSERT INTO notifications (id_user, notification_title, notification_message, notification_category)
                 VALUES (:id_user, :title, :message, :category)"
            );
            $stmtNotif->bindValue(':id_user',  $data['id_user'],                                               PDO::PARAM_INT);
            $stmtNotif->bindValue(':title',    'Selamat Datang di NetFlow!',                                   PDO::PARAM_STR);
            $stmtNotif->bindValue(':message',  'Halo ' . $data['full_name'] . ', profil Anda berhasil dibuat. Selamat menikmati layanan NetFlow!', PDO::PARAM_STR);
            $stmtNotif->bindValue(':category', 'system',                                                       PDO::PARAM_STR);
            $stmtNotif->execute();

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}