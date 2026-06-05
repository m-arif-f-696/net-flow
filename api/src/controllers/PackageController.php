<?php

class PackageController 
{

  public function __construct(private PackageGateway $gateway, private $userActive)
  {
    
  }

  public function processRequest(string $method, ?string $param): void 
  {
    if ($param) {

      $this->processResourceRequest($method, $param);

    } else {

      $this->processCollectionRequest($method);

    }
  }

  private function processResourceRequest(string $method, string $param): void 
  {
    $id_user = (int) $this->userActive->id_user;
    
    // Gunakan cara yang kita bahas sebelumnya!
    if (is_numeric($param)) {
      $package = $this->gateway->getPackageById((int)$param, $id_user);
    } else {
      $package = $this->gateway->getPackageBySlug($param, $id_user);
    }

    if (! $package) {
      http_response_code(404);

      echo json_encode(["message" => "Package not found"]);
      return;
    }

    switch ($method) {
      case "GET" :

        http_response_code(200);
        echo json_encode(["code"=>200, "message" => "Success", "data" => $package]);
        break;

      case "DELETE":
        // Method dari Frontend adalah DELETE
        if ($param) {
            // Tapi Gateway di bawah ini menjalankan query UPDATE
            $rows = $this->gateway->deletePackage((int)$param, $package['id_provider']);
            
            if ($rows > 0) {
                http_response_code(204);
                echo json_encode(["code" => 204, "message" => "Package successfully deleted (soft delete)"]);
            } else {
                http_response_code(404);
                echo json_encode(["code" => 404,"message" => "Package not found or already deleted"]);
            }
        }
        break;

      case "PATCH":
        // 1. Tangkap data JSON murni dari Body Request
        $input = (array) json_decode(file_get_contents("php://input"), true);

        // 2. Fail-Fast: Tolak jika tidak ada data yang dikirim
        if (empty($input)) {
            http_response_code(422); // Unprocessable Entity
            echo json_encode(["message" => "No data provided for update"]);
            break;
        }

        $errors = $this->getPatchValidationErrors($input);

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

        $id_package = (int) $package['id_package']; 
        
        $rows = $this->gateway->patchPackage($id_package, $id_user, $input);
        
        if ($rows > 0) {
          http_response_code(204);
          echo json_encode(["code" => 204, "message" => "Package successfully updated"]);
        } else {
            // Bisa jadi gagal update, atau data yang dikirim sama persis dengan yang ada di DB
            http_response_code(404);
            echo json_encode(["code" => 404, "message" => "No changes made to the package"]);
        }
        break;
      
    }
  }

  private function processCollectionRequest(string $method) : void 
  {
    switch ($method) {
      case "GET":
        $summary = $this->gateway->getSummary((int)$this->userActive->id_user);

        http_response_code(200);
        echo json_encode([ 
          "message" => "Success",
          "code"=>200, 
          "package_summary" =>$summary,
          "data" => $this->gateway->getAll((int)$this->userActive->id_user) 
        ]);
        break;

      case "POST":
        $data = (array) json_decode(file_get_contents("php://input"), true);
        
        $data["slug"] = $this->slugify($data["name_package"]);

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

      
        $id = $this->gateway->createPackage($data, (int)$this->userActive->id_user);


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

      // 1. Validasi Nama Paket
      if (empty($data["name_package"])) {
          $errors[] = "name_package is required";
      }

      // 2. Validasi Slug (Wajib untuk URL Clean)
      if (empty($data["slug"])) {
          $errors[] = "slug is required";
      }

      // 3. Validasi Tipe Paket (ENUM)
      $allowedTypes = ['unlimited', 'kuota'];
      if (empty($data["type_package"]) || !in_array($data["type_package"], $allowedTypes)) {
          $errors[] = "type_package must be either 'unlimited' or 'kuota'";
      }

      // 4. Validasi Kuota Tergantung Tipe Paket (Cerdas)
      if (isset($data["type_package"]) && $data["type_package"] === 'kuota') {
          if (empty($data["quota_limit_gb"])) {
              $errors[] = "quota_limit_gb is required when type_package is 'kuota'";
          } elseif (!filter_var($data["quota_limit_gb"], FILTER_VALIDATE_INT)) {
              $errors[] = "quota_limit_gb must be an integer";
          }
      }

      // 5. Validasi Kecepatan Logika Dasar (Mbps)
      if (empty($data["speed_mbps"])) {
          $errors[] = "speed_mbps is required";
      } elseif (!filter_var($data["speed_mbps"], FILTER_VALIDATE_INT)) {
          $errors[] = "speed_mbps must be an integer";
      }

      // 6. Validasi Download Speed
      if (empty($data["download_speed"])) {
          $errors[] = "download_speed is required";
      } elseif (!filter_var($data["download_speed"], FILTER_VALIDATE_INT)) {
          $errors[] = "download_speed must be an integer";
      }

      // 7. Validasi Upload Speed
      if (empty($data["upload_speed"])) {
          $errors[] = "upload_speed is required";
      } elseif (!filter_var($data["upload_speed"], FILTER_VALIDATE_INT)) {
          $errors[] = "upload_speed must be an integer";
      }

      // 8. Validasi Unit Kecepatan (Opsional, tapi jika diisi harus benar)
      $allowedUnits = ['Mbps', 'Gbps'];
      if (!empty($data["download_unit"]) && !in_array($data["download_unit"], $allowedUnits)) {
          $errors[] = "download_unit must be either 'Mbps' or 'Gbps'";
      }
      if (!empty($data["upload_unit"]) && !in_array($data["upload_unit"], $allowedUnits)) {
          $errors[] = "upload_unit must be either 'Mbps' or 'Gbps'";
      }

      // 9. Validasi Harga Per Bulan
      if (empty($data["price_per_month"])) {
          $errors[] = "price_per_month is required";
      } elseif (!filter_var($data["price_per_month"], FILTER_VALIDATE_INT)) {
          $errors[] = "price_per_month must be an integer";
      }

      // 10. Validasi Biaya Pemasangan (Opsional, tapi jika diisi harus angka)
      if (isset($data["installation_cost"]) && !filter_var($data["installation_cost"], FILTER_VALIDATE_INT) && $data["installation_cost"] !== 0) {
          $errors[] = "installation_cost must be an integer";
      }

      return $errors;
  }

  private function getPatchValidationErrors(array $data): array
  {
      $errors = [];

      if (array_key_exists("name_package", $data) && empty($data["name_package"])) {
          $errors[] = "name_package cannot be empty";
      }

      if (array_key_exists("type_package", $data)) {
          $allowedTypes = ['unlimited', 'kuota'];
          if (!in_array($data["type_package"], $allowedTypes)) {
              $errors[] = "type_package must be either 'unlimited' or 'kuota'";
          }
      }

      if (array_key_exists("price_per_month", $data)) {
          if (!filter_var($data["price_per_month"], FILTER_VALIDATE_INT)) {
              $errors[] = "price_per_month must be an integer";
          }
      }

      // Dan seterusnya hanya untuk atribut yang mau di-update...

      return $errors;
  }

  private function slugify(string $text): string 
  {
      // 1. Ubah ke huruf kecil
      $text = strtolower($text);
      
      // 2. Ganti spasi dengan strip
      $text = str_replace(' ', '-', $text);
      
      // 3. Hapus karakter yang tidak diizinkan (selain huruf, angka, dan strip)
      $text = preg_replace('/[^a-z0-9-]/', '', $text);
      
      return $text;
  }


}