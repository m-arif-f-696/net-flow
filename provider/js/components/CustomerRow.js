export default class CustomerRow extends HTMLTableRowElement {
  connectedCallback() {
    const name = this.getAttribute("name") || "—";
    const status = this.getAttribute("status") || "Active"; // Fallback ke Active jika kosong
    const id = this.getAttribute("customer-id") || "—";
    const address = this.getAttribute("address") || "—";
    const plan = this.getAttribute("plan") || "—";
    const speed = this.getAttribute("speed") || "—";

    // Logika warna status
    let statusColor = "bg-success";
    let statusTextClass = "text-success";
    if (status.toLowerCase() === "suspended") {
      statusColor = "bg-warning";
      statusTextClass = "text-warning-content";
    } else if (status.toLowerCase() === "terminated") {
      statusColor = "bg-error";
      statusTextClass = "text-error-content";
    }

    this.className = "hover:bg-base-200 transition-colors group";
    this.innerHTML = /*html*/ `
      <td class="px-6 py-5">
        <div class="flex items-center gap-3">
          <div>
            <p class="font-bold text-base-content leading-tight">${name}</p>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${statusColor}"></span>
              <span class="text-[11px] font-semibold ${statusTextClass} uppercase">${status}</span>
            </div>
          </div>
        </div>
      </td>
      <td class="px-6 py-5">
        <span class="font-mono text-xs text-base-content/60 bg-base-200 px-2 py-1 rounded">${id}</span>
      </td>
      <td class="px-6 py-5">
        <p class="text-xs text-base-content font-medium truncate max-w-[180px]">${address}</p>
      </td>
      <td class="px-6 py-5">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-info">${plan}</span>
          <span class="text-[10px] text-base-content/50 font-medium">${speed}</span>
        </div>
      </td>
      <td class="px-6 py-5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button data-action="view" class="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" title="View Details">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button data-action="edit" class="p-2 hover:bg-base-200 text-base-content/60 rounded-lg transition-colors" title="Edit Customer">
            <span class="material-symbols-outlined">edit</span>
          </button>
        </div>
      </td>
    `;
  }
}

// Daftarkan Custom Element yang mengekstensi tag <tr>
customElements.define("customer-row", CustomerRow, { extends: "tr" });
