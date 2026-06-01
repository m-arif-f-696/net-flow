export default class IspCard extends HTMLElement {
  set data(isp) {
    this._isp = isp;
    this.render();
  }

  render() {
    if (!this._isp) return;

    this.innerHTML = /*html*/ `
      <div class="flex flex-col gap-4 p-4 rounded-3xl bg-base-200 border border-base-300">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-base-100 flex items-center justify-center p-2 shadow-sm shrink-0">
            <img
              alt="${this._isp.name} logo"
              class="w-full h-full object-contain rounded-lg"
              src="${this._isp.logo}"
            />
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-lg leading-tight text-base-content">
                  ${this._isp.name}
                </h4>
                <p class="text-xs text-base-content/50 font-medium">
                  ${this._isp.provider}
                </p>
              </div>
              <span class="text-lg font-extrabold text-base-content">
                $${this._isp.price}<span class="text-xs font-medium text-base-content/50">/mo</span>
              </span>
            </div>
            <div class="flex gap-4 mt-1">
              <span class="text-xs font-semibold text-primary flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5 10.5 6.75 6.75 10.5h4.5L4.5 20.25l10.5-11.25L11.25 12h4.5l-7.5 8.25" />
                </svg>
                ${this._isp.speed}
              </span>
              <span class="text-xs font-semibold text-base-content/50 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                ${this._isp.distance}
              </span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="detailpackage.html?id=${this._isp.id}" class="flex-1 py-3 px-4 bg-base-100 text-base-content font-semibold rounded-xl text-center text-sm border border-base-300 active:bg-base-200 transition-colors">
            View Details
          </a>
          <a href="checkout.html?id=${this._isp.id}" class="flex-1 py-3 px-4 bg-primary text-primary-content font-bold rounded-xl text-center text-sm shadow-md active:scale-95 transition-transform">
            Connect
          </a>
        </div>
      </div>
    `;
  }
}

customElements.define("isp-card", IspCard);
