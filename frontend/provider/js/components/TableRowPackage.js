// Extend HTMLTableRowElement, bukan HTMLElement
export default class TableRowPackage extends HTMLTableRowElement {
  connectedCallback() {
    const name = this.getAttribute("name") || "-";
    const speed = this.getAttribute("speed") || "-";
    const type = this.getAttribute("type") || "Unlimited";
    const sales = this.getAttribute("sales") || "0";
    const revenue = this.getAttribute("revenue") || "0";

    // Tambahkan class hover di sini karena TR-nya sekarang adalah 'this'
    this.className = "hover:bg-surface-container-low/50 transition-colors";

    // Isi langsung ke dalam 'this' (karena 'this' adalah tag <tr>)
    this.innerHTML = `
        <td class="px-6 py-4 font-bold text-sm text-primary">${name}</td>
        <td class="px-6 py-4 text-sm">${speed}</td>
        <td class="px-6 py-4 text-sm font-medium">${type}</td>
        <td class="px-6 py-4 text-sm font-medium">${sales} unit</td>
        <td class="px-6 py-4 text-sm font-bold text-on-surface">${revenue}</td>
    `;
  }
}
customElements.define("table-row-package", TableRowPackage, { extends: "tr" });
