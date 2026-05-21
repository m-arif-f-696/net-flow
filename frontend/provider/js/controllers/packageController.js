const contentPackage = document.querySelector("#content-packages");

export const loadDataPackage = async () => {
  console.log("click");
  renderLoadingSkeleton();
  let data;
  try {
    const res = await fetch("/provider/data/listpackage.json");
    data = await res.json();
  } catch (err) {
    contentPackage.innerHTML = "";

    contentPackage.innerHTML = /*html*/ `
      <div class="lg:col-span-12 flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error">
          <span class="material-symbols-outlined text-3xl">wifi_off</span>
        </div>
        <h3 class="font-headline font-bold text-on-surface text-xl">Gagal Memuat Data</h3>
        <p class="text-on-surface-variant text-sm max-w-sm">
          Tidak dapat mengambil data paket. Periksa koneksi atau coba beberapa saat lagi.
        </p>
        <button
          onclick="loadDataPackage()"
          class="mt-2 px-6 py-2 rounded-full border border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all">
          Coba Lagi
        </button>
      </div>
    `;
    return;
  }
  contentPackage.innerHTML = "";

  const featurePackageCard = renderFeaturePackageCard(data.packages[0]);
  const sideCardStats = renderSideCardStats(data.package_summary);
  const packageCardList = renderPackageCardList(data.packages.slice(1));

  contentPackage.innerHTML = /*html*/ `
  ${featurePackageCard}
  ${sideCardStats}
  <div class="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
    ${packageCardList}
    <a href='create-package.html'
      class="border-2 border-dashed border-neutral/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group min-h-[300px]">
      <div
        class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-colors">
        <span
          class="material-symbols-outlined text-2xl"
          data-icon="add"
          >add</span
        >
      </div>
      <div class="text-center">
        <h3 class="font-headline font-bold text-on-surface">
          Add New Tier
        </h3>
        <p class="text-xs text-on-surface-variant mt-1">
          Design a new speed bracket
        </p>
      </div>
    </a>
  </div>
    `;
};

function renderLoadingSkeleton() {
  contentPackage.innerHTML = /*html*/ `
    <div class="skeleton lg:col-span-8 rounded-xl h-96"></div>
    <div class="skeleton lg:col-span-4 rounded-xl h-96"></div>
    <div class="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      <div class="skeleton rounded-xl h-72"></div>
      <div class="skeleton rounded-xl h-72"></div>
      <div class="skeleton rounded-xl h-72"></div>
    </div>
  `;
}

function renderFeaturePackageCard(dataPackage) {
  const {
    id,
    name,
    description,
    icon,
    price,
    download_speed,
    download_unit,
    upload_speed,
    upload_unit,
    features,
    is_visible,
  } = dataPackage;
  const listFeatures = features
    .map(
      (feature) => /*html*/ `
    <div
      class="flex items-center gap-3 text-sm text-on-surface-variant">
      <span
        class="material-symbols-outlined text-primary text-lg"
        >check_circle</span
      >
      <span>${feature}</span>
    </div>
    `,
    )
    .join("");

  return /*html*/ `
  <div
    class="lg:col-span-8 bg-base-200 p-8 rounded-xl shadow-sm border border-neutral/10 flex flex-col h-full md:flex-row gap-8 relative overflow-hidden group">
    <div class="absolute top-0 right-0 p-4">
      <span
        class="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"
        >Paket Terlaris</span
      >
    </div>
    <div class="lg:w-1/3 flex flex-col justify-between">
      <div>
        <div
          class="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-6">
          <span
            class="material-symbols-outlined text-3xl"
            data-icon="${icon}"
            >${icon}</span
          >
        </div>
        <h3
          class="text-3xl font-headline font-bold text-on-surface mb-2">
          ${name}
        </h3>
        <p class="text-on-surface-variant text-sm mb-6">
          ${description}
        </p>
      </div>
      <div class="text-4xl font-headline font-black text-primary">
        Rp. ${price.toLocaleString("id-ID")}<span
          class="text-sm font-medium text-on-surface-variant"
          >/Bulan</span
        >
      </div>
    </div>
    <div class="lg:w-2/3 flex flex-col gap-6">
      <div
        class="grid grid-cols-2 gap-6 bg-base-300 p-6 rounded-xl border border-neutral/10">
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider"
            >Download Speed</span
          >
          <div class="text-2xl font-bold text-on-surface">
            ${download_speed}
            <span
              class="text-sm font-medium text-on-surface-variant"
              >${download_unit}</span
            >
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider"
            >Upload Speed</span
          >
          <div class="text-2xl font-bold text-on-surface">
            ${upload_speed}
            <span
              class="text-sm font-medium text-on-surface-variant"
              >${upload_unit}</span
            >
          </div>
        </div>
      </div>
      <div class="space-y-3 px-1">
        ${listFeatures}
      </div>
      <div
        class="mt-auto pt-6 border-t border-neutral/10 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="edit-package.html?id=${id}"
            class="text-sm font-bold text-primary hover:underline transition-all">
            Edit Plan
          </a>
        </div>
        <label class="flex items-center gap-3">
          <input type="checkbox" ${is_visible ? "checked" : ""} class="toggle toggle-primary" />
          <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">${is_visible ? "Paket Aktif" : "Paket Tidak Aktif"}</span>
        </label>
      </div>
    </div>
  </div>
  `;
}

function renderSideCardStats(package_summary) {
  const { total_packages, most_popular, average_price, total_customers } =
    package_summary;

  return /*html*/ `
  <div
    class="lg:col-span-4 bg-primary text-white p-8 rounded-xl flex flex-col justify-between h-full shadow-xl shadow-primary/20">
    <div>
      <h4 class="text-lg font-headline font-bold mb-2">
        Paket Aktif
      </h4>
      <p class="text-sky-100 text-sm opacity-80">
        Distribusi paket yang berjalan.
      </p>
    </div>
    <div class="py-8">
      <div class="text-5xl font-black mb-1">${total_packages}</div>
      <div class="text-sm font-medium text-sky-200">
        Jenis Paket Tersedia
      </div>
    </div>
    <div class="space-y-4">
      <div
        class="flex justify-between items-end border-b border-white/10 pb-2">
        <span class="text-xs uppercase font-bold text-sky-200"
          >Paling Populer</span
        >
        <span class="font-headline font-bold">${most_popular}</span>
      </div>
      <div
        class="flex justify-between items-end border-b border-white/10 pb-2">
        <span class="text-xs uppercase font-bold text-sky-200"
          >Rata-Rata Harga</span
        >
        <span class="font-headline font-bold">Rp. ${average_price.toLocaleString("id-ID")}</span>
      </div>
      <div
        class="flex justify-between items-end border-b border-white/10 pb-2">
        <span class="text-xs uppercase font-bold text-sky-200"
          >Total Pelanggan Paket</span
        >
        <span class="font-headline font-bold">${total_customers}</span>
      </div>
    </div>
  </div>
  `;
}

function renderPackageCardList(dataPackages) {
  return dataPackages
    .map(
      (pkg) => /*html*/ `
    <card-package
      id-package="${pkg.id}"
      name-package="${pkg.name}"
      description="${pkg.description}"
      icon="${pkg.icon}"
      download-speed="${pkg.download_speed} ${pkg.download_unit}"
      upload-speed="${pkg.upload_speed} ${pkg.upload_unit}"
      price="${pkg.price}"
      active-package="${pkg.is_visible ? "active" : "inactive"}"
    ></card-package>
  `,
    )
    .join("");
}

window.loadDataPackage = loadDataPackage;
