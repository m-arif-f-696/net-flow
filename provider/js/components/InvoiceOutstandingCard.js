export default class InvoiceOutstandingCard extends HTMLElement {
  connectedCallback() {
    this.total = this.getAttribute("total") || "0";
    this.collected = this.getAttribute("collected") || "0";
    this.pastDue30 = this.getAttribute("past-due-30") || "0";
    this.pastDue31 = this.getAttribute("past-due-31") || "0";
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="bg-base-200 rounded-xl p-8 flex flex-col justify-between border border-neutral/10 h-full">
        <div>
          <p class="text-sm font-medium text-base-content/60">Tagihan Belum Dibayar</p>
          <h3 class="text-4xl font-black text-base-content mt-2 tracking-tight">
            Rp ${Number(this.total).toLocaleString("id-ID")}
          </h3>
          <div class="mt-4 flex items-center gap-2">
            <div class="h-2 flex-1 bg-base-300 rounded-full overflow-hidden">
              <div class="bg-primary h-full rounded-full transition-all" style="width: ${this.collected}%"></div>
            </div>
            <span class="text-[10px] font-bold text-primary">${this.collected}% Terkumpul</span>
          </div>
        </div>
        <div class="space-y-3 mt-8">
          <div class="flex justify-between items-center text-sm">
            <span class="text-base-content/60">Jatuh Tempo (1-30 hari)</span>
            <span class="font-bold">Rp ${Number(this.pastDue30).toLocaleString("id-ID")}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-base-content/60">Jatuh Tempo (31+ hari)</span>
            <span class="font-bold text-error">Rp ${Number(this.pastDue31).toLocaleString("id-ID")}</span>
          </div>
          <button class="w-full mt-2 py-2 text-primary font-bold text-xs uppercase tracking-widest border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
            Kirim Pengingat
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("invoice-outstanding-card", InvoiceOutstandingCard);
