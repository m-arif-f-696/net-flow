<?php

class CustomerPackageController 
{
    // $userActive berisi data hasil decode JWT (misal: id_user, role, email)
    public function __construct(private PackageGateway $gateway, private $userActive)
    {
    }

    public function processRequest(string $method, ?string $param): void 
    {
        if ($param) {
            $this->processResourceRequest($method, $param);
        } else {
            $this->processCollectionRequest($method);
        }
    }

    // Menangani request dengan parameter (Contoh: GET /customer/packages/5)
    // 5 di sini adalah ID Provider
    private function processResourceRequest(string $method, string $param): void 
    {
        if ($method !== "GET") {
            http_response_code(405);
            header("Allow: GET");
            echo json_encode(["message" => "Metode tidak diizinkan. Customer hanya dapat melihat data."]);
            return;
        }

        // Mengambil daftar paket berdasarkan id_provider
        if (is_numeric($param)) {
            $package = $this->gateway->getPackageById((int)$param);
        } else {
            $package = $this->gateway->getPackageBySlug($param);
        }

        if (!$package) {
            http_response_code(404);
            echo json_encode(["message" => "Tidak ada paket yang ditemukan untuk provider tersebut."]);
            return;
        }

        http_response_code(200);
        echo json_encode(["code"=>200, "message" => "Success", "data" => $package]);
    }

    // Menangani request tanpa parameter (Contoh: GET /customer/packages)
    private function processCollectionRequest(string $method) : void 
    {
        if ($method !== "GET") {
            http_response_code(405);
            header("Allow: GET");
            echo json_encode(["message" => "Metode tidak diizinkan. Customer hanya dapat melihat data."]);
            return;
        }

        // 1. TANGKAP QUERY PARAMETER (Dengan Nilai Default)

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $search = isset($_GET['search']) ? (string) $_GET['search'] : null;


        $packages = $this->gateway->getAll(null, 'active', $limit, $offset, $search);
        $pagination = $this->gateway->getPagination(null, 'active', $limit, $offset, $search);


        http_response_code(200);
        echo json_encode(["code"=>200, "message" => "Success", "data" => $packages, "pagination" => $pagination]);
    }
}