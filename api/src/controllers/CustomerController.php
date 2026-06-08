<?php

class CustomerController {
    private $gateway;
    private $userActive;

    public function __construct(CustomerGateway $gateway, object $userActive) {
        $this->gateway = $gateway;
        $this->userActive = $userActive;
    }

    public function processRequest(string $method, ?string $id): void {
        // Mendapatkan id_provider berdasarkan user yang sedang login
        $id_provider = $this->gateway->findProviderIdByUser($this->userActive->id_user); 

        if ($method === 'GET') {
            if ($id === 'summary') {
                // Eksekusi jika URL: /provider/customers/summary
                $this->getCustomersSummaryData($id_provider);
                
            } elseif ($id && is_numeric($id)) {
                // Eksekusi jika URL: /provider/customers/5
                $this->getCustomerDetail($id_provider, (int)$id);
                
            } else {
                // Eksekusi jika URL: /provider/customers (Menampilkan tabel + Pagination)
                $this->getAllCustomersPaginated($id_provider);
            }
        } else {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
        }
    }

    // Fungsi Endpoint: Summary
    private function getCustomersSummaryData(int $id_provider): void {
        // Pastikan Anda sudah menambahkan fungsi getCustomerSummary() di CustomerGateway
        $summary = $this->gateway->getCustomerSummary($id_provider);

        http_response_code(200);
        echo json_encode([
            "message" => "Berhasil mengambil ringkasan status pelanggan",
            "summary" => $summary
        ]);
    }

    // Fungsi Endpoint: Get All (Pagination)
    private function getAllCustomersPaginated(int $id_provider): void {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

        $filter = isset($_GET['filter']) ? $_GET['filter'] : null;
        
        if ($page < 1) $page = 1;
        if ($limit < 1) $limit = 10;

        $offset = ($page - 1) * $limit;

        $total_data = $this->gateway->getTotalCustomers($id_provider, $filter);
        $customers_data = $this->gateway->getCustomers($id_provider, $limit, $offset, $filter);
        $total_pages = ceil($total_data / $limit);

        // Format ID Customer menjadi NF-XXXX
        foreach ($customers_data as &$customer) {
            $customer['subscriber_id'] = sprintf("CUST-%04d", $customer['id_customer']);
        }

        http_response_code(200);
        echo json_encode([
            "message" => "Berhasil mengambil data pelanggan",
            "data" => $customers_data,
            "pagination" => [
                "total_data" => $total_data,
                "total_pages" => $total_pages,
                "current_page" => $page,
                "limit" => $limit
            ]
        ]);
    }
    private function getCustomerDetail(int $id_provider, int $id_customer): void {
        $customer = $this->gateway->getCustomerById($id_provider, $id_customer);

        // Jika data tidak ditemukan atau bukan milik provider ini
        if (!$customer) {
            http_response_code(404);
            echo json_encode([
                "message" => "Data pelanggan tidak ditemukan atau Anda tidak memiliki akses"
            ]);
            return;
        }

        // Terapkan ID kustom yang keren (NF-XXXX)
        $customer['subscriber_id'] = sprintf("CUST-%04d", $customer['id_customer']);

        http_response_code(200);
        echo json_encode([
            "message" => "Berhasil mengambil detail pelanggan",
            "data" => $customer
        ]);
    }
}