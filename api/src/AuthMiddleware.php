<?php
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class AuthMiddleware {
    // Fungsi ini akan mengembalikan data user jika token valid, atau menghentikan script jika tidak valid
    public static function checkToken() {
        $key = $_ENV["KEY_JWT"];

        $jwt = $_COOKIE['access_token'] ?? null;

        if ($jwt) {
                try {
                    // Bongkar Token
                    $decoded = JWT::decode($jwt, new Key($key, 'HS256'));
                    
                    // KEMBALIKAN DATA USER yang ada di dalam token
                    return $decoded->data; 

                } catch (Exception $e) {
                    http_response_code(401);
                    echo json_encode(["message" => "Token has expire or token not valid"]);
                    exit; // Hentikan script, jangan lanjut ke controller!
                }
        }


        // Jika tidak ada header Authorization sama sekali
        http_response_code(401);
        echo json_encode([
            "message" => "Akses ditolak. Anda belum login (Token tidak ditemukan).",
            "code" => 401
        ]);
        exit; 
    }

    public static function requireRole(string $role)
    {

        $user = self::checkToken(); // Panggil checkToken di sini

        // 3. Cek Role
        if ($user->role !== $role) {
            http_response_code(403);
            echo json_encode([
                "message" => "Akses ditolak. Role Anda bukan '$role'.",
                "error" => "Forbidden"
            ]);
            exit();
        }

        // Jika lolos, kembalikan data user (opsional, tapi sering dipakai)
        return $user;
    
    }

}


?>