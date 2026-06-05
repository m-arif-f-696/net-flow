export default class IspCard extends HTMLElement {
  set data(pkg) {
    this._pkg = pkg;
    this.render();
  }

  _formatPrice(price) {
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  }

  render() {
    if (!this._pkg) return;

    const {
      name_package,
      slug,
      price_per_month,
      package_status,
      provider_name,
      area_name,
      coverage_area_name,
      download_speed,
      download_unit,
      upload_speed,
      upload_unit,
      type_package,
    } = this._pkg;

    const isActive = package_status === "active";
    const statusBadge = isActive
      ? `<span class="text-[10px] font-bold text-success uppercase tracking-wider">● Active</span>`
      : `<span class="text-[10px] font-bold text-base-content/30 uppercase tracking-wider">● Inactive</span>`;

    this.innerHTML = /*html*/ `
      <div class="flex flex-col gap-4 p-4 rounded-3xl bg-base-200 border border-base-300">
        
        <!-- Header: Icon + Name + Price -->
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-lg leading-tight text-base-content">${name_package}</h4>
                ${statusBadge}
              </div>
              <span class="text-lg font-extrabold text-base-content">
                ${this._formatPrice(price_per_month)}<span class="text-xs font-medium text-base-content/50">/bln</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Provider & Wilayah -->
        <div class="flex flex-col gap-1 px-1">
          <span class="text-xs text-base-content/60 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            ${provider_name}
          </span>
          <span class="text-xs text-base-content/60 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            ${area_name} · ${coverage_area_name}
          </span>
        </div>

        <!-- Speed Info -->
        <div class="grid grid-cols-3 gap-2 px-1">
          <div class="flex flex-col items-center p-2 rounded-xl bg-base-100 border border-base-300">
            <span class="text-[10px] text-base-content/50 uppercase tracking-wide">Download</span>
            <span class="font-bold text-sm text-base-content">${download_speed} <span class="text-xs font-medium">${download_unit}</span></span>
          </div>
          <div class="flex flex-col items-center p-2 rounded-xl bg-base-100 border border-base-300">
            <span class="text-[10px] text-base-content/50 uppercase tracking-wide">Upload</span>
            <span class="font-bold text-sm text-base-content">${upload_speed} <span class="text-xs font-medium">${upload_unit}</span></span>
          </div>
          <div class="flex flex-col items-center p-2 rounded-xl bg-base-100 border border-base-300">
            <span class="text-[10px] text-base-content/50 uppercase tracking-wide">Tipe</span>
            <span class="font-bold text-sm text-base-content capitalize">${type_package}</span>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex gap-2">
          <a href="detailpackage/${slug}" class="flex-1 py-3 px-4 bg-base-100 text-base-content font-semibold rounded-xl text-center text-sm border border-base-300 active:bg-base-200 transition-colors">
            View Details
          </a>
          <a href="checkout/${slug}" class="flex-1 py-3 px-4 bg-primary text-primary-content font-bold rounded-xl text-center text-sm shadow-md active:scale-95 transition-transform">
            Connect
          </a>
        </div>

      </div>
    `;
  }
}

customElements.define("isp-card", IspCard);
