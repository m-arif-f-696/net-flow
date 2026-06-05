import {
  loadDataPackage,
  formCreatePackage,
  formEditPackage,
  toggleActivePackage,
} from "../controllers/packageController.js";

// 1. Jalankan fungsi untuk memuat daftar paket
// (Aman dipanggil di sini karena sudah ada sistem 'return' jika elemen tidak ditemukan)
loadDataPackage();

// 2. JANGAN LUPA: Jalankan juga fungsi untuk menangani form Wizard!
formCreatePackage();

formEditPackage();

toggleActivePackage();
