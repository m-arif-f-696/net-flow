<?php

class PackageGateway {
    private PDO $db;

    public function __construct(Database $database) {
        $this->db = $database->connect();
    }

    private function getBaseQuery(): string
    {
        return "SELECT 
                    p.*,
                    pr.name_company     AS provider_name,
                    pr.logo_provider,
                    pr.contact_cs,
                    w_area.nama         AS area_name,
                    w_coverage.nama     AS coverage_area_name,
                    w_coverage.kode     AS coverage_area_code
                FROM packages p
                INNER JOIN providers pr 
                    ON p.id_provider = pr.id_provider
                INNER JOIN wilayah w_area 
                    ON pr.area_code = w_area.kode
                INNER JOIN wilayah w_coverage 
                    ON pr.coverage_area = w_coverage.kode";
    }

    public function getAll(
        ?int    $id_user        = null,
        ?string $status         = null,
        ?int    $limit          = 10,
        ?int    $offset         = 0,
        ?string $search         = null,
        ?string $area           = null,
        ?string $coverageFilter = null  // <-- tambahan: 'available' | 'unavailable' | null
    ): array {
        $sql = $this->getBaseQuery();
        $sql .= " WHERE 1=1";

        $id_provider = null;

        if ($status !== null) {
            $sql .= " AND p.package_status = :status";
        }

        if ($id_user !== null) {
            $id_provider = $this->getProviderByIdUser($id_user);
            $sql .= " AND p.id_provider = :id_provider";
        }

        if ($search !== null) {
            $sql .= " AND (p.name_package LIKE :search OR pr.name_company LIKE :search)";
        }

        // Filter coverage berdasarkan pilihan
        if ($area !== null && $coverageFilter === 'available') {
            // Hanya tampilkan provider yang coverage-nya mencakup area customer
            $sql .= " AND (:area = pr.coverage_area OR :area LIKE CONCAT(pr.coverage_area, '.%'))";
        } elseif ($area !== null && $coverageFilter === 'unavailable') {
            // Hanya tampilkan provider yang coverage-nya TIDAK mencakup area customer
            $sql .= " AND NOT (:area = pr.coverage_area OR :area LIKE CONCAT(pr.coverage_area, '.%'))";
        }
        // Jika $coverageFilter null → tidak ada filter, tampil semua

        $sql .= " ORDER BY p.created_at DESC";

        if ($limit !== null && $offset !== null) {
            $sql .= " LIMIT :limit OFFSET :offset";
        }

        $stmt = $this->db->prepare($sql);

        if ($status !== null) {
            $stmt->bindValue(":status", $status, PDO::PARAM_STR);
        }

        if ($id_provider !== null) {
            $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        }

        if ($search !== null) {
            $stmt->bindValue(":search", "%" . $search . "%", PDO::PARAM_STR);
        }

        if ($area !== null && $coverageFilter !== null) {
            $stmt->bindValue(":area", $area, PDO::PARAM_STR);
        }

        if ($limit !== null && $offset !== null) {
            $stmt->bindValue(":limit",  $limit,  PDO::PARAM_INT);
            $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPackageWithRevenue(int $id_user, int $limit = 3)
    {
        $id_provider = $this->getProviderByIdUser($id_user);

        $sql = "SELECT 
            p.*,
            SUM(t.amount) AS revenue,
            COUNT(s.id_subscription) AS sales
        FROM packages p
        INNER JOIN providers pr 
            ON p.id_provider = pr.id_provider
        INNER JOIN subscriptions s 
            ON p.id_package = s.id_package
        INNER JOIN transactions t
            ON s.id_subscription = t.id_subscription
        WHERE p.id_provider = :id_provider AND t.payment_status = 'settlement'
        GROUP BY p.id_package
        ORDER BY revenue DESC
        LIMIT :limit";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPackageById(int $id, ?int $id_user = null) 
    {
        // 1. Panggil query dasar (Otomatis sudah nge-JOIN ke providers dan wilayah)
        $sql = $this->getBaseQuery();

        // 2. Filter berdasarkan ID Paket
        $sql .= " WHERE p.id_package = :id";

        // 3. Proteksi jika Provider yang melihat (Hanya bisa melihat paket miliknya)
        if ($id_user !== null) {
            $sql .= " AND pr.id_user = :id_user"; 
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        if ($id_user !== null) {
            $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        }

        $stmt->execute();
        
        // Tetap gunakan fetch() karena hasilnya pasti hanya 1 (Detail)
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPackageBySlug(string $slug, ?int $id_user = null) 
    {
        // 1. Panggil query dasar
        $sql = $this->getBaseQuery();

        // 2. Filter berdasarkan Slug
        $sql .= " WHERE p.slug = :slug";

        // 3. Proteksi jika Provider yang memanggil
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
        $provider = $this->getProviderByIdUser($id_user);
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


        $sqlPackages = "SELECT s.id_package, p.name_package
                        FROM subscriptions s
                        JOIN packages p ON s.id_package = p.id_package
                        WHERE p.id_provider = :id_provider
                        GROUP BY s.id_package
                        ORDER BY COUNT(*) DESC
                        LIMIT 1";
        
        $stmtIdPackage = $this->db->prepare($sqlPackages);
        $stmtIdPackage->bindValue(":id_provider", $id_provider, PDO::PARAM_INT);
        $stmtIdPackage->execute();
        
        // 1. UBAH fetchColumn() MENJADI fetch()
        $info_package = $stmtIdPackage->fetch(PDO::FETCH_ASSOC);

        // 2. BUAT PENGECEKAN (Jika provider belum punya paket yang terjual)
        $popular_name = $info_package ? $info_package['name_package'] : "Belum ada penjualan";
        $popular_id   = $info_package ? (int) $info_package['id_package'] : null;

        // 3. Kembalikan dalam format Array Associative persis seperti target JSON Anda
        return 
            [
                "total_packages"  => (int) $packageStats['total_packages'],
                "most_popular"    => $popular_name,
                "id_package"      => $popular_id,
                "average_price"   => (int) $packageStats['average_price'],
                "total_customers" => (int) $totalCustomers
            ];
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

    public function patchPackage(int $id_package, ?int $id_user, array $data): int
    {
        $allowedColumns = [
            'name_package', 
            'type_package', 
            'speed_mbps', 
            'download_speed',
            'download_unit',
            'upload_speed',
            'upload_unit',
            'quota_limit_gb', 
            'price_per_month', 
            'installation_cost', 
            'package_description', 
            'icon_package',
            'package_features',
            'is_recommended',
            'package_status'
        ];

        $fields = [];
        $binds = [];

        // 1. Looping data input untuk merakit query (tambahkan prefix p. untuk tabel packages)
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedColumns)) {
                $fields[] = "p.$key = :$key"; // Menggunakan alias p.
                
                if ($key === 'package_features' && is_array($value)) {
                    $value = json_encode($value);
                }
                $binds[":$key"] = $value;
            }
        }

        if (array_key_exists('name_package', $data)) {
            $rawSlug = $this->slugify($data['name_package']);
            $uniqueSlug = $this->getUniqueSlug($rawSlug, $id_package);
            $fields[] = "p.slug = :slug";
            $binds[":slug"] = $uniqueSlug;
        }

        if (empty($fields)) {
            return 0;
        }

        $fieldsString = implode(", ", $fields);

        // 2. Merakit SQL UPDATE JOIN yang benar
        $sql = "UPDATE packages p ";
        
        // JOIN diletakkan SEBELUM SET
        if ($id_user !== null) {
            $sql .= "JOIN providers pr ON p.id_provider = pr.id_provider ";
        }

        // SET dan WHERE utama
        $sql .= "SET {$fieldsString} WHERE p.id_package = :id_package";

        // Tambahan filter pengecekan kepemilikan provider
        if ($id_user !== null) {
            $sql .= " AND pr.id_user = :id_user"; 
        }

        // 3. UBAH DARI STRING MENJADI STATEMENT PDO (Ini yang sebelumnya kurang)
        $stmt = $this->db->prepare($sql);

        // 4. Eksekusi Binding Data
        foreach ($binds as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        // 5. Bind ID Package
        $stmt->bindValue(":id_package", $id_package, PDO::PARAM_INT);

        // 6. Bind ID User (Jika Tidak Null)
        if ($id_user !== null) {
            $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        }

        $stmt->execute();

        return $stmt->rowCount();
    }

    public function getPagination(
        ?int    $id_user        = null,
        ?string $status         = null,
        ?int    $limit          = null,
        ?int    $offset         = null,
        ?string $search         = null,
        ?string $area           = null,
        ?string $coverageFilter = null  // <-- tambahan
    ): array {
        $sql = "SELECT COUNT(p.id_package) as total FROM packages p";
        $sql .= " JOIN providers pr ON p.id_provider = pr.id_provider";
        $sql .= " WHERE 1=1";

        if ($id_user !== null) {
            $sql .= " AND pr.id_user = :id_user";
        }

        if ($status !== null) {
            $sql .= " AND p.package_status = :status";
        }

        if ($search !== null) {
            $sql .= " AND p.name_package LIKE :search";
        }

        if ($area !== null && $coverageFilter === 'available') {
            $sql .= " AND (:area = pr.coverage_area OR :area LIKE CONCAT(pr.coverage_area, '.%'))";
        } elseif ($area !== null && $coverageFilter === 'unavailable') {
            $sql .= " AND NOT (:area = pr.coverage_area OR :area LIKE CONCAT(pr.coverage_area, '.%'))";
        }

        $stmt = $this->db->prepare($sql);

        if ($id_user !== null) {
            $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        }

        if ($status !== null) {
            $stmt->bindValue(":status", $status, PDO::PARAM_STR);
        }

        if ($search !== null) {
            $stmt->bindValue(":search", "%" . $search . "%", PDO::PARAM_STR);
        }

        if ($area !== null && $coverageFilter !== null) {
            $stmt->bindValue(":area", $area, PDO::PARAM_STR);
        }

        $stmt->execute();

        $row        = $stmt->fetch(PDO::FETCH_ASSOC);
        $total_data = (int) $row['total'];
        $total_pages  = ($limit > 0) ? ceil($total_data / $limit) : 1;
        $current_page = ($limit > 0 && $offset !== null) ? ($offset / $limit) + 1 : 1;

        return [
            "total_data"   => $total_data,
            "total_pages"  => $total_pages,
            "current_page" => $current_page,
            "limit"        => $limit,
        ];
    }

    private function getProviderByIdUser(int $id_user): array
    {
        $sql = "SELECT id_provider FROM providers WHERE id_user = :id_user";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getCustomerByIdUser(int $id_user): array | false
    {
        $sql = "SELECT id_customer, area_code FROM customers WHERE id_user = :id_user";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(":id_user", $id_user, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getUniqueSlug(string $slug, ?int $exclude_id = null): string
    {
        $originalSlug = $slug;
        $count = 1;

        // Lakukan perulangan terus-menerus sampai menemukan slug yang unik (belum ada di DB)
        while (true) {
            $sql = "SELECT COUNT(*) FROM packages WHERE slug = :slug";
            if ($exclude_id !== null) {
                $sql .= " AND id_package != :exclude_id";
            }
            
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(":slug", $slug, PDO::PARAM_STR);
            if ($exclude_id !== null) {
                $stmt->bindValue(":exclude_id", $exclude_id, PDO::PARAM_INT);
            }
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

    private function slugify(string $text): string 
    {
        // 1. Ubah ke huruf kecil
        $text = strtolower($text);
        
        // 2. Ganti spasi dengan strip
        $text = str_replace(' ', '-', $text);
        
        // 3. Hapus karakter yang tidak diizinkan (selain huruf, angka, dan strip)
        $text = preg_replace('/[^a-z0-9-]/', '', $text);
        
        return $text;
    }

}