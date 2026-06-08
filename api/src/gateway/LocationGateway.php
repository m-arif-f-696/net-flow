<?php

class LocationGateway
{
    private PDO $db;

    // 1. Disesuaikan dengan arsitektur class Database Net Flow Anda
    public function __construct(Database $database) 
    {
        $this->db = $database->connect();
    }

    /**
     * Ambil semua provinsi (kode 2 digit, misal: "11", "32")
     */
    public function getProvinces(): array
    {
        $sql = "SELECT kode, nama FROM wilayah WHERE LENGTH(kode) = 2 ORDER BY nama";
        $stmt = $this->db->query($sql);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ambil kabupaten/kota berdasarkan kode provinsi
     * Kode provinsi: "32" → kabupaten: "32.xx" (panjang 5)
     */
    public function getRegencies(string $province_code): array
    {
        $sql = "SELECT kode, nama FROM wilayah 
                WHERE LENGTH(kode) = 5 
                AND kode LIKE :prefix 
                ORDER BY nama";
                
        $stmt = $this->db->prepare($sql);
        // 2. Menggunakan bindValue (standar PDO yang lebih aman)
        $stmt->bindValue(':prefix', $province_code . '.%', PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ambil kecamatan berdasarkan kode kabupaten/kota
     * Kode kabupaten: "32.07" → kecamatan: "32.07.xx" (panjang 8)
     */
    public function getDistricts(string $regency_code): array
    {
        $sql = "SELECT kode, nama FROM wilayah 
                WHERE LENGTH(kode) = 8 
                AND kode LIKE :prefix 
                ORDER BY nama";
                
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':prefix', $regency_code . '.%', PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ambil kelurahan/desa berdasarkan kode kecamatan
     * Kode kecamatan: "32.07.15" → kelurahan: "32.07.15.xx" (panjang 13)
     */
    public function getVillages(string $district_code): array
    {
        $sql = "SELECT kode, nama FROM wilayah 
                WHERE LENGTH(kode) = 13 
                AND kode LIKE :prefix 
                ORDER BY nama";
                
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':prefix', $district_code . '.%', PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Validasi apakah kode wilayah ada di database
     */
    public function exists(string $kode): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM wilayah WHERE kode = :kode");
        $stmt->bindValue(':kode', $kode, PDO::PARAM_STR);
        $stmt->execute();
        
        return (bool) $stmt->fetchColumn();
    }

    public function getArea(?string $code): array
    {
        $province_code = substr($code, 0, 2);
        $regency_code = substr($code, 0, 5);
        $district_code = substr($code, 0, 8);
        $village_code = substr($code, 0, 13);

        $area = [$province_code, $regency_code, $district_code, $village_code];
        $results = [];

        foreach ($area as $code) {
          $sql = "SELECT kode, nama FROM wilayah WHERE kode = :code";
          $stmt = $this->db->prepare($sql);
          $stmt->bindValue(':code', $code, PDO::PARAM_STR);
          $stmt->execute();
          $result = $stmt->fetch(PDO::FETCH_ASSOC);
          $results[] = $result;
        }

        $sql = "SELECT kode, nama FROM wilayah WHERE kode = :code";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':code', $code, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'province' => $results[0],
            'regencies' => $results[1],
            'districts' => $results[2],
            'villages' => $results[3]
        ];
    }
}