<?php
// 1. PHP & Session diletakkan di BARIS PALING ATAS (Wajib!)
session_start();

// 2. Sertakan koneksi database jika dibutuhkan
// require 'config/koneksi.php';

// 3. Ambil parameter 'page' (Gunakan !empty agar aman saat mengakses root URL)
$page = !empty($_GET['page']) ? $_GET['page'] : '/';
?>

<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/net_flow/assets/images/logo.svg" />
    <title>Net Flow</title>
    <link href="assets/css/output.css?v=<?= time(); ?>" rel="stylesheet">
</head>
<body>
<?php

switch ($page) {
    // AREA PUBLIK
    case '/':
        include 'pages/landing.php';
        break;
    case 'login':
        include 'pages/login.php';
        break;
    
    // AREA PROVIDER
    case 'provider-dashboard':
        include 'pages/provider/dashboard.php';
        break;
    case 'provider-paket':
        include 'pages/provider/kelola_paket.php';
        break;

    // AREA PELANGGAN
    case 'user-dashboard':
        include 'pages/user/dashboard.php';
        break;
    case 'cari-wifi':
        include 'pages/user/cari_wifi.php';
        break;

    // JIKA URL TIDAK DITEMUKAN (Halaman 404)
    default:
        include 'pages/not_found.php';
        break;
}
?>
</body>
</html>