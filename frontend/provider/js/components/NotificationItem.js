export default class NotificationItem extends HTMLElement {
  connectedCallback() {
    this.classList.add("block");
    // 1. Tangkap semua atribut dari HTML (atau gunakan nilai default jika kosong)
    const icon = this.getAttribute("icon") || "info";
    const iconBg = this.getAttribute("icon-bg") || "bg-blue-100";
    const iconColor = this.getAttribute("icon-color") || "text-blue-600";
    const time = this.getAttribute("time") || "";
    const badgeText = this.getAttribute("badge-text");
    const badgeClass =
      this.getAttribute("badge-class") || "bg-gray-100 text-gray-700";

    // 2. Tangkap isi pesan teks yang ada di dalam tag
    const messageContent = this.innerHTML;

    // 3. Logika untuk memunculkan badge (karena tidak semua notifikasi pakai badge)
    let badgeHtml = "";
    if (badgeText) {
      badgeHtml = `<span class="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass} uppercase tracking-tighter">${badgeText}</span>`;
    }

    // 4. Render/Timpa HTML-nya
    this.innerHTML = `
      <div class="p-5 flex gap-4 hover:bg-surface-container-low/30 transition-colors">
        <div class="w-10 h-10 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-xl">${icon}</span>
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <p class="text-sm text-on-surface leading-tight">
              ${messageContent}
            </p>
            <span class="text-[10px] font-bold text-on-surface-variant shrink-0 ml-4">${time}</span>
          </div>
          ${badgeHtml}
        </div>
      </div>
    `;
  }
}

customElements.define("notification-item", NotificationItem);
