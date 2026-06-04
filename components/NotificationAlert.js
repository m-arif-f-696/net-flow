export default class NotificationAlert extends HTMLElement {
  connectedCallback() {
    // Kita panggil render saat komponen pertama kali dimuat
    this.render();
  }

  // Atribut yang akan dipantau perubahannya
  static get observedAttributes() {
    return ["title", "message", "color"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    // Mengambil atribut, dengan nilai default jika kosong
    const title = this.getAttribute("title") || "Pemberitahuan";
    const message = this.getAttribute("message") || "";
    const color = this.getAttribute("color") || "info"; // success, error, warning, info

    // Menentukan ikon material berdasarkan warna
    let icon = "info";
    if (color === "success") icon = "check_circle";
    if (color === "error") icon = "error";
    if (color === "warning") icon = "warning";

    // Gunakan innerHTML agar class Tailwind & DaisyUI bisa terbaca
    this.innerHTML = /*html*/ `
      <dialog class="modal">
        <div class="modal-box border border-${color}/20">
          <h3 class="font-bold text-lg text-${color} flex items-center gap-2">
            <span class="material-symbols-outlined">${icon}</span>
            ${title}
          </h3>
          <p class="py-4 text-base-content/85">
            ${message}
          </p>
          <div class="modal-action">
            <button type="button" class="btn btn-${color}" id="btn-ok">
              OK
            </button>
          </div>
        </div>
      </dialog>
    `;

    // Pasang ulang event listener setiap kali komponen dirender ulang
    const btnOk = this.querySelector("#btn-ok");
    if (btnOk) {
      btnOk.addEventListener("click", () => this._handleOk());
    }
  }

  _handleOk() {
    this.hide();
    // Kirim event agar script luar bisa bereaksi saat tombol OK diklik
    this.dispatchEvent(new CustomEvent("onOk", { bubbles: true }));
  }

  // Metode untuk menampilkan modal menggunakan fitur <dialog>
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
}

// Daftarkan Custom Element
customElements.define("notification-alert", NotificationAlert);
