<?php

class MyTransactionController
{
    public function __construct(
        private MyTransactionGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $resource): void
    {
        // Route:
        // GET /customer/my-transactions           → daftar transaksi (pagination)
        // GET /customer/my-transactions/{id}      → detail satu transaksi

        if ($resource !== null) {
            $this->processResourceRequest($method, $resource);
            return;
        }

        $this->processCollectionRequest($method);
    }

    // -------------------------------------------------------------------------
    // GET /customer/my-transactions
    // -------------------------------------------------------------------------

    private function processCollectionRequest(string $method): void
    {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $limit    = isset($_GET['limit'])    ? (int)    $_GET['limit']    : 10;
        $page     = isset($_GET['page'])     ? (int)    $_GET['page']     : 1;
        $status   = isset($_GET['status'])   ? trim($_GET['status'])      : null;

        $allowedStatus = ['pending', 'settlement', 'expire', 'cancel'];

        if ($status !== null && !in_array($status, $allowedStatus, true)) {
            http_response_code(422);
            echo json_encode([
                'message' => 'Status tidak valid. Gunakan: pending, settlement, expire, cancel.'
            ]);
            return;
        }

        if ($page < 1)    $page    = 1;
        if ($limit < 1)   $limit   = 10;
        if ($limit > 100) $limit   = 100;

        $offset      = ($page - 1) * $limit;
        $id_user     = (int) $this->userActive->id_user;

        try {
            $total_count = $this->gateway->countTransactions($id_user, $status);
            $total_pages = (int) ceil($total_count / $limit);
            $transactions = $this->gateway->getTransactions($id_user, $status, $limit, $offset);

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Riwayat transaksi berhasil diambil.',
                'filter'  => [
                    'status' => $status ?? 'all',
                ],
                'pagination' => [
                    'total_count'  => $total_count,
                    'total_pages'  => $total_pages,
                    'current_page' => $page,
                    'per_page'     => $limit,
                    'has_next'     => $page < $total_pages,
                    'has_prev'     => $page > 1,
                ],
                'data' => $transactions,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /customer/my-transactions/{id}
    // -------------------------------------------------------------------------

    private function processResourceRequest(string $method, string $resource): void
    {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $id_transaction = filter_var($resource, FILTER_VALIDATE_INT);

        if ($id_transaction === false) {
            http_response_code(400);
            echo json_encode(['message' => 'ID transaksi tidak valid.']);
            return;
        }

        try {
            $transaction = $this->gateway->getTransactionById(
                (int) $this->userActive->id_user,
                (int) $id_transaction
            );

            if (!$transaction) {
                http_response_code(404);
                echo json_encode([
                    'code'    => 404,
                    'message' => 'Transaksi tidak ditemukan.',
                    'data'    => null,
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Detail transaksi berhasil diambil.',
                'data'    => $transaction,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }
}