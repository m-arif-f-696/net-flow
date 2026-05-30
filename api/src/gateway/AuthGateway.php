<?php

class AuthGateway {

  private PDO $db;

  public function __construct(Database $database)
  {
    $this->db = $database->connect();
  }

  public function getUserByEmail ( string $email ) : array | false 

  {
    $sql = "SELECT * FROM users WHERE email = :email LIMIT 1";
    $stmt = $this->db->prepare($sql);

    $stmt->bindValue(":email", $email, PDO::PARAM_STR);

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

}