import "./IspCard.js";
import "./PaginationControl.js";

export default class MarketPage extends HTMLElement {
  constructor() {
    super();
    this._debounceTimer = null;
  }

  connectedCallback() {
    this.render();
    this._setupSearchListener();
  }

  render() {
    this.innerHTML = /*html*/ `
      <main class="mt-24 px-6 space-y-8 pb-24">
        
        <section class="mb-10">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">Available Networks</p>
          <h1 class="text-4xl font-extrabold tracking-tight text-base-content mb-6 leading-tight">Find the best mesh near you.</h1>
          <div class="relative">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input 
              id="search-package" 
              class="w-full pl-12 pr-4 py-4 bg-base-200 border-b-2 border-base-300 focus:border-primary focus:outline-none transition-all text-base-content placeholder:text-base-content/40 font-medium" 
              placeholder="Search by package name..." 
              type="text" 
            />
          </div>
        </section>

        <section id="isp-grid" class="grid grid-cols-1 gap-8"></section>

        <pagination-control></pagination-control>
      </main>
    `;
  }

  // ─── Setup Search Input dengan Debounce ───

  _setupSearchListener() {
    const searchInput = this.querySelector("#search-package");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(this._debounceTimer);

      // Debounce 400ms: agar tidak spam API setiap keystroke
      this._debounceTimer = setTimeout(() => {
        this.dispatchEvent(
          new CustomEvent("search-change", { detail: e.target.value.trim() })
        );
      }, 400);
    });
  }

  // ─── Public Methods (dipanggil oleh Controller) ───

  /**
   * Tampilkan loading skeleton di grid.
   */
  setLoading(isLoading) {
    const grid = this.querySelector("#isp-grid");
    if (!grid) return;

    if (isLoading) {
      grid.innerHTML = /*html*/ `
        <div class="flex flex-col gap-4 p-4 rounded-3xl bg-base-200 border border-base-300 animate-pulse">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-base-300"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-base-300 rounded w-3/4"></div>
              <div class="h-3 bg-base-300 rounded w-1/2"></div>
            </div>
          </div>
          <div class="flex gap-2">
            <div class="flex-1 h-10 bg-base-300 rounded-xl"></div>
            <div class="flex-1 h-10 bg-base-300 rounded-xl"></div>
          </div>
        </div>
        <div class="flex flex-col gap-4 p-4 rounded-3xl bg-base-200 border border-base-300 animate-pulse">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-base-300"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-base-300 rounded w-2/3"></div>
              <div class="h-3 bg-base-300 rounded w-1/3"></div>
            </div>
          </div>
          <div class="flex gap-2">
            <div class="flex-1 h-10 bg-base-300 rounded-xl"></div>
            <div class="flex-1 h-10 bg-base-300 rounded-xl"></div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Render daftar paket dan update pagination.
   * @param {Array} packages - Array data paket dari API.
   * @param {Object} pagination - Object pagination dari API { total_data, total_pages, current_page, limit }.
   */
  setPackages(packages, pagination) {
    const grid = this.querySelector("#isp-grid");
    const paginationEl = this.querySelector("pagination-control");
    if (!grid) return;

    grid.innerHTML = ""; // Bersihkan grid

    // Kondisi: tidak ada data
    if (!packages || packages.length === 0) {
      grid.innerHTML = /*html*/ `
        <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h3 class="font-bold text-base-content text-lg">Paket Tidak Ditemukan</h3>
          <p class="text-base-content/60 text-sm max-w-sm">
            Tidak ada paket yang cocok dengan pencarian Anda.
          </p>
        </div>
      `;
      return;
    }

    // Render setiap paket sebagai <isp-card>
    packages.forEach((pkg) => {
      const card = document.createElement("isp-card");
      card.data = pkg; // Lempar object ke setter di IspCard.js
      grid.appendChild(card);
    });

    // Update Pagination
    if (paginationEl && pagination) {
      paginationEl.data = {
        currentPage: pagination.current_page,
        totalPages: pagination.total_pages,
        limit: pagination.limit,
      };
    }

    // Tangkap event page-change dari PaginationControl, lalu bubble up
    paginationEl?.addEventListener("page-change", (e) => {
      const newPage = e.detail;
      const limit = pagination.limit || 10;
      const offset = (newPage - 1) * limit;

      this.dispatchEvent(
        new CustomEvent("page-change", { detail: { page: newPage, offset, limit } })
      );
    });
  }

  /**
   * Tampilkan pesan error di grid.
   * @param {string} message - Pesan error.
   */
  setError(message) {
    const grid = this.querySelector("#isp-grid");
    if (!grid) return;

    grid.innerHTML = /*html*/ `
      <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="font-bold text-base-content text-lg">Gagal Memuat Data</h3>
        <p class="text-base-content/60 text-sm max-w-sm">
          ${message || "Tidak dapat mengambil data paket. Periksa koneksi atau coba beberapa saat lagi."}
        </p>
      </div>
    `;
  }
}

customElements.define("market-page", MarketPage);
