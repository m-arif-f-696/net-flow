export default class TransactionTable extends HTMLElement {
  connectedCallback() {
    this.currentFilter = "all";
    this.currentPage = 1;
    this.transactions = [];
    this.pagination = { total: 0, per_page: 5, current_page: 1, total_pages: 1 };
    this.render();
    this.loadData();
  }

  async loadData() {
    const src = this.getAttribute("src");
    if (!src) return;

    try {
      const res = await fetch(`${src}?page=${this.currentPage}&filter=${this.currentFilter}`);
      const data = await res.json();
      this.transactions = data.transactions;
      this.pagination = data.pagination;
    } catch (err) {
      this.transactions = [];
    }

    this.renderContent();
    this.bindEvents();
  }

  statusBadge(status) {
    const map = {
      sukses:  { class: "bg-success/10 text-success",  label: "Sukses" },
      pending: { class: "bg-warning/10 text-warning",  label: "Pending" },
      gagal:   { class: "bg-error/10 text-error",      label: "Gagal" },
    };
    const s = map[status?.toLowerCase()] || map.pending;
    return /*html*/ `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-tighter ${s.class}">
        ${s.label}
      </span>
    `;
  }

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

    return this.transactions.map(t => /*html*/ `
      <tr class="hover:bg-base-200/50 transition-colors duration-150">
        <td class="px-6 py-4 font-medium text-base-content">${t.id}</td>
        <td class="px-6 py-4 text-base-content/60">${t.customer_name}</td>
        <td class="px-6 py-4 text-base-content/60">${t.package_name}</td>
        <td class="px-6 py-4 text-base-content/60">${t.date}</td>
        <td class="px-6 py-4 font-medium text-right">Rp ${Number(t.amount).toLocaleString("id-ID")}</td>
        <td class="px-6 py-4 text-center">${this.statusBadge(t.status)}</td>
      </tr>
    `).join("");
  }

  renderPaginationButtons() {
    const { current_page, total_pages } = this.pagination;
    let buttons = "";

    for (let i = 1; i <= total_pages; i++) {
      buttons += /*html*/ `
        <button data-page="${i}"
          class="w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors
          ${i === current_page ? "bg-primary text-white" : "hover:bg-base-200 text-base-content"}">
          ${i}
        </button>
      `;
    }
    return buttons;
  }

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

  render() {
    this.innerHTML = /*html*/ `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h4 class="text-xl font-bold">Transaksi Terbaru</h4>
          <div class="flex bg-base-200 rounded-lg p-1" id="filter-tabs">
            ${this.filterTab("all", "Semua")}
            ${this.filterTab("pending", "Pending")}
            ${this.filterTab("gagal", "Gagal")}
          </div>
        </div>
        <div class="bg-base-100 rounded-xl border border-neutral/10 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-base-200 text-base-content/50 border-b border-neutral/10">
                <tr>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">ID Transaksi</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nama Pelanggan</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nama Paket</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Total Bayar</th>
                  <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody id="table-body" class="divide-y divide-neutral/10">
                <tr><td colspan="6" class="px-6 py-16 text-center"><span class="loading loading-spinner loading-md text-primary"></span></td></tr>
              </tbody>
            </table>
          </div>
          <div id="pagination-footer" class="px-6 py-4 border-t border-neutral/10 flex items-center justify-between text-sm text-base-content/50 font-medium">
          </div>
        </div>
      </div>
    `;
  }

  renderContent() {
    const { total, per_page, current_page, total_pages } = this.pagination;
    const from = (current_page - 1) * per_page + 1;
    const to = Math.min(current_page * per_page, total);

    this.querySelector("#table-body").innerHTML = this.renderRows();
    this.querySelector("#pagination-footer").innerHTML = /*html*/ `
      <span>Menampilkan ${from}–${to} dari ${total} transaksi</span>
      <div class="flex gap-1">
        <button id="btn-prev"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors ${current_page === 1 ? "opacity-30 pointer-events-none" : ""}">
          <span class="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        ${this.renderPaginationButtons()}
        <button id="btn-next"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-base-200 transition-colors ${current_page === total_pages ? "opacity-30 pointer-events-none" : ""}">
          <span class="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    `;
  }

  bindEvents() {
    // filter tabs
    this.querySelector("#filter-tabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      this.currentFilter = btn.dataset.filter;
      this.currentPage = 1;

      // update active tab UI
      this.querySelectorAll("[data-filter]").forEach(b => {
        const isActive = b.dataset.filter === this.currentFilter;
        b.className = `px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${isActive ? "bg-base-100 text-primary shadow-sm" : "text-base-content/50 hover:text-primary"}`;
      });

      this.loadData();
    });

    // pagination prev/next
    this.querySelector("#btn-prev")?.addEventListener("click", () => {
      if (this.currentPage > 1) { this.currentPage--; this.loadData(); }
    });
    this.querySelector("#btn-next")?.addEventListener("click", () => {
      if (this.currentPage < this.pagination.total_pages) { this.currentPage++; this.loadData(); }
    });

    // pagination number buttons
    this.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.currentPage = Number(btn.dataset.page);
        this.loadData();
      });
    });
  }
}

customElements.define("transaction-table", TransactionTable);
