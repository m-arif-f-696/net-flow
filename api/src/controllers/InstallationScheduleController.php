<?php

class InstallationScheduleController
{
    public function __construct(
        private InstallationScheduleGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $params): void
    {
        // Route:
        // GET   /provider/installations             → daftar jadwal (+ ?filter=approved dst)
        // PATCH /provider/installations/{id}        → tandai instalasi selesai

        if ($params !== null) {
            $this->processResourceRequest($method, $params);
            return;
        }

        $this->processCollectionRequest($method);
    }

    // -------------------------------------------------------------------------
    // GET /provider/installations
    // -------------------------------------------------------------------------

    private function processCollectionRequest(string $method): void
    {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        $allowedStatus = ['pending', 'approved', 'completed', 'rescheduled', 'cancelled'];
        $filter        = isset($_GET['filter']) ? trim($_GET['filter']) : null;

        if ($filter !== null && !in_array($filter, $allowedStatus, true)) {
            http_response_code(422);
            echo json_encode([
                'message' => 'Filter tidak valid. Gunakan: pending, approved, completed, rescheduled, cancelled.'
            ]);
            return;
        }

        try {
            $id_provider   = $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);
            $installations = $this->gateway->getAll($id_provider, $filter);

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Daftar jadwal instalasi berhasil diambil.',
                'filter'  => $filter ?? 'all',
                'total'   => count($installations),
                'data'    => $installations,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($this->resolveCode($e->getCode()));
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // PATCH /provider/installations/{id}
    // -------------------------------------------------------------------------

    private function processResourceRequest(string $method, string $params): void
    {
        $id_schedule = filter_var($params, FILTER_VALIDATE_INT);

        if ($id_schedule === false) {
            http_response_code(400);
            echo json_encode(['message' => 'ID jadwal tidak valid.']);
            return;
        }

        if ($method !== 'PATCH') {
            http_response_code(405);
            echo json_encode(['message' => 'Method tidak diizinkan.']);
            return;
        }

        try {
            $id_provider = $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);
            $this->gateway->markAsCompleted((int) $id_schedule, $id_provider);

            $installation = $this->gateway->getById((int) $id_schedule);

            http_response_code(200);
            echo json_encode([
                'code'    => 200,
                'message' => 'Instalasi berhasil ditandai selesai. Langganan pelanggan kini aktif.',
                'data'    => $installation,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($this->resolveCode($e->getCode()));
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    private function resolveCode(int|string $code): int
    {
        $code = (int) $code;
        return ($code >= 100 && $code <= 599) ? $code : 500;
    }
}