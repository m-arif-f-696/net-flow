import "../components/PackageDetailHeader.js";
import "../components/PackageDetailSpecs.js";
import "../components/PackageDetailBenefits.js";
import "../components/PackageDetailCoverage.js";
import "../components/PackageDetailProvider.js";

import config from "../../../js/config.js";

// atau sesuai path config kamu

export const initPackageDetail = async () => {
  let slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    const pathParts = location.pathname.split("/");
    slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
  }

  if (!slug || slug === "detailpackage.html") {
    console.error("Slug paket tidak ditemukan di URL.");
    return;
  }

  const identifier = slug;
  _renderSkeleton();

  let json;
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/customer/packages/${identifier}`,
      { headers: { "Content-Type": "application/json" } },
    );
    json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Gagal memuat paket.");
  } catch (err) {
    _renderError(err.message);
    return;
  }

  const pkg = json.data;

  let features = pkg.package_features ?? [];
  if (typeof features === "string") {
    try {
      features = JSON.parse(features);
    } catch {
      features = [];
    }
  }

  document.querySelector("package-detail-header")?.setData({
    providerName: pkg.provider_name,
    providerLogo: pkg.logo_provider
      ? `${config.BASE_URL}/${pkg.logo_provider}`
      : "",
    packageName: pkg.name_package,
    price: pkg.price_per_month,
  });

  document.querySelector("package-detail-specs")?.setData({
    downloadSpeed: pkg.download_speed,
    downloadUnit: pkg.download_unit,
    uploadSpeed: pkg.upload_speed,
    uploadUnit: pkg.upload_unit,
  });

  document.querySelector("package-detail-benefits")?.setData({
    features,
    description: pkg.package_description ?? "",
  });
  document.querySelector("package-detail-coverage")?.setData({
    areaName: pkg.coverage_area_name ?? pkg.area_name ?? "—",
    available: pkg.coverage_status ?? false,
  });

  document.querySelector("package-detail-provider")?.setData({
    companyName: pkg.provider_name ?? "—",
    description: pkg.package_description ?? "",
    areaName: pkg.coverage_area_name ?? "—",
    contactCs: pkg.contact_cs ?? "—",
  });

  const btnConnect = document.getElementById("btn-connect");
  if (btnConnect) {
    btnConnect.dataset.packageId = pkg.id_package;
    btnConnect.addEventListener("click", () => {
      window.location.href = `/user/checkout/${pkg.slug}`;
    });
  }
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function _renderSkeleton() {
  const header = document.querySelector("package-detail-header");
  if (header) {
    header.innerHTML = /*html*/ `
      <section class="mt-4 mb-8 space-y-3">
        <div class="skeleton h-10 w-10 rounded-xl"></div>
        <div class="skeleton h-8 w-3/4 rounded-xl"></div>
        <div class="skeleton h-6 w-1/3 rounded-xl"></div>
      </section>
    `;
  }
}

function _renderError(msg) {
  document.querySelector("main")?.insertAdjacentHTML(
    "afterbegin",
    /*html*/ `
    <div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center text-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <h3 class="font-bold text-base-content text-lg">Gagal Memuat Paket</h3>
      <p class="text-base-content/50 text-sm max-w-sm">${msg}</p>
      <button onclick="history.back()"
        class="px-6 py-2 rounded-full border border-base-300 text-base-content/60 text-sm font-bold hover:bg-base-200 transition-all">
        Kembali
      </button>
    </div>
  `,
  );
}
