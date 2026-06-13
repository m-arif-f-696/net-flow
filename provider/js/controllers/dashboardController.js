// ─────────────────────────────────────────────
// notificationController.js
// ─────────────────────────────────────────────
import config from "../../../js/config.js";

export const initNotification = async () => {
  const container = document.getElementById("notification-list");
  const badge = document.getElementById("notif-unread-badge");
  if (!container) return;

  await _loadNotifications(container, badge);

  // Tombol refresh
  document
    .getElementById("btn-notif-refresh")
    ?.addEventListener("click", () => {
      _loadNotifications(container, badge);
    });

  // Tombol show more
  document.getElementById("btn-notif-more")?.addEventListener("click", () => {
    const current = container.querySelectorAll("notification-item").length;
    _loadNotifications(container, badge, current);
  });

  // Event mark-read dari NotificationItem
  container.addEventListener("mark-read", async (e) => {
    const { id } = e.detail;
    console.log(id);
    await _markRead(id);
    _loadNotifications(container, badge);
  });
};

// Fungsi utama untuk mengambil dan menampilkan statistik
export const initDashboardStats = async () => {
  try {
    // Ganti URL ini dengan URL API Anda yang sebenarnya (atau gunakan config.API_BASE_URL)
    const response = await fetch(`${config.API_BASE_URL}/provider/report`, {
      method: "GET",
      // Jangan lupa masukkan header Authorization jika API Anda menggunakan JWT Token
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    const result = await response.json();

    // Pastikan API membalas dengan status 200/success
    if (result.code == "200") {
      const data = result.data;

      // Inject data ke dalam HTML berdasarkan ID
      document.getElementById("stat-customers").textContent =
        data.total_active_customers;
      document.getElementById("stat-revenue").textContent = _formatRupiah(
        data.total_revenue,
      );
      document.getElementById("stat-packages").textContent =
        data.total_packages;
      document.getElementById("stat-issues").textContent = data.total_issues;
    } else {
      console.error("Gagal memuat data:", result.message);
      // Opsional: Tampilkan error di UI
    }
  } catch (error) {
    console.error("Terjadi kesalahan saat fetch data:", error);
  }
};

export const initDashboardTopPackage = async () => {
  try {
    const response = await fetch(
      `${config.API_BASE_URL}/provider/packages?revenue=3`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (result.code == "200") {
      const data = result.data;

      const rowPackage = data.map((item) => {
        return /*html*/ `
          <tr is="table-row-package" 
          name="${item.name_package}" 
          type="${item.type_package}" 
          revenue="${_formatRupiah(item.revenue)}"
          speed-download="${item.download_speed} ${item.download_unit}"
          speed-upload="${item.upload_speed} ${item.upload_unit}"
          sales="${item.sales}"
          ></tr>
        `;
      });

      document.getElementById("top-package-loading").classList.add("hidden");
      document.getElementById("top-package-table").innerHTML =
        rowPackage.join("");
    } else {
      document.getElementById("top-package-loading").classList.add("hidden");
      document.getElementById("top-package-table").innerHTML =
        "<tr><td colspan='5' class='text-center'>Tidak ada data</td></tr>";
      console.error("Gagal memuat data:", result.message);
    }
  } catch (error) {
    document.getElementById("top-package-loading").classList.add("hidden");
    document.getElementById("top-package-table").innerHTML =
      "<tr><td colspan='5' class='text-center'>Tidak ada data</td></tr>";
    console.error("Terjadi kesalahan saat fetch data:", error);
  }
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const _statusGroups = [
  { key: "open", label: "Belum Ditangani", badgeClass: "badge-error" },
  {
    key: "investigating",
    label: "Dalam Investigasi",
    badgeClass: "badge-warning",
  },
  { key: "progress", label: "Dalam Proses", badgeClass: "badge-info" },
  { key: "resolved", label: "Selesai", badgeClass: "badge-success" },
];

// Cache data per status
const _cache = {};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initReportFromCustomer = async () => {
  const container = document.getElementById("report-accordion-container");
  if (!container) return;

  // Render skeleton accordion dulu
  _renderSkeletonAccordion(container);

  // Fetch semua status paralel
  await Promise.all(_statusGroups.map((g) => _fetchIssues(g.key)));

  // Render accordion
  _renderAccordion(container);

  // Delegasi event untuk semua interaksi
  _bindEvents(container);
};

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────
async function _fetchIssues(status) {
  try {
    const res = await fetch(`${config.API_BASE_URL}/issues?status=${status}`, {
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    _cache[status] = json.data ?? [];
  } catch (err) {
    console.error(`Gagal fetch issues ${status}:`, err);
    _cache[status] = [];
  }
}

// ─────────────────────────────────────────────
// RENDER ACCORDION
// ─────────────────────────────────────────────
function _renderAccordion(container) {
  container.innerHTML = _statusGroups
    .map((group) => {
      const issues = _cache[group.key] ?? [];
      const count = issues.length;

      return /*html*/ `
      <div class="collapse collapse-arrow join-item border-base-300 border">
        <input type="checkbox" ${group.key === "open" && count > 0 ? "checked" : ""} />
        <div class="collapse-title font-semibold flex items-center gap-2">
          ${group.label}
          <span class="badge badge-sm ${group.badgeClass} badge-soft font-bold">${count}</span>
        </div>
        <div class="collapse-content text-sm space-y-2 pt-2">
          ${
            count === 0
              ? `<p class="text-base-content/40 text-center py-4">Tidak ada laporan.</p>`
              : issues
                  .map((issue) => _renderIssueItem(issue, group.key))
                  .join("")
          }
        </div>
      </div>
    `;
    })
    .join("");
}

function _renderIssueItem(issue, status) {
  const severityMap = {
    low: { label: "Rendah", cls: "badge-primary" },
    medium: { label: "Sedang", cls: "badge-warning" },
    high: { label: "Tinggi", cls: "badge-error" },
  };
  const sev = severityMap[issue.severity] ?? severityMap.low;

  const time = new Date(issue.created_at).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return /*html*/ `
    <div class="collapse collapse-plus bg-base-100 border border-base-300 rounded-xl"
      data-issue-id="${issue.id_issue}" data-status="${status}">
      <input type="radio" name="issue-accordion-${status}" />

      <!-- Title row -->
      <div class="collapse-title font-semibold flex justify-between items-center gap-2 pr-10">
        <div class="flex items-center gap-2 min-w-0">
          <span class="badge badge-sm ${sev.cls} badge-soft shrink-0">${sev.label}</span>
          <span class="truncate">${issue.title_issue}</span>
        </div>
        <span class="text-xs text-base-content/40 font-normal shrink-0">${time}</span>
      </div>

      <!-- Content -->
      <div class="collapse-content text-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-base-content/50">Dari</span>
          <span class="badge badge-soft badge-primary">${issue.customer_name}</span>
        </div>
        <p class="text-base-content/70 leading-relaxed mb-4">${issue.description_issue}</p>

        <!-- Actions berdasarkan status -->
        ${_renderActions(issue, status)}
      </div>
    </div>
  `;
}

function _renderActions(issue, status) {
  if (status === "resolved") return "";

  const nextStatus = {
    open: "investigating",
    investigating: "progress",
    progress: "resolved",
  };
  const nextLabel = {
    open: "Mulai Investigasi",
    investigating: "Tandai Dalam Proses",
    progress: "Tandai Selesai",
  };
  const nextIcon = {
    open: "search",
    investigating: "build",
    progress: "check_circle",
  };

  return /*html*/ `
    <div class="space-y-3">

      ${
        status === "investigating"
          ? /*html*/ `
      <!-- Severity selector — hanya saat investigating -->
      <div>
        <p class="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-2">Tingkat Keparahan</p>
        <div class="flex gap-2 flex-wrap">
          <button data-action="severity" data-id="${issue.id_issue}" data-severity="low"
            class="btn btn-sm btn-soft rounded-lg ${issue.severity === "low" ? "btn-primary" : "btn-ghost"}">
            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
            Rendah
          </button>
          <button data-action="severity" data-id="${issue.id_issue}" data-severity="medium"
            class="btn btn-sm btn-soft rounded-lg ${issue.severity === "medium" ? "btn-warning" : "btn-ghost"}">
            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
            Sedang
          </button>
          <button data-action="severity" data-id="${issue.id_issue}" data-severity="high"
            class="btn btn-sm btn-soft rounded-lg ${issue.severity === "high" ? "btn-error" : "btn-ghost"}">
            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
            Tinggi
          </button>
        </div>
      </div>`
          : ""
      }

      <!-- Ubah status -->
      <button data-action="status" data-id="${issue.id_issue}"
        data-next-status="${nextStatus[status]}" data-current-status="${status}"
        class="btn btn-sm btn-soft btn-primary rounded-lg">
        <span class="material-symbols-outlined text-sm">${nextIcon[status]}</span>
        ${nextLabel[status]}
      </button>

    </div>
  `;
}

// ─────────────────────────────────────────────
// EVENTS — delegasi ke container
// ─────────────────────────────────────────────
function _bindEvents(container) {
  container.addEventListener("click", async (e) => {
    // ── Ubah status ──
    const statusBtn = e.target.closest("[data-action='status']");
    if (statusBtn) {
      const id = statusBtn.dataset.id;
      const nextStatus = statusBtn.dataset.nextStatus;
      const currentStatus = statusBtn.dataset.currentStatus;

      statusBtn.disabled = true;
      statusBtn.innerHTML = `<span class="loading loading-spinner loading-xs"></span>`;

      const ok = await _patchStatus(id, nextStatus);
      if (ok) {
        // Pindahkan issue dari cache lama ke cache baru
        const issueIndex = _cache[currentStatus]?.findIndex(
          (i) => String(i.id_issue) === String(id),
        );
        if (issueIndex !== -1) {
          const [issue] = _cache[currentStatus].splice(issueIndex, 1);
          issue.status_issue = nextStatus;
          if (!_cache[nextStatus]) _cache[nextStatus] = [];
          _cache[nextStatus].unshift(issue);
        }
        _renderAccordion(container);
      } else {
        statusBtn.disabled = false;
        statusBtn.innerHTML = `<span class="material-symbols-outlined text-sm">error</span> Gagal`;
      }
      return;
    }

    // ── Ubah severity ──
    const sevBtn = e.target.closest("[data-action='severity']");
    if (sevBtn) {
      const id = sevBtn.dataset.id;
      const severity = sevBtn.dataset.severity;
      const status = sevBtn.closest("[data-status]")?.dataset.status;

      sevBtn.disabled = true;

      const ok = await _patchSeverity(id, severity);
      if (ok) {
        // Update cache
        const issue = _cache[status]?.find(
          (i) => String(i.id_issue) === String(id),
        );
        if (issue) issue.severity = severity;
        _renderAccordion(container);
      } else {
        sevBtn.disabled = false;
      }
    }
  });
}

// ─────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────
async function _patchStatus(id, status) {
  try {
    const res = await fetch(`${config.API_BASE_URL}/issues/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_issue: status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return true;
  } catch (err) {
    console.error("Gagal ubah status:", err);
    _showToast(err.message ?? "Gagal mengubah status.", "error");
    return false;
  }
}

async function _patchSeverity(id, severity) {
  try {
    const res = await fetch(`${config.API_BASE_URL}/issues/${id}/severity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ severity }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return true;
  } catch (err) {
    console.error("Gagal ubah severity:", err);
    _showToast(err.message ?? "Gagal mengubah keparahan.", "error");
    return false;
  }
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function _renderSkeletonAccordion(container) {
  container.innerHTML = _statusGroups
    .map(
      (g) => /*html*/ `
    <div class="collapse collapse-arrow join-item border-base-300 border">
      <input type="checkbox" />
      <div class="collapse-title font-semibold flex items-center gap-2">
        ${g.label}
        <span class="skeleton w-6 h-4 rounded-full"></span>
      </div>
    </div>
  `,
    )
    .join("");
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function _showToast(message, type = "info") {
  document.getElementById("report-toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "report-toast";
  toast.className = "toast toast-top toast-end z-[999]";
  toast.innerHTML = /*html*/ `
    <div class="alert ${type === "error" ? "alert-error" : "alert-success"} text-sm font-semibold shadow-lg">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function _loadNotifications(container, badge, offset = 0) {
  if (offset === 0) {
    container.innerHTML = `
      <div class="p-8 flex justify-center">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>
    `;
  }

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/notifications?limit=10&offset=${offset}`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await res.json();

    if (!res.ok) throw new Error(json.message ?? "Gagal memuat notifikasi.");

    const notifications = json.data ?? [];
    const unreadCount = json.unread_count ?? 0;

    // Update badge unread
    if (badge) {
      badge.textContent = unreadCount > 0 ? unreadCount : "";
      badge.classList.toggle("hidden", unreadCount === 0);
    }

    if (offset === 0) container.innerHTML = "";

    if (!notifications.length && offset === 0) {
      container.innerHTML = `
        <div class="p-12 flex flex-col items-center gap-3 text-center">
          <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
            <span class="material-symbols-outlined text-base-content/30 text-2xl">notifications_off</span>
          </div>
          <p class="text-sm text-base-content/50">Tidak ada notifikasi.</p>
        </div>
      `;
      return;
    }

    // Render setiap notifikasi sebagai accordion item
    notifications.forEach((notif) => {
      const el = document.createElement("notification-item");
      el.setAttribute("notif-id", notif.id_notification);
      el.setAttribute("title", notif.notification_title);
      el.setAttribute("message", notif.notification_message);
      el.setAttribute("category", notif.notification_category);
      el.setAttribute("is-read", notif.is_read ? "1" : "0");
      el.setAttribute("time", notif.created_at);
      el.setAttribute("accordion-name", "notif-accordion");
      container.appendChild(el);
    });
  } catch (err) {
    container.innerHTML = `
      <div class="p-8 text-center text-sm text-error">${err.message}</div>
    `;
  }
}

async function _markRead(id) {
  try {
    await fetch(`${config.API_BASE_URL}/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gagal tandai dibaca:", err);
  }
}

// Fungsi untuk memformat angka menjadi Rupiah
const _formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};
