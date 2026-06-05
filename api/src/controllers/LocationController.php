<?php

class LocationController
{
    public function __construct(private LocationGateway $gateway) {}

    public function processRequest(string $method, ?string $resource): void
    {
        if ($method !== "GET") {
            http_response_code(405);
            header("Allow: GET");
            echo json_encode(["message" => "Method not allowed."]);
            return;
        }

        // Routing berdasarkan query param:
        // GET /location                          → semua provinsi
        // GET /location?type=regency&code=32     → kabupaten/kota di provinsi 32
        // GET /location?type=district&code=32.07 → kecamatan di kabupaten 32.07
        // GET /location?type=village&code=32.07.15 → kelurahan di kecamatan 32.07.15

        $type = $_GET['type'] ?? 'province';
        $code = $_GET['code'] ?? null;

        match ($type) {
            'province' => $this->handleProvince(),
            'regency'  => $this->handleRegency($code),
            'district' => $this->handleDistrict($code),
            'village'  => $this->handleVillage($code),
            default    => $this->sendError(400, "Parameter 'type' tidak valid. Gunakan: province, regency, district, village.")
        };
    }

    private function handleProvince(): void
    {
        $data = $this->gateway->getProvinces();
        $this->sendSuccess($data);
    }

    private function handleRegency(?string $code): void
    {
        if (!$code) {
            $this->sendError(400, "Parameter 'code' provinsi wajib diisi. Contoh: ?type=regency&code=32");
            return;
        }

        if (!$this->gateway->exists($code)) {
            $this->sendError(404, "Kode provinsi '{$code}' tidak ditemukan.");
            return;
        }

        $data = $this->gateway->getRegencies($code);
        $this->sendSuccess($data);
    }

    private function handleDistrict(?string $code): void
    {
        if (!$code) {
            $this->sendError(400, "Parameter 'code' kabupaten/kota wajib diisi. Contoh: ?type=district&code=32.07");
            return;
        }

        if (!$this->gateway->exists($code)) {
            $this->sendError(404, "Kode kabupaten/kota '{$code}' tidak ditemukan.");
            return;
        }

        $data = $this->gateway->getDistricts($code);
        $this->sendSuccess($data);
    }

    private function handleVillage(?string $code): void
    {
        if (!$code) {
            $this->sendError(400, "Parameter 'code' kecamatan wajib diisi. Contoh: ?type=village&code=32.07.15");
            return;
        }

        if (!$this->gateway->exists($code)) {
            $this->sendError(404, "Kode kecamatan '{$code}' tidak ditemukan.");
            return;
        }

        $data = $this->gateway->getVillages($code);
        $this->sendSuccess($data);
    }

    private function sendSuccess(array $data): void
    {
        http_response_code(200);
        echo json_encode(["code" => 200, "message" => "Success", "data" => $data]);
    }

    private function sendError(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(["code" => $code, "message" => $message]);
    }
}