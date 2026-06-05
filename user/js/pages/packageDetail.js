import "../components/PackageDetailHeader.js";
import "../components/PackageDetailSpecs.js";
import "../components/PackageDetailBenefits.js";
import "../components/PackageDetailCoverage.js";
import "../components/PackageDetailProvider.js";
import { initPackageDetail } from "../controllers/packageDetailController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("page-loader");
  await initPackageDetail();

  // Hapus loader setelah sedikit delay agar transisi terasa smooth
  setTimeout(() => {
    if (loader) {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }, 600);
});
