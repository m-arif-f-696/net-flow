-- Matikan pengecekan foreign key sementara (opsional, untuk memastikan kelancaran)
SET FOREIGN_KEY_CHECKS = 0;

-- Hapus tabel anak/relasi terdalam terlebih dahulu
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS monthly_reports;
DROP TABLE IF EXISTS network_issues;

-- Hapus tabel utama terpusat paling terakhir
DROP TABLE IF EXISTS users;

-- Nyalakan kembali pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABEL UTAMA: USERS (TERPUSAT)
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    role ENUM('superadmin', 'provider', 'customer') NOT NULL,
    status_onboarding ENUM('register', 'completed') DEFAULT 'register', -- Indikator Kelengkapan Profil
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABEL PROFIL: PROVIDERS
CREATE TABLE providers (
    id_provider INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    name_company VARCHAR(150) NOT NULL,
    nib VARCHAR(50) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    area_code VARCHAR(20) NOT NULL,
    coordinate_point VARCHAR(255),
    coverage_area VARCHAR(20) NOT NULL,
    contact_cs VARCHAR(20) NOT NULL,
    logo_provider VARCHAR(255),
    verified_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (area_code) REFERENCES wilayah(kode) ON DELETE RESTRICT,
    FOREIGN KEY (coverage_area) REFERENCES wilayah(kode) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. TABEL DATA: PACKAGES (FUTURE-PROOF & UI READY)
CREATE TABLE packages (
    id_package INT AUTO_INCREMENT PRIMARY KEY,
    id_provider INT NOT NULL,
    name_package VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE, -- Bagus untuk URL clean: netflow.test/package/slug-nama
    type_package ENUM('unlimited', 'kuota') NOT NULL,
    
    -- Struktur Kecepatan & Unit
    speed_mbps INT NOT NULL, -- Dipertahankan murni Mbps untuk kebutuhan kalkulasi logika/filter query backend
    download_speed INT NOT NULL,
    download_unit ENUM('Mbps', 'Gbps') DEFAULT 'Mbps',
    upload_speed INT NOT NULL,
    upload_unit ENUM('Mbps', 'Gbps') DEFAULT 'Mbps',
    
    quota_limit_gb INT NULL,
    price_per_month INT NOT NULL,
    installation_cost INT NOT NULL DEFAULT 0,
    package_description TEXT,
    icon_package VARCHAR(50) DEFAULT 'wifi', -- Menyimpan string Google Material Icon
    package_features JSON NULL,               -- Menampung Array: ["Gratis Router WiFi 6", "Unlimited"]
    
    -- Flag Visual Komponen UI (1 = True, 0 = False)
    is_recommended TINYINT(1) DEFAULT 0, -- Diubah sesuai logika manual dari Provider
    package_status ENUM('active', 'inactive') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_provider) REFERENCES providers(id_provider) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABEL PROFIL: CUSTOMERS
CREATE TABLE customers (
    id_customer INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    nik CHAR(16) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('L', 'P') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    area_code VARCHAR(20) NOT NULL, 
    coordinate_point VARCHAR(255),  
    photo_profile VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (area_code) REFERENCES wilayah(kode) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. TABEL DATA: SUBSCRIPTIONS (HUBUNGAN CUSTOMER DAN PAKET)
CREATE TABLE subscriptions (
    id_subscription INT AUTO_INCREMENT PRIMARY KEY,
    id_customer INT NOT NULL,
    id_package INT NOT NULL,
    status_subscription ENUM('active', 'suspended', 'terminated') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, -- Digunakan untuk acuan generate invoice bulan berikutnya
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Mengikat ke profil customer dan paket wifi
    FOREIGN KEY (id_customer) REFERENCES customers(id_customer) ON DELETE CASCADE,
    FOREIGN KEY (id_package) REFERENCES packages(id_package) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. TABEL DATA: TRANSACTIONS (PENCATATAN KEUANGAN & MIDTRANS READY)
CREATE TABLE transactions (
    id_transaction INT AUTO_INCREMENT PRIMARY KEY,
    id_subscription INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- Contoh: INV-202606-0001 (Wajib Unique)
    amount INT NOT NULL, -- Total nominal yang harus dibayar
    payment_type ENUM('activation', 'monthly') NOT NULL, -- Membedakan biaya pasang awal vs bulanan
    payment_status ENUM('pending', 'settlement', 'expire', 'cancel') DEFAULT 'pending', -- Status standar Midtrans
    snap_token VARCHAR(255) NULL, -- Menyimpan token pembayaran dari Midtrans API
    paid_at TIMESTAMP NULL, -- Kapan user melakukan pembayaran
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Mengikat ke data langganan, RESTRICT digunakan agar riwayat keuangan aman dari penghapusan tidak sengaja
    FOREIGN KEY (id_subscription) REFERENCES subscriptions(id_subscription) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. TABEL DATA: NOTIFICATIONS (UNTUK REAL-TIME POLLING DI FRONTEND)
CREATE TABLE notifications (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL, -- Dikirim ke user tertentu (bisa customer / provider)
    notification_title VARCHAR(150) NOT NULL,
    notification_message TEXT NOT NULL,
    notification_category ENUM('billing', 'system', 'promo') DEFAULT 'system', -- Penentu warna/icon di UI
    is_read TINYINT(1) DEFAULT 0, -- 0 = Unread (Belum dibaca), 1 = Read (Sudah dibaca)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. TABEL DATA: MONTHLY_REPORTS (REKAPUTULASI DATA BISNIS PROVIDER)
CREATE TABLE monthly_reports (
    id_report INT AUTO_INCREMENT PRIMARY KEY,
    id_provider INT NOT NULL,
    report_month TINYINT NOT NULL, -- Angka bulan (1-12)
    report_year SMALLINT NOT NULL, -- Angka tahun (Contoh: 2026)
    total_revenue INT NOT NULL DEFAULT 0, -- Total pendapatan kotor bulan tersebut
    total_new_subscriptions INT NOT NULL DEFAULT 0, -- Jumlah user baru yang pasang wifi
    total_active_customers INT NOT NULL DEFAULT 0, -- Total pelanggan yang statusnya masih aktif
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_provider) REFERENCES providers(id_provider) ON DELETE CASCADE,
    -- Memastikan satu provider hanya punya 1 baris laporan per bulan di tahun yang sama
    UNIQUE KEY unique_provider_monthly_report (id_provider, report_month, report_year)
) ENGINE=InnoDB;

-- 9. TABEL DATA: NETWORK_ISSUES (LAPORAN GANGGUAN / TICKETING SYSTEM)
CREATE TABLE network_issues (
    id_issue INT AUTO_INCREMENT PRIMARY KEY,
    id_provider INT NOT NULL,
    id_customer INT NOT NULL,
    title_issue VARCHAR(150) NOT NULL,
    description_issue TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status_issue ENUM('open', 'investigating', 'progress', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Relasi pengikat ke kedua belah pihak
    FOREIGN KEY (id_provider) REFERENCES providers(id_provider) ON DELETE CASCADE,
    FOREIGN KEY (id_customer) REFERENCES customers(id_customer) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE INDEX idx_package_id ON subscriptions(id_package);
CREATE INDEX idx_provider_id ON packages(id_provider);
-- Mempercepat query pembacaan notifikasi yang belum dibaca milik user tertentu
CREATE INDEX idx_user_unread_notif ON notifications(id_user, is_read);
-- Indeks sekunder untuk mempercepat filter dashboard teknisi provider berdasarkan status kendala
CREATE INDEX idx_issue_status ON network_issues(id_provider, status_issue);
-- ====================================================================
-- 1. INDEKS UNTUK TABEL PROVIDERS
-- ====================================================================
-- Mempercepat pencarian provider berdasarkan wilayah cakupan jaringan dan verifikasi admin
CREATE INDEX idx_provider_coverage ON providers(coverage_area);
CREATE INDEX idx_provider_verified ON providers(verified_status);

-- ====================================================================
-- 2. INDEKS UNTUK TABEL CUSTOMERS
-- ====================================================================
-- Mempercepat pencarian lokasi customer saat pemetaan area terdekat
CREATE INDEX idx_customer_area ON customers(area_code);

-- ====================================================================
-- 3. INDEKS UNTUK TABEL PACKAGES
-- ====================================================================
-- Mempercepat query filter dynamic pencarian paket wifi (kecepatan & harga)
CREATE INDEX idx_package_filter ON packages(package_status, speed_mbps, price_per_month);

-- ====================================================================
-- 4. INDEKS UNTUK TABEL SUBSCRIPTIONS
-- ====================================================================
-- Mempercepat pengecekan masa aktif wifi untuk cron job isolasi bulanan
CREATE INDEX idx_sub_status_dates ON subscriptions(status_subscription, end_date);

-- ====================================================================
-- 5. INDEKS UNTUK TABEL TRANSACTIONS
-- ====================================================================
-- Mempercepat pencarian tagihan yang belum dibayar saat validasi webhook Midtrans
CREATE INDEX idx_transaction_payment ON transactions(payment_status, payment_type);

-- 2. Insert Data Users
-- 1. INSERT DATA: USERS (Kredensial Akun)
-- Catatan: Hash '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' adalah enkripsi dari teks: 'password123'
INSERT INTO users (id_user, email, password, role, status_onboarding) VALUES
(1, 'superadmin@netflow.test', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', 'completed'),
(2, 'meganet@netflow.test', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', 'completed'),
(3, 'arif.customer@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'completed'),
(4, 'baru@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'register');

-- 2. INSERT DATA: PROVIDERS (Profil Perusahaan ISP)
-- Asumsi kode wilayah '32.07.15' dan '32.07' sudah tersedia di tabel wilayah Anda
INSERT INTO providers (id_provider, id_user, name_company, nib, address, area_code, coordinate_point, coverage_area, contact_cs, logo_provider, verified_status) VALUES
(1, 2, 'PT Mega Network Indonesia', '1234567890123', 'Jl. Tekno No. 45, Tasikmalaya', '32.07.15', '-7.351234,108.223456', '32.07', '08123456789', 'uploads/photo_profile/provider/default.png', 'verified');

-- 3. INSERT DATA: PACKAGES (Katalog Layanan Wifi)
-- Fitur menggunakan format JSON data type sesuai rancangan modern kita sebelumnya
INSERT INTO packages (id_package, id_provider, name_package, slug, type_package, speed_mbps, download_speed, download_unit, upload_speed, upload_unit, quota_limit_gb, price_per_month, installation_cost, package_description, icon_package, package_features, is_recommended, package_status) VALUES
(1, 1, 'Fiber Ultra 1Gbps', 'fiber-ultra-1gbps', 'unlimited', 1000, 1, 'Gbps', 500, 'Mbps', NULL, 890000, 150000, 'Dioptimalkan untuk gaming berat dan streaming multi-perangkat tanpa hambatan.', 'rocket_launch', '["Router WiFi 6E Gratis", "Tanpa Batas Data", "Dukungan Prioritas 24/7", "IP Public Dinamis"]', 1, 'active'),
(2, 1, 'Mega Home Lite', 'mega-home-lite', 'unlimited', 30, 30, 'Mbps', 10, 'Mbps', NULL, 250000, 150000, 'Cocok untuk kebutuhan harian keluarga kecil, pengerjaan tugas, dan media sosial.', 'wifi', '["Gratis Instalasi", "Ideal untuk 3-5 perangkat", "Bandwidth Simetris"]', 0, 'active'),
(3, 1, 'Kuota Hemat 100GB', 'kuota-hemat-100gb', 'kuota', 50, 50, 'Mbps', 20, 'Mbps', 100, 150000, 100000, 'Paket kuota ekonomis berkecepatan tinggi tanpa komitmen biaya bulanan yang mengikat.', 'speed', '["Kuotanya 100 GB", "Masa Aktif 30 Hari", "Bisa Top Up Kapan Saja"]', 0, 'active');

-- 4. INSERT DATA: CUSTOMERS (Profil Pelanggan Rumah)
INSERT INTO customers (id_customer, id_user, nik, full_name, gender, phone, address, area_code, coordinate_point, photo_profile) VALUES
(1, 3, '3207151234560001', 'Muhamad Arif Farhan', 'L', '08987654321', 'Perum Nirwana Blok C-12, Sindangkasih', '32.07.15', '-7.324567,108.256789', 'uploads/photo_profile/user/default.png');

-- 5. INSERT DATA: SUBSCRIPTIONS (Kontrak Langganan Aktif)
INSERT INTO subscriptions (id_subscription, id_customer, id_package, status_subscription, start_date, end_date) VALUES
(1, 1, 1, 'active', '2026-06-01', '2026-07-01');

-- 6. INSERT DATA: TRANSACTIONS (Riwayat Invoice Pembayaran)
INSERT INTO transactions (id_transaction, id_subscription, invoice_number, amount, payment_type, payment_status, snap_token, paid_at) VALUES
(1, 1, 'INV-202606-0001', 1040000, 'activation', 'settlement', 'snap-token-dummy-12345', '2026-06-01 09:15:30');

-- Dummy data untuk Notifikasi
INSERT INTO notifications (id_user, notification_title, notification_message, notification_category, is_read) VALUES
(3, 'Tagihan Bulan Juni Telah Terbit', 'Halo Muhamad Arif Farhan, invoice INV-202606-0001 untuk paket Fiber Ultra Anda sudah tersedia. Silakan lakukan pembayaran.', 'billing', 0),
(2, 'Pendaftaran Berhasil Terverifikasi', 'Selamat PT Mega Network Indonesia! Dokumen NIB Anda telah disetujui oleh Superadmin. Katalog Anda kini sudah live.', 'system', 1);

-- Dummy data untuk Laporan Rekap Bulanan Provider (PT Mega Network, id_provider = 1)
INSERT INTO monthly_reports (id_provider, report_month, report_year, total_revenue, total_new_subscriptions, total_active_customers) VALUES
(1, 5, 2026, 12500000, 15, 110), -- Rekap Bulan Mei 2026
(1, 6, 2026, 15400000, 22, 123); -- Rekap Bulan Juni 2026 (Berjalan)

-- Insert Laporan Kendala Baru dari Customer
INSERT INTO network_issues (id_issue, id_provider, id_customer, title_issue, description_issue, severity, status_issue) VALUES
(1, 1, 1, 'Indikator Modem LOS Merah', 'Sejak hujan lebat semalam pukul 22.00 WIB, koneksi internet mati total dan lampu indikator LOS di modem berkedip merah murni. Mohon pengecekan kabel odp terdekat.', 'high', 'open');

-- Insert Notifikasi Terkait Gangguan Tersebut
-- 1. Notifikasi Masuk ke Dashboard Provider (id_user = 2 milik Meganet) memberi tahu ada tiket baru masuk
INSERT INTO notifications (id_user, notification_title, notification_message, notification_category, is_read) VALUES
(2, 'Tiket Gangguan Baru #TKT001', 'Customer Muhamad Arif Farhan melaporkan kendala: Indikator Modem LOS Merah (Prioritas: High).', 'system', 0);