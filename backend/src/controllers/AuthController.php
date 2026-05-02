<?php
use \Firebase\JWT\JWT;


class AuthController {

  public function __construct(private AuthGateway $gateway)
  {
  
  }

  public function processRequest(string $method, ?string $action): void 
  {
    if ($method == "POST") {
      switch($action) {
        case "login" :
          $this->processLogin();
          break;

        case "register" :
          $this->processRegister();
          break;

        default :
          http_response_code(404);
          echo json_encode(["message" => "Endpoint not found"]);
          break;
      }
      

    } else {
      http_response_code(405);
      header("Allow: 'POST'");
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
            "role" => $user['role']
        ]
    ];

    $jwt = JWT::encode($payload, $key, 'HS256'); // encode jadi token (JWT)

    http_response_code(200);
    echo json_encode([
      "message" => "Login Successful",
      "token" => $jwt,
      "role" => $user['role']
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


}