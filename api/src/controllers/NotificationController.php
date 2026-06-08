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

    // GET /notification
    private function processCollectionRequest(string $method): void
    {
        if ($method !== "GET") {
            http_response_code(405);
            header("Allow: GET");
            echo json_encode(["message" => "Method not allowed."]);
            return;
        }

        $id_user       = (int) $this->userActive->id_user;
        $limit  = isset($_GET['limit'])  ? (int) $_GET['limit']  : 10;
        $offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

        // Panggil fungsi gateway terbaru yang sudah kita buat dengan sistem limit-offset
        $notifications = $this->gateway->getWithPagination($id_user, $limit, $offset);
        
        // Tetap hitung total notifikasi yang belum dibaca murni untuk memicu badge angka merah di UI lonceng
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
}