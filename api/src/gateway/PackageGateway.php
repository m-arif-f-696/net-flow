<?php

class PackageGateway {
    private PDO $db;

    public function __construct(Database $database) {
        $this->db = $database->connect();
    }

    public function getAll(?int $id_user) {
        $sql = "SELECT p.* FROM packages p";
        
        if ($id_user !== null) {
            $sql .= " JOIN providers pr ON p.id_provider = pr.id_provider";
        }

        // 3. Tambahkan WHERE dinamis
        $sql .= " WHERE 1=1";

        if ($id_user !== null) {
            // Panggil id_user milik tabel providers
            $sql .= " AND pr.id_user = :id_user"; 
        }

        $stmt = $this->db->prepare($sql);

        $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        
        $stmt->execute();
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC); // Tambahkan FETCH_ASSOC agar rapi di JSON

        return $data;
    }

    public function createPackage(array $data, int $id_user): string
    {
        $sqlProvider = "SELECT id_provider FROM providers WHERE id_user = :id_user";
        $stmtProvider = $this->db->prepare($sqlProvider);
        $stmtProvider->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        $stmtProvider->execute();
        $provider = $stmtProvider->fetch(PDO::FETCH_ASSOC);

        if (!$provider) {
            throw new Exception("Akses ditolak. Anda tidak terdaftar sebagai Provider.");
        }

        $id_provider = $provider['id_provider'];

        $uniqueSlug = $this->getUniqueSlug($data["slug"]);


        $sql = "INSERT INTO packages (id_provider, name_package, slug, type_package, speed_mbps, download_speed, download_unit, upload_speed, upload_unit, quota_limit_gb, price_per_month, installation_cost, package_description, icon_package, package_features, is_recommended, package_status) 
        VALUES (:id_provider, :name_package, :slug, :type_package, :speed_mbps, :download_speed, :download_unit, :upload_speed, :upload_unit, :quota_limit_gb, :price_per_month, :installation_cost, :package_description, :icon_package, :package_features, :is_recommended, :package_status)";

        $stmt = $this->db->prepare($sql);



        // --- BINDING YANG SUDAH DIPERBAIKI DAN DILENGKAPI ---

        // Gunakan $id_provider dari database, bukan dari input user
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        
        // Data Utama
        $stmt->bindValue(":name_package", $data["name_package"], PDO::PARAM_STR);
        $stmt->bindValue(":slug", $uniqueSlug, PDO::PARAM_STR);
        $stmt->bindValue(":type_package", $data["type_package"], PDO::PARAM_STR);
        
        // Kecepatan & Satuan (Dengan fallback satuan default)
        $stmt->bindValue(":speed_mbps", $data["speed_mbps"], PDO::PARAM_INT);
        $stmt->bindValue(":download_speed", $data["download_speed"], PDO::PARAM_INT);
        $stmt->bindValue(":download_unit", $data["download_unit"] ?? 'Mbps', PDO::PARAM_STR);
        $stmt->bindValue(":upload_speed", $data["upload_speed"], PDO::PARAM_INT);
        $stmt->bindValue(":upload_unit", $data["upload_unit"] ?? 'Mbps', PDO::PARAM_STR);
        
        // Penanganan NULL untuk Kuota (jika paket unlimited)
        $quota = $data["quota_limit_gb"] ?? null;
        $stmt->bindValue(":quota_limit_gb", $quota, $quota === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        
        // Harga & Biaya (Fallback 0 jika gratis pasang)
        $stmt->bindValue(":price_per_month", $data["price_per_month"], PDO::PARAM_INT);
        $stmt->bindValue(":installation_cost", $data["installation_cost"] ?? 0, PDO::PARAM_INT); 
        
        // Deskripsi & Icon Visual
        $stmt->bindValue(":package_description", $data["package_description"] ?? null, PDO::PARAM_STR); 
        $stmt->bindValue(":icon_package", $data["icon_package"] ?? 'wifi', PDO::PARAM_STR); 
        
        // Penanganan Fitur Array ke JSON
        // Jika frontend mengirim bentuk array (misal: ["Tanpa FUP", "Gratis Router"]), ubah jadi string
        $features = isset($data["package_features"]) && is_array($data["package_features"]) 
                    ? json_encode($data["package_features"]) 
                    : ($data["package_features"] ?? null);
        $stmt->bindValue(":package_features", $features, $features === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        
        // Flag Visual & Status
        $stmt->bindValue(":is_recommended", $data["is_recommended"] ?? 0, PDO::PARAM_INT);
        $stmt->bindValue(":package_status", $data["package_status"] ?? 'active', PDO::PARAM_STR); 

        $stmt->execute();

        return $this->db->lastInsertId();
    }

    public function getSummary(int $id_user): array 
    {   
        $provider = $this->getProviderById($id_user);
        $id_provider = $provider['id_provider'];

        // 1. Hitung total paket & rata-rata harga untuk provider ini
        $sqlPackages = "SELECT 
                            COUNT(id_package) as total_packages, 
                            COALESCE(AVG(price_per_month), 0) as average_price 
                        FROM packages 
                        WHERE id_provider = :id_provider";
        
        $stmtPkg = $this->db->prepare($sqlPackages);
        $stmtPkg->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmtPkg->execute();
        $packageStats = $stmtPkg->fetch(PDO::FETCH_ASSOC);

        // 2. Hitung total pelanggan unik berdasarkan transaksi di paket milik provider ini
        $sqlCustomers = "SELECT count(distinct id_customer) as total_customers
                        FROM subscriptions s
                        JOIN packages p ON s.id_package = p.id_package
                        WHERE p.id_provider =:id_provider";
                        
        $stmtCust = $this->db->prepare($sqlCustomers);
        $stmtCust->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmtCust->execute();
        $totalCustomers = $stmtCust->fetchColumn();


        $sqlPackages = "SELECT s.id_package
                        FROM subscriptions s
                        JOIN packages p ON s.id_package = p.id_package
                        WHERE p.id_provider = :id_provider
                        GROUP BY s.id_package
                        ORDER BY COUNT(*) DESC
                        LIMIT 1";
        
        $stmtIdPackage = $this->db->prepare($sqlPackages);
        $stmtIdPackage->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmtIdPackage->execute();
        $id_package = $stmtIdPackage->fetchColumn();

        // 3. Kembalikan dalam format Array Associative persis seperti target JSON Anda
        return [
            "package_summary" => [
                "total_packages"  => (int) $packageStats['total_packages'],
                "id_package"     => (int) $id_package,
                "average_price"   => (int) $packageStats['average_price'],
                "total_customers" => (int) $totalCustomers
            ]
        ];
    }

    public function getPackageById(int $id, ?int $id_user = null) 
    {
        $sql = "SELECT p.* FROM packages p";

        if ($id_user !== null) {
            $sql .= " JOIN providers pr ON p.id_provider = pr.id_provider";
        }

        $sql .= " WHERE p.id_package = :id";

        if ($id_user !== null) {
            $sql .= " AND pr.id_user = :id_user"; 
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        if ($id_user !== null) {
            $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPackageBySlug(string $slug, ?int $id_user = null) 
    {
        $sql = "SELECT p.* FROM packages p";

        if ($id_user !== null) {
            $sql .= " JOIN providers pr ON p.id_provider = pr.id_provider";
        }

        $sql .= " WHERE p.slug = :slug";

        if ($id_user !== null) {
            $sql .= " AND pr.id_user = :id_user"; 
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":slug", $slug, PDO::PARAM_STR);

        if ($id_user !== null) {
            $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deletePackage(string $id, int $id_provider): int
    {   
        $sql = "UPDATE packages 
                SET package_status = 'inactive' 
                WHERE id_package = :id_package AND id_provider = :id_provider";

        $stmt = $this->db->prepare($sql);
        
        // Keamanan ekstra: Pastikan yang dihapus adalah benar-benar milik provider yang sedang login
        $stmt->bindValue(":id_package", $id, PDO::PARAM_INT);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        
        $stmt->execute();

        // Mengembalikan jumlah baris yang berhasil diubah (biasanya 1 jika sukses)
        return $stmt->rowCount();
    }

    public function patchPackage(int $id_package, int $id_user, array $data): int
    {
        $allowedColumns = [
            'name_package', 
            'type_package', 
            'speed_mbps', 
            'quota_limit_gb', 
            'price_per_month', 
            'installation_cost', 
            'package_description', 
            'package_status'
        ];

        $fields = [];
        $binds = [];

        // 2. Looping data input untuk merakit query
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedColumns)) {
                // Merakit string: "nama_kolom = :nama_kolom"
                $fields[] = "$key = :$key";
                // Menyimpan nilai untuk dieksekusi PDO nanti
                $binds[":$key"] = $value;
            }
        }


        if (empty($fields)) {
            return 0;
        }

        $fieldsString = implode(", ", $fields);

       
        $sql = "UPDATE packages SET {$fieldsString} WHERE id_package = :id_package";

        $stmt = $this->db->prepare($sql);

        // 6. Bind data yang dinamis secara otomatis
        foreach ($binds as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        // 7. Bind ID Package
        $stmt->bindValue(":id_package", $id_package, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->rowCount();
    }

    private function getProviderById(int $id_user): array
    {
        $sql = "SELECT id_provider FROM providers WHERE id_user = :id_user";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getUniqueSlug(string $slug): string
    {
        $originalSlug = $slug;
        $count = 1;

        // Lakukan perulangan terus-menerus sampai menemukan slug yang unik (belum ada di DB)
        while (true) {
            $sql = "SELECT COUNT(*) FROM packages WHERE slug = :slug";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(":slug", $slug, PDO::PARAM_STR);
            $stmt->execute();
            
            // Jika slug belum digunakan (COUNT = 0), kembalikan slug tersebut
            if ($stmt->fetchColumn() == 0) {
                break;
            }
            
            // Jika sudah ada, tambahkan suffix angka (misal: nama-paket-1, nama-paket-2)
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        return $slug;
    }

}