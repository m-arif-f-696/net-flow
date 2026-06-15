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

    // -------------------------------------------------------------------------
    // POST /customer/pay/{id_transaction}
    // -------------------------------------------------------------------------
    public function processPayRequest(string $method, ?string $params): void
    {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $id_transaction = filter_var($params, FILTER_VALIDATE_INT);
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
                echo json_encode(['message' => 'Transaksi tidak ditemukan atau bukan milik Anda.']);
                return;
            }

            if ($transaction['payment_status'] === 'settlement') {
                http_response_code(422);
                echo json_encode(['message' => 'Transaksi ini sudah lunas.']);
                return;
            }

            // Jika snap_token sudah ada DAN dibuat kurang dari 24 jam yang lalu, gunakan token lama
            $isExpired = false;
            if (!empty($transaction['snap_token']) && !empty($transaction['created_at'])) {
                $createdTime = strtotime($transaction['created_at']);
                // Default masa aktif Snap Token Midtrans adalah 24 jam (86400 detik)
                if ((time() - $createdTime) > 86400) {
                    $isExpired = true;
                }
            }

            if (!empty($transaction['snap_token']) && !$isExpired) {
                http_response_code(200);
                echo json_encode([
                    'message'    => 'Gunakan token Snap yang ada.',
                    'snap_token' => $transaction['snap_token']
                ]);
                return;
            }

            // Integrasikan Midtrans Config
            \Midtrans\Config::$serverKey    = $_ENV['MIDTRANS_SERVER_KEY'];
            \Midtrans\Config::$isProduction = filter_var($_ENV['MIDTRANS_IS_PRODUCTION'], FILTER_VALIDATE_BOOLEAN);
            \Midtrans\Config::$isSanitized  = true;
            \Midtrans\Config::$is3ds        = true;

            // Dapatkan detail customer email dari DB
            // Karena getTransactionById tidak memuat user email secara langsung, mari ambil dari relasi
            $database = new Database();
            $db = $database->connect();
            $stmtCustomer = $db->prepare(
                "SELECT c.full_name, c.phone, u.email 
                 FROM customers c 
                 JOIN users u ON c.id_user = u.id_user 
                 WHERE c.id_user = :id_user LIMIT 1"
            );
            $stmtCustomer->execute([':id_user' => (int) $this->userActive->id_user]);
            $customer = $stmtCustomer->fetch(PDO::FETCH_ASSOC);

            if (!$customer) {
                throw new RuntimeException("Data profil customer tidak lengkap.", 400);
            }

            $itemDetails = [
                [
                    'id'       => 'tx-' . $transaction['id_transaction'],
                    'price'    => (int) $transaction['amount'],
                    'quantity' => 1,
                    'name'     => $transaction['name_package'] . ' (' . ($transaction['payment_type'] === 'monthly' ? 'Tagihan Bulanan' : 'Aktivasi Awal') . ')',
                ]
            ];

            $paramsMidtrans = [
                'transaction_details' => [
                    'order_id'     => $transaction['invoice_number'],
                    'gross_amount' => (int) $transaction['amount'],
                ],
                'customer_details' => [
                    'first_name' => $customer['full_name'],
                    'email'      => $customer['email'],
                    'phone'      => $customer['phone'],
                ],
                'item_details' => $itemDetails,
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($paramsMidtrans);

            // Simpan snap_token di DB
            $this->gateway->saveSnapToken((int) $id_transaction, $snapToken);

            http_response_code(200);
            echo json_encode([
                'message'    => 'Snap token berhasil dibuat.',
                'snap_token' => $snapToken
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Gagal membuat token pembayaran. Detail: ' . $e->getMessage()]);
        }
    }
}