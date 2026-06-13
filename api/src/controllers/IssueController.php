<?php

class IssueController
{
    public function __construct(
        private IssueGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $resource): void
    {
        // Route:
        // GET   /issues                    → daftar issues (+ filter ?status=open dst)
        // POST  /issues                    → customer buat laporan baru
        // PATCH /issues/{id}/status        → provider ubah status
        // PATCH /issues/{id}/severity      → provider ubah severity (tidak boleh resolved)

        if ($resource !== null) {
            $this->processResourceRequest($method, $resource);
            return;
        }

        $this->processCollectionRequest($method);
    }

    // -------------------------------------------------------------------------
    // Collection: GET /issues | POST /issues
    // -------------------------------------------------------------------------

    private function processCollectionRequest(string $method): void
    {
        match ($method) {
            'GET'  => $this->handleGetAll(),
            'POST' => $this->handleCreate(),
            default => $this->methodNotAllowed(),
        };
    }

    // -------------------------------------------------------------------------
    // Resource: /issues/{id}/status | /issues/{id}/severity
    // -------------------------------------------------------------------------

    private function processResourceRequest(string $method, string $resource): void
    {
        $uri   = trim(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), "/");
        $parts = explode("/", $uri);
        // Pecah resource: "5/status" → id=5, action=status
        $id     = filter_var($parts[2], FILTER_VALIDATE_INT);
        $action = $parts[3] ?? null;

        if ($id === false) {
            http_response_code(400);
            echo json_encode(['message' => 'ID issue tidak valid.']);
            return;
        }

        if ($method !== 'PATCH') {
            $this->methodNotAllowed();
            return;
        }

        match ($action) {
            'status'   => $this->handleUpdateStatus((int) $id),
            'severity' => $this->handleUpdateSeverity((int) $id),
            default    => $this->notFound(),
        };
    }

    // -------------------------------------------------------------------------
    // GET /issues?status=open
    // -------------------------------------------------------------------------

    private function handleGetAll(): void
    {
        $role = $this->userActive->role;

        // Validasi & ambil filter status
        $status         = isset($_GET['status']) ? trim($_GET['status']) : null;
        $allowedStatus  = ['open', 'investigating', 'progress', 'resolved'];

        if ($status !== null && !in_array($status, $allowedStatus, true)) {
            http_response_code(422);
            echo json_encode([
                'message' => 'Status tidak valid. Gunakan: open, investigating, progress, resolved.'
            ]);
            return;
        }

        $id_ref = match ($role) {
            'provider'   => $this->getProviderId(),
            'customer'   => $this->getCustomerId(),
            'superadmin' => 0,
            default      => null,
        };

        if ($id_ref === null) {
            http_response_code(403);
            echo json_encode(['message' => 'Akses ditolak.']);
            return;
        }

        try {
            $issues = $this->gateway->getAll($role, $id_ref, $status);

            http_response_code(200);
            echo json_encode([
                'message' => 'Daftar laporan gangguan berhasil diambil.',
                'filter'  => [
                    'status' => $status ?? 'all',
                    'note'   => $status === 'resolved' ? 'Dibatasi 5 data terbaru.' : null,
                ],
                'total'   => count($issues),
                'data'    => $issues,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /issues
    // -------------------------------------------------------------------------

    private function handleCreate(): void
    {
        if ($this->userActive->role !== 'customer') {
            http_response_code(403);
            echo json_encode(['message' => 'Hanya customer yang dapat membuat laporan gangguan.']);
            return;
        }

        $data   = json_decode(file_get_contents('php://input'), true);
        $errors = $this->validateCreate($data);

        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['message' => 'Validasi gagal.', 'errors' => $errors]);
            return;
        }

        try {
            $id_customer = $this->getCustomerId();
            $id_issue    = $this->gateway->create($id_customer, $data);
            $issue       = $this->gateway->getById($id_issue);
            $id_user     = $this->gateway->findUserIdByIdIssue($id_issue);

            $this->gateway->createNotification(
                $id_user,
                "Laporan gangguan baru",
                "Laporan gangguan baru telah dibuat oleh customer " . $issue['customer_name'] . ". Segera tangani laporan tersebut.",
                "system"
            );

            http_response_code(201);
            echo json_encode([
                'message' => 'Laporan gangguan berhasil dibuat.',
                'data'    => $issue,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // PATCH /issues/{id}/status  → Provider
    // -------------------------------------------------------------------------

    private function handleUpdateStatus(int $id_issue): void
    {
        if ($this->userActive->role !== 'provider') {
            http_response_code(403);
            echo json_encode(['message' => 'Hanya provider yang dapat mengubah status laporan.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['status_issue'])) {
            http_response_code(422);
            echo json_encode(['message' => 'Field status_issue wajib diisi.']);
            return;
        }

        try {
            $id_provider = $this->getProviderId();
            $updated     = $this->gateway->updateStatus($id_issue, $id_provider, $data['status_issue']);

            if (!$updated) {
                http_response_code(404);
                echo json_encode(['message' => 'Laporan tidak ditemukan atau bukan milik provider ini.']);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'message' => 'Status laporan berhasil diperbarui.',
                'data'    => $this->gateway->getById($id_issue),
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // PATCH /issues/{id}/severity  → Customer
    // -------------------------------------------------------------------------

    private function handleUpdateSeverity(int $id_issue): void
    {
        if ($this->userActive->role !== 'provider') {
            http_response_code(403);
            echo json_encode(['message' => 'Hanya provider yang dapat mengubah severity laporan.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['severity'])) {
            http_response_code(422);
            echo json_encode(['message' => 'Field severity wajib diisi.']);
            return;
        }

        try {
            $id_provider = $this->getProviderId();
            $updated     = $this->gateway->updateSeverity($id_issue, $id_provider, $data['severity']);

            if (!$updated) {
                http_response_code(404);
                echo json_encode([
                    'message' => 'Laporan tidak ditemukan, bukan milik provider ini, atau sudah resolved.'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'message' => 'Severity laporan berhasil diperbarui.',
                'data'    => $this->gateway->getById($id_issue),
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function validateCreate(?array $data): array
    {
        $errors          = [];
        $severityAllowed = ['low', 'medium', 'high'];

        if (empty($data['id_subscription'])) {
            $errors['id_subscription'] = 'Langganan wajib dipilih.';
        } elseif (!is_numeric($data['id_subscription'])) {
            $errors['id_subscription'] = 'ID langganan tidak valid.';
        }

        if (empty($data['title_issue'])) {
            $errors['title_issue'] = 'Judul laporan wajib diisi.';
        }

        if (empty($data['description_issue'])) {
            $errors['description_issue'] = 'Deskripsi laporan wajib diisi.';
        }

        if (isset($data['severity']) && !in_array($data['severity'], $severityAllowed, true)) {
            $errors['severity'] = 'Severity tidak valid. Gunakan: low, medium, high.';
        }

        return $errors;
    }

    private function getProviderId(): int
    {
        return $this->gateway->findProviderIdByUser((int) $this->userActive->id_user);
    }

    private function getCustomerId(): int
    {
        return $this->gateway->findCustomerIdByUser((int) $this->userActive->id_user);
    }

    private function methodNotAllowed(): void
    {
        http_response_code(405);
        echo json_encode(['message' => 'Method tidak diizinkan.']);
    }

    private function notFound(): void
    {
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint tidak ditemukan.']);
    }
}