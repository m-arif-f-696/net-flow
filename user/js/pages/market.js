import "../components/MarketPage.js";
import "../components/IspCard.js";
import "../components/PaginationControl.js";
import { initMarket } from "../controllers/marketController.js";

// ─────────────────────────────────────────────
// MARKET PAGE ENTRY POINT
// ─────────────────────────────────────────────
// File ini dipanggil oleh market.html via <script type="module">
// Tugasnya hanya satu: memanggil fungsi controller saat DOM siap.

document.addEventListener("DOMContentLoaded", () => {
  initMarket();
});
