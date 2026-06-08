<?php

class ProviderReportController
{
    private ProviderReportGateway $gateway;
    private object $userActive;

    // Menangkap gateway dan data user dari token JWT (dari index.php)
    public function __construct(ProviderReportGateway $gateway, object $userActive)
    {
        $this->gateway = $gateway;
        $this->userActive = $userActive;
    }

    public function processRequest(string $method): void
    {
        // Fitur Dashboard (Report) biasanya hanya diakses dengan metode GET
        if ($method !== "GET") {
            http_response_code(405); // 405 Method Not Allowed
            header("Allow: GET");
            echo json_encode(["message" => "Method tidak diizinkan"]);
            return;
        }

        $this->getDashboardReport();
    }

    private function getDashboardReport(): void
    {
        // 1. Ambil id_user dari token
        $id_user = $this->userActive->id_user;

        // 2. Cari id_provider di database menggunakan gateway
        $id_provider = $this->gateway->getProviderIdByUserId($id_user);

        if (!$id_provider) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "Profil provider belum lengkap atau tidak ditemukan"]);
            return;
        }

        // 3. Eksekusi hitung, Upsert, dan ambil datanya
        $reportData = $this->gateway->generateAndGetReport($id_provider);

        // 4. Kirimkan JSON ke Frontend (JavaScript)
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "code" => "200",
            "message" => "Berhasil memuat laporan bulan ini",
            "data" => $reportData
        ]);
    }
}