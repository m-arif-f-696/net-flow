<?php

class ProviderProfileController {

    public function __construct(
        private ProviderGateway $gateway,
        private stdClass $userActive
    ) {}

    public function processRequest(string $method, ?string $action): void
    {
        if ($method !== "POST" || $action !== "setup") {
            http_response_code(405);
            header("Allow: POST");
            echo json_encode(["message" => "Method not allowed atau action tidak valid."]);
            return;
        }

        $this->handleSetup();
    }

    private function handleSetup(): void
    {
        // Parameter POST dari FormData
        $name_company = $_POST['name_company'] ?? null;
        $nib          = $_POST['nib'] ?? null;
        $contact_cs   = $_POST['contact_cs'] ?? null;
        $area_code    = $_POST['area_code'] ?? null;
        $coordinate_point = $_POST['coordinate_point'] ?? null;
        $address      = $_POST['address'] ?? null;
        $coverage_area = $_POST['coverage_area'] ?? null;

        // Validasi field teks wajib
        if (empty($name_company) || empty($nib) || empty($contact_cs) || empty($area_code) || empty($coordinate_point) || empty($address) || empty($coverage_area)) {
            http_response_code(422);
            echo json_encode(["message" => "Data profil tidak lengkap."]);
            return;
        }

        // Validasi dan simpan file logo
        if (!isset($_FILES['logo_provider']) || $_FILES['logo_provider']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(422);
            echo json_encode(["message" => "Gagal mengunggah logo perusahaan."]);
            return;
        }

        $file = $_FILES['logo_provider'];

        // Cek ukuran file max 2MB
        if ($file['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["message" => "Ukuran file terlalu besar. Maksimal 2MB."]);
            return;
        }

        // Cek Mime Type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        $fileMimeType = mime_content_type($file['tmp_name']);
        if (!in_array($fileMimeType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(["message" => "Format file tidak didukung. Gunakan JPG, PNG, atau SVG."]);
            return;
        }

        // Dapatkan ekstensi file asli
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        if (empty($ext)) {
            $ext = ($fileMimeType === 'image/png') ? 'png' : (($fileMimeType === 'image/svg+xml') ? 'svg' : 'jpg');
        }

        // Rename agar unik
        $newFileName = 'logo_' . uniqid() . '_' . time() . '.' . $ext;
        $relativeDir = 'uploads/photo_profile/provider/';
        $uploadDir   = __DIR__ . '/../../../' . $relativeDir;

        // Buat folder jika belum ada
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $destination = $uploadDir . $newFileName;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal menyimpan file logo ke server."]);
            return;
        }

        $logoPath = $relativeDir . $newFileName;

        // Simpan ke database
        try {
            $saveData = [
                'id_user'          => $this->userActive->id_user,
                'name_company'     => $name_company,
                'nib'              => $nib,
                'address'          => $address,
                'area_code'        => $area_code,
                'coordinate_point' => $coordinate_point,
                'coverage_area'    => $coverage_area,
                'contact_cs'       => $contact_cs,
                'logo_provider'    => $logoPath
            ];

            if ($this->gateway->createProfile($saveData)) {
                http_response_code(201);
                echo json_encode([
                    "success" => true,
                    "message" => "Pendaftaran profile provider berhasil diselesaikan."
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Gagal menyimpan profile ke database."]);
            }
        } catch (Exception $e) {
            // Jika gagal simpan DB, hapus file yang sudah diupload untuk menghemat space
            if (file_exists($destination)) {
                unlink($destination);
            }

            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }
    
}
