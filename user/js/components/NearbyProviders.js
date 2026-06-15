export default class NearbyProviders extends HTMLElement {
  connectedCallback() {
    this._searchQuery = "";
    if (!this.innerHTML.trim()) {
      this.render();
    }
  }

  // Menerima data dalam bentuk Array dari Controller
  setData(providers = []) {
    this._providers = providers;
    this.render(); // Render ulang setelah data API masuk
  }

  render() {
    // Cari search input yang sedang aktif untuk mempertahankan nilai dan fokus
    const activeSearch = this.querySelector('input[type="text"]');
    const currentQuery = activeSearch
      ? activeSearch.value
      : this._searchQuery || "";

    // Tidak melakukan filter client-side, datanya langsung dari API (melalui setData)
    const filteredProviders = this._providers || [];

    let contentHTML = "";

    // Skenario 1: Data belum di-fetch atau masih kosong (Loading state)
    if (!this._providers) {
      contentHTML = `
        <div class="w-full flex items-center justify-center p-8 bg-base-100 border border-base-300 rounded-2xl shadow-sm">
           <span class="loading loading-spinner text-primary loading-md"></span>
           <span class="ml-3 text-base-content/60 font-medium">Mencari jaringan terdekat...</span>
        </div>
      `;
    }
    // Skenario 2: Data API ternyata kosong
    else if (filteredProviders.length === 0) {
      contentHTML = `
        <div class="w-full text-center p-6 bg-base-100 border border-base-300 rounded-2xl shadow-sm">
           <p class="text-base-content/60">Tidak ada provider yang cocok atau menjangkau lokasimu.</p>
        </div>
      `;
    }
    // Skenario 3: Data berhasil didapat, lakukan mapping ke kartu horizontal
    else {
      contentHTML = `
        <div class="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5" style="scrollbar-width: none">
          ${filteredProviders
            .map((provider) => {
              const {
                id_provider = "",
                slug = "",
                packageName = "—",
                icon = "",
                coverageArea = "—",
                startPrice = 0,
              } = provider;

              // Tentukan variasi warna berdasarkan nama/id provider agar visual bervariasi seperti mockup
              const colors = [
                { bg: "bg-primary/10", text: "text-primary" },
                { bg: "bg-secondary/10", text: "text-secondary" },
                { bg: "bg-accent/10", text: "text-accent" },
              ];
              const colorIndex =
                (typeof id_provider === "number"
                  ? id_provider
                  : packageName.charCodeAt(0) || 0) % colors.length;
              const color = colors[colorIndex];

              const logoHTML = icon
                ? `<span class="material-symbols-outlined text-4xl">${icon}</span>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ${color.text}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"/></svg>`;

              return `
                <div class="min-w-[180px] bg-base-100 p-4 rounded-2xl shadow-sm border border-base-300 flex-shrink-0">
                  <div class="w-11 h-11 ${color.bg} rounded-2xl flex items-center justify-center mb-3">
                    ${logoHTML}
                  </div>
                  <h3 class="font-bold text-sm text-base-content truncate" title="${packageName}">${packageName}</h3>
                  <p class="text-xs text-base-content/40 mb-3 truncate">${coverageArea}</p>
                  <div class="flex justify-between items-center">
                    <span class="text-primary font-bold text-sm">Rp ${Number(startPrice).toLocaleString("id-ID")}</span>
                    <a href="detailpackage/${slug}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/30 hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                      </svg>
                    </a>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    // Render container utama sesuai mock-up request
    this.innerHTML = /*html*/ `
      <section class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold tracking-tight text-base-content">Paket Internet Terdekat</h2>
        </div>

        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input class="w-full bg-base-100 border border-base-300 rounded-2xl pl-12 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-base-content" placeholder="Search local ISPs..." type="text" value="${currentQuery}" />
        </div>

        <div class="flex flex-rew gap-4 overflow-x-auto no-scrollbar scroll-smooth ">
          ${contentHTML}
        </div>
      </section>
    `;

    // Pasang kembali event listener pada input pencarian
    const searchInput = this.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value;
        this.dispatchEvent(
          new CustomEvent("search", {
            detail: { query: this._searchQuery },
          }),
        );
      });
      // Jika sebelumnya elemen input sedang fokus, kembalikan fokusnya ke posisi kursor akhir
      if (activeSearch) {
        searchInput.focus();
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
      }
    }
  }
}

if (!customElements.get("nearby-providers")) {
  customElements.define("nearby-providers", NearbyProviders);
}
