import config from "../../../js/config.js";
import { getAreaName } from "../../../js/locationController.js";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let _currentFilter = "all";
let _currentPage = 1;
let _limit = 10;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initCustomer = async () => {
  console.log("Memulai load data...");
  await Promise.all([_loadSummary(), _loadCustomers()]);
  console.log("Data selesai dimuat.");

  _bindFilterTabs();
  _bindPagination();

  console.log("Mencoba binding table actions...");
  _bindTableActions();
  console.log("Semua binding selesai!");
};

// ─────────────────────────────────────────────
// LOAD SUMMARY (stat cards)
// ─────────────────────────────────────────────
async function _loadSummary() {
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/customers/summary`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await res.json();
    const s = json.summary ?? {};

    _setText("stat-active", s.active ?? 0);
    _setText("stat-suspended", s.suspended ?? 0);
    _setText("stat-terminated", s.terminated ?? 0);
  } catch (err) {
    console.error("Gagal memuat summary:", err);
  }
}

// ─────────────────────────────────────────────
// LOAD CUSTOMERS (table)
// ─────────────────────────────────────────────
async function _loadCustomers() {
  const tbody = document.getElementById("customer-tbody");
  const info = document.getElementById("pagination-info");
  if (!tbody) return;

  _renderTableSkeleton(tbody);

  const params = new URLSearchParams({ limit: _limit, page: _currentPage });
  if (_currentFilter !== "all") params.set("filter", _currentFilter);

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/customers?${params}`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await res.json();

    const customers = json.data ?? [];
    const pagination = json.pagination ?? {};

    tbody.innerHTML = "";

    if (!customers.length) {
      tbody.innerHTML = /*html*/ `
        <tr>
          <td colspan="5" class="px-6 py-16 text-center text-base-content/40 text-sm">
            Tidak ada pelanggan ditemukan.
          </td>
        </tr>
      `;
      _renderPaginationButtons(pagination);
      return;
    }

    customers.forEach((c) => {
      const row = document.createElement("tr", { is: "customer-row" });
      row.setAttribute("name", c.full_name);
      row.setAttribute("status", _mapStatus(c.status_subscription));
      row.setAttribute("customer-id", c.subscriber_id ?? "—");
      row.setAttribute("address", c.address ?? "—");
      row.setAttribute("plan", c.name_package ?? "—");
      row.setAttribute("speed", ""); // belum ada di response
      row.setAttribute(
        "img",
        c.photo_profile ? `${config.API_BASE_URL}/${c.photo_profile}` : "",
      );
      // Simpan id asli untuk aksi view/edit
      row.dataset.customerId = c.id_customer;
      tbody.appendChild(row);
    });

    // Update info teks & pagination buttons
    _updatePaginationInfo(info, pagination);
    _renderPaginationButtons(pagination);
  } catch (err) {
    tbody.innerHTML = /*html*/ `
      <tr>
        <td colspan="5" class="px-6 py-16 text-center text-error text-sm">
          Gagal memuat data: ${err.message}
        </td>
      </tr>
    `;
  }
}

// ─────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────
function _bindFilterTabs() {
  const tabs = document.querySelectorAll("[data-customer-filter]");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      _currentFilter = btn.dataset.customerFilter;
      _currentPage = 1;

      // Update active style
      tabs.forEach((b) => {
        const isActive = b.dataset.customerFilter === _currentFilter;
        b.className = isActive
          ? "px-5 py-2 rounded-full bg-primary text-primary-content font-semibold text-sm shadow-md transition-all active:scale-95"
          : "px-5 py-2 rounded-full hover:bg-base-100 text-base-content/70 font-semibold text-sm transition-all active:scale-95";
      });

      _loadCustomers();
    });
  });
}

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────
function _bindPagination() {
  // Delegasi — tombol prev/next/angka di-render ulang setiap load
  document
    .getElementById("pagination-wrapper")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      _currentPage = Number(btn.dataset.page);
      _loadCustomers();
    });
}

function _updatePaginationInfo(el, pagination) {
  if (!el) return;
  const { total_data = 0, current_page = 1, limit = 10 } = pagination;
  const from = (current_page - 1) * limit + 1;
  const to = Math.min(current_page * limit, total_data);
  el.innerHTML = `Showing <span class="text-base-content font-bold">${from}-${to}</span> of <span class="text-base-content font-bold">${total_data}</span> customers`;
}

function _renderPaginationButtons(pagination) {
  const wrapper = document.getElementById("pagination-wrapper");
  if (!wrapper) return;

  const { total_pages = 1, current_page = 1 } = pagination;

  // Buat array halaman yang ditampilkan (dengan ellipsis)
  const pages = _buildPageRange(current_page, total_pages);

  wrapper.innerHTML = /*html*/ `
    <button data-page="${current_page - 1}"
      class="p-2 rounded-lg border border-neutral/10 bg-base-100 hover:bg-base-200 disabled:opacity-40"
      ${current_page === 1 ? "disabled" : ""}>
      <span class="material-symbols-outlined text-sm">chevron_left</span>
    </button>

    ${pages
      .map((p) =>
        p === "..."
          ? `<span class="text-base-content/40 px-1">...</span>`
          : /*html*/ `
          <button data-page="${p}"
            class="w-8 h-8 rounded-lg text-xs font-bold transition-colors
            ${
              p === current_page
                ? "bg-primary text-primary-content"
                : "hover:bg-base-200 text-base-content/70"
            }">
            ${p}
          </button>`,
      )
      .join("")}

    <button data-page="${current_page + 1}"
      class="p-2 rounded-lg border border-neutral/10 bg-base-100 hover:bg-base-200 disabled:opacity-40"
      ${current_page === total_pages ? "disabled" : ""}>
      <span class="material-symbols-outlined text-sm">chevron_right</span>
    </button>
  `;
}

function _buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}

// ─────────────────────────────────────────────
// ROW ACTION BUTTONS
// ─────────────────────────────────────────────
function _bindTableActions() {
  const tbody = document.getElementById("customer-tbody");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-action='view']");
    const editBtn = e.target.closest("[data-action='edit']");

    if (viewBtn) {
      const id = viewBtn.closest("tr").dataset.customerId;
      _openCustomerModal(id);
    }

    if (editBtn) {
      const id = editBtn.closest("tr").dataset.customerId;
      window.location.href = `customer-edit.html?id=${id}`;
    }
  });
}

// ─────────────────────────────────────────────
// MODAL DETAIL
// ─────────────────────────────────────────────
async function _openCustomerModal(id) {
  const modal = document.getElementById("modal-customer-detail");
  const loading = document.getElementById("modal-loading");
  const content = document.getElementById("modal-content");
  const error = document.getElementById("modal-error");

  if (!modal) return;

  // Reset state → tampilkan loading
  loading.classList.remove("hidden");
  content.classList.add("hidden");
  error.classList.add("hidden");
  modal.showModal();

  try {
    const res = await fetch(`${config.API_BASE_URL}/provider/customers/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Gagal memuat detail.");

    const c = json.data;

    const areaCode = c.area_code;

    const areaName = await getAreaName(areaCode);
    const province = areaName.province.nama;
    const regency = areaName.regencies.nama;
    const district = areaName.districts.nama;
    const village = areaName.villages.nama;

    // Foto profil
    const photo = document.getElementById("modal-photo");
    photo.src = c.photo_profile ? `${config.BASE_URL}/${c.photo_profile}` : "";
    photo.alt = c.full_name;

    // Teks fields
    _setModalText("modal-name", c.full_name);
    _setModalText("modal-subscriber-id", c.subscriber_id ?? "—");
    _setModalText("modal-package", c.name_package ?? "—");
    _setModalText("modal-nik", c.nik ?? "—");
    _setModalText("modal-phone", c.phone ?? "—");
    _setModalText("modal-area", c.area_code ?? "—");
    _setModalText("modal-province", province ?? "—");
    _setModalText("modal-regency", regency ?? "—");
    _setModalText("modal-district", district ?? "—");
    _setModalText("modal-village", village ?? "—");
    _setModalText("modal-address", c.address ?? "—");
    _setModalText("modal-gender", c.gender === "L" ? "Laki-laki" : "Perempuan");
    _setModalText(
      "modal-created",
      new Date(c.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );

    // Status badge
    const badge = document.getElementById("modal-status-badge");
    const statusMap = {
      active: { text: "Active", cls: "badge-success" },
      suspended: { text: "Suspended", cls: "badge-warning" },
      terminated: { text: "Terminated", cls: "badge-error" },
    };
    const s = statusMap[c.status_subscription?.toLowerCase()] ?? {
      text: c.status_subscription,
      cls: "badge-ghost",
    };
    badge.textContent = s.text;
    badge.className = `badge badge-sm font-bold ${s.cls}`;

    // Link edit
    document.getElementById("modal-edit-link").href =
      `customer-edit.html?id=${c.id_customer}`;

    // Tampilkan content
    loading.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (err) {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
    console.error("Modal error:", err);
  }
}

function _setModalText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function _mapStatus(status) {
  const map = {
    active: "Active",
    suspended: "Suspended",
    terminated: "Terminated",
  };
  return map[status?.toLowerCase()] ?? status ?? "—";
}

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = Number(value).toLocaleString("id-ID");
}

function _renderTableSkeleton(tbody) {
  tbody.innerHTML = Array.from({ length: 5 })
    .map(
      () => /*html*/ `
    <tr>
      <td class="px-6 py-5"><div class="skeleton h-4 w-32 rounded"></div></td>
      <td class="px-6 py-5"><div class="skeleton h-4 w-20 rounded"></div></td>
      <td class="px-6 py-5"><div class="skeleton h-4 w-40 rounded"></div></td>
      <td class="px-6 py-5"><div class="skeleton h-4 w-28 rounded"></div></td>
      <td class="px-6 py-5"><div class="skeleton h-4 w-16 rounded ml-auto"></div></td>
    </tr>
  `,
    )
    .join("");
}
