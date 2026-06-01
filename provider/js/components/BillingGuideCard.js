export default class BillingGuideCard extends HTMLElement {
  connectedCallback() {
    this.pdfUrl = this.getAttribute("pdf-url") || "#";
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="relative overflow-hidden bg-primary text-white rounded-xl p-6 shadow-xl shadow-primary/20 flex flex-col justify-between h-full">
        <div class="relative z-10">
          <h4 class="font-bold mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">book</span>
            Panduan Billing
          </h4>
          <p class="text-xs opacity-80 leading-relaxed mb-6">
            Kuasai operasi keuangan dengan panduan billing dan manajemen invoice kami yang komprehensif.
          </p>
        </div>
        <div class="relative z-10 flex gap-3">
          <a href="${this.pdfUrl}"
            class="flex-1 py-2 bg-white/20 hover:bg-white/30 text-center text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">download</span>
            Unduh Panduan PDF
          </a>
        </div>
        <!-- Decoration -->
        <div class="absolute -right-10 -bottom-10 opacity-30 pointer-events-none">
          <span class="material-symbols-outlined text-[140px]" style="font-variation-settings:'wght' 100">payments</span>
        </div>
      </div>
    `;
  }
}

customElements.define("billing-guide-card", BillingGuideCard);
