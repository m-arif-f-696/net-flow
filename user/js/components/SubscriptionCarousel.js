export default class SubscriptionCarousel extends HTMLElement {
  connectedCallback() {
    // Render awal (bisa berupa loading state jika data belum ada)
    this.render();
  }

  // Fungsi sakti untuk menerima data dari fetch API
  setData(data) {
    // Pastikan data berupa array, jika tidak jadikan array kosong
    this._data = Array.isArray(data) ? data : [];
    this.render();
  }

  render() {
    const subscriptions = this._data;

    // 1. Tampilkan animasi loading jika data belum di-fetch atau sedang kosong
    if (!subscriptions || subscriptions.length === 0) {
      this.innerHTML = `
        <section class="w-full relative pb-8 flex justify-center items-center h-40">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </section>
      `;
      return;
    }

    // 2. Looping data untuk membuat item carousel (Kartu Langganan)
    const itemsHTML = subscriptions
      .map((subs, index) => {
        // Membuat gaya warna selang-seling (Primary & Slate-800) seperti desain asli Anda
        const isPrimary = index % 2 === 0;
        const bgClass = isPrimary
          ? "bg-primary text-primary-content"
          : "bg-slate-800 text-white";
        const glowClass = isPrimary ? "bg-primary-content/10" : "bg-white/5";
        const badgeClass = isPrimary ? "bg-primary-content/20" : "bg-white/20";
        const textMutedClass = isPrimary
          ? "text-primary-content/70"
          : "text-white/50";
        const textBoldClass = isPrimary
          ? "text-primary-content/90"
          : "text-white/90";
        const buttonClass = isPrimary
          ? "bg-primary-content text-primary"
          : "bg-white text-slate-800";

        return `
        <div class="carousel-item w-full snap-center" id="subs${index + 1}">
          <section class="w-full ${bgClass} rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 ${glowClass} rounded-full blur-2xl"></div>
            <div class="absolute -bottom-8 -left-8 w-32 h-32 ${glowClass} rounded-full blur-xl"></div>
            <div class="flex justify-between items-start mb-6 relative">
              <div>
                <h2 class="text-lg font-bold tracking-tight mb-1">
                  ${subs.packageName || "—"}
                  <span class="text-sm font-normal ${badgeClass} px-2 py-0.5 rounded-md ml-1">${subs.speed || "—"}</span>
                </h2>
                <p class="text-sm ${textMutedClass}">${subs.category || "Paket Internet"}</p>
              </div>
              <div class="w-10 h-10 ${badgeClass} rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                </svg>
              </div>
            </div>
            <div class="space-y-3 relative">
              <div class="flex justify-between text-sm font-semibold">
                <span>Kondisi Jaringan</span>
                <span class="${textBoldClass} flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Stabil
                </span>
              </div>
              <div class="w-full ${badgeClass} h-2.5 rounded-full overflow-hidden">
                <div class="bg-green-400 h-full rounded-full w-full"></div>
              </div>
              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-2 ${textMutedClass}">
                  <span class="text-xs font-medium">Tagihan Berikut: ${subs.nextBilling || "—"}</span>
                </div>
                <button class="${buttonClass} text-xs font-bold px-5 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform">Bayar</button>
              </div>
            </div>
          </section>
        </div>
      `;
      })
      .join("");

    // 3. Looping untuk membuat titik indikator di bawah (Pagination Dots)
    const indicatorsHTML = subscriptions
      .map((subs, index) => {
        // Titik pertama warnanya solid, sisanya agak transparan
        const dotColor =
          index === 0 ? "bg-primary" : "bg-primary/30 hover:bg-primary";
        return `<a href="#subs${index + 1}" class="w-2 h-2 rounded-full ${dotColor} transition-colors"></a>`;
      })
      .join("");

    // 4. Render keseluruhan HTML
    this.innerHTML = `
      <section class="w-full relative pb-8">
        <div class="carousel carousel-center w-full space-x-4 rounded-3xl snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden">
          ${itemsHTML}
        </div>
        <div class="flex justify-center w-full gap-2 absolute bottom-0">
          ${indicatorsHTML}
        </div>
      </section>
    `;
  }
}

// Mendaftarkan Web Component (dengan proteksi duplikasi)
if (!customElements.get("subscription-carousel")) {
  customElements.define("subscription-carousel", SubscriptionCarousel);
}
