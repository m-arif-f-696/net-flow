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
        // GET  /issues               → daftar semua issues (sesuai role)
        // POST /issues               → customer buat laporan baru
        // PATCH /issues/{id_issue}   → provider update status issue

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
        switch ($method) {
            case 'GET':
                $this->handleGetAll();
                break;

            case 'POST':
                $this->handleCreate();
                break;

            default:
                http_response_code(405);
                echo json_encode(['message' => 'Method tidak diizinkan.']);
        }
    }

    // -------------------------------------------------------------------------
    // Resource: PATCH /issues/{id_issue}
    // -------------------------------------------------------------------------
    private function processResourceRequest(string $method, string $resource): void
    {
        $id_issue = filter_var($resource, FILTER_VALIDATE_INT);

        if ($id_issue === false) {
            http_response_code(400);
            echo json_encode(['message' => 'ID issue tidak valid.']);
            return;
        }

        switch ($method) {
            case 'PATCH':
                $this->handleUpdateStatus((int) $id_issue);
                break;

            default:
                http_response_code(405);
                echo json_encode(['message' => 'Method tidak diizinkan.']);
        }
    }

    // -------------------------------------------------------------------------
    // GET /issues
    // -------------------------------------------------------------------------
    private function handleGetAll(): void
    {
        $role = $this->userActive->role;

        $id_ref = match ($role) {
            'provider'   => $this->getProviderId(),
            'customer'   => $this->getCustomerId(),
            'superadmin' => 0, // tidak dipakai di query superadmin
            default      => null,
        };

        if ($id_ref === null) {
            http_response_code(403);
            echo json_encode(['message' => 'Akses ditolak.']);
            return;
        }

        try {
            $issues = $this->gateway->getAll($role, $id_ref);
            http_response_code(200);
            echo json_encode([
                'message' => 'Daftar laporan gangguan berhasil diambil.',
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

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validateCreate($data);
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['message' => 'Validasi gagal.', 'errors' => $errors]);
            return;
        }

        $id_customer = $this->getCustomerId();

        try {
            $id_issue = $this->gateway->create($id_customer, $data);
            $issue    = $this->gateway->getById($id_issue);

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
    // PATCH /issues/{id_issue}
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

        $id_provider = $this->getProviderId();

        try {
            $updated = $this->gateway->updateStatus($id_issue, $id_provider, $data['status_issue']);

            if (!$updated) {
                http_response_code(404);
                echo json_encode(['message' => 'Laporan tidak ditemukan atau bukan milik provider ini.']);
                return;
            }

            $issue = $this->gateway->getById($id_issue);

            http_response_code(200);
            echo json_encode([
                'message' => 'Status laporan berhasil diperbarui.',
                'data'    => $issue,
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Validasi body untuk POST /issues
     */
    private function validateCreate(?array $data): array
    {
        $errors = [];
        $severityAllowed = ['low', 'medium', 'high'];

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
}