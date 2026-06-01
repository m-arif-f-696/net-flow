import TopBar from "./components/TopBar.js";
import NavBar from "./components/NavBar.js";
import MarketPage from "./components/MarketPage.js";
import IspCard from "./components/IspCard.js";
import PaginationControl from "./components/PaginationControl.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    customElements.whenDefined("top-bar"),
    customElements.whenDefined("nav-bar"),
  ]);

  // Semua komponen sudah terdefinisi & dirender
  // Hapus loader setelah sedikit delay agar transisi terasa smooth
  setTimeout(() => {
    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }, 600);
});
