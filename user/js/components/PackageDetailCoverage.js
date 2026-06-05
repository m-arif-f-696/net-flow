export default class PackageDetailCoverage extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  // areaName  : nama wilayah dari tabel wilayah (misal "Kab. Tasikmalaya")
  // available : boolean — apakah customer ada di wilayah ini
  setData({ areaName = "—", available = false }) {
    this._data = { areaName, available };
    this.render();
  }

  render() {
    const { areaName = "—", available = false } = this._data ?? {};

    this.innerHTML = /*html*/ `
      <section class="mb-8">
        <div class="text-xs font-bold uppercase tracking-widest text-primary mb-4">Coverage Area</div>

        <div class="bg-base-200 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl ${available ? "bg-success/10" : "bg-base-300"} flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ${available ? "text-success" : "text-base-content/40"}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <p class="font-bold text-base-content text-sm">${areaName}</p>
              <p class="text-xs text-base-content/50">Wilayah layanan provider</p>
            </div>
          </div>

          ${available
            ? /*html*/ `
              <span class="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs font-bold rounded-full whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                Tersedia di area Anda
              </span>`
            : /*html*/ `
              <span class="px-3 py-1.5 bg-base-300 text-base-content/40 text-xs font-bold rounded-full whitespace-nowrap">
                Di luar jangkauan
              </span>`
          }
        </div>
      </section>
    `;
  }
}

customElements.define("package-detail-coverage", PackageDetailCoverage);
