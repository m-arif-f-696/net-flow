export default class RecentActivity extends HTMLElement {
  constructor() {
    super();
    // Inisialisasi awal dengan undefined sebagai penanda "Loading state"
    this._transactions = undefined;
  }

  connectedCallback() {
    // Render awal saat komponen dipasang ke DOM (akan memunculkan loading)
    if (!this.innerHTML.trim()) {
      this.render();
    }
  }

  // Fungsi yang akan dipanggil oleh Controller Anda
  setData(data) {
    this._transactions = data;
    this.render(); // Render ulang setelah data masuk
  }

  // Fungsi pembantu untuk format Rupiah
  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Fungsi pembantu untuk format Tanggal (Contoh: Sep 12, 2023)
  formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  render() {
    // 1. STATE: LOADING (Jika controller sedang melakukan fetch)
    if (this._transactions === undefined) {
      this.innerHTML = /*html*/ `
        <section class="space-y-4">
          <h2 class="text-lg font-bold tracking-tight text-base-content">Recent Activity</h2>
          <div class="flex items-center justify-center p-6">
            <span class="loading loading-spinner loading-md text-primary"></span>
            <span class="ml-3 text-sm text-base-content/60">Memuat transaksi...</span>
          </div>
        </section>
      `;
      return;
    }

    // 2. STATE: KOSONG (Jika hasil fetch array kosong)
    if (this._transactions.length === 0) {
      this.innerHTML = /*html*/ `
        <section class="space-y-4">
          <h2 class="text-lg font-bold tracking-tight text-base-content">Recent Activity</h2>
          <div class="text-center p-6 bg-base-100 rounded-2xl border border-base-300 shadow-sm">
            <p class="text-sm text-base-content/60">Belum ada aktivitas transaksi.</p>
          </div>
        </section>
      `;
      return;
    }

    // 3. STATE: ADA DATA (Looping data transaksi)
    const transactionsHTML = this._transactions
      .map((t) => {
        // Karena ini tagihan/pembayaran, kita beri ikon seragam (atau Anda bisa bedakan dengan t.paymentType)
        return /*html*/ `
          <div class="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-base-300 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-base-content">${t.packageName || "Pembayaran WiFi"}</p>
                <p class="text-[10px] text-base-content/40 uppercase tracking-wider">
                  ${this.formatDate(t.paidAt || t.createdAt)} • ${t.invoice}
                </p>
              </div>
            </div>
            <p class="text-sm font-bold text-error">-${this.formatCurrency(t.amount)}</p>
          </div>
        `;
      })
      .join(""); // Gabungkan array string HTML menjadi satu string panjang

    // Suntikkan hasil looping ke dalam kerangka section
    this.innerHTML = /*html*/ `
      <section class="space-y-4">
        <h2 class="text-lg font-bold tracking-tight text-base-content">Recent Activity</h2>
        <div class="space-y-3">
          ${transactionsHTML}
        </div>
      </section>
    `;
  }
}

if (!customElements.get("recent-activity")) {
  customElements.define("recent-activity", RecentActivity);
}
