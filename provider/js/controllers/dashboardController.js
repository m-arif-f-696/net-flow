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
