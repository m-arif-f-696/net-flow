<?php

class TransactionController
{
    public function __construct(
        private TransactionGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $resource): void
    {
        // Route:
        // GET /provider/transactions/summary?month=6&year=2026
        // GET /provider/transactions/outstanding
        // GET /provider/transactions/list?month=6&year=2026&page=2&per_page=10&status=pending

        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }


        match ($resource) {
        'summary'     => $this->handleSummary(),
        'outstanding' => $this->handleOutstanding(),
        'list'        => $this->handleList(),
        default       => $this->notFound(),
    };
    }

    // -------------------------------------------------------------------------
    // GET /provider/transactions
    // -------------------------------------------------------------------------

    private function handleSummary(): void
    {
        // Ambil bulan & tahun dari query param (opsional)
    $month = isset($_GET['month']) ? (int) $_GET['month'] : (int) date('n');
    $year  = isset($_GET['year'])  ? (int) $_GET['year']  : (int) date('Y');

    if ($month < 1 || $month > 12) {
        http_response_code(422);
        echo json_encode(['message' => 'Bulan tidak valid.']);
        return;
    }
    if ($year < 2025 || $year > (int) date('Y')) {
        http_response_code(422);
        echo json_encode(['message' => 'Tahun tidak valid.']);
        return;
    }

   
    $id_provider = $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);
    $summary     = $this->gateway->getSummary($id_provider, $month, $year);

    http_response_code(200);
    echo json_encode([
        'message' => 'Summary berhasil diambil.',
        'data'    => $summary,
    ]);
    
    }

    private function handleOutstanding(): void
    {
        
        $id_provider = $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);
        $outstanding = $this->gateway->getOutstanding($id_provider);

        http_response_code(200);
        echo json_encode([
            'message' => 'Outstanding berhasil diambil.',
            'data'    => $outstanding,
        ]);
        
    }

    private function handleList(): void
    {
        $month    = isset($_GET['month'])    ? (int) $_GET['month']    : (int) date('n');
        $year     = isset($_GET['year'])     ? (int) $_GET['year']     : (int) date('Y');
        $status   = isset($_GET['status'])  ? trim($_GET['status'])    : null;
        $page     = isset($_GET['page'])     ? (int) $_GET['page']     : 1;
        $per_page = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;

        // Validasi
        if ($month < 1 || $month > 12) {
            http_response_code(422);
            echo json_encode(['message' => 'Bulan harus antara 1–12.']);
            return;
        }
        if ($year < 2025 || $year > (int) date('Y')) {
            http_response_code(422);
            echo json_encode(['message' => 'Tahun harus mulai dari 2025.']);
            return;
        }
        if ($page < 1) {
            http_response_code(422);
            echo json_encode(['message' => 'Page harus lebih dari 0.']);
            return;
        }
        if ($per_page < 1 || $per_page > 100) {
            http_response_code(422);
            echo json_encode(['message' => 'Per page harus antara 1–100.']);
            return;
        }

        
        $id_provider = $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);

        $total_count = $this->gateway->countTransactions($id_provider, $month, $year, $status);
        $total_pages = (int) ceil($total_count / $per_page);
        $offset      = ($page - 1) * $per_page;

        $transactions = $this->gateway->getTransactions(
            $id_provider, $month, $year, $status, $per_page, $offset
        );

        http_response_code(200);
        echo json_encode([
            'message'      => 'Data transaksi berhasil diambil.',
            'filter'       => [
                'month'  => $month,
                'year'   => $year,
                'status' => $status ?? 'all',
            ],
            'pagination'   => [
                'total_count' => $total_count,
                'total_pages' => $total_pages,
                'current_page'=> $page,
                'per_page'    => $per_page,
                'has_next'    => $page < $total_pages,
                'has_prev'    => $page > 1,
            ],
            'transactions' => $transactions,
        ]);
    }

    private function notFound(): void
    {
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint tidak ditemukan.']);
    }

}