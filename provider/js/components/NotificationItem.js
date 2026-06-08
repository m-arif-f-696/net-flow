export default class NotificationItem extends HTMLElement {
  connectedCallback() {
    this.classList.add("block");

    const id = this.getAttribute("notif-id") || "";
    const title = this.getAttribute("title") || "Notifikasi";
    const message = this.getAttribute("message") || "";
    const category = this.getAttribute("category") || "system";
    const isRead = this.getAttribute("is-read") === "1";
    const time = this.getAttribute("time") || "";
    const name = this.getAttribute("accordion-name") || "notif-accordion";

    // Icon & warna berdasarkan category
    const categoryMap = {
      payment: {
        icon: "payments",
        bg: "bg-success/10",
        color: "text-success",
        badge: "Pembayaran",
        badgeClass: "badge-success",
      },
      complaint: {
        icon: "confirmation_number",
        bg: "bg-error/10",
        color: "text-error",
        badge: "Keluhan",
        badgeClass: "badge-error",
      },
      system: {
        icon: "inventory_2",
        bg: "bg-primary/10",
        color: "text-primary",
        badge: "Sistem",
        badgeClass: "badge-info",
      },
      security: {
        icon: "security",
        bg: "bg-warning/10",
        color: "text-warning",
        badge: "Keamanan",
        badgeClass: "badge-warning",
      },
      subscriber: {
        icon: "person_add",
        bg: "bg-secondary/10",
        color: "text-secondary",
        badge: "Pelanggan",
        badgeClass: "badge-secondary",
      },
    };

    const cat = categoryMap[category] ?? categoryMap.system;

    // Format waktu
    const formattedTime = time
      ? new Date(time).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    this.innerHTML = /*html*/ `
      <div class="collapse collapse-arrow join-item border-base-300 border ${!isRead ? "bg-primary/5" : "bg-base-100"}">
        <input type="radio" name="${name}" />

        <!-- Title row -->
        <div class="collapse-title p-4 pr-10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-lg">${cat.icon}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-base-content leading-tight truncate">
                  ${title}
                </p>
                ${!isRead ? `<span class="w-2 h-2 rounded-full bg-primary shrink-0"></span>` : ""}
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="badge badge-sm ${cat.badgeClass} badge-soft">${cat.badge}</span>
                <span class="text-[10px] text-base-content/40">${formattedTime}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail -->
        <div class="collapse-content px-4 pb-4">
          <div class="ml-12 text-sm text-base-content/70 leading-relaxed border-l-2 border-base-300 pl-4">
            ${message}
          </div>
          ${
            id
              ? /*html*/ `
          <div class="ml-12 mt-3 flex gap-2">
            <button
              data-notif-id="${id}"
              class="btn-mark-read btn btn-xs btn-ghost text-primary ${isRead ? "hidden" : ""}">
              <span class="material-symbols-outlined text-sm">mark_email_read</span>
              Tandai Dibaca
            </button>
          </div>`
              : ""
          }
        </div>
      </div>
    `;

    // Tombol tandai dibaca
    this.querySelector(".btn-mark-read")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const notifId = e.currentTarget.dataset.notifId;
      this.dispatchEvent(
        new CustomEvent("mark-read", {
          bubbles: true,
          detail: { id: notifId },
        }),
      );
    });
  }
}

customElements.define("notification-item", NotificationItem);
