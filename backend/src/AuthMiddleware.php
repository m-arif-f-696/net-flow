<?php
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class AuthMiddleware {
    // Fungsi ini akan mengembalikan data user jika token valid, atau menghentikan script jika tidak valid
    public static function checkToken() {
        $key = $_ENV["KEY_JWT"];

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

        if ($authHeader) {
            $token_parts = explode(" ", $authHeader);
            if (count($token_parts) == 2 && $token_parts[0] == "Bearer") {
                $jwt = $token_parts[1];

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
        }

        // Jika tidak ada header Authorization sama sekali
        http_response_code(401);
        echo json_encode(["message" => "Akses ditolak. Anda belum login (Token tidak ditemukan)."]);
        exit; 
    }
}

?>