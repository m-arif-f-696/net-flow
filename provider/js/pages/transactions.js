import "../components/TransactionSummaryCard.js";
import "../components/InvoiceOutstandingCard.js";
import "../components/TransactionTable.js";
import { initTransaction } from "../controllers/transactionController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("page-loader");

  try {
    await initTransaction();
  } catch (err) {
    console.error("initTransaction error:", err);
  }

  setTimeout(() => {
    if (loader) {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }, 300);
});
