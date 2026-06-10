<?php

class MySubscriptionController
{
    public function __construct(
        private MySubscriptionGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $resource): void
    {
        // Route:
        // GET /customer/my-subscription           → subscription aktif
        // GET /customer/my-subscription/history   → riwayat semua subscription

        if ($resource === 'history') {
            $this->handleHistory($method);
            return;
        }

        $this->handleActive($method);
    }

    // -------------------------------------------------------------------------
    // GET /customer/my-subscription
    // -------------------------------------------------------------------------

   private function handleActive(string $method): void
    {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        try {
            $subscriptions = $this->gateway->getActiveSubscription(
                (int) $this->userActive->id_user
            );

            if (empty($subscriptions)) {
                http_response_code(404);
                echo json_encode([
                    'code'    => 404,
                    'message' => 'Tidak ada langganan aktif.',
                    'total'   => 0,
                    'data'    => [],
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Data langganan aktif berhasil diambil.',
                'total'   => count($subscriptions),
                'data'    => $subscriptions,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /customer/my-subscription/history
    // -------------------------------------------------------------------------

    private function handleHistory(string $method): void
    {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        try {
            $history = $this->gateway->getSubscriptionHistory(
                (int) $this->userActive->id_user
            );

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Riwayat langganan berhasil diambil.',
                'total'   => count($history),
                'data'    => $history,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }
}