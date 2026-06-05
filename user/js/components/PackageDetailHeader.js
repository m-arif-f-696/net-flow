export default class PackageDetailHeader extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  setData({ providerName, providerLogo, packageName, price }) {
    this._data = { providerName, providerLogo, packageName, price };
    this.render();
  }

  render() {
    const {
      providerName = "—",
      providerLogo = "",
      packageName  = "—",
      price        = 0,
    } = this._data ?? {};

    this.innerHTML = /*html*/ `
      <section class="mt-4 mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-base-100 shadow-sm flex items-center justify-center p-1 overflow-hidden">
            ${providerLogo
              ? `<img src="${providerLogo}" alt="${providerName} logo" class="w-full h-full object-contain" />`
              : `<div class="w-full h-full bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"/>
                  </svg>
                </div>`
            }
          </div>
          <span class="text-xs font-semibold uppercase tracking-widest text-primary">${providerName}</span>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight text-base-content mb-2">${packageName}</h2>
        <div class="flex items-baseline gap-1">
          <span class="text-4xl font-extrabold text-base-content">
            Rp ${Number(price).toLocaleString("id-ID")}
          </span>
          <span class="text-base-content/50 font-medium">/bulan</span>
        </div>
      </section>
    `;
  }
}

customElements.define("package-detail-header", PackageDetailHeader);
