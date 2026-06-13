<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';
spl_autoload_register(function ($class) {
    // Tentukan daftar folder yang ingin diperiksa
    $dirs = [
        __DIR__ . "/src/controllers/",
        __DIR__ . "/src/gateway/",
        __DIR__ . "/src/"
    ];

    foreach ($dirs as $dir) {
        $file = $dir . $class . ".php";
        if (file_exists($file)) {
            require_once $file;
            return; // Berhenti jika file sudah ditemukan
        }
    }
});

set_error_handler("ErrorHandler::handleError");
set_exception_handler('ErrorHandler::handleException');

header("Access-Control-Allow-Origin: http://127.0.0.1:5501");
header("Access-Control-Allow-Credentials: true");
// 2. Izinkan metode HTTP yang digunakan
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// 3. Izinkan header tambahan (Penting kalau nanti Anda pakai Token JWT atau JSON)
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// 4. Tangani Preflight Request dari Browser (Method OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
header("Content-type: application/json; charset=UTF-8");


// Parse URI
$uri   = trim(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), "/");
$parts = explode("/", $uri);

// Cari index "api" agar fleksibel walau ada prefix folder /backend/
$apiIndex = array_search("api", $parts);
if ($apiIndex === false) {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint tidak ditemukan"]);
    exit();
}

// Segmen setelah "api"
$group    = $parts[$apiIndex + 1] ?? null;  // auth | provider | customer | admin
$resource = $parts[$apiIndex + 2] ?? null;  // packages | users | dashboard | ...
$params       = $parts[$apiIndex + 3] ?? null;  // {id} opsional

$method   = $_SERVER["REQUEST_METHOD"];
$database = new Database();

// Refaktorisasi: Buat objek AuthMiddleware di luar switch agar tidak duplikasi kode


switch ($group) {

    // ──────────────────────────────────────────
    // AUTH  →  /api/auth/{action}
    // ──────────────────────────────────────────
    case "auth":
        // Resource berperan sebagai action (register | login | logout)
        $gateway    = new AuthGateway($database);
        $controller = new AuthController($gateway);
        $controller->processRequest($method, $resource);
        break;

    // ──────────────────────────────────────────
    // LOCATION  →  /api/location?type={type}&code={code}
    // ──────────────────────────────────────────
    case "location":
        $gateway    = new LocationGateway($database);
        $controller = new LocationController($gateway);
        $controller->processRequest($method, $resource);
        break;
    
    case "notifications":
        $userActive = AuthMiddleware::checkToken();
      
        $gateway    = new NotificationGateway($database);
        $controller = new NotificationController($gateway, $userActive);
        $controller->processRequest($method, $resource);
        break;
    
    case "issues":
        $userActive = AuthMiddleware::checkToken();
        $gateway    = new IssueGateway($database);
        $controller = new IssueController($gateway, $userActive);
        $controller->processRequest($method, $resource);
        break;
    
    // ──────────────────────────────────────────
    // PROVIDER  →  /api/provider/{resource}/{id}
    // ──────────────────────────────────────────
    case "provider":
        // Menggunakan objek $auth yang sudah diinstansiasi di atas
        $userActive = AuthMiddleware::requireRole("provider"); 

        switch ($resource) {
            case "profile":
                $gateway    = new ProviderGateway($database);
                $controller = new ProviderProfileController($gateway, $userActive);
                $controller->processRequest($method, $params);
                break;

            case "report":
                $gateway    = new ProviderReportGateway($database);
                $controller = new ProviderReportController($gateway, $userActive);
                $controller->processRequest($method);
                break;

            case "packages":
                $gateway    = new PackageGateway($database);
                $controller = new PackageController($gateway, $userActive);
                $controller->processRequest($method, $params);
                break;

            case "customers":
                $gateway    = new CustomerGateway($database);
                $controller = new CustomerController($gateway, $userActive);
                $controller->processRequest($method, $params);
                break;
            case "transactions":
                $gateway    = new TransactionGateway($database);
                $controller = new TransactionController($gateway, $userActive);
                $controller->processRequest($method, $params); // $resource = summary | outstanding | list
                break;

            default:
                http_response_code(404);
                echo json_encode(["message" => "Provider endpoint tidak ditemukan"]);
                exit();
        }
        break;

    // ──────────────────────────────────────────
    // CUSTOMER  →  /api/customer/{resource}/{id}
    // ──────────────────────────────────────────
    case "customer":
        $userActive = AuthMiddleware::requireRole("customer");

        switch ($resource) {

            case "packages":
                $gateway    = new PackageGateway($database);
                $controller = new CustomerPackageController($gateway, $userActive);
                $controller->processRequest($method, $params); // $params = provider_id
                break;

            case "my-subscription":
                $gateway    = new MySubscriptionGateway($database);
                $controller = new MySubscriptionController($gateway, $userActive);
                $controller->processRequest($method, $params);
                break;

            case "my-transactions":
                $gateway    = new MyTransactionGateway($database);
                $controller = new MyTransactionController($gateway, $userActive);
                $controller->processRequest($method, $params);
                break;

            default:
                http_response_code(404);
                echo json_encode(["message" => "Customer endpoint tidak ditemukan"]);
                exit();
        }
        break;

    // ──────────────────────────────────────────
    // ADMIN  →  /api/admin/{resource}/{id}
    // ──────────────────────────────────────────
    case "admin":
        AuthMiddleware::requireRole("superadmin");

        switch ($resource) {
            case "users":
                // $gateway    = new UserGateway($database);
                // $controller = new AdminUserController($gateway);
                // $controller->processRequest($method, $id);  
                break;

            case "reports":
                // $gateway    = new ReportGateway($database);
                // $controller = new AdminReportController($gateway);
                // $controller->processRequest($method);
                break;

            default:
                http_response_code(404);
                echo json_encode(["message" => "Admin endpoint tidak ditemukan"]);
                exit();
        }
        break;

    // ──────────────────────────────────────────
    // 404 fallback jika nama group salah
    // ──────────────────────────────────────────
    default:
        http_response_code(404);
        echo json_encode(["message" => "Endpoint tidak ditemukan"]);
        exit();
}

