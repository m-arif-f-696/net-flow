export default class TransactionSummaryCard extends HTMLElement {
  connectedCallback() {
    this.mrr = this.getAttribute("mrr") || "0";
    this.growth = this.getAttribute("growth") || "0";
    this.subscriptions = this.getAttribute("subscriptions") || "0";
    this.arpu = this.getAttribute("arpu") || "0";
    this.churn = this.getAttribute("churn") || "0";
    this.render();
  }

  render() {
    const isPositive = !this.growth.startsWith("-");
    this.innerHTML = /*html*/ `
      <div class="relative overflow-hidden bg-base-100 rounded-xl p-8 border border-neutral/10 flex flex-col justify-between min-h-[280px]">
        <div class="relative z-10">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-medium text-base-content/60">Pendapatan Berulang Bulanan</p>
              <h3 class="text-5xl font-black text-base-content mt-2 tracking-tight">
                Rp ${Number(this.mrr).toLocaleString("id-ID")}
              </h3>
            </div>
            <div class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
              ${isPositive ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}">
              <span class="material-symbols-outlined text-xs">
                ${isPositive ? "trending_up" : "trending_down"}
              </span>
              ${this.growth}%
            </div>
          </div>
        </div>

        <!-- Decorative blur -->
        <div class="absolute inset-0 opacity-10 pointer-events-none">
          <div class="absolute -right-20 -top-20 w-80 h-80 bg-primary blur-[100px] rounded-full"></div>
          <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-400 blur-[100px] rounded-full"></div>
        </div>

        <div class="relative z-10 flex flex-wrap gap-8 md:gap-12 mt-8 border-t border-neutral/10 pt-6">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Langganan Aktif</p>
            <p class="text-xl font-bold">${Number(this.subscriptions).toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Rata-rata ARPU</p>
            <p class="text-xl font-bold">Rp ${Number(this.arpu).toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Churn Rate</p>
            <p class="text-xl font-bold">${this.churn}%</p>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("transaction-summary-card", TransactionSummaryCard);
