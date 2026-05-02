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
// 1. Izinkan semua domain (atau ganti * dengan domain frontend Anda jika sudah live)
header("Access-Control-Allow-Origin: *");
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


$parts = explode("/" ,$_SERVER["REQUEST_URI"]);

$database = new Database();

// arah endpoint
switch ($parts[1]) {
    case 'auth':
        $gateway = new AuthGateway($database);
        $controller = new AuthController($gateway);
        $action = $parts[2] ?? null;
        $controller->processRequest($_SERVER['REQUEST_METHOD'], $action);
        break;
    case "package" :
        $gateway = new PackageGateway($database);
        $controller = new PackageController($gateway);
        $id = $parts[2] ?? null;
        $controller->processRequest($_SERVER['REQUEST_METHOD'], $id);
        break;
    
    default:
        http_response_code(404);
        exit;

}















