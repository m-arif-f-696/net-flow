<?php 
class ProviderGateway {

  private PDO $db;

  public function __construct(Database $database)
  {
    $this->db = $database->connect();
  }

  public function  getProfileByIdUser ( string $id_user ) : array | false 

  {
    $sql = "SELECT * FROM provider WHERE id_user = :id_user LIMIT 1";
    $stmt = $this->db->prepare($sql);

    $stmt->bindValue(":id_user", $id_user, PDO::PARAM_STR);

    $stmt->execute();

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    return $data;

  }

  public function createUser(array $data) : bool {
    $sql = "INSERT INTO users (email, password, role) VALUES (:email, :password, :role)";

    $stmt = $this->db->prepare($sql);
    $stmt->bindValue(':email', $data['email'], PDO::PARAM_STR);
    $stmt->bindValue(':password', $data['password'], PDO::PARAM_STR); 
    $stmt->bindValue(':role', $data['role'], PDO::PARAM_STR);

    return $stmt->execute();
  }

  public function createProfile(array $data) : bool {
    try {
        $this->db->beginTransaction();

        $sql = "INSERT INTO providers (id_user, name_company, nib, address, area_code, coordinate_point, coverage_area, contact_cs, logo_provider) 
                VALUES (:id_user, :name_company, :nib, :address, :area_code, :coordinate_point, :coverage_area, :contact_cs, :logo_provider)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id_user', $data['id_user'], PDO::PARAM_INT);
        $stmt->bindValue(':name_company', $data['name_company'], PDO::PARAM_STR);
        $stmt->bindValue(':nib', $data['nib'], PDO::PARAM_STR);
        $stmt->bindValue(':address', $data['address'], PDO::PARAM_STR);
        $stmt->bindValue(':area_code', $data['area_code'], PDO::PARAM_STR);
        $stmt->bindValue(':coordinate_point', $data['coordinate_point'], PDO::PARAM_STR);
        $stmt->bindValue(':coverage_area', $data['coverage_area'], PDO::PARAM_STR);
        $stmt->bindValue(':contact_cs', $data['contact_cs'], PDO::PARAM_STR);
        $stmt->bindValue(':logo_provider', $data['logo_provider'], PDO::PARAM_STR);
        $stmt->execute();

        // Update status_onboarding di tabel users
        $sqlUser = "UPDATE users SET status_onboarding = 'completed' WHERE id_user = :id_user";
        $stmtUser = $this->db->prepare($sqlUser);
        $stmtUser->bindValue(':id_user', $data['id_user'], PDO::PARAM_INT);
        $stmtUser->execute();

        // Massage Selamat Datang
        $sqlNotification = "INSERT INTO notifications (id_user, title, message, category) 
                            VALUES (:id_user, :title, :message, :category)";
        $stmtNotification = $this->db->prepare($sqlNotification);
        $stmtNotification->bindValue(':id_user', $data['id_user'], PDO::PARAM_INT);
        $stmtNotification->bindValue(':title', 'Selamat Datang', PDO::PARAM_STR);
        $stmtNotification->bindValue(':message', 'Selamat Datang ' . $data['name_company'] . ', partner ISP terpercaya. Profile provider berhasil diselesaikan.', PDO::PARAM_STR);
        $stmtNotification->bindValue(':category', 'system', PDO::PARAM_STR);
        $stmtNotification->execute();



        $this->db->commit();
        return true;
    } catch (Exception $e) {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
        throw $e;
    }
  }

}