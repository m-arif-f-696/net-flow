<?php

class CustomerGateway {
    private PDO $db;

    public function __construct(Database $database) {
        $this->db = $database->connect();
    }

    // Fungsi 1: Menghitung total SELURUH pelanggan untuk provider tersebut (tanpa limit)
    public function getTotalCustomers(int $id_provider, ?string $filter = null): int {
        // Query menggunakan JOIN sesuai struktur ERD Net Flow Anda
        $sql = "SELECT COUNT(DISTINCT c.id_customer) as total_data 
                FROM customers c
                JOIN subscriptions s ON c.id_customer = s.id_customer
                JOIN packages p ON s.id_package = p.id_package
                WHERE p.id_provider = :id_provider";

        if(isset($filter)) {
            $sql .= " AND s.status_subscription = :filter";
        }
                
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);

        if(isset($filter)) {
            $stmt->bindValue(":filter", $filter, PDO::PARAM_STR);
        }
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total_data'];
    }

    // Fungsi 2: Mengambil data pelanggan dengan batasan Halaman (Limit & Offset)
    public function getCustomers(int $id_provider, int $limit, int $offset, ?string $filter = null): array {
        $sql = "SELECT c.*, s.status_subscription, p.name_package 
                FROM customers c
                JOIN subscriptions s ON c.id_customer = s.id_customer
                JOIN packages p ON s.id_package = p.id_package
                WHERE p.id_provider = :id_provider";
        
        if(isset($filter)) {
            $sql .= " AND s.status_subscription = :filter";
        }
        
        $sql .= " ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset";
            
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        
        if(isset($filter)) {
            $stmt->bindValue(":filter", $filter, PDO::PARAM_STR);
        }
        
        // PENTING: Untuk LIMIT dan OFFSET, tipe datanya wajib di-bind sebagai INT
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Fungsi 3: Menghitung ringkasan jumlah pelanggan berdasarkan status langganan
    public function getCustomerSummary(int $id_provider): array {
        $sql = "SELECT 
                    COUNT(CASE WHEN s.status_subscription = 'active' THEN 1 END) as `active`,
                    COUNT(CASE WHEN s.status_subscription = 'suspended' THEN 1 END) as `suspended`,
                    COUNT(CASE WHEN s.status_subscription = 'terminated' THEN 1 END) as `terminated`
                FROM customers c
                JOIN subscriptions s ON c.id_customer = s.id_customer
                JOIN packages p ON s.id_package = p.id_package
                WHERE p.id_provider = :id_provider";
                
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Memastikan output return berupa angka (integer) murni
        return [
            "active" => (int) ($result['active'] ?? 0),
            "suspended" => (int) ($result['suspended'] ?? 0),
            "terminated" => (int) ($result['terminated'] ?? 0),
            "total" => (int) (($result['active'] ?? 0) + ($result['suspended'] ?? 0) + ($result['terminated'] ?? 0))
        ];
    }

    // Fungsi 4: Mengambil detail satu pelanggan berdasarkan ID
    public function getCustomerById(int $id_provider, int $id_customer): array | false {
        $sql = "SELECT c.*, s.status_subscription, p.name_package 
                FROM customers c
                JOIN subscriptions s ON c.id_customer = s.id_customer
                JOIN packages p ON s.id_package = p.id_package
                WHERE p.id_provider = :id_provider 
                  AND c.id_customer = :id_customer
                LIMIT 1";
                
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmt->bindValue(":id_customer", $id_customer, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC); // Mengembalikan array jika ada, false jika tidak ada
    }

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
}