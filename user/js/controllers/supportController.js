// user/js/controllers/supportController.js

import config from "../../../js/config.js";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — dipanggil dari pages/support.js
// ─────────────────────────────────────────────────────────────────────────────
export const initSupport = async () => {
  const page = document.querySelector("support-page");
  if (!page) return;

  // Muat data awal secara paralel
  await Promise.all([
    _loadIssues(page),
    _loadSubscriptions(page),
  ]);

  // Filter berubah → reload
  page.addEventListener("filter-change", (e) => {
    _loadIssues(page, e.detail.status);
  });

  // User submit laporan baru
  page.addEventListener("submit-report", (e) => {
    _submitIssue(page, e.detail);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ─────────────────────────────────────────────────────────────────────────────

const _loadSubscriptions = async (page) => {
  try {
    const res = await fetch(`${config.API_BASE_URL}/customer/my-subscription`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    page.setSubscriptions(json.data ?? []);
  } catch (err) {
    console.error("[supportController] Gagal memuat langganan:", err);
    page.setSubscriptions([]);
  }
};

/**
 * GET /issues            → semua laporan milik customer (dari cookie sesi)
 * GET /issues?status=... → filter berdasarkan status
 */
const _loadIssues = async (page, status = "all") => {
  page.showSkeleton();

  try {
    const query = status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`${config.API_BASE_URL}/issues${query}`, {
      credentials: "include", // kirim httpOnly cookie secara otomatis
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    page.renderIssues(json.data ?? []);
  } catch (err) {
    console.error("[supportController] Gagal memuat laporan:", err);
    page.renderIssues([]);
    _showToast("Gagal memuat riwayat laporan.", "error");
  }
};

/**
 * POST /issues → buat laporan baru
 * id_provider & id_customer diambil server dari cookie sesi, tidak dikirim client
 */
const _submitIssue = async (page, payload) => {
  page.setSubmitLoading(true);

  try {
    const res = await fetch(`${config.API_BASE_URL}/issues`, {
      method: "POST",
      credentials: "include", // httpOnly cookie
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_subscription: payload.id_subscription,
        title_issue: payload.title_issue,
        description_issue: payload.description_issue,
        severity: payload.severity,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message ?? `HTTP ${res.status}`);
    }

    page.closeModal();
    _showToast("Laporan berhasil dikirim!", "success");

    // Reload list agar tiket baru langsung muncul
    await _loadIssues(page);
  } catch (err) {
    console.error("[supportController] Gagal mengirim laporan:", err);
    _showToast(err.message ?? "Gagal mengirim laporan.", "error");
  } finally {
    page.setSubmitLoading(false);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST HELPER
// ─────────────────────────────────────────────────────────────────────────────
const _showToast = (message, type = "info") => {
  const typeClass =
    {
      success: "alert-success",
      error: "alert-error",
      info: "alert-info",
      warning: "alert-warning",
    }[type] ?? "alert-info";

  // Hapus toast lama bila masih tampil
  document
    .querySelectorAll(".toast[data-support-toast]")
    .forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.setAttribute("data-support-toast", "");
  toast.className = "toast toast-top toast-end z-[9999]";
  toast.innerHTML = /* html */ `
    <div class="alert ${typeClass} shadow-lg rounded-2xl text-sm">
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};
