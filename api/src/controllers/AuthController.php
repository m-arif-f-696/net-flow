<?php
use \Firebase\JWT\JWT;


class AuthController {

  public function __construct(private AuthGateway $gateway)
  {
  
  }

  public function processRequest(string $method, ?string $action): void 
  {
    // Tangani metode POST untuk Login dan Register
    if ($method === "POST") {
        switch($action) {
            case "login" :
                $this->processLogin(); // <- Di sini, pastikan kamu men-set HttpOnly Cookie saat login sukses
                break;

            case "register" :
                $this->processRegister();
                break;

            case "logout" : 
                $this->processLogout();
                break;

            default :
                http_response_code(404);
                echo json_encode(["message" => "Endpoint not found or invalid action"]);
                break;
        }
    } 
    // Tangani metode GET khusus untuk cek token / ambil profil
    elseif ($method === "GET") {
        if ($action === "me") { // endpoint: /auth?action=me
            $data = AuthMiddleware::checkToken();
            
            if ($data) {
                http_response_code(200);
                echo json_encode(["code" => 200, "message" => "Authorized", "user" => $data]);
            } else {
                http_response_code(401);
                echo json_encode(["code" => 401, "message" => "Unauthorized"]);
            }
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Endpoint not found"]);
        }
    } 
    // Method selain POST dan GET
    else {
        http_response_code(405);
        header("Allow: POST, GET");
        echo json_encode(["message" => "Method not allowed"]);
    }
  }


  private function processLogin(): void 
  {
    $input = (array) json_decode(file_get_contents("php://input"), true);
    
    if (empty($input['email']) || empty($input['password'])) {
      http_response_code(422);
      echo json_encode(["message" => "Email and password must be input"]);
      return; 
    }
      
    $email = $input['email'];
    $password = $input['password'];

    $user = $this->gateway->getUserByEmail($email);

    if (!$user || !password_verify($password, $user['password'])) {
      http_response_code(401);
      echo json_encode([
        "message" => "Email or password wrong"
      ]);
      return;
    }

    $key = $_ENV["KEY_JWT"];
    $issued_at = time();
    $expire_time = $issued_at + (60 * 60 * 24); // Token untuk login hanya berlaku 24 jam
    
    $payload = [
        "iss" => "http://localhost/netflow", 
        "iat" => $issued_at,
        "exp" => $expire_time,
        "data" => [
            "id_user" => $user['id_user'],
            "email" => $user['email'],
            "role" => $user['role'],
            "name" => $user['nama_user'],
            "img" => $user['link_gambar']
        ]
    ];

    $jwt = JWT::encode($payload, $key, 'HS256'); // encode jadi token (JWT)

    setcookie(
      "access_token", 
      $jwt, 
    [
        "expires" => time() + (3600 * 24), // Kedaluwarsa dalam 1 hari
        "path" => "/",                     // Berlaku di semua path subdomain/folder
        "domain" => "",                    // Kosongkan untuk localhost, sesuaikan saat hosting
        "secure" => false,                 // Ubah jadi TRUE saat sudah production (HTTPS) di Hostinger
        "httponly" => true,                // WAJIB TRUE! Mencegah JavaScript mencuri token (Anti-XSS)
        "samesite" => "Lax"                // Melindungi dari serangan CSRF
    ]);


    http_response_code(200);
    echo json_encode([
      "success" => true,
      "message" => "Login Successful",
      "user" => [
        "nama" => $user['nama_user'] ?? "User",
        "avatar" => $user['link_gambar'] ?? "default-avatar.png",
        "role" => $user['role']
      ]
    ]);
          
  }

  private function processRegister() : void 
  {
    $input = (array) json_decode(file_get_contents("php://input"), true);
    
    if (empty($input['email']) || empty($input['password'])) {
            http_response_code(422);
            echo json_encode(["message" => "Data tidak lengkap."]);
            return;
        }

        // Hash password sebelum disimpan ke database
        $hashedPassword = password_hash($input['password'], PASSWORD_BCRYPT);
        
        // Set default role (misalnya: customer)
        $role = $input['role'] ?? 'customer';

        $dataToSave = [
            'email' => $input['email'],
            'password' => $hashedPassword,
            'role' => $role
        ];

        if ($this->gateway->createUser($dataToSave)) {
            http_response_code(201); // 201 Created
            echo json_encode(["message" => "Registrasi berhasil. Silakan login."]);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "Gagal menyimpan data user."]);
        }
  }

  private function processLogout() : void {
    setcookie("access_token", "", time() - 3600, "/");

    http_response_code(200);
    echo json_encode([
      "success" => true,
      "message" => "Logout Successful"
    ]);
  }


}