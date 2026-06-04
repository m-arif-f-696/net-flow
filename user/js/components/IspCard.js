export default class IspCard extends HTMLElement {
  set data(pkg) {
    this._pkg = pkg;
    this.render();
  }

  /**
   * Helper: Parse package_features dari stringified JSON array.
   * API mengembalikan: "[\"Router WiFi 6E Gratis\", \"Tanpa Batas Data\"]"
   * Kita perlu parse jadi array JS yang sesungguhnya.
   */
  _parseFeatures(raw) {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Helper: Format harga ke Rupiah.
   * 800000 → "Rp 800.000"
   */
  _formatPrice(price) {
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  }

  render() {
    if (!this._pkg) return;

    const {
      id_package,
      name_package,
      price_per_month,
      package_features,
      package_status,
    } = this._pkg;

    // Parse stringified JSON → Array
    const features = this._parseFeatures(package_features);

    // Render daftar fitur sebagai badge/chips
    const featureList = features
      .map(
        (feature) => /*html*/ `
        <span class="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          ${feature}
        </span>
      `
      )
      .join("");

    // Status badge
    const isActive = package_status === "active";
    const statusBadge = isActive
      ? `<span class="text-[10px] font-bold text-success uppercase tracking-wider">● Active</span>`
      : `<span class="text-[10px] font-bold text-base-content/30 uppercase tracking-wider">● Inactive</span>`;

    this.innerHTML = /*html*/ `
      <div class="flex flex-col gap-4 p-4 rounded-3xl bg-base-200 border border-base-300">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-lg leading-tight text-base-content">
                  ${name_package}
                </h4>
                ${statusBadge}
              </div>
              <span class="text-lg font-extrabold text-base-content">
                ${this._formatPrice(price_per_month)}<span class="text-xs font-medium text-base-content/50">/bln</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Features parsed dari stringified JSON -->
        <div class="flex flex-wrap gap-x-4 gap-y-2 px-1">
          ${featureList}
        </div>

        <div class="flex gap-2">
          <a href="detailpackage.html?id=${id_package}" class="flex-1 py-3 px-4 bg-base-100 text-base-content font-semibold rounded-xl text-center text-sm border border-base-300 active:bg-base-200 transition-colors">
            View Details
          </a>
          <a href="checkout.html?id=${id_package}" class="flex-1 py-3 px-4 bg-primary text-primary-content font-bold rounded-xl text-center text-sm shadow-md active:scale-95 transition-transform">
            Connect
          </a>
        </div>
      </div>
    `;
  }
}

customElements.define("isp-card", IspCard);
