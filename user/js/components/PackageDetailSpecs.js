export default class PackageDetailSpecs extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  setData({ downloadSpeed, downloadUnit, uploadSpeed, uploadUnit, uptime = "99.9%" }) {
    this._data = { downloadSpeed, downloadUnit, uploadSpeed, uploadUnit, uptime };
    this.render();
  }

  render() {
    const {
      downloadSpeed = "—",
      downloadUnit  = "",
      uploadSpeed   = "—",
      uploadUnit    = "",
      uptime        = "99.9%",
    } = this._data ?? {};

    this.innerHTML = /*html*/ `
      <section class="grid grid-cols-2 gap-4 mb-8">

        <!-- Download Speed - full width -->
        <div class="col-span-2 bg-base-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5 10.5 6.75 6.75 10.5h4.5L4.5 20.25l10.5-11.25L11.25 12h4.5l-7.5 8.25" />
            </svg>
          </div>
          <div class="text-2xl font-extrabold text-base-content">${downloadSpeed} ${downloadUnit}</div>
          <div class="text-xs uppercase tracking-wider text-base-content/50">Download Speed</div>
        </div>

        <!-- Upload -->
        <div class="bg-base-200 rounded-3xl p-6 flex flex-col items-center text-center">
          <div class="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div class="text-lg font-bold text-base-content">${uploadSpeed} ${uploadUnit}</div>
          <div class="text-xs text-base-content/50">Upload</div>
        </div>

        <!-- Uptime -->
        <div class="bg-base-200 rounded-3xl p-6 flex flex-col items-center text-center">
          <div class="w-9 h-9 bg-success/10 rounded-xl flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div class="text-lg font-bold text-base-content">${uptime}</div>
          <div class="text-xs text-base-content/50">Uptime</div>
        </div>

      </section>
    `;
  }
}

customElements.define("package-detail-specs", PackageDetailSpecs);
