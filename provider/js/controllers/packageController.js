import config from "../../../js/config.js";

export const loadDataPackage = async () => {
  const contentPackage = document?.querySelector("#content-packages");
  if (!contentPackage) return;
  renderLoadingSkeleton(contentPackage);

  let data;
  try {
    const res = await fetch(`${config.API_BASE_URL}/provider/packages`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    data = await res.json();
    console.log(data);
  } catch (err) {
    contentPackage.innerHTML = /*html*/ `
      <div class="lg:col-span-12 flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="font-bold text-base-content text-xl">Gagal Memuat Data</h3>
        <p class="text-base-content/60 text-sm max-w-sm">
          Tidak dapat mengambil data paket. Periksa koneksi atau coba beberapa saat lagi.
        </p>
        <button
          onclick="loadDataPackage()"
          class="mt-2 px-6 py-2 rounded-full border border-primary text-primary text-sm font-bold hover:bg-primary hover:text-primary-content transition-all">
          Coba Lagi
        </button>
      </div>
    `;
    return;
  }

  const packages = data.data ?? []; // semua paket
  console.log(data.data);
  const packageSummary = data.package_summary ?? {}; // { total_packages, most_popular_id, most_popular, average_price, total_customers }

  console.log(packageSummary);
  // Cari paket terlaris dari package_summary.most_popular_id (atau most_popular jika sudah berupa nama)
  const featuredId = packageSummary.id_package ?? null;
  const featuredPackage = featuredId
    ? packages.find((p) => p.id_package === featuredId)
    : (packages[0] ?? null); // fallback: paket pertama

  // Paket sisanya (exclude featured)
  const restPackages = featuredPackage
    ? packages.filter((p) => p.id_package !== featuredPackage.id_package)
    : packages;

  contentPackage.innerHTML = "";

  // Kondisi: tidak ada paket sama sekali
  if (packages.length === 0) {
    contentPackage.innerHTML = /*html*/ `
      <div class="lg:col-span-12 flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </div>
        <h3 class="font-bold text-base-content text-xl">Belum Ada Paket</h3>
        <p class="text-base-content/60 text-sm max-w-sm">
          Anda belum membuat paket internet apapun. Mulai buat paket pertama Anda sekarang.
        </p>
        <a href="add-package.html"
          class="mt-2 px-6 py-2 rounded-full bg-primary text-primary-content text-sm font-bold hover:opacity-90 transition-all">
          Buat Paket Pertama
        </a>
      </div>
    `;
    return;
  }

  // Render featured + side stats
  const featurePackageCard = featuredPackage
    ? renderFeaturePackageCard(featuredPackage)
    : `<div class="lg:col-span-8 bg-base-200 rounded-xl flex items-center justify-center min-h-[300px]">
        <p class="text-base-content/40 text-sm">Tidak ada paket terlaris.</p>
       </div>`;

  const sideCardStats = renderSideCardStats(packageSummary);
  const packageCardList = renderPackageCardList(restPackages);

  contentPackage.innerHTML = /*html*/ `
    ${featurePackageCard}
    ${sideCardStats}
    <div class="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      ${packageCardList}
      <a href="add-package.html"
        class="border-2 border-dashed border-base-300 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group min-h-[300px]">
        <div class="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 group-hover:bg-primary group-hover:text-primary-content transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div class="text-center">
          <h3 class="font-bold text-base-content">Add New Tier</h3>
          <p class="text-xs text-base-content/50 mt-1">Design a new speed bracket</p>
        </div>
      </a>
    </div>
  `;
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function parseFeatures(raw) {
  // API mengembalikan package_features sebagai JSON string
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function renderLoadingSkeleton(content) {
  content.innerHTML = /*html*/ `
    <div class="skeleton lg:col-span-8 rounded-xl h-96"></div>
    <div class="skeleton lg:col-span-4 rounded-xl h-96"></div>
    <div class="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      <div class="skeleton rounded-xl h-72"></div>
      <div class="skeleton rounded-xl h-72"></div>
      <div class="skeleton rounded-xl h-72"></div>
    </div>
  `;
}

function renderFeaturePackageCard(pkg) {
  const {
    slug,
    name_package,
    package_description,
    icon_package,
    price_per_month,
    download_speed,
    download_unit,
    upload_speed,
    upload_unit,
    package_features,
    package_status,
  } = pkg;

  const features = parseFeatures(package_features);
  const isActive = package_status === "active";

  const listFeatures = features
    .map(
      (f) => /*html*/ `
    <div class="flex items-center gap-3 text-sm text-base-content/60">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span>${f}</span>
    </div>
  `,
    )
    .join("");

  return /*html*/ `
    <div class="lg:col-span-8 bg-base-200 p-8 rounded-xl shadow-sm border border-base-300 flex flex-col md:flex-row gap-8 relative overflow-hidden card-package-item">
      <div class="absolute top-0 right-0 p-4">
        <span class="bg-primary text-primary-content text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
          Paket Terlaris
        </span>
      </div>

      <!-- Left -->
      <div class="lg:w-1/3 flex flex-col justify-between">
        <div>
          <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-base-content mb-2">${name_package}</h3>
          <p class="text-base-content/60 text-sm mb-6">${package_description}</p>
        </div>
        <div class="text-4xl font-black text-primary">
          Rp ${price_per_month.toLocaleString("id-ID")}
          <span class="text-sm font-medium text-base-content/50">/Bulan</span>
        </div>
      </div>

      <!-- Right -->
      <div class="lg:w-2/3 flex flex-col gap-6">
        <div class="grid grid-cols-2 gap-6 bg-base-300 p-6 rounded-xl border border-base-300">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] text-base-content/50 uppercase font-bold tracking-wider">Download Speed</span>
            <div class="text-2xl font-bold text-base-content">
              ${download_speed}
              <span class="text-sm font-medium text-base-content/50">${download_unit}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] text-base-content/50 uppercase font-bold tracking-wider">Upload Speed</span>
            <div class="text-2xl font-bold text-base-content">
              ${upload_speed}
              <span class="text-sm font-medium text-base-content/50">${upload_unit}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3 px-1">${listFeatures}</div>

        <div class="mt-auto pt-6 border-t border-base-300 flex items-center justify-between">
          <a href="edit-package/${slug}"
            class="text-sm font-bold text-primary hover:underline transition-all">
            Edit Plan
          </a>
          <label class="flex items-center gap-3 cursor-pointer">
            <input data-id_package=${pkg.id_package} type="checkbox" ${isActive ? "checked" : ""} class="toggle toggle-primary active-package" />
            <span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
              ${isActive ? "Paket Aktif" : "Paket Tidak Aktif"}
            </span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderSideCardStats(summary) {
  const {
    total_packages = 0,
    most_popular = "—",
    average_price = 0,
    total_customers = 0,
  } = summary;

  return /*html*/ `
    <div class="lg:col-span-4 bg-primary text-primary-content p-8 rounded-xl flex flex-col justify-between h-full shadow-xl shadow-primary/20">
      <div>
        <h4 class="text-lg font-bold mb-2">Paket Aktif</h4>
        <p class="text-primary-content/70 text-sm">Distribusi paket yang berjalan.</p>
      </div>
      <div class="py-8">
        <div class="text-5xl font-black mb-1">${total_packages}</div>
        <div class="text-sm font-medium text-primary-content/70">Jenis Paket Tersedia</div>
      </div>
      <div class="space-y-4">
        <div class="flex justify-between items-end border-b border-primary-content/10 pb-2">
          <span class="text-xs uppercase font-bold text-primary-content/60">Paling Populer</span>
          <span class="font-bold">${most_popular}</span>
        </div>
        <div class="flex justify-between items-end border-b border-primary-content/10 pb-2">
          <span class="text-xs uppercase font-bold text-primary-content/60">Rata-Rata Harga</span>
          <span class="font-bold">Rp ${Number(average_price).toLocaleString("id-ID")}</span>
        </div>
        <div class="flex justify-between items-end border-b border-primary-content/10 pb-2">
          <span class="text-xs uppercase font-bold text-primary-content/60">Total Pelanggan</span>
          <span class="font-bold">${total_customers}</span>
        </div>
      </div>
    </div>
  `;
}

function renderPackageCardList(packages) {
  if (!packages.length) return "";

  return packages
    .map(
      (pkg) => /*html*/ `
    <card-package
      id_package="${pkg.id_package}"
      slug="${pkg.slug}"
      name-package="${pkg.name_package}"
      description="${pkg.package_description}"
      icon="${pkg.icon_package}"
      download-speed="${pkg.download_speed} ${pkg.download_unit}"
      upload-speed="${pkg.upload_speed} ${pkg.upload_unit}"
      price="${pkg.price_per_month}"
      active-package="${pkg.package_status === "active" ? "active" : "inactive"}"
    ></card-package>
  `,
    )
    .join("");
}

window.loadDataPackage = loadDataPackage;

// ─────────────────────────────────────────────
// FORM CREATE PACKAGE
// ─────────────────────────────────────────────
export const formCreatePackage = () => {
  const wizard = document?.querySelector("wizard-create-package");
  if (!wizard) return;

  wizard.addEventListener("wizard-submit", async (e) => {
    const payload = e.detail;
    console.log("Payload ke API:", payload);

    // 1️⃣ Kirim data ke API
    try {
      const res = await fetch(`${config.API_BASE_URL}/provider/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyimpan paket");
      }

      // 2️⃣ Jika berhasil, tampilkan Alert
      const toast = document.querySelector("#confirm-add-package");
      if (!toast) return; // guard

      // Cukup set attribute, komponen akan merender ulang otomatis
      toast.setAttribute("title", "Sukses");
      toast.setAttribute("message", "Paket berhasil ditambahkan!");
      toast.setAttribute("color", "success");

      // Tampilkan modal
      toast.show();

      // 3️⃣ Setelah pengguna menutup toast, arahkan kembali
      // Gunakan "onOk" (sesuai desain komponen baru) dan { once: true }
      toast.addEventListener(
        "onOk",
        () => {
          window.location.href = "/provider/packages.html";
        },
        { once: true },
      );
    } catch (err) {
      // 4️⃣ Tampilkan pesan error lewat komponen yang sama
      console.error("Network error:", err);

      const toast = document.querySelector("#confirm-add-package");
      if (toast) {
        toast.setAttribute("title", "Gagal!");
        toast.setAttribute("message", err.message);
        toast.setAttribute("color", "error");
        toast.show();
      }
    }
  });
};

export const formEditPackage = () => {
  const wizard = document?.querySelector("wizard-edit-package");
  if (!wizard) return;

  // Ambil slug dari pathname (karena URL rewriting mod_rewrite) atau fallback ke query parameter
  let slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    const pathParts = location.pathname.split("/");
    slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
  }

  if (!slug || slug === "edit-package.html") {
    console.error("Slug paket tidak ditemukan di URL.");
    return;
  }

  console.log("Slug paket: ", slug);

  // Set ke komponen supaya dia bisa fetch data
  wizard.setAttribute("slug", slug);

  wizard.addEventListener("wizard-submit", async (e) => {
    const { id, payload, hasChanges } = e.detail;

    if (!hasChanges) {
      const toast = document?.querySelector("#alert-massage-package");
      if (toast) {
        toast.setAttribute("title", "Gagal!");
        toast.setAttribute("message", "Tidak ada perubahan yang disimpan.");
        toast.setAttribute("color", "error");
        toast.show();
      }
      return;
    }

    try {
      const res = await fetch(
        `${config.API_BASE_URL}/provider/packages/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      window.location.href = "/provider/packages.html";
    } catch (err) {
      console.error("Network error:", err);
      const toast = document?.querySelector("#alert-massage-package");
      if (toast) {
        toast.setAttribute("title", "Gagal!");
        toast.setAttribute("message", err.message);
        toast.setAttribute("color", "error");
        toast.show();
      }
    }
  });
};

// export const toggleActivePackage = () => {
//   const cardPackages = document?.querySelectorAll(".card-package-item");
//   cardPackages.forEach((item) => {
//     const toggle = item.querySelector(".toggle");
//     toggle.addEventListener("change", async (e) => {
//       const id_package = e.target.dataset.id_package;
//       const status = e.target.checked ? "active" : "inactive";
//       console.log("Status: ", status);
//       console.log("ID Package: ", id_package);

//       const confirmModal = document.querySelector("#confirm-delete-package");
//       if (!confirmModal) return;
//       confirmModal.setAttribute("title", `Konfirmasi ${status} Paket`);
//       confirmModal.setAttribute(
//         "message",
//         status === "active"
//           ? "Apakah anda yakin ingin menonaktifkan paket ini?"
//           : "Apakah anda yakin ingin mengaktifkan paket ini?",
//       );
//       confirmModal.setAttribute("color", "warning");
//       confirmModal.setAttribute("icon", "warning");
//       confirmModal.show();

//       const onOkHandler = async () => {
//         try {
//           const res = await fetch(
//             `http://net_flow.test/api/provider/packages/${id_package}`,
//             {
//               method: "PATCH",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ package_status: status }),
//             },
//           );
//           if (!res.ok) {
//             const errorData = await res.json();
//             throw new Error(errorData.message || "Gagal mengubah status paket");
//           }
//           const toast = document?.querySelector("#alert-massage-package");
//           if (toast) {
//             toast.setAttribute("title", "Sukses");
//             toast.setAttribute("message", "Status paket berhasil diubah!");
//             toast.setAttribute("color", "success");
//             toast.show();
//           }
//         } catch (err) {
//           console.error("Network error:", err);
//           const toast = document?.querySelector("#alert-massage-package");
//           if (toast) {
//             toast.setAttribute("title", "Gagal!");
//             toast.setAttribute("message", err.message);
//             toast.setAttribute("color", "error");
//             toast.show();
//           }
//         }
//       };

//       const onCancelHandler = () => {
//         e.target.checked = !e.target.checked;
//       };

//       confirmModal.addEventListener("onOk", onOkHandler, { once: true });
//       confirmModal.addEventListener("onCancel", onCancelHandler, {
//         once: true,
//       });
//     });
//   });
// };

export const toggleActivePackage = () => {
  // 1. Pasang listener di 'document', agar elemen yang dirender menyusul tetap terdeteksi
  document.addEventListener("change", async (e) => {
    // 2. Cek apakah elemen yang berubah memiliki class "toggle" dan punya dataset "id_package"
    // Jika tidak, abaikan dan hentikan fungsi
    if (
      !e.target.classList.contains("toggle") ||
      !e.target.dataset.id_package
    ) {
      return;
    }

    // 3. Jika benar itu adalah toggle paket, jalankan logikanya
    const checkbox = e.target;
    const id_package = checkbox.dataset.id_package;
    const status = checkbox.checked ? "active" : "inactive";

    console.log("Status: ", status);
    console.log("ID Package: ", id_package);

    const confirmModal = document.querySelector("#confirm-delete-package");
    if (!confirmModal) {
      console.error("Modal tidak ditemukan!");
      return;
    }

    confirmModal.setAttribute("title", `Konfirmasi Status Paket`);
    confirmModal.setAttribute(
      "message",
      status === "active"
        ? "Apakah anda yakin ingin mengaktifkan paket ini?"
        : "Apakah anda yakin ingin menonaktifkan paket ini?",
    );
    confirmModal.setAttribute("color", "warning");
    confirmModal.setAttribute("icon", "warning");
    confirmModal.show();

    const controller = new AbortController();

    const onOkHandler = async () => {
      try {
        const res = await fetch(
          `${config.API_BASE_URL}/provider/packages/${id_package}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              // "Authorization": `Bearer ${token}` // Buka komentar jika backend wajib token
            },
            body: JSON.stringify({ package_status: status }),
            credentials: "include",
          },
        );

        // if (!res.ok) {
        //   const errorData = await res.json();
        //   throw new Error(errorData.message || "Gagal mengubah status paket");
        // }

        const toast = document?.querySelector("#alert-massage-package");
        if (toast) {
          toast.setAttribute("title", "Sukses");
          toast.setAttribute("message", "Status paket berhasil diubah!");
          toast.setAttribute("color", "success");
          toast.show();
        }
      } catch (err) {
        console.error("Network error:", err);
        // Rollback: kembalikan toggle ke posisi semula jika gagal API
        checkbox.checked = !checkbox.checked;

        const toast = document?.querySelector("#alert-massage-package");
        if (toast) {
          toast.setAttribute("title", "Gagal!");
          toast.setAttribute("message", err.message);
          toast.setAttribute("color", "error");
          toast.show();
        }
      }
    };

    const onCancelHandler = () => {
      // Rollback: kembalikan toggle ke posisi semula jika user klik batal
      checkbox.checked = !checkbox.checked;
      controller.abort(); // Bersihkan event listener modal
    };

    confirmModal.addEventListener("onOk", onOkHandler, {
      once: true,
      signal: controller.signal,
    });
    confirmModal.addEventListener("onCancel", onCancelHandler, {
      once: true,
      signal: controller.signal,
    });
  });
};
