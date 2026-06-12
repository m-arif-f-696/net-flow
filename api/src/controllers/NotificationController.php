<?php

class NotificationController
{
    public function __construct(
        private NotificationGateway $gateway,
        private object $userActive
    ) {}

    public function processRequest(string $method, ?string $resource): void
    {
        // Route:
        // GET    /notification                  → ambil semua notifikasi + unread count
        // PATCH  /notification                  → mark all as read
        // PATCH  /notification/{id_notification} → mark one as read

        if ($resource === "mark-all-read") {
            $this->handleMarkAllAsRead($method);
            return;
        }

        if ($resource !== null) {
            $this->processResourceRequest($method, $resource);
            return;
        }

        $this->processCollectionRequest($method);
    }
    private function processCollectionRequest(string $method): void
    {
        match ($method) {
            'GET'  => $this->handleGetAll(),
            'POST' => $this->handleCreate(),
            default => $this->methodNotAllowed('GET, POST','PATCH'),
        };
    }

    // PATCH /notification/mark-all-read
    private function handleMarkAllAsRead(string $method): void
    {
        if ($method !== "PATCH") {
            http_response_code(405);
            header("Allow: PATCH");
            echo json_encode(["message" => "Method not allowed."]);
            return;
        }

        $id_user = (int) $this->userActive->id_user;
        $updated = $this->gateway->markAllAsRead($id_user);

        http_response_code(200);
        echo json_encode([
            "code"    => 200,
            "message" => "Semua notifikasi telah ditandai sudah dibaca.",
            "updated" => $updated,
        ]);
    }

    // PATCH /notification/{id}
    private function processResourceRequest(string $method, string $resource): void
    {
        if ($method !== "PATCH") {
            http_response_code(405);
            header("Allow: PATCH");
            echo json_encode(["message" => "Method not allowed."]);
            return;
        }

        if (!is_numeric($resource)) {
            http_response_code(400);
            echo json_encode(["message" => "ID notifikasi tidak valid."]);
            return;
        }

        $id_user         = (int) $this->userActive->id_user;
        $id_notification = (int) $resource;

        $updated = $this->gateway->markOneAsRead($id_notification, $id_user);

        if (!$updated) {
            http_response_code(404);
            echo json_encode(["message" => "Notifikasi tidak ditemukan atau sudah dibaca."]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "code"    => 200,
            "message" => "Notifikasi berhasil ditandai sudah dibaca.",
        ]);
    }

    // GET /notifications
    private function handleGetAll(): void
    {
        $id_user = (int) $this->userActive->id_user;
        $limit   = isset($_GET['limit'])  ? (int) $_GET['limit']  : 10;
        $offset  = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

        $notifications = $this->gateway->getWithPagination($id_user, $limit, $offset);
        $unread_count  = $this->gateway->countUnread($id_user);

        http_response_code(200);
        echo json_encode([
            "code"         => 200,
            "message"      => "Success",
            "unread_count" => $unread_count,
            "limit"        => $limit,
            "offset"       => $offset,
            "data"         => $notifications,
        ]);
    }

    // POST /notifications
    private function handleCreate(): void
    {
        // Hanya superadmin & provider yang boleh kirim notifikasi
        $role = $this->userActive->role;

        if (!in_array($role, ['superadmin', 'provider'], true)) {
            http_response_code(403);
            echo json_encode(['message' => 'Akses ditolak. Hanya superadmin dan provider yang dapat mengirim notifikasi.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validateCreate($data);
        if (!empty($errors)) {
            http_response_code(422);
            echo json_encode(['message' => 'Validasi gagal.', 'errors' => $errors]);
            return;
        }

        try {
            // Jika provider, pastikan target penerima adalah customer miliknya
            if ($role === 'provider') {
                $isCustomerOfProvider = $this->gateway->isCustomerOfProvider(
                    (int) $data['id_user'],
                    (int) $this->userActive->id_user
                );

                if (!$isCustomerOfProvider) {
                    http_response_code(403);
                    echo json_encode(['message' => 'Akses ditolak. Anda hanya dapat mengirim notifikasi ke pelanggan Anda sendiri.']);
                    return;
                }
            }

            $id_notification = $this->gateway->create($data);

            http_response_code(201);
            echo json_encode([
                'code'    => 201,
                'message' => 'Notifikasi berhasil dikirim.',
                'data'    => [
                    'id_notification' => $id_notification,
                    'id_user'         => $data['id_user'],
                    'title'           => $data['notification_title'],
                    'category'        => $data['notification_category'] ?? 'system',
                ],
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
        $errors = [];
        $allowedCategory = ['billing', 'system', 'promo'];

        if (empty($data['id_user'])) {
            $errors['id_user'] = 'Penerima notifikasi wajib diisi.';
        }

        if (empty($data['notification_title'])) {
            $errors['notification_title'] = 'Judul notifikasi wajib diisi.';
        }

        if (empty($data['notification_message'])) {
            $errors['notification_message'] = 'Pesan notifikasi wajib diisi.';
        }

        if (
            isset($data['notification_category']) &&
            !in_array($data['notification_category'], $allowedCategory, true)
        ) {
            $errors['notification_category'] = 'Kategori tidak valid. Gunakan: billing, system, promo.';
        }

        return $errors;
    }
    
    private function methodNotAllowed(string $allow): void
    {
        http_response_code(405);
        header("Allow: $allow");
        echo json_encode(['message' => 'Method tidak diizinkan.']);
    }
}