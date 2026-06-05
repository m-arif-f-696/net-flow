export default class PackageDetailBenefits extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  setData({ features = [], description = "" }) {
    this._features = features;
    this._description = description;
    this.render();
  }

  render() {
    const features = this._features ?? [];
    const description = this._description ?? "";

    if (!features.length && !description) return;

    const items = features
      .map(
        (f) => `
      <div class="flex items-center gap-4 bg-base-200 p-4 rounded-xl">
        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-primary text-xl">check</span>
        </div>
        <span class="font-medium text-base-content">${f}</span>
      </div>
    `,
      )
      .join("");

    this.innerHTML = `
      <section class="mb-8 space-y-4">

        <div class="text-xs font-bold uppercase tracking-widest text-primary">Plan Benefits</div>

        ${
          description
            ? `
        <div class="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
          <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-primary text-xl">info</span>
          </div>
          <p class="text-sm text-base-content/70 leading-relaxed">${description}</p>
        </div>`
            : ""
        }

        <div class="space-y-3">${items}</div>

      </section>
    `;
  }
}

customElements.define("package-detail-benefits", PackageDetailBenefits);
