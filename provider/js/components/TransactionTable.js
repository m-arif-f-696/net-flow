export default class TransactionTable extends HTMLElement {
  connectedCallback() {
    this.currentFilter = "all";
    this.currentPage = 1;
    this._onPageChange = null;
    this._onFilterChange = null;
    this.transactions = [];
    this.pagination = {
      total_count: 0,
      per_page: 10,
      current_page: 1,
      total_pages: 1,
    };
    this.render();
  }

  setLoading(val) {
    if (!val) return;
    const tbody = this.querySelector("#table-body");
    if (!tbody) return;

    tbody.style.transition = "opacity 0.15s ease";
    tbody.style.opacity = "0";

    setTimeout(() => {
      tbody.innerHTML = /*html*/ `
      <tr>
        <td colspan="6" class="py-16">
          <div class="flex items-center justify-center w-full">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>
        </td>
      </tr>
    `;
      requestAnimationFrame(() => {
        tbody.style.opacity = "1";
      });
    }, 150);
  }

  setData({ transactions, pagination, onPageChange, onFilterChange }) {
    this.transactions = transactions ?? [];
    this.pagination = pagination ?? {};
    this._onPageChange = onPageChange ?? null;
    this._onFilterChange = onFilterChange ?? null;
    this.renderContent();
  }

  // ─── Status badge ────────────────────────────
  statusBadge(status) {
    const map = {
      settlement: { cls: "bg-success/10 text-success", label: "Sukses" },
      pending: { cls: "bg-warning/10 text-warning", label: "Pending" },
      expire: { cls: "bg-error/10 text-error", label: "Kadaluarsa" },
      cancel: { cls: "bg-base-300 text-base-content/50", label: "Batal" },
    };
    const s = map[status?.toLowerCase()] ?? {
      cls: "bg-base-300 text-base-content/50",
      label: status ?? "—",
    };
    return /*html*/ `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-tighter ${s.cls}">
        ${s.label}
      </span>
    `;
  }

  // ─── Rows ─────────────────────────────────────
  renderRows() {
    if (!this.transactions.length) {
      return /*html*/ `
        <tr>
          <td colspan="6" class="px-6 py-16 text-center text-base-content/40 text-sm">
            Tidak ada transaksi ditemukan.
          </td>
        </tr>
      `;
    }

    return this.transactions
      .map((t) => {
        const paidAt = t.paid_at
          ? new Date(t.paid_at).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";

        const paymentTypeLabel =
          {
            activation: "Aktivasi",
            monthly: "Bulanan",
            addon: "Add-on",
          }[t.payment_type] ?? t.payment_type;

        return /*html*/ `
        <tr class="hover:bg-base-200/50 transition-colors duration-150">
          <td class="px-6 py-4">
            <p class="font-medium text-base-content text-xs">${t.invoice_number}</p>
            <p class="text-[10px] text-base-content/40 uppercase tracking-wider mt-0.5">${paymentTypeLabel}</p>
          </td>
          <td class="px-6 py-4 text-base-content/60 text-sm">${t.customer_name}</td>
          <td class="px-6 py-4 text-base-content/60 text-sm">${t.package_name}</td>
          <td class="px-6 py-4 text-base-content/60 text-sm">${paidAt}</td>
          <td class="px-6 py-4 font-medium text-right text-sm">
            Rp ${Number(t.amount).toLocaleString("id-ID")}
          </td>
          <td class="px-6 py-4 text-center">${this.statusBadge(t.payment_status)}</td>
        </tr>
      `;
      })
      .join("");
  }

  // ─── Pagination buttons ───────────────────────
  renderPaginationButtons() {
    const { current_page = 1, total_pages = 1 } = this.pagination;
    let buttons = "";
    for (let i = 1; i <= total_pages; i++) {
      buttons += /*html*/ `
        <button data-page="${i}"
          class="w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors
          ${i === current_page ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content"}">
          ${i}
        </button>
      `;
    }
    return buttons;
  }

  // ─── Filter tab ───────────────────────────────
  filterTab(value, label) {
    const active = this.currentFilter === value;
    return /*html*/ `
      <button data-filter="${value}"
        class="px-4 py-1.5 text-xs font-bold rounded-md transition-colors
        ${active ? "bg-base-100 text-primary shadow-sm" : "text-base-content/50 hover:text-primary"}">
        ${label}
      </button>
    `;
  }

  // ─── Render shell (dipanggil sekali di connectedCallback) ─
  render() {
    this.innerHTML = /*html*/ `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h4 class="text-xl font-bold">Transaksi</h4>
          <div class="flex bg-base-200 rounded-lg p-1" id="filter-tabs">
            ${this.filterTab("all", "Semua")}
            ${this.filterTab("pending", "Pending")}
            ${this.filterTab("settlement", "Sukses")}
            ${this.filterTab("expire", "Kadaluarsa")}
            ${this.filterTab("cancel", "Batal")}
          </div>
        </div>

        <div class="bg-base-100 rounded-xl border border-neutral/10 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-base-200 text-base-content/50 border-b border-neutral/10">
                <tr>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Invoice</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Pelanggan</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Paket</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tgl Bayar</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody id="table-body" class="divide-y divide-neutral/10" style="min-height: 300px;">
                <tr>
                  <td colspan="6" class="px-6 py-16 text-center">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div id="pagination-footer"
            class="px-6 py-4 border-t border-neutral/10 flex items-center justify-between text-sm text-base-content/50 font-medium">
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  // ─── Render content (rows + pagination) ──────
  renderContent() {
    const tbody = this.querySelector("#table-body");
    if (!tbody) return;

    tbody.style.transition = "opacity 0.15s ease";
    tbody.style.opacity = "0";

    setTimeout(() => {
      const {
        total_count = 0,
        per_page = 10,
        current_page = 1,
        total_pages = 1,
      } = this.pagination;
      const from = total_count === 0 ? 0 : (current_page - 1) * per_page + 1;
      const to = Math.min(current_page * per_page, total_count);

      tbody.innerHTML = this.renderRows();

      this.querySelector("#pagination-footer").innerHTML = /*html*/ `
      <span>Menampilkan ${from}–${to} dari ${total_count} transaksi</span>
      <div class="flex gap-1">
        <button id="btn-prev"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors
          ${current_page === 1 ? "opacity-30 pointer-events-none" : ""}">
          <span class="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        ${this.renderPaginationButtons()}
        <button id="btn-next"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors
          ${current_page === total_pages ? "opacity-30 pointer-events-none" : ""}">
          <span class="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    `;

      // ← INI yang hilang — fade in setelah konten diganti
      requestAnimationFrame(() => {
        tbody.style.opacity = "1";
      });
    }, 150);
  }

  // ─── Bind events ──────────────────────────────
  bindEvents() {
    // Filter tabs
    this.querySelector("#filter-tabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      this.currentFilter = btn.dataset.filter;
      this.currentPage = 1;

      this.querySelectorAll("[data-filter]").forEach((b) => {
        const isActive = b.dataset.filter === this.currentFilter;
        b.className = `px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
          isActive
            ? "bg-base-100 text-primary shadow-sm"
            : "text-base-content/50 hover:text-primary"
        }`;
      });

      this._onFilterChange?.(this.currentFilter);
    });

    this.addEventListener("click", (e) => {
      // Prev
      if (e.target.closest("#btn-prev")) {
        const { current_page = 1 } = this.pagination;
        if (current_page > 1) this._onPageChange?.(current_page - 1);
        return;
      }
      // Next
      if (e.target.closest("#btn-next")) {
        const { current_page = 1, total_pages = 1 } = this.pagination;
        if (current_page < total_pages) this._onPageChange?.(current_page + 1);
        return;
      }
      // Page number
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn) {
        this._onPageChange?.(Number(pageBtn.dataset.page));
      }
    });
  }
}

customElements.define("transaction-table", TransactionTable);
