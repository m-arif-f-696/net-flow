<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

class Database {
    // Tambahkan deklarasi properti di sini
    private $host;
    private $user;
    private $pass;
    private $db_name;

    public function __construct() {
        // Asumsi Anda menggunakan phpdotenv seperti pembahasan sebelumnya
        $this->host = $_ENV['DB_HOST'];
        $this->user = $_ENV['DB_USER']; // Sekarang $this->user ada isinya
        $this->pass = $_ENV['DB_PASS'];
        $this->db_name = $_ENV['DB_NAME'];
    }

    public function connect() {
        // Contoh penggunaan di fungsi koneksi
        $dsn = "mysql:host={$this->host};dbname={$this->db_name}";
        $pdo = new PDO($dsn, $this->user, $this->pass);
        
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    }
}