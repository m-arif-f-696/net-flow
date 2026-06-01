export default class PaginationControl extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  set data({ currentPage, totalPages }) {
    this._currentPage = currentPage;
    this._totalPages = totalPages;
    this.render();
  }

  render() {
    if (!this._totalPages) return;

    this.innerHTML = /*html*/ `
      <div class="flex justify-center mt-8">
        <div class="join shadow-sm">
          <button id="btn-prev" class="join-item btn btn-sm bg-base-200 border-base-300 ${this._currentPage === 1 ? "btn-disabled" : ""}">
            « Prev
          </button>
          <button class="join-item btn btn-sm bg-base-100 border-base-300 pointer-events-none">
            Page ${this._currentPage} of ${this._totalPages}
          </button>
          <button id="btn-next" class="join-item btn btn-sm bg-base-200 border-base-300 ${this._currentPage === this._totalPages ? "btn-disabled" : ""}">
            Next »
          </button>
        </div>
      </div>
    `;

    // Event Listener untuk tombol
    this.querySelector("#btn-prev")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("page-change", { detail: this._currentPage - 1 }),
      );
    });

    this.querySelector("#btn-next")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("page-change", { detail: this._currentPage + 1 }),
      );
    });
  }
}

customElements.define("pagination-control", PaginationControl);
