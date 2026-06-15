import config from "../../../js/config.js";

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT CONTROLLER
// Dipanggil oleh pages/checkout.js
// Alur:
//  1. Ambil slug dari URL path → fetch data paket
//  2. Render info paket ke DOM
//  3. Inisialisasi Cally calendar + time select
//  4. Handle tombol "Confirm & Pay" → POST ke /customer/checkout → Midtrans Snap
// ─────────────────────────────────────────────────────────────────────────────

export const initCheckout = async () => {
  // ── 1. Ambil slug dari URL path ──────────────────────────────────────────
  const pathParts = location.pathname.split("/").filter(Boolean);
  const slug = pathParts[pathParts.length - 1];

  if (!slug || slug === "checkout.html") {
    _renderError(
      "Paket tidak ditemukan. Silakan kembali dan pilih paket terlebih dahulu.",
    );
    return;
  }

  // ── 2. Fetch data paket ──────────────────────────────────────────────────
  let pkg;
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/customer/packages/${slug}`,
      {
        credentials: "include",
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Gagal memuat data paket.");
    pkg = json.data;
  } catch (err) {
    _renderError(err.message);
    return;
  }

  // ── 3. Render info paket ke DOM ──────────────────────────────────────────
  _renderPackageInfo(pkg);

  // ── 4. Inisialisasi kalender & dropdown waktu ────────────────────────────
  const { getSelectedDate, getSelectedTime } = _initSchedulePicker();

  // ── 5. Handle tombol "Confirm & Pay" ────────────────────────────────────
  const btnPay = document.getElementById("btn-confirm-pay");
  if (!btnPay) return;

  btnPay.addEventListener("click", async () => {
    const selectedDate = getSelectedDate();
    const selectedTime = getSelectedTime();

    // Validasi input jadwal
    if (!selectedDate) {
      _showToast("Pilih tanggal instalasi terlebih dahulu.", "error");
      return;
    }
    if (!selectedTime) {
      _showToast("Pilih slot waktu instalasi terlebih dahulu.", "error");
      return;
    }

    // Ubah tombol ke state loading
    _setButtonLoading(btnPay, true);

    try {
      // POST ke API checkout kita
      const res = await fetch(`${config.API_BASE_URL}/customer/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_package: pkg.id_package,
          installation_date: selectedDate,
          installation_time: selectedTime,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message ?? "Checkout gagal. Silakan coba lagi.");
      }

      const snapToken = json.snap_token;

      // Panggil Midtrans Snap popup
      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log("Pembayaran sukses:", result);
          _showToast("Pembayaran Anda berhasil diproses!", "success");
          setTimeout(() => {
            window.location.href = "/user/home.html"; // Atau /user/index.html sesuai struktur Anda
          }, 2000);
        },
        onPending: (result) => {
          console.log("Pembayaran pending:", result);
          _showToast(
            "Transaksi dibuat. Selesaikan pembayaran sesuai instruksi.",
            "warning",
          );
          setTimeout(() => {
            window.location.href = "/user/home.html";
          }, 3000);
        },
        onError: (result) => {
          console.error("Pembayaran gagal:", result);
          _showToast("Pembayaran gagal. Silakan coba lagi.", "error");
          _setButtonLoading(btnPay, false);
        },
        onClose: () => {
          _showToast(
            "Anda menutup halaman pembayaran sebelum selesai.",
            "warning",
          );
          _setButtonLoading(btnPay, false);
        },
      });
    } catch (err) {
      _showToast(err.message, "error");
      _setButtonLoading(btnPay, false);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — Render info paket ke elemen DOM
// ─────────────────────────────────────────────────────────────────────────────

function _renderPackageInfo(pkg) {
  // Selected Plan section
  const elName = document.getElementById("pkg-name");
  const elSpeed = document.getElementById("pkg-speed");
  const elMonthly = document.getElementById("pkg-monthly");

  // Price Breakdown section
  const elBreakdownName = document.getElementById("pkg-breakdown-name");
  const elBreakdownPrice = document.getElementById("pkg-breakdown-price");
  const elInstallRow = document.getElementById("pkg-install-row");
  const elInstallBadge = document.getElementById("pkg-install-badge");
  const elInstallPrice = document.getElementById("pkg-install-price");
  const elTotal = document.getElementById("pkg-total");

  // Format kecepatan
  const speedLabel =
    pkg.download_speed >= 1000
      ? `${pkg.download_speed / 1000} Gbps`
      : `${pkg.download_speed} ${pkg.download_unit ?? "Mbps"}`;

  // Format harga
  const fmtRp = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  if (elName) elName.textContent = pkg.name_package;
  if (elSpeed) elSpeed.textContent = `${speedLabel} Speed`;

  const monthly = Number(pkg.price_per_month);
  const install = Number(pkg.installation_cost ?? 0);
  const total = monthly + install;

  if (elMonthly)
    elMonthly.innerHTML = `${fmtRp(monthly)}<span class="text-xs text-base-content/50 font-medium">/mo</span>`;

  if (elBreakdownName) elBreakdownName.textContent = pkg.name_package;
  if (elBreakdownPrice) elBreakdownPrice.textContent = fmtRp(monthly);

  // Instalasi — gratis atau berbayar
  if (elInstallRow && elInstallBadge && elInstallPrice) {
    if (install === 0) {
      elInstallBadge.classList.remove("hidden");
      elInstallPrice.classList.add("hidden");
    } else {
      elInstallBadge.classList.add("hidden");
      elInstallPrice.classList.remove("hidden");
      elInstallPrice.textContent = fmtRp(install);
    }
  }

  if (elTotal) elTotal.textContent = fmtRp(total);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — Init Cally calendar + time select, return getter functions
// ─────────────────────────────────────────────────────────────────────────────

function _initSchedulePicker() {
  const calendar = document.getElementById("install-calendar");
  const timeSelect = document.getElementById("install-time");
  const dateLabel = document.getElementById("selected-date-label");
  const summary = document.getElementById("schedule-summary");
  const summaryText = document.getElementById("schedule-summary-text");

  let _selectedDate = "";
  let _selectedTime = "";

  // Set min = besok
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (calendar)
    calendar.setAttribute("min", tomorrow.toISOString().split("T")[0]);

  function _updateSummary() {
    if (!summary || !summaryText) return;
    if (_selectedDate && _selectedTime) {
      const dateObj = new Date(_selectedDate + "T00:00:00");
      const dateStr = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      summaryText.textContent = `${dateStr} · ${_selectedTime.replace("-", " – ")}`;
      summary.classList.remove("hidden");
      summary.classList.add("flex");
    } else {
      summary.classList.add("hidden");
      summary.classList.remove("flex");
    }
  }

  // Cally emits 'change' dengan value "YYYY-MM-DD"
  calendar?.addEventListener("change", (e) => {
    _selectedDate = e.target.value ?? "";

    if (_selectedDate && dateLabel) {
      const dateObj = new Date(_selectedDate + "T00:00:00");
      dateLabel.textContent = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } else if (dateLabel) {
      dateLabel.textContent = "Belum dipilih";
    }

    _updateSummary();
  });

  timeSelect?.addEventListener("change", () => {
    _selectedTime = timeSelect.value ?? "";
    _updateSummary();
  });

  return {
    getSelectedDate: () => _selectedDate,
    getSelectedTime: () => _selectedTime,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — UI Helpers
// ─────────────────────────────────────────────────────────────────────────────

function _setButtonLoading(btn, isLoading) {
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `
      <span class="loading loading-spinner loading-sm"></span>
      Memproses...
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalHtml ?? "Confirm &amp; Pay";
  }
}

function _renderError(msg) {
  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = /*html*/ `
    <div class="flex flex-col items-center justify-center py-32 gap-4 text-center px-6">
      <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <h3 class="font-bold text-base-content text-lg">Gagal Memuat Halaman</h3>
      <p class="text-base-content/50 text-sm max-w-xs">${msg}</p>
      <button onclick="history.back()"
        class="px-6 py-2 rounded-full border border-base-300 text-base-content/60 text-sm font-bold hover:bg-base-200 transition-all">
        Kembali
      </button>
    </div>
  `;
}

function _showToast(msg, type = "info") {
  const colorMap = {
    info: "alert-info",
    error: "alert-error",
    warning: "alert-warning",
    success: "alert-success",
  };

  const toast = document.createElement("div");
  toast.className = "toast toast-top toast-center z-[9999]";
  toast.innerHTML = `
    <div class="alert ${colorMap[type] ?? "alert-info"} shadow-lg text-sm font-semibold max-w-sm">
      <span>${msg}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
