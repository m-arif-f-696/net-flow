// ─────────────────────────────────────────────
// notificationController.js
// ─────────────────────────────────────────────
import config from "../../../js/config.js";

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
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
const _statusGroupsReport = [
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
const _cacheReport = {};

const _statusGroupsSchedule = [
  { key: "pending", label: "Menunggu Pembayaran", badgeClass: "badge-warning" },
  { key: "approved", label: "Siap Dipasang", badgeClass: "badge-info" },
  { key: "completed", label: "Selesai", badgeClass: "badge-success" },
];

const _cacheSchedule = {};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initReportFromCustomer = async () => {
  const container = document.getElementById("report-accordion-container");
  if (!container) return;

  // Render skeleton accordion dulu
  _renderSkeletonAccordion(container);

  // Fetch semua status paralel
  await Promise.all(_statusGroupsReport.map((g) => _fetchIssues(g.key)));

  // Render accordion
  _renderAccordionReport(container);

  // Delegasi event untuk semua interaksi
  _bindEventsReport(container);
};

export const initScheduleInstallation = async () => {
  const container = document.getElementById("schedule-accordion-container");
  if (!container) return;

  _renderSkeletonAccordion(container);

  await Promise.all(_statusGroupsSchedule.map((g) => _fetchSchedules(g.key)));

  _renderAccordionSchedule(container);
  _bindEventsSchedule(container);
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
    _cacheReport[status] = json.data ?? [];
  } catch (err) {
    console.error(`Gagal fetch issues ${status}:`, err);
    _cacheReport[status] = [];
  }
}

async function _fetchSchedules(status) {
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/installations?filter=${status}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const json = await res.json();
    _cacheSchedule[status] = json.data ?? [];
  } catch (err) {
    console.error(`Gagal fetch schedules ${status}:`, err);
    _cacheSchedule[status] = [];
  }
}

// ─────────────────────────────────────────────
// RENDER ACCORDION
// ─────────────────────────────────────────────
function _renderAccordionReport(container) {
  container.innerHTML = _statusGroupsReport
    .map((group) => {
      const issues = _cacheReport[group.key] ?? [];
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
function _renderAccordionSchedule(container) {
  container.innerHTML = _statusGroupsSchedule
    .map((group) => {
      const schedules = _cacheSchedule[group.key] ?? [];
      const count = schedules.length;

      return /*html*/ `
      <div class="collapse collapse-arrow join-item border-base-300 border">
        <input type="checkbox" ${group.key === "approved" && count > 0 ? "checked" : ""} />
        <div class="collapse-title font-semibold flex items-center gap-2">
          ${group.label}
          <span class="badge badge-sm ${group.badgeClass} badge-soft font-bold">${count}</span>
        </div>
        <div class="collapse-content text-sm space-y-2 pt-2">
          ${
            count === 0
              ? `<p class="text-base-content/40 text-center py-4">Tidak ada jadwal.</p>`
              : schedules.map((s) => _renderScheduleItem(s, group.key)).join("")
          }
        </div>
      </div>
    `;
    })
    .join("");
}

function _renderScheduleItem(s, status) {
  const date = new Date(s.installation_date + "T00:00:00").toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const timeSlot = s.installation_time?.replace("-", " – ") ?? "—";
  const createdAt = new Date(s.created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBadge =
    {
      pending: "badge-warning",
      approved: "badge-info",
      completed: "badge-success",
    }[status] ?? "badge-ghost";

  return /*html*/ `
    <div class="collapse collapse-plus bg-base-100 border border-base-300 rounded-xl"
      data-schedule-id="${s.id_schedule}" data-status="${status}">
      <input type="radio" name="schedule-accordion-${status}" />
 
      <!-- Title row -->
      <div class="collapse-title font-semibold pr-10">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0">
            <span class="badge badge-sm ${statusBadge} badge-soft shrink-0">${s.name_package}</span>
          </div>
          <span class="text-xs text-base-content/40 font-normal shrink-0">${date}</span>
        </div>
        <p class="text-sm font-bold text-base-content mt-1">${s.customer_name}</p>
      </div>
 
      <!-- Detail content -->
      <div class="collapse-content text-sm space-y-4">
 
        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-3">
 
          <div class="bg-base-200 rounded-xl p-3">
            <p class="text-[10px] text-base-content/50 uppercase tracking-widest font-bold mb-1">Paket</p>
            <p class="font-bold text-base-content text-sm">${s.name_package}</p>
            <p class="text-xs text-base-content/50">${s.speed_mbps} Mbps</p>
          </div>
 
          <div class="bg-base-200 rounded-xl p-3">
            <p class="text-[10px] text-base-content/50 uppercase tracking-widest font-bold mb-1">Slot Waktu</p>
            <p class="font-bold text-base-content text-sm">${timeSlot}</p>
            <p class="text-xs text-base-content/50">${date}</p>
          </div>
 
          <div class="bg-base-200 rounded-xl p-3">
            <p class="text-[10px] text-base-content/50 uppercase tracking-widest font-bold mb-1">No. Telepon</p>
            <a href="tel:${s.customer_phone}"
              class="font-bold text-primary text-sm flex items-center gap-1 hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              ${s.customer_phone}
            </a>
          </div>
 
          <div class="bg-base-200 rounded-xl p-3">
            <p class="text-[10px] text-base-content/50 uppercase tracking-widest font-bold mb-1">Dibuat</p>
            <p class="font-bold text-base-content text-sm">${createdAt}</p>
          </div>
 
        </div>
 
        <!-- Alamat -->
        <div class="bg-base-200 rounded-xl p-3">
          <p class="text-[10px] text-base-content/50 uppercase tracking-widest font-bold mb-1">Alamat Instalasi</p>
          <p class="font-medium text-base-content text-sm leading-relaxed">${s.full_address}</p>
          <a href="https://maps.google.com/?q=${encodeURIComponent(s.full_address)}" target="_blank"
            class="inline-flex items-center gap-1 text-xs text-primary font-bold mt-2 hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Buka di Maps
          </a>
        </div>
 
        ${
          s.additional_message
            ? /*html*/ `
        <div class="bg-warning/5 border border-warning/20 rounded-xl p-3">
          <p class="text-[10px] text-warning uppercase tracking-widest font-bold mb-1">Pesan Tambahan</p>
          <p class="text-base-content/70 text-sm leading-relaxed">${s.additional_message}</p>
        </div>`
            : ""
        }
 
        <!-- Action — hanya saat approved -->
        ${
          status === "approved"
            ? /*html*/ `
        <button data-action="complete" data-id="${s.id_schedule}"
          class="btn btn-success btn-sm w-full rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Tandai Instalasi Selesai
        </button>`
            : ""
        }
 
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// EVENTS — delegasi ke container
// ─────────────────────────────────────────────
function _bindEventsReport(container) {
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
        const issueIndex = _cacheReport[currentStatus]?.findIndex(
          (i) => String(i.id_issue) === String(id),
        );
        if (issueIndex !== -1) {
          const [issue] = _cacheReport[currentStatus].splice(issueIndex, 1);
          issue.status_issue = nextStatus;
          if (!_cacheReport[nextStatus]) _cacheReport[nextStatus] = [];
          _cacheReport[nextStatus].unshift(issue);
        }
        _renderAccordionReport(container);
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
        const issue = _cacheReport[status]?.find(
          (i) => String(i.id_issue) === String(id),
        );
        if (issue) issue.severity = severity;
        _renderAccordionReport(container);
      } else {
        sevBtn.disabled = false;
      }
    }
  });
}

function _bindEventsSchedule(container) {
  container.addEventListener("click", async (e) => {
    const completeBtn = e.target.closest("[data-action='complete']");
    if (!completeBtn) return;

    const id = completeBtn.dataset.id;

    // Konfirmasi
    if (!confirm("Tandai instalasi ini sebagai selesai?")) return;

    completeBtn.disabled = true;
    completeBtn.innerHTML = `<span class="loading loading-spinner loading-xs"></span> Menyimpan...`;

    const ok = await _patchComplete(id);
    if (ok) {
      // Pindahkan dari approved → completed di cache
      const idx = _cacheSchedule["approved"]?.findIndex(
        (s) => String(s.id_schedule) === String(id),
      );
      if (idx !== -1) {
        const [schedule] = _cacheSchedule["approved"].splice(idx, 1);
        schedule.status_schedule = "completed";
        _cacheSchedule["completed"] = _cacheSchedule["completed"] ?? [];
        _cacheSchedule["completed"].unshift(schedule);
      }
      _renderAccordionSchedule(container);
      _showToast("Instalasi berhasil ditandai selesai.", "success");
    } else {
      completeBtn.disabled = false;
      completeBtn.innerHTML = `Tandai Instalasi Selesai`;
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

async function _patchComplete(id) {
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/installations/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return true;
  } catch (err) {
    console.error("Gagal tandai selesai:", err);
    _showToast(err.message ?? "Gagal mengubah status.", "error");
    return false;
  }
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function _renderSkeletonAccordion(container) {
  container.innerHTML = _statusGroupsReport
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
