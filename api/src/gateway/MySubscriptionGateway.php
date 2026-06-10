<?php

class MySubscriptionGateway
{
    private PDO $db;

    public function __construct(Database $database)
    {
        $this->db = $database->connect();
    }

    // -------------------------------------------------------------------------
    // Lookup
    // -------------------------------------------------------------------------

    private function findCustomerIdByUser(int $id_user): int
    {
        $stmt = $this->db->prepare(
            "SELECT id_customer FROM customers WHERE id_user = :id_user LIMIT 1"
        );
        $stmt->execute([':id_user' => $id_user]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException("Profil customer tidak ditemukan.", 404);
        }

        return (int) $row['id_customer'];
    }

    // -------------------------------------------------------------------------
    // Subscription aktif customer
    // -------------------------------------------------------------------------

    public function getActiveSubscription(int $id_user): array
    {
        $id_customer = $this->findCustomerIdByUser($id_user);

        $stmt = $this->db->prepare(
            "SELECT 
                s.id_subscription,
                s.status_subscription,
                s.start_date,
                s.end_date                          AS next_billing,
                p.name_package,
                p.type_package,
                p.speed_mbps,
                p.download_speed,
                p.download_unit,
                p.upload_speed,
                p.upload_unit,
                p.quota_limit_gb,
                p.price_per_month,
                p.icon_package,
                p.package_features,
                pr.name_company                     AS provider_name,
                pr.logo_provider,
                pr.contact_cs                       AS provider_contact,
                NULL                                AS data_usage_gb
            FROM subscriptions s
            JOIN packages  p  ON s.id_package  = p.id_package
            JOIN providers pr ON p.id_provider = pr.id_provider
            WHERE s.id_customer         = :id_customer
            AND s.status_subscription = 'active'
            ORDER BY s.start_date DESC"
        );

        $stmt->execute([':id_customer' => $id_customer]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode package_features tiap row
        foreach ($rows as &$row) {
            if (!empty($row['package_features'])) {
                $row['package_features'] = json_decode($row['package_features'], true);
            }

            $row['data_usage_percent'] = null;
            if ($row['type_package'] === 'kuota' && $row['quota_limit_gb'] > 0) {
                $row['data_usage_percent'] = 0;
            }
        }
        unset($row);

        return $rows;
    }

    // -------------------------------------------------------------------------
    // Riwayat subscription customer (semua, bukan hanya aktif)
    // -------------------------------------------------------------------------

    public function getSubscriptionHistory(int $id_user): array
    {
        $id_customer = $this->findCustomerIdByUser($id_user);

        $stmt = $this->db->prepare(
            "SELECT 
                s.id_subscription,
                s.status_subscription,
                s.start_date,
                s.end_date,
                p.name_package,
                p.speed_mbps,
                p.price_per_month,
                pr.name_company AS provider_name
            FROM subscriptions s
            JOIN packages  p  ON s.id_package  = p.id_package
            JOIN providers pr ON p.id_provider = pr.id_provider
            WHERE s.id_customer = :id_customer
            ORDER BY s.created_at DESC"
        );

        $stmt->execute([':id_customer' => $id_customer]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}