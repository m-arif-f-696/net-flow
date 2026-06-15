import { initBilling } from "../controllers/billingController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("page-loader");

  try {
    await initBilling();
  } catch (err) {
    console.error("initBilling error:", err);
  }

  setTimeout(() => {
    if (loader) {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity    = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }, 300);
});
