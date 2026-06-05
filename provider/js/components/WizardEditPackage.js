import WizardCreatePackage from "./WizardCreatePackage.js";

export default class WizardEditPackage extends WizardCreatePackage {
  static get observedAttributes() {
    return ["slug"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "slug" && newVal && oldVal !== newVal) {
      this.slug = newVal;
      if (this.isConnected) {
        this.isLoading = true;
        this._renderLoading();
        this._loadPackage();
      }
    }
  }

  connectedCallback() {
    this.currentStep = 1;
    this.formData = {};
    this.originalData = {}; // snapshot data awal dari API — untuk diff
    this.isLoading = true;
    this.slug = this.getAttribute("slug");

    this._renderLoading();
    if (this.slug) {
      this._loadPackage();
    }
  }

  // ─────────────────────────────────────────────
  // Load data dari API, isi formData, lalu render
  // ─────────────────────────────────────────────
  async _loadPackage() {
    if (!this.slug) {
      this._renderError("slug attribute wajib diisi.");
      return;
    }

    try {
      const res = await fetch(
        `http://net_flow.test/api/provider/packages/${this.slug}`,
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      const json = await res.json();

      if (!res.ok) throw new Error(json.message ?? "Gagal memuat paket.");

      const pkg = json.data;
      this.packageId = pkg.id_package;

      // Parse package_features (bisa JSON string atau array)
      let features = pkg.package_features ?? [];
      if (typeof features === "string") {
        try {
          features = JSON.parse(features);
        } catch {
          features = [];
        }
      }

      const dlSpeedInMbps =
        pkg.download_unit === "Gbps"
          ? Number(pkg.download_speed) * 1000
          : Number(pkg.download_speed);
      const ulSpeedInMbps =
        pkg.upload_unit === "Gbps"
          ? Number(pkg.upload_speed) * 1000
          : Number(pkg.upload_speed);

      // Isi formData dari response API
      this.formData = {
        name: pkg.name_package,
        description: pkg.package_description,
        category: pkg.type_package === "unlimited" ? "Unlimited" : "Kuota",
        icon: pkg.icon_package,
        features: features.length ? features : [""],
        download_speed: String(dlSpeedInMbps),
        upload_speed: String(ulSpeedInMbps),
        price: String(pkg.price_per_month),
        setup_fee: String(pkg.installation_cost ?? 0),
        is_visible: pkg.package_status === "active",
        is_bestseller: pkg.is_recommended === 1,
        status: pkg.package_status,
      };

      // Simpan snapshot — untuk diff saat submit
      this.originalData = {
        name_package: pkg.name_package,
        type_package: pkg.type_package,
        speed_mbps: pkg.speed_mbps,
        quota_limit_gb: pkg.quota_limit_gb,
        price_per_month: pkg.price_per_month,
        installation_cost: pkg.installation_cost,
        package_description: pkg.package_description,
        package_status: pkg.package_status,
        download_speed: String(dlSpeedInMbps),
        download_unit: dlSpeedInMbps >= 1000 ? "Gbps" : "Mbps",
        upload_speed: String(ulSpeedInMbps),
        upload_unit: ulSpeedInMbps >= 1000 ? "Gbps" : "Mbps",
        icon_package: pkg.icon_package,
        package_features: JSON.stringify(features),
        is_recommended: pkg.is_recommended,
        is_active: pkg.is_active,
      };
    } catch (err) {
      this._renderError(err.message);
      return;
    }

    this.isLoading = false;
    this.render();
    this.bindEvents();
  }

  // ─────────────────────────────────────────────
  // Override render — tambah header "Edit Paket"
  // ─────────────────────────────────────────────
  render() {
    if (this.isLoading) return; // jangan render sebelum data siap

    this.innerHTML = /*html*/ `
      <div class="w-full max-w-6xl mx-auto flex flex-col gap-8">

        <!-- Header edit mode -->
        <div class="flex items-center gap-4 pb-4 border-b border-base-300">
          <div class="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <div>
            <h2 class="font-bold text-xl text-base-content">Edit Paket</h2>
            <p class="text-xs text-base-content/50">Hanya field yang diubah yang akan dikirim ke server.</p>
          </div>
          <span class="ml-auto px-3 py-1 bg-warning/10 text-warning text-[10px] font-bold rounded-full uppercase tracking-widest">
            Edit Mode
          </span>
        </div>

        <!-- Progress Bar (sama seperti create) -->
        <section class="flex items-center justify-center w-full max-w-3xl mx-auto">
          ${this.renderStep(1, "check", "General")}
          <div class="h-[2px] flex-1 -mt-6 transition-colors duration-300 ${this.currentStep >= 2 ? "bg-primary" : "bg-neutral/20"}"></div>
          ${this.renderStep(2, "2", "Technical Specs")}
          <div class="h-[2px] flex-1 -mt-6 transition-colors duration-300 ${this.currentStep >= 3 ? "bg-primary" : "bg-neutral/20"}"></div>
          ${this.renderStep(3, "3", "Market Placement")}
        </section>

        <!-- Step Content -->
        <form id="wizard-form" novalidate>
          <div id="step-1" class="${this.currentStep === 1 ? "block" : "hidden"}">
            ${this.renderStep1()}
          </div>
          <div id="step-2" class="${this.currentStep === 2 ? "block" : "hidden"}">
            ${this.renderStep2()}
          </div>
          <div id="step-3" class="${this.currentStep === 3 ? "block" : "hidden"}">
            ${this.renderStep3()}
          </div>
        </form>

      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // Override renderStep3 — ganti tombol Publikasikan → Simpan Perubahan
  // ─────────────────────────────────────────────
  renderStep3() {
    // Panggil parent, lalu ganti teks tombol via string replace
    return super
      .renderStep3()
      .replace('id="btn-publish"', 'id="btn-publish"')
      .replace(">Publikasikan Paket<", ">Simpan Perubahan<");
  }

  // ─────────────────────────────────────────────
  // Override dispatchSubmit — PATCH, hanya kirim field yang berubah
  // ─────────────────────────────────────────────
  dispatchSubmit() {
    const dlSpeedRaw = Number(this.formData.download_speed);
    const ulSpeedRaw = Number(this.formData.upload_speed);

    // Tentukan unit berdasarkan nilai speed (Mbps)
    const downloadUnit = dlSpeedRaw >= 1000 ? "Gbps" : "Mbps";
    const uploadUnit = ulSpeedRaw >= 1000 ? "Gbps" : "Mbps";

    // Konversi nilai angka jika unitnya Gbps
    const downloadSpeedVal =
      downloadUnit === "Gbps" ? dlSpeedRaw / 1000 : dlSpeedRaw;
    const uploadSpeedVal =
      uploadUnit === "Gbps" ? ulSpeedRaw / 1000 : ulSpeedRaw;

    // Semua nilai baru (mencakup semua kolom)
    const newValues = {
      name_package: this.formData.name,
      type_package: this.formData.category?.toLowerCase(),
      speed_mbps: dlSpeedRaw,
      download_speed: downloadSpeedVal,
      download_unit: downloadUnit,
      upload_speed: uploadSpeedVal,
      upload_unit: uploadUnit,
      quota_limit_gb: null,
      price_per_month: Number(this.formData.price),
      installation_cost: Number(this.formData.setup_fee) || 0,
      package_description: this.formData.description,
      icon_package: this.formData.icon,
      package_features: JSON.stringify(this.formData.features || []),
      is_recommended: this.formData.is_bestseller ? 1 : 0,
      package_status:
        this.formData.status === "published" ? "active" : "inactive",
      is_active: this.formData.is_active ? 1 : 0,
    };

    console.log("DEBUG - originalData:", this.originalData);
    console.log("DEBUG - newValues:", newValues);

    // Diff: hanya ambil field yang berbeda dari originalData
    const changedFields = {};
    for (const [key, newVal] of Object.entries(newValues)) {
      const oldVal = this.originalData[key];
      const isDifferent = String(oldVal ?? "") !== String(newVal ?? "");
      console.log(
        `DEBUG - Key: ${key}, Old: "${oldVal}", New: "${newVal}", Different: ${isDifferent}`,
      );
      if (isDifferent) {
        changedFields[key] = newVal;
      }
    }

    // Bangun payload PATCH (kembalikan stringified array ke array asli jika berubah)
    const payload = {};
    for (const [key, val] of Object.entries(changedFields)) {
      if (key === "package_features") {
        payload[key] = JSON.parse(val);
      } else {
        payload[key] = val;
      }
    }

    console.log("Changed fields:", changedFields);
    console.log("Full payload PATCH:", payload);

    this.dispatchEvent(
      new CustomEvent("wizard-submit", {
        bubbles: true,
        detail: {
          id: this.packageId,
          payload,
          hasChanges: Object.keys(payload).length > 0,
        },
      }),
    );
  }

  // ─────────────────────────────────────────────
  // UI Helpers
  // ─────────────────────────────────────────────
  _renderLoading() {
    this.innerHTML = /*html*/ `
      <div class="flex flex-col items-center justify-center py-24 gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/50 text-sm">Memuat data paket...</p>
      </div>
    `;
  }

  _renderError(msg) {
    this.innerHTML = /*html*/ `
      <div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="font-bold text-base-content text-lg">Gagal Memuat Paket</h3>
        <p class="text-base-content/50 text-sm max-w-sm">${msg}</p>
        <button onclick="history.back()"
          class="px-6 py-2 rounded-full border border-base-300 text-base-content/60 text-sm font-bold hover:bg-base-200 transition-all">
          Kembali
        </button>
      </div>
    `;
  }
}

customElements.define("wizard-edit-package", WizardEditPackage);
