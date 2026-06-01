export default class CardPackage extends HTMLElement {
  connectedCallback() {
    this.namePackage = this.getAttribute("name-package");
    this.description = this.getAttribute("description");
    this.downloadSpeed = this.getAttribute("download-speed") || "0";
    this.uploadSpeed = this.getAttribute("upload-speed") || "0";
    this.price = Number(this.getAttribute("price")) || 0;
    this.icon = this.getAttribute("icon") || "home";
    this.statusPackage = this.getAttribute("active-package");
    this.idPackage = this.getAttribute("id-package");
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <div class="bg-base-200 p-6 rounded-xl border border-neutral/10 hover:shadow-lg transition-all duration-300 group">
      <div class="flex justify-between items-start mb-6">
        <div class="w-12 h-12 bg-neutral/20 rounded-xl flex items-center justify-center ">
          <span class="material-symbols-outlined">${this.icon}</span>
        </div>
        <label class="flex items-center gap-3">
          <input type="checkbox" ${this.statusPackage === "active" ? "checked" : ""} class="toggle toggle-primary" />
        </label>
      </div>
      <h3 class="text-xl font-headline font-bold text-on-surface mb-1">${this.namePackage}</h3>
      <p class=" text-xs mb-6 h-8">${this.description}</p>
      <div class="flex items-center gap-6 mb-8">
        <div>
          <span class="text-xs font-bold  uppercase">Download</span>
          <p class="text-lg font-headline font-bold">${this.downloadSpeed}</p>
        </div>
        <div class="w-px h-8 bg-outline-variant/20"></div>
        <div>
          <span class="text-xs font-bold  uppercase">Upload</span>
          <p class="text-lg font-headline font-bold">${this.uploadSpeed}</p>
        </div>
      </div>
      <div class="flex items-center justify-between pt-6 border-t border-neutral/10">
        <span class="text-2xl font-black text-on-surface">
          Rp. ${this.price.toLocaleString("id-ID")}
        </span>
        <a class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low  hover:bg-primary hover:text-white transition-colors"
          href="edit-package?id=${this.idPackage}">
          <span class="material-symbols-outlined text-sm">edit</span>
        </a>
      </div>
    </div>
    `;
  }
}

customElements.define("card-package", CardPackage);
