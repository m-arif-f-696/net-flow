<?php

class PackageGateway {
    private PDO $db;

    public function __construct(Database $database) {
        $this->db = $database->connect();
    }

    public function getAll() {
        $sql = "SELECT * FROM packages";
        $stmt = $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC); // Tambahkan FETCH_ASSOC agar rapi di JSON

        return $stmt;
    }

    public function createPackage(array $data): string
    {
        $sql = "INSERT INTO packages (id_provider, name_package, type_package, speed_mbps, quota_limit_gb, price_per_month, installation_cost, package_description, package_status) 
        VALUES (:id_provider, :name_package, :type_package, :speed_mbps, :quota_limit_gb, :price_per_month, :installation_cost, :package_description, :package_status)";

        $stmt = $this->db->prepare($sql);

        // --- PERBAIKAN BINDING DISINI ---

        $stmt->bindValue(":id_provider", $data["id_provider"], PDO::PARAM_INT);
        $stmt->bindValue(":name_package", $data["name_package"], PDO::PARAM_STR); // Diperbaiki
        $stmt->bindValue(":type_package", $data["type_package"], PDO::PARAM_STR);
        $stmt->bindValue(":speed_mbps", $data["speed_mbps"], PDO::PARAM_INT);
        
        // Penanganan NULL yang lebih aman untuk kuota (jika paket unlimited)
        $quota = $data["quota_limit_gb"] ?? null;
        $stmt->bindValue(":quota_limit_gb", $quota, $quota === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        
        $stmt->bindValue(":price_per_month", $data["price_per_month"], PDO::PARAM_INT);
        
        // Diperbaiki dan diberi fallback nilai 0 (sesuai default SQL) jika dari frontend tidak dikirim
        $stmt->bindValue(":installation_cost", $data["installation_cost"] ?? 0, PDO::PARAM_INT); 
        
        // Parameter yang sebelumnya tertinggal
        $stmt->bindValue(":package_description", $data["package_description"] ?? '', PDO::PARAM_STR); 
        
        // Diberi fallback 'active' jika status tidak dikirim dari form frontend
        $stmt->bindValue(":package_status", $data["package_status"] ?? 'active', PDO::PARAM_STR); 

        $stmt->execute();

        return $this->db->lastInsertId();
    }

    public function getPackageById(int $id)
    {
        $sql = "SELECT * FROM packages WHERE id_package = :id";

        $stmt = $this->db->prepare($sql);

        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        $stmt->execute();

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        return $data;
        
    }
}