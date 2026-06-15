<?php

class CustomerProfileController
{
    public function __construct(
        private CustomerProfileGateway $gateway,
        private stdClass $userActive
    ) {}

    public function processRequest(string $method, ?string $action): void
    {
        if ($method !== 'POST' || $action !== 'setup') {
            http_response_code(405);
            header('Allow: POST');
            echo json_encode(['message' => 'Method not allowed atau action tidak valid.']);
            return;
        }

        $this->handleSetup();
    }

    private function handleSetup(): void
    {
        // Ambil field teks dari FormData
        $nik              = $_POST['nik']              ?? null;
        $full_name        = $_POST['full_name']        ?? null;
        $gender           = $_POST['gender']           ?? null;
        $phone            = $_POST['phone']            ?? null;
        $address          = $_POST['address']          ?? null;
        $area_code        = $_POST['area_code']        ?? null;
        $coordinate_point = $_POST['coordinate_point'] ?? null;

        // Validasi field wajib
        $errors = [];

        if (empty($nik))       $errors['nik']       = 'NIK wajib diisi.';
        if (strlen((string)$nik) !== 16) $errors['nik'] = 'NIK harus 16 digit.';
        if (empty($full_name)) $errors['full_name'] = 'Nama lengkap wajib diisi.';
        if (!in_array($gender, ['L', 'P'], true)) $errors['gender'] = 'Gender tidak valid. Gunakan L atau P.';
        if (empty($phone))     $errors['phone']     = 'Nomor telepon wajib diisi.';
        if (empty($address))   $errors['address']   = 'Alamat wajib diisi.';
        if (empty($area_code)) $errors['area_code'] = 'Kode wilayah wajib diisi.';

        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['message' => 'Validasi gagal.', 'errors' => $errors]);
            return;
        }

        // Handle foto profil (opsional, fallback ke default)
        $photoPath = 'uploads/photo_profile/user/default.png';

        if (isset($_FILES['photo_profile']) && $_FILES['photo_profile']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['photo_profile'];

            // Validasi ukuran max 2MB
            if ($file['size'] > 2 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['message' => 'Ukuran foto terlalu besar. Maksimal 2MB.']);
                return;
            }

            // Validasi tipe file
            $allowedTypes = ['image/jpeg', 'image/png'];
            $fileMimeType = mime_content_type($file['tmp_name']);
            if (!in_array($fileMimeType, $allowedTypes, true)) {
                http_response_code(400);
                echo json_encode(['message' => 'Format foto tidak didukung. Gunakan JPG atau PNG.']);
                return;
            }

            // Generate nama file unik
            $ext         = $fileMimeType === 'image/png' ? 'png' : 'jpg';
            $newFileName = 'photo_' . uniqid() . '_' . time() . '.' . $ext;
            $relativeDir = 'uploads/photo_profile/user/';
            $uploadDir   = __DIR__ . '/../../../' . $relativeDir;

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $destination = $uploadDir . $newFileName;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                http_response_code(500);
                echo json_encode(['message' => 'Gagal menyimpan foto ke server.']);
                return;
            }

            $photoPath = $relativeDir . $newFileName;
        }

        // Simpan ke database
        try {
            $saveData = [
                'id_user'          => (int) $this->userActive->id_user,
                'nik'              => $nik,
                'full_name'        => $full_name,
                'gender'           => $gender,
                'phone'            => $phone,
                'address'          => $address,
                'area_code'        => $area_code,
                'coordinate_point' => $coordinate_point ?? null,
                'photo_profile'    => $photoPath,
            ];

            $this->gateway->createProfile($saveData);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Profil customer berhasil dibuat.',
            ]);

        } catch (Exception $e) {
            // Jika gagal simpan DB dan foto sudah diupload, hapus fotonya
            if (isset($destination) && file_exists($destination)) {
                unlink($destination);
            }

            http_response_code(500);
            echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
        }
    }
}