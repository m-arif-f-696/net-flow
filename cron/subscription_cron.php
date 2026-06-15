<?php

require_once __DIR__ . '/../api/src/Database.php';

// ============================================================
// SETUP
// ============================================================

$database = new Database();
$db       = $database->connect();
$today    = date('Y-m-d');

echo "[{$today}] Cron subscription berjalan...\n";

// ============================================================
// HELPER: Generate Invoice Number
// ============================================================

function generateInvoiceNumber(PDO $db): string
{
    $prefix = 'INV-' . date('Ym') . '-';

    $stmt = $db->prepare(
        "SELECT invoice_number
         FROM transactions
         WHERE invoice_number LIKE :prefix
         ORDER BY id_transaction DESC
         LIMIT 1"
    );
    $stmt->execute([':prefix' => $prefix . '%']);
    $last = $stmt->fetchColumn();

    $nextNum = $last
        ? (int) substr($last, -4) + 1
        : 1;

    return $prefix . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
}

// ============================================================
// HELPER: Kirim Notifikasi
// ============================================================

function sendNotification(PDO $db, int $id_user, string $title, string $message, string $category = 'billing'): void
{
    $stmt = $db->prepare(
        "INSERT INTO notifications (id_user, notification_title, notification_message, notification_category)
         VALUES (:id_user, :title, :message, :category)"
    );
    $stmt->execute([
        ':id_user'  => $id_user,
        ':title'    => $title,
        ':message'  => $message,
        ':category' => $category,
    ]);
}

// ============================================================
// TUGAS 1: H-3 — Kirim notifikasi pengingat ke customer
// ============================================================

echo "[1] Cek subscription H-3 jatuh tempo...\n";

$reminderDate = date('Y-m-d', strtotime('+3 days'));

$stmtReminder = $db->prepare(
    "SELECT
        s.id_subscription,
        s.end_date,
        c.full_name,
        u.id_user,
        pk.name_package,
        pk.price_per_month,
        pr.name_company AS provider_name
     FROM subscriptions s
     JOIN customers  c  ON s.id_customer  = c.id_customer
     JOIN users      u  ON c.id_user      = u.id_user
     JOIN packages   pk ON s.id_package   = pk.id_package
     JOIN providers  pr ON pk.id_provider = pr.id_provider
     WHERE s.status_subscription = 'active'
       AND s.end_date            = :reminder_date"
);
$stmtReminder->execute([':reminder_date' => $reminderDate]);
$reminders = $stmtReminder->fetchAll(PDO::FETCH_ASSOC);

foreach ($reminders as $sub) {
    sendNotification(
        $db,
        (int) $sub['id_user'],
        'Tagihan Akan Jatuh Tempo',
        "Halo {$sub['full_name']}, tagihan paket {$sub['name_package']} dari {$sub['provider_name']} " .
        "akan jatuh tempo pada " . date('d M Y', strtotime($sub['end_date'])) . ". " .
        "Total tagihan: Rp " . number_format($sub['price_per_month'], 0, ',', '.') . ". " .
        "Pastikan Anda melakukan pembayaran tepat waktu.",
        'billing'
    );

    echo "   → Notifikasi H-3 dikirim ke user #{$sub['id_user']} ({$sub['full_name']})\n";
}

// ============================================================
// TUGAS 2: end_date tercapai → suspended + buat invoice monthly
// ============================================================

echo "[2] Cek subscription yang jatuh tempo hari ini...\n";

$stmtDue = $db->prepare(
    "SELECT
        s.id_subscription,
        s.end_date,
        c.full_name,
        u.id_user,
        pk.name_package,
        pk.price_per_month,
        pr.name_company AS provider_name
     FROM subscriptions s
     JOIN customers  c  ON s.id_customer  = c.id_customer
     JOIN users      u  ON c.id_user      = u.id_user
     JOIN packages   pk ON s.id_package   = pk.id_package
     JOIN providers  pr ON pk.id_provider = pr.id_provider
     WHERE s.status_subscription = 'active'
       AND s.end_date            <= :today"
);
$stmtDue->execute([':today' => $today]);
$dueSubs = $stmtDue->fetchAll(PDO::FETCH_ASSOC);

foreach ($dueSubs as $sub) {
    $db->beginTransaction();

    try {
        // 1. Suspend subscription
        $stmtSuspend = $db->prepare(
            "UPDATE subscriptions
             SET status_subscription = 'suspended'
             WHERE id_subscription = :id_subscription"
        );
        $stmtSuspend->execute([':id_subscription' => $sub['id_subscription']]);

        // 2. Cek apakah sudah ada invoice pending untuk subscription ini
        //    (hindari double invoice jika cron jalan lebih dari sekali)
        $stmtCheckInv = $db->prepare(
            "SELECT COUNT(*) FROM transactions
             WHERE id_subscription = :id_subscription
               AND payment_status  = 'pending'
               AND payment_type    = 'monthly'"
        );
        $stmtCheckInv->execute([':id_subscription' => $sub['id_subscription']]);
        $existingInvoice = (int) $stmtCheckInv->fetchColumn();

        if ($existingInvoice === 0) {
            // 3. Buat invoice monthly
            $invoiceNumber = generateInvoiceNumber($db);

            $stmtInvoice = $db->prepare(
                "INSERT INTO transactions
                    (id_subscription, invoice_number, amount, payment_type, payment_status)
                 VALUES
                    (:id_subscription, :invoice_number, :amount, 'monthly', 'pending')"
            );
            $stmtInvoice->execute([
                ':id_subscription' => $sub['id_subscription'],
                ':invoice_number'  => $invoiceNumber,
                ':amount'          => $sub['price_per_month'],
            ]);

            echo "   → Invoice {$invoiceNumber} dibuat untuk subscription #{$sub['id_subscription']}\n";
        }

        // 4. Notifikasi ke customer
        sendNotification(
            $db,
            (int) $sub['id_user'],
            'Langganan Anda Telah Ditangguhkan',
            "Halo {$sub['full_name']}, langganan paket {$sub['name_package']} dari {$sub['provider_name']} " .
            "telah ditangguhkan karena tagihan belum dibayar. " .
            "Segera lakukan pembayaran sebesar Rp " . number_format($sub['price_per_month'], 0, ',', '.') .
            " untuk mengaktifkan kembali layanan Anda. " .
            "Jika tidak dibayar dalam 30 hari, langganan akan dihentikan permanen.",
            'billing'
        );

        $db->commit();
        echo "   → Subscription #{$sub['id_subscription']} suspended ({$sub['full_name']})\n";

    } catch (\Exception $e) {
        $db->rollBack();
        echo "   [ERROR] Subscription #{$sub['id_subscription']}: " . $e->getMessage() . "\n";
    }
}

// ============================================================
// TUGAS 3: +30 hari suspended → terminated + expire invoice
// ============================================================

echo "[3] Cek subscription yang sudah 30 hari suspended...\n";

$terminateDate = date('Y-m-d', strtotime('-30 days'));

$stmtSuspended = $db->prepare(
    "SELECT
        s.id_subscription,
        s.updated_at,
        c.full_name,
        u.id_user                AS customer_user_id,
        pk.name_package,
        pr.name_company          AS provider_name,
        u_prov.id_user           AS provider_user_id
     FROM subscriptions s
     JOIN customers  c    ON s.id_customer  = c.id_customer
     JOIN users      u    ON c.id_user      = u.id_user
     JOIN packages   pk   ON s.id_package   = pk.id_package
     JOIN providers  pr   ON pk.id_provider = pr.id_provider
     JOIN users      u_prov ON pr.id_user   = u_prov.id_user
     WHERE s.status_subscription = 'suspended'
       AND DATE(s.updated_at)   <= :terminate_date"
);
$stmtSuspended->execute([':terminate_date' => $terminateDate]);
$suspendedSubs = $stmtSuspended->fetchAll(PDO::FETCH_ASSOC);

foreach ($suspendedSubs as $sub) {
    $db->beginTransaction();

    try {
        // 1. Terminate subscription
        $stmtTerminate = $db->prepare(
            "UPDATE subscriptions
             SET status_subscription = 'terminated'
             WHERE id_subscription = :id_subscription"
        );
        $stmtTerminate->execute([':id_subscription' => $sub['id_subscription']]);

        // 2. Expire semua invoice pending milik subscription ini
        $stmtExpire = $db->prepare(
            "UPDATE transactions
             SET payment_status = 'expire'
             WHERE id_subscription = :id_subscription
               AND payment_status  = 'pending'"
        );
        $stmtExpire->execute([':id_subscription' => $sub['id_subscription']]);

        // 3. Notifikasi ke customer
        sendNotification(
            $db,
            (int) $sub['customer_user_id'],
            'Langganan Anda Telah Dihentikan',
            "Halo {$sub['full_name']}, langganan paket {$sub['name_package']} dari {$sub['provider_name']} " .
            "telah dihentikan secara permanen karena tagihan tidak dibayar selama 30 hari. " .
            "Silakan berlangganan kembali jika ingin menggunakan layanan kami.",
            'billing'
        );

        // 4. Notifikasi ke provider
        sendNotification(
            $db,
            (int) $sub['provider_user_id'],
            'Pelanggan Dihentikan Otomatis',
            "Pelanggan {$sub['full_name']} dengan paket {$sub['name_package']} " .
            "telah dihentikan secara otomatis karena tidak melakukan pembayaran selama 30 hari.",
            'billing'
        );

        $db->commit();
        echo "   → Subscription #{$sub['id_subscription']} terminated ({$sub['full_name']})\n";

    } catch (\Exception $e) {
        $db->rollBack();
        echo "   [ERROR] Subscription #{$sub['id_subscription']}: " . $e->getMessage() . "\n";
    }
}

echo "[DONE] Cron subscription selesai.\n";