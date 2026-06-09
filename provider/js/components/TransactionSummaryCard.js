export default class TransactionSummaryCard extends HTMLElement {
  connectedCallback() {
    const now = new Date();
    this._month = now.getMonth() + 1;
    this._year = now.getFullYear();
    this._loading = false;
    this._data = { mrr: 0, growth: 0, subscriptions: 0, arpu: 0, churn: 0 };
    this.render();
  }

  setLoading(val) {
    this._loading = val;
    if (val) this._renderSkeleton();
  }

  setData({ mrr, growth, subscriptions, arpu, churn }) {
    this._loading = false;
    this._data = { mrr, growth, subscriptions, arpu, churn };
    this.render();
  }

  render() {
    const { mrr, growth, subscriptions, arpu, churn } = this._data;
    const isPositive = Number(growth) >= 0;

    this.innerHTML = /*html*/ `
    <div class="relative overflow-hidden bg-base-100 rounded-xl p-8 border border-neutral/10 flex flex-col justify-between min-h-[280px]">

      <!-- Decorative blur -->
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-primary blur-[100px] rounded-full"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-400 blur-[100px] rounded-full"></div>
      </div>

      <div class="relative z-10">
        <div class="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <p class="text-sm font-medium text-base-content/60">Pendapatan Berulang Bulanan</p>
            <div class="text-5xl font-black text-base-content mt-2 tracking-tight">
              Rp ${Number(mrr).toLocaleString("id-ID")}
            </div>
          </div>

          <div class="flex flex-col items-end gap-3">
            <!-- Growth badge -->
            <div class="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
              ${isPositive ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}">
              <span class="material-symbols-outlined text-xs">
                ${isPositive ? "trending_up" : "trending_down"}
              </span>
              ${isPositive ? "+" : ""}${Number(growth).toFixed(1)}%
            </div>

            <!-- Period picker — render dengan nilai _month/_year saat ini -->
            <div class="flex items-center gap-2">
              <select id="summary-month"
                class="select select-xs select-bordered bg-base-200 text-base-content font-semibold focus:outline-none">
                ${this._renderMonthOptions()}
              </select>
              <select id="summary-year"
                class="select select-xs select-bordered bg-base-200 text-base-content font-semibold focus:outline-none">
                ${this._renderYearOptions()}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex flex-wrap gap-8 md:gap-12 mt-8 border-t border-neutral/10 pt-6">
        <div>
          <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Langganan Aktif</p>
          <p class="text-xl font-bold">${Number(subscriptions).toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Rata-rata ARPU</p>
          <p class="text-xl font-bold">Rp ${Number(arpu).toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-widest text-base-content/50 font-bold mb-1">Churn Rate</p>
          <p class="text-xl font-bold">${Number(churn).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  `;

    // Bind picker setelah render
    this._bindPicker();
  }

  _renderMonthOptions() {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months
      .map(
        (m, i) =>
          `<option value="${i + 1}" ${i + 1 === this._month ? "selected" : ""}>${m}</option>`,
      )
      .join("");
  }

  _renderYearOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let options = "";
    for (let y = currentYear; y >= currentYear - 3; y--) {
      options += `<option value="${y}" ${y === this._year ? "selected" : ""}>${y}</option>`;
    }
    return options;
  }

  _bindPicker() {
    this.querySelector("#summary-month")?.addEventListener("change", (e) => {
      this._month = Number(e.target.value);
      // Dispatch event ke atas — controller yang handle fetch
      this.dispatchEvent(
        new CustomEvent("period-change", {
          bubbles: true,
          detail: { month: this._month, year: this._year },
        }),
      );
    });

    this.querySelector("#summary-year")?.addEventListener("change", (e) => {
      this._year = Number(e.target.value);
      this.dispatchEvent(
        new CustomEvent("period-change", {
          bubbles: true,
          detail: { month: this._month, year: this._year },
        }),
      );
    });
  }

  _renderSkeleton() {
    this.innerHTML = /*html*/ `
      <div class="relative overflow-hidden bg-base-100 rounded-xl p-8 border border-neutral/10 flex flex-col justify-between min-h-[280px]">
        <div class="space-y-4">
          <div class="skeleton h-4 w-48 rounded"></div>
          <div class="skeleton h-12 w-64 rounded"></div>
        </div>
        <div class="flex gap-8 mt-8 border-t border-neutral/10 pt-6">
          <div class="skeleton h-8 w-20 rounded"></div>
          <div class="skeleton h-8 w-20 rounded"></div>
          <div class="skeleton h-8 w-20 rounded"></div>
        </div>
      </div>
    `;
  }
}

customElements.define("transaction-summary-card", TransactionSummaryCard);
