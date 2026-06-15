<?php

class PaymentCallbackController
{
    public function __construct(
        private PaymentCallbackGateway $gateway
    ) {}

    public function processRequest(string $method): void
    {
        // Midtrans hanya mengirim POST
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $this->handleCallback();
    }

    // -------------------------------------------------------------------------
    // POST /api/webhook/payment
    // Endpoint publik — tanpa middleware auth — dipanggil oleh server Midtrans
    // -------------------------------------------------------------------------

    private function handleCallback(): void
    {
        // --- 1. Parse payload dari Midtrans ---
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['message' => 'Payload tidak valid.']);
            return;
        }

        // --- 2. Verifikasi signature key ---
        // Rumus Midtrans: SHA512(order_id + status_code + gross_amount + server_key)
        $serverKey         = $_ENV['MIDTRANS_SERVER_KEY'];
        $orderId           = $data['order_id']       ?? '';
        $statusCode        = $data['status_code']    ?? '';
        $grossAmount       = $data['gross_amount']   ?? '';
        $incomingSignature = $data['signature_key']  ?? '';

        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        // hash_equals mencegah timing attack
        if (!hash_equals($expectedSignature, $incomingSignature)) {
            http_response_code(403);
            echo json_encode(['message' => 'Signature tidak valid.']);
            return;
        }

        // --- 3. Cari transaksi di database ---
        $transaction = $this->gateway->findTransactionByInvoiceNumber($orderId);

        if (!$transaction) {
            http_response_code(404);
            echo json_encode(['message' => 'Transaksi tidak ditemukan.']);
            return;
        }

        // --- 4. Idempotency check ---
        // Jika sudah settlement, abaikan notifikasi duplikat dari Midtrans
        if ($transaction['payment_status'] === 'settlement') {
            http_response_code(200);
            echo json_encode(['message' => 'Transaksi sudah diproses sebelumnya.']);
            return;
        }

        $transactionStatus = $data['transaction_status'] ?? '';
        $fraudStatus       = $data['fraud_status']       ?? '';

        // --- 5. Proses berdasarkan status dari Midtrans ---
        // settlement  → pembayaran dikonfirmasi (transfer bank, dll.)
        // capture     → pembayaran kartu kredit dikonfirmasi
        // expire/cancel/deny → pembayaran gagal

        if ($transactionStatus === 'settlement' ||
            ($transactionStatus === 'capture' && $fraudStatus === 'accept')
        ) {
            $this->processSettlement($transaction);

        } elseif (in_array($transactionStatus, ['cancel', 'expire', 'deny'], true)) {
            $this->processFailed(
                $transaction,
                $transactionStatus === 'deny' ? 'cancel' : $transactionStatus
            );
        }

        // Selalu return 200 ke Midtrans agar tidak retry terus-menerus
        http_response_code(200);
        echo json_encode(['message' => 'Notifikasi berhasil diterima.']);
    }

    // -------------------------------------------------------------------------
    // Proses: Pembayaran BERHASIL
    // -------------------------------------------------------------------------

    private function processSettlement(array $transaction): void
    {
        $idTransaction  = (int) $transaction['id_transaction'];
        $idSubscription = (int) $transaction['id_subscription'];
        $paymentType    = $transaction['payment_type'];

        // Update status transaksi → settlement
        $this->gateway->updateTransactionSettlement($idTransaction);

        if ($paymentType === 'activation') {
            // Update status schedule → approved
            $this->gateway->approvedSchedule($idSubscription);

            // Notifikasi ke customer
            $this->gateway->insertNotification(
                (int) $transaction['id_user_customer'],
                'Pembayaran Berhasil! 🎉',
                "Langganan paket {$transaction['name_package']} Anda telah aktif. " .
                "Teknisi kami akan menghubungi Anda sesuai jadwal pemasangan.",
                'billing'
            );

            // Notifikasi ke provider
            $this->gateway->insertNotification(
                (int) $transaction['id_user_provider'],
                'Pelanggan Baru Terdaftar',
                "Customer {$transaction['customer_name']} baru saja berlangganan paket " .
                "{$transaction['name_package']} dan pembayaran aktivasi telah diterima.",
                'billing'
            );

        } elseif ($paymentType === 'monthly') {
            // Perpanjang end_date subscription +30 hari
            $this->gateway->extendSubscription($idSubscription);

            $amountFormatted = 'Rp ' . number_format((int) $transaction['amount'], 0, ',', '.');

            // Notifikasi ke customer
            $this->gateway->insertNotification(
                (int) $transaction['id_user_customer'],
                'Tagihan Bulanan Lunas ✅',
                "Pembayaran {$transaction['invoice_number']} sebesar {$amountFormatted} " .
                "berhasil. Masa aktif paket {$transaction['name_package']} diperpanjang 30 hari.",
                'billing'
            );
        }
    }

    // -------------------------------------------------------------------------
    // Proses: Pembayaran GAGAL / KADALUARSA
    // -------------------------------------------------------------------------

    private function processFailed(array $transaction, string $status): void
    {
        $idTransaction  = (int) $transaction['id_transaction'];
        $idSubscription = (int) $transaction['id_subscription'];
        $paymentType    = $transaction['payment_type'];

        // Update status transaksi → expire / cancel
        $this->gateway->updateTransactionStatus($idTransaction, $status);

        // Untuk activation yang gagal: subscription tidak aktif → terminate
        if ($paymentType === 'activation') {
            $this->gateway->terminateSubscription($idSubscription);

            $reason = $status === 'expire'
                ? 'Token pembayaran telah kadaluarsa.'
                : 'Pembayaran dibatalkan.';

            // Notifikasi ke customer
            $this->gateway->insertNotification(
                (int) $transaction['id_user_customer'],
                'Pembayaran Gagal ❌',
                "{$reason} Langganan paket {$transaction['name_package']} tidak dapat diaktifkan. " .
                "Silakan lakukan checkout ulang jika ingin melanjutkan.",
                'billing'
            );
        }
    }
}
