<?php

class CheckoutController
{
    public function __construct(
        private CheckoutGateway $gateway,
        private object          $userActive
    ) {}

    public function processRequest(string $method): void
    {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $this->handleCheckout();
    }

    // -------------------------------------------------------------------------
    // POST /api/customer/checkout
    // Body: { id_package, installation_date, installation_time, additional_message? }
    // -------------------------------------------------------------------------

    private function handleCheckout(): void
    {
        // --- 1. Parse & validasi input ---
        $data = json_decode(file_get_contents('php://input'), true);

        $id_package          = isset($data['id_package']) ? (int) $data['id_package'] : null;
        $installation_date   = trim($data['installation_date'] ?? '');
        $installation_time   = trim($data['installation_time'] ?? '');
        $additional_message  = $data['additional_message'] ?? null;

        if (!$id_package || !$installation_date || !$installation_time) {
            http_response_code(422);
            echo json_encode(['message' => 'id_package, installation_date, dan installation_time wajib diisi.']);
            return;
        }

        // Validasi format tanggal YYYY-MM-DD
        $parsedDate = \DateTime::createFromFormat('Y-m-d', $installation_date);
        if (!$parsedDate || $parsedDate->format('Y-m-d') !== $installation_date) {
            http_response_code(422);
            echo json_encode(['message' => 'Format installation_date tidak valid. Gunakan YYYY-MM-DD.']);
            return;
        }

        // Tanggal instalasi minimal hari ini
        if ($parsedDate < new \DateTime('today')) {
            http_response_code(422);
            echo json_encode(['message' => 'Tanggal pemasangan tidak boleh di masa lalu.']);
            return;
        }

        // --- 2. Ambil data customer ---
        $customer = $this->gateway->findCustomerWithDetails((int) $this->userActive->id_user);

        // --- 3. Ambil & validasi paket ---
        $package = $this->gateway->findPackageById($id_package);
        if (!$package || $package['package_status'] !== 'active') {
            http_response_code(404);
            echo json_encode(['message' => 'Paket tidak ditemukan atau sudah tidak aktif.']);
            return;
        }

        // --- 4. Kalkulasi jumlah tagihan ---
        $amount = (int) $package['price_per_month'] + (int) $package['installation_cost'];

        // --- 5. Generate invoice number ---
        $invoiceNumber = $this->gateway->generateInvoiceNumber();

        // --- 6. Simpan ke DB (subscription → transaction → schedule) ---
        $idSubscription = $this->gateway->createSubscription(
            (int) $customer['id_customer'],
            $id_package
        );

        $idTransaction = $this->gateway->createTransaction(
            $idSubscription,
            $invoiceNumber,
            $amount
        );

        $this->gateway->createInstallationSchedule(
            $idSubscription,
            $installation_date,
            $installation_time,
            $additional_message
        );

        // --- 7. Panggil Midtrans Snap ---
        \Midtrans\Config::$serverKey    = $_ENV['MIDTRANS_SERVER_KEY'];
        \Midtrans\Config::$isProduction = filter_var($_ENV['MIDTRANS_IS_PRODUCTION'], FILTER_VALIDATE_BOOLEAN);
        \Midtrans\Config::$isSanitized  = true;
        \Midtrans\Config::$is3ds        = true;

        // Bangun item_details untuk Midtrans (harga harus match gross_amount)
        $itemDetails = [
            [
                'id'       => 'pkg-' . $package['id_package'],
                'price'    => (int) $package['price_per_month'],
                'quantity' => 1,
                'name'     => $package['name_package'],
            ],
        ];

        if ((int) $package['installation_cost'] > 0) {
            $itemDetails[] = [
                'id'       => 'install-' . $package['id_package'],
                'price'    => (int) $package['installation_cost'],
                'quantity' => 1,
                'name'     => 'Biaya Instalasi',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id'     => $invoiceNumber,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $customer['full_name'],
                'email'      => $customer['email'],
                'phone'      => $customer['phone'],
            ],
            'item_details' => $itemDetails,
        ];

        try {
            $snapToken = \Midtrans\Snap::getSnapToken($params);
        } catch (\Exception $e) {
            // Rollback: hapus semua record yang sudah dibuat
            $this->gateway->rollbackCheckout($idTransaction, $idSubscription);

            http_response_code(502);
            echo json_encode(['message' => 'Gagal menghubungi Midtrans. Silakan coba lagi. Detail: ' . $e->getMessage()]);
            return;
        }

        // --- 8. Simpan snap_token ---
        $this->gateway->saveSnapToken($idTransaction, $snapToken);

        // --- 9. Kembalikan token ke frontend ---
        http_response_code(201);
        echo json_encode([
            'message'        => 'Checkout berhasil. Silakan selesaikan pembayaran.',
            'invoice_number' => $invoiceNumber,
            'amount'         => $amount,
            'snap_token'     => $snapToken,
        ]);
    }
}
