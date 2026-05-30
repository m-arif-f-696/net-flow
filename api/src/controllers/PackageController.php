<?php

class PackageController 
{

  public function __construct(private PackageGateway $gateway)
  {
    
  }

  public function processRequest(string $method, ?string $id): void 
  {
    if ($id) {

      $this->processResourceRequest($method, $id);

    } else {

      $this->processCollectionRequest($method);

    }
  }

  private function processResourceRequest(string $method, string $id): void 
  {
    $package = $this->gateway->getPackageById((int)$id);

    if (! $package) {
      http_response_code(404);

      echo json_encode(["message" => "Package not found"]);
      return;
    }

    switch ($method) {
      case "GET" :
        echo json_encode($package);
        break;
      
    }
  }

  private function processCollectionRequest(string $method) : void 
  {
    switch ($method) {
      case "GET":
        echo json_encode($this->gateway->getAll());
        break;

      case "POST":
        $data = (array) json_decode(file_get_contents("php://input"), true);

        $errors = $this->getValidationErrors($data);

        if(! empty($errors)) {
          http_response_code(422);

          echo json_encode([
            "status" => "error",
            "code" => 422,
            "message" => "Erorr input information",
            "errors" => $errors
          ]);

          break;
        }

      
        $id = $this->gateway->createPackage($data);


        http_response_code(201);
        echo json_encode([
          "massage" => "Package created",
          "id" => $id
        ]);

        break;
      
      default:
        http_response_code(405);
        header("Allow: GET, POST");
    }
      
  }

  private function getValidationErrors(array $data): array
  {
      $errors = [];

      // 1. Validasi ID Provider (Wajib ada dan harus angka)
      if (empty($data["id_provider"])) {
          $errors[] = "id_provider is required";
      } elseif (!filter_var($data["id_provider"], FILTER_VALIDATE_INT)) {
          $errors[] = "id_provider must be an integer";
      }

      // 2. Validasi Nama Paket
      if (empty($data["name_package"])) {
          $errors[] = "name_package is required";
      }

      // 3. Validasi Tipe Paket (ENUM)
      $allowedTypes = ['unlimited', 'kuota'];
      if (empty($data["type_package"]) || !in_array($data["type_package"], $allowedTypes)) {
          $errors[] = "type_package must be either 'unlimited' or 'kuota'";
      }

      // 4. Validasi Kecepatan
      if (empty($data["speed_mbps"])) {
          $errors[] = "speed_mbps is required";
      } elseif (!filter_var($data["speed_mbps"], FILTER_VALIDATE_INT)) {
          $errors[] = "speed_mbps must be an integer";
      }

      // 5. Validasi Harga
      if (empty($data["price_per_month"])) {
          $errors[] = "price_per_month is required";
      } elseif (!filter_var($data["price_per_month"], FILTER_VALIDATE_INT)) {
          $errors[] = "price_per_month must be an integer";
      }

      return $errors;
  }


}