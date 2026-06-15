import config from "../../../js/config.js";

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initBilling = async () => {
  await Promise.all([
    _loadPendingTransactions(),
    _loadSettledTransactions(),
  ]);
};

// ─────────────────────────────────────────────
// LOAD PENDING
// ─────────────────────────────────────────────
async function _loadPendingTransactions() {
  const section    = document.getElementById("billing-pending-list");
  const totalEl    = document.getElementById("billing-total-due");
  const heroAmount = document.getElementById("billing-hero-amount");
  if (!section) return;

  _renderSkeleton(section, 2);

  try {
    const res  = await fetch(
      `${config.API_BASE_URL}/customer/my-transactions?status=pending`,
      { headers: { "Content-Type": "application/json" } }
    );
    const json = await res.json();
    const data = json.data ?? [];

    // Hitung total yang harus dibayar
    const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalStr = `Rp ${total.toLocaleString("id-ID")}`;

    if (heroAmount) heroAmount.textContent = totalStr;
    if (totalEl)    totalEl.textContent    = totalStr;

    section.innerHTML = "";

    if (!data.length) {
      section.innerHTML = _emptyState("Tidak ada tagihan yang perlu dibayar.", "check_circle");
      return;
    }

    data.forEach((t) => {
      section.insertAdjacentHTML("beforeend", _renderPendingItem(t));
    });

    // Bind tombol bayar
    section.querySelectorAll("[data-action='pay']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        payTransaction(id, btn);
      });
    });

  } catch (err) {
    console.error("Gagal memuat tagihan pending:", err);
    section.innerHTML = _errorState("Gagal memuat tagihan.");
  }
}

// ─────────────────────────────────────────────
// LOAD SETTLEMENT
// ─────────────────────────────────────────────
async function _loadSettledTransactions() {
  const section = document.getElementById("billing-settled-list");
  if (!section) return;

  _renderSkeleton(section, 3);

  try {
    const res  = await fetch(
      `${config.API_BASE_URL}/customer/my-transactions?status=settlement`,
      { headers: { "Content-Type": "application/json" } }
    );
    const json = await res.json();
    const data = json.data ?? [];

    section.innerHTML = "";

    if (!data.length) {
      section.innerHTML = _emptyState("Belum ada transaksi berhasil.", "receipt_long");
      return;
    }

    data.forEach((t) => {
      section.insertAdjacentHTML("beforeend", _renderSettledItem(t));
    });

  } catch (err) {
    console.error("Gagal memuat riwayat transaksi:", err);
    section.innerHTML = _errorState("Gagal memuat riwayat transaksi.");
  }
}

// ─────────────────────────────────────────────
// PAY — placeholder, ganti saat endpoint siap
// ─────────────────────────────────────────────
export const payTransaction = async (idTransaction, btnEl = null) => {
  if (btnEl) {
    btnEl.disabled  = true;
    btnEl.innerHTML = `<span class="loading loading-spinner loading-xs"></span>`;
  }

  try {
    const res  = await fetch(`${config.API_BASE_URL}/customer/pay/${idTransaction}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message ?? "Pembayaran gagal.");

    if (!json.snap_token) {
      throw new Error("Token pembayaran tidak ditemukan.");
    }

    // Panggil Midtrans Snap popup
    window.snap.pay(json.snap_token, {
      onSuccess: (result) => {
        console.log("Pembayaran sukses:", result);
        _showToast("Pembayaran Anda berhasil diproses!", "success");
        setTimeout(() => {
          initBilling(); // Reload list tagihan bulanan
        }, 2000);
      },
      onPending: (result) => {
        console.log("Pembayaran pending:", result);
        _showToast("Silakan selesaikan pembayaran tagihan Anda.", "warning");
        if (btnEl) {
          btnEl.disabled  = false;
          btnEl.innerHTML = "Bayar";
        }
        initBilling();
      },
      onError: (result) => {
        console.error("Pembayaran gagal:", result);
        _showToast("Pembayaran gagal. Silakan coba lagi.", "error");
        if (btnEl) {
          btnEl.disabled  = false;
          btnEl.innerHTML = "Bayar";
        }
      },
      onClose: () => {
        _showToast("Anda menutup halaman pembayaran sebelum selesai.", "warning");
        if (btnEl) {
          btnEl.disabled  = false;
          btnEl.innerHTML = "Bayar";
        }
      },
    });

  } catch (err) {
    console.error("Pay error:", err);
    _showToast(err.message ?? "Gagal memproses pembayaran.", "error");
    if (btnEl) {
      btnEl.disabled  = false;
      btnEl.innerHTML = "Bayar";
    }
  }
};

// ─────────────────────────────────────────────
// RENDER ITEMS
// ─────────────────────────────────────────────
function _renderPendingItem(t) {
  const date = t.created_at
    ? new Date(t.created_at).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const typeLabel = {
    activation: "Aktivasi",
    monthly:    "Bulanan",
    addon:      "Add-on",
  }[t.payment_type] ?? t.payment_type;

  return /*html*/ `
    <div class="flex items-center justify-between bg-base-200 p-4 rounded-2xl border border-warning/20">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center text-warning shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div>
          <p class="font-bold text-base-content text-sm">${t.name_package}</p>
          <p class="text-xs text-base-content/50 mt-0.5">${t.invoice_number} · ${typeLabel}</p>
          <p class="text-xs text-base-content/40">${date} · ${t.provider_name}</p>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right">
          <p class="font-bold text-base-content text-sm">Rp ${Number(t.amount).toLocaleString("id-ID")}</p>
          <span class="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-bold uppercase">Pending</span>
        </div>
        <button
          data-action="pay"
          data-id="${t.id_transaction}"
          class="btn btn-primary btn-sm rounded-xl">
          Bayar
        </button>
      </div>
    </div>
  `;
}

function _renderSettledItem(t) {
  const date = t.paid_at
    ? new Date(t.paid_at).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const typeLabel = {
    activation: "Aktivasi",
    monthly:    "Bulanan",
    addon:      "Add-on",
  }[t.payment_type] ?? t.payment_type;

  return /*html*/ `
    <div class="flex items-center justify-between p-4 rounded-2xl border border-base-300 hover:bg-base-200/50 transition-colors">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div>
          <p class="font-bold text-base-content text-sm">${t.name_package}</p>
          <p class="text-xs text-base-content/50 mt-0.5">${t.invoice_number} · ${typeLabel}</p>
          <p class="text-xs text-base-content/40">${date} · ${t.provider_name}</p>
        </div>
      </div>
      <div class="text-right shrink-0">
        <p class="font-bold text-base-content text-sm">Rp ${Number(t.amount).toLocaleString("id-ID")}</p>
        <span class="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase">Lunas</span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function _renderSkeleton(el, count = 3) {
  el.innerHTML = Array.from({ length: count }).map(() => /*html*/ `
    <div class="flex items-center gap-4 p-4 bg-base-200 rounded-2xl">
      <div class="skeleton w-12 h-12 rounded-2xl shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-40 rounded"></div>
        <div class="skeleton h-3 w-24 rounded"></div>
      </div>
      <div class="skeleton h-6 w-16 rounded-full"></div>
    </div>
  `).join("");
}

function _emptyState(msg, icon = "inbox") {
  return /*html*/ `
    <div class="flex flex-col items-center gap-3 py-10 text-center">
      <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
        <span class="material-symbols-outlined text-base-content/30 text-2xl">${icon}</span>
      </div>
      <p class="text-sm text-base-content/50">${msg}</p>
    </div>
  `;
}

function _errorState(msg) {
  return /*html*/ `
    <div class="flex flex-col items-center gap-3 py-10 text-center">
      <p class="text-sm text-error">${msg}</p>
    </div>
  `;
}

function _showToast(message, type = "info") {
  document.getElementById("billing-toast")?.remove();
  const toast = document.createElement("div");
  toast.id        = "billing-toast";
  toast.className = "toast toast-top toast-center z-[999]";
  toast.innerHTML = /*html*/ `
    <div class="alert ${type === "error" ? "alert-error" : "alert-success"} text-sm font-semibold shadow-lg">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
