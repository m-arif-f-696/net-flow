export default class InvoiceOutstandingCard extends HTMLElement {
  connectedCallback() {
    this._data = { total: 0, collected: 0, pastDue30: 0, pastDue31: 0 };
    this._renderSkeleton();
  }

  setData({ total, collected, pastDue30, pastDue31 }) {
    this._data = { total, collected, pastDue30, pastDue31 };
    this.render();
  }

  render() {
    const { total, collected, pastDue30, pastDue31 } = this._data;

    this.innerHTML = /*html*/ `
      <div class="bg-base-200 rounded-xl p-8 flex flex-col justify-between border border-neutral/10 h-full">
        <div>
          <p class="text-sm font-medium text-base-content/60">Tagihan Belum Dibayar</p>
          <h3 class="text-4xl font-black text-base-content mt-2 tracking-tight">
            Rp ${Number(total).toLocaleString("id-ID")}
          </h3>
          <div class="mt-4 flex items-center gap-2">
            <div class="h-2 flex-1 bg-base-300 rounded-full overflow-hidden">
              <div class="bg-primary h-full rounded-full transition-all duration-700"
                style="width: ${Math.min(Number(collected), 100)}%"></div>
            </div>
            <span class="text-[10px] font-bold text-primary shrink-0">${Number(collected).toFixed(0)}% Terkumpul</span>
          </div>
        </div>

        <div class="space-y-3 mt-8">
          <div class="flex justify-between items-center text-sm">
            <span class="text-base-content/60">Jatuh Tempo (1-30 hari)</span>
            <span class="font-bold">Rp ${Number(pastDue30).toLocaleString("id-ID")}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-base-content/60">Jatuh Tempo (31+ hari)</span>
            <span class="font-bold text-error">Rp ${Number(pastDue31).toLocaleString("id-ID")}</span>
          </div>
          <button class="w-full mt-2 py-2 text-primary font-bold text-xs uppercase tracking-widest border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
            Kirim Pengingat
          </button>
        </div>
      </div>
    `;
  }

  _renderSkeleton() {
    this.innerHTML = /*html*/ `
      <div class="bg-base-200 rounded-xl p-8 flex flex-col justify-between border border-neutral/10 h-full">
        <div class="space-y-4">
          <div class="skeleton h-4 w-40 rounded"></div>
          <div class="skeleton h-10 w-52 rounded"></div>
          <div class="skeleton h-2 w-full rounded-full"></div>
        </div>
        <div class="space-y-3 mt-8">
          <div class="skeleton h-4 w-full rounded"></div>
          <div class="skeleton h-4 w-full rounded"></div>
          <div class="skeleton h-8 w-full rounded-lg"></div>
        </div>
      </div>
    `;
  }
}

customElements.define("invoice-outstanding-card", InvoiceOutstandingCard);
