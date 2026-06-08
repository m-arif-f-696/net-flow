import { initCustomer } from "../controllers/customerController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("page-loader");

  try {
    // Jalankan initCustomer tapi beri timeout maksimal agar tidak nunggu selamanya
    await Promise.race([
      initCustomer(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000),
      ),
    ]);
  } catch (err) {
    console.error("initCustomer error:", err);
  } finally {
    // Pindahkan penghapusan loader ke 'finally'
    // 'finally' pasti jalan entah sukses atau gagal
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }
});
