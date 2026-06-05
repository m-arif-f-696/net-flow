export default class PackageDetailProvider extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  setData({ companyName, description, areaName, contactCs }) {
    this._data = { companyName, description, areaName, contactCs };
    this.render();
  }

  render() {
    const {
      companyName = "—",
      description = "",
      areaName    = "—",
      contactCs   = "—",
    } = this._data ?? {};

    this.innerHTML = /*html*/ `
      <section class="bg-base-200 rounded-3xl p-6 shadow-sm mb-32">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-bold text-base-content">${companyName}</h3>
            <div class="flex items-center gap-1.5 mt-1 text-base-content/50">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span class="text-xs font-medium">${areaName}</span>
            </div>
          </div>
          <!-- Kontak CS -->
          <a href="tel:${contactCs}"
            class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Hubungi CS
          </a>
        </div>
        ${description
          ? `<p class="text-sm text-base-content/60 leading-relaxed">${description}</p>`
          : ""
        }
      </section>
    `;
  }
}

customElements.define("package-detail-provider", PackageDetailProvider);
