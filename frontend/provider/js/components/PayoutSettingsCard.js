export default class PayoutSettingsCard extends HTMLElement {
  connectedCallback() {
    this.bank = this.getAttribute("bank") || "—";
    this.frequency = this.getAttribute("frequency") || "—";
    this.nextPayout = this.getAttribute("next-payout") || "—";
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="bg-base-200/50 rounded-xl p-6 border border-neutral/10 h-full flex flex-col justify-between">
        <div>
          <h4 class="text-sm font-bold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-sm">account_balance</span>
            Pengaturan Pembayaran
          </h4>
          <div class="p-4 bg-base-100 rounded-lg mb-6 border border-neutral/10">
            <p class="text-[10px] text-base-content/50 font-bold uppercase mb-2">Bank Terhubung</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-4 bg-blue-600 rounded-sm"></div>
                <span class="text-sm font-bold">${this.bank}</span>
              </div>
              <span class="material-symbols-outlined text-sm text-success" style="font-variation-settings:'FILL' 1">check_circle</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="flex flex-col text-xs">
              <span class="text-base-content/50 font-medium mb-1">Frekuensi</span>
              <span class="font-bold">${this.frequency}</span>
            </div>
            <div class="flex flex-col text-xs">
              <span class="text-base-content/50 font-medium mb-1">Pembayaran Berikutnya</span>
              <span class="font-bold text-primary">${this.nextPayout}</span>
            </div>
          </div>
        </div>
        <button class="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
          Edit Jadwal Pembayaran
        </button>
      </div>
    `;
  }
}

customElements.define("payout-settings-card", PayoutSettingsCard);
