import { initCheckout } from "../controllers/checkoutController.js";

// ─────────────────────────────────────────────
// CHECKOUT PAGE ENTRY POINT
// ─────────────────────────────────────────────
// File ini dipanggil oleh checkout.html via <script type="module">
// Tugasnya: memanggil initCheckout() setelah DOM siap.

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("page-loader");

  await initCheckout();

  // Hapus loader setelah controller selesai
  if (loader) {
    loader.style.transition = "opacity 0.4s ease";
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 400);
  }
});
