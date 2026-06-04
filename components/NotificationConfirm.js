export default class NotificationConfirm extends HTMLElement {
  connectedCallback() {
    this.title = this.getAttribute("title") || "Konfirmasi";
    this.message = this.getAttribute("message") || "Apakah Anda yakin?";
    this.cancelText = this.getAttribute("cancelText") || "Batal";
    this.confirmText = this.getAttribute("confirmText") || "Hapus";
    this.color = this.getAttribute("color") || "warning";

    this.render();

    // Event listener untuk tombol konfirmasi
    this.querySelector("#btn-confirm").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("onConfirm"));
      this.hide();
    });

    // Event listener untuk tombol batal
    this.querySelector("#btn-cancel").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("onCancel"));
      this.hide();
    });
  }

  // Metode untuk menampilkan modal (menggunakan fitur <dialog> bawaan HTML5/DaisyUI)
  show() {
    const dialog = this.querySelector("dialog");
    if (dialog) {
      dialog.showModal();
    }
  }

  // Metode untuk menutup modal
  hide() {
    const dialog = this.querySelector("dialog");
    if (dialog) {
      dialog.close();
    }
  }

  render() {
    this.innerHTML = /*html*/ `
      <dialog class="modal">
        <div class="modal-box border border-${this.color}/20">
          <h3 class="font-bold text-lg text-${this.color} flex items-center gap-2">
            <span class="material-symbols-outlined">warning</span>
            ${this.title}
          </h3>
          <p class="py-4 text-base-content/85">
            ${this.message}
          </p>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" id="btn-cancel">
              ${this.cancelText}
            </button>
            <button type="button" class="btn btn-${this.color}" id="btn-confirm">
              ${this.confirmText}
            </button>
          </div>
        </div>
      </dialog>
    `;
  }
}

customElements.define("notification-confirm", NotificationConfirm);
