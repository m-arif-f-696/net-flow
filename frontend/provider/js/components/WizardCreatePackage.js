export default class WizardCreatePackage extends HTMLElement {
  connectedCallback() {
    this.currentStep = 1;
    this.formData = {};
    this.render();
    this.bindEvents();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="w-full max-w-6xl mx-auto flex flex-col gap-8">

        <!-- Progress Bar -->
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

  renderStep(num, icon, label) {
    const isCompleted = this.currentStep > num;
    const isActive = this.currentStep === num;
    return /*html*/ `
      <div class="flex flex-col items-center relative flex-1 ">
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all duration-300
          ${isCompleted ? "bg-primary text-white" : isActive ? "bg-primary text-white ring-4 ring-primary/20" : "bg-neutral/10 text-neutral/40"}">
          ${
            isCompleted
              ? `<span class="material-symbols-outlined text-xl">check</span>`
              : icon === "check"
                ? `<span class="material-symbols-outlined text-xl">check</span>`
                : `<span>${icon}</span>`
          }
        </div>
        <span class="mt-2 text-xs uppercase tracking-widest font-bold
          ${isActive ? "text-primary" : isCompleted ? "text-primary/60" : "text-neutral/30"}">
          ${label}
        </span>
      </div>
    `;
  }

  renderStep1() {
    const availableIcons = [
      "rocket_launch",
      "bolt",
      "wifi",
      "router",
      "hub",
      "lan",
      "cell_tower",
      "satellite_alt",
      "signal_cellular_alt",
      "network_check",
      "speed",
      "cloud",
      "dns",
      "home",
      "business",
      "apartment",
      "videogame_asset",
      "smart_display",
      "computer",
      "devices",
    ];

    const selectedIcon = this.formData.icon || "";
    const features = this.formData.features || [""];

    return /*html*/ `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Form -->
      <div class="lg:col-span-7 flex flex-col gap-8">
        <div class="bg-base-100 p-8 rounded-2xl shadow-sm border border-neutral/10 flex flex-col gap-10">

          <!-- Icon Picker -->
          <div>
            <label class="block text-xs font-bold text-primary mb-4 uppercase tracking-wide">
              Logo / Ikon Paket
            </label>
            <div class="grid grid-cols-5 sm:grid-cols-10 gap-2" id="icon-group">
              ${availableIcons
                .map(
                  (icon) => /*html*/ `
                <label class="relative cursor-pointer group" title="${icon}">
                  <input class="peer sr-only" name="icon" type="radio" value="${icon}" ${selectedIcon === icon ? "checked" : ""} />
                  <div class="w-full aspect-square rounded-xl border border-neutral/10 bg-base-200
                    peer-checked:bg-primary/10 peer-checked:border-primary/40
                    group-hover:bg-base-300 transition-all
                    flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl
                      peer-checked:text-primary"
                      style="${selectedIcon === icon ? "font-variation-settings:'FILL' 1" : ""}">
                      ${icon}
                    </span>
                  </div>
                </label>
              `,
                )
                .join("")}
            </div>
            <p class="text-error text-xs mt-2 hidden" id="err-icon">Pilih ikon paket.</p>
          </div>

          <!-- Package Name -->
          <div>
            <label class="block text-xs font-bold text-primary mb-2 uppercase tracking-wide" for="package-name">
              Nama Paket
            </label>
            <input
              id="package-name"
              name="name"
              type="text"
              placeholder="e.g. Velocity Fiber Pro"
              value="${this.formData.name || ""}"
              class="w-full bg-transparent border-0 border-b border-neutral/20 py-3 px-0 text-2xl font-bold focus:ring-0 focus:border-primary focus:outline-none transition-all placeholder:text-neutral/30"
              required />
            <p class="text-error text-xs mt-1 hidden" id="err-name">Nama paket wajib diisi.</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-bold text-primary mb-2 uppercase tracking-wide" for="description">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Deskripsikan target pengguna dan keunggulan paket ini..."
              rows="3"
              class="w-full bg-transparent border-0 border-b border-neutral/20 py-3 px-0 focus:ring-0 focus:border-primary focus:outline-none transition-all placeholder:text-neutral/30 resize-none"
              required>${this.formData.description || ""}</textarea>
            <p class="text-error text-xs mt-1 hidden" id="err-description">Deskripsi wajib diisi.</p>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-bold text-primary mb-6 uppercase tracking-wide">
              Kategori Layanan
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="category-group">
              ${["Fiber", "Broadband", "Satellite"]
                .map((cat, i) => {
                  const icons = ["flare", "router", "satellite_alt"];
                  const checked = this.formData.category === cat;
                  return /*html*/ `
                  <label class="relative cursor-pointer group">
                    <input class="peer sr-only" name="category" type="radio" value="${cat}" ${checked ? "checked" : ""} required />
                    <div class="p-4 rounded-xl border border-neutral/10 bg-base-200 peer-checked:bg-primary/10 peer-checked:border-primary/30 transition-all group-hover:bg-base-300 flex flex-col items-center gap-3">
                      <span class="material-symbols-outlined text-3xl">${icons[i]}</span>
                      <span class="font-bold text-sm">${cat}</span>
                    </div>
                  </label>
                `;
                })
                .join("")}
            </div>
            <p class="text-error text-xs mt-2 hidden" id="err-category">Pilih kategori layanan.</p>
          </div>

          <!-- Features List -->
          <div>
            <label class="block text-xs font-bold text-primary mb-4 uppercase tracking-wide">
              Fitur Paket
            </label>
            <div class="flex flex-col gap-3" id="features-list">
              ${features
                .map(
                  (f, idx) => /*html*/ `
                <div class="flex items-center gap-3 feature-item">
                  <span class="material-symbols-outlined text-primary/40 shrink-0 text-lg">check_circle</span>
                  <input
                    type="text"
                    name="feature"
                    placeholder="e.g. Tanpa Batas Data"
                    value="${f}"
                    class="flex-1 bg-transparent border-0 border-b border-neutral/20 py-2 px-0 text-sm focus:ring-0 focus:border-primary focus:outline-none transition-all placeholder:text-neutral/30" />
                  <button type="button" class="btn-remove-feature w-8 h-8 rounded-full flex items-center justify-center text-neutral/30 hover:text-error hover:bg-error/10 transition-all ${features.length === 1 ? "invisible" : ""}">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              `,
                )
                .join("")}
            </div>
            <button type="button" id="btn-add-feature"
              class="mt-4 flex items-center gap-2 text-sm text-primary font-bold hover:opacity-70 transition-opacity">
              <span class="material-symbols-outlined text-sm">add_circle</span>
              Tambah Fitur
            </button>
            <p class="text-error text-xs mt-2 hidden" id="err-features">Tambahkan minimal satu fitur.</p>
          </div>

          <!-- Action -->
          <div class="flex justify-end pt-6 border-t border-neutral/10">
            <button type="button" id="btn-next-1"
              class="px-10 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              Selanjutnya
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Side Info -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <!-- Live Preview Card -->
        <div class="bg-base-200 rounded-2xl p-6 border border-neutral/10 flex flex-col gap-4">
          <p class="text-[10px] font-bold uppercase tracking-widest text-base-content/40">Preview Kartu</p>
          <div class="bg-base-100 rounded-xl p-5 border border-neutral/10 flex flex-col gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-2xl" id="preview-icon" style="font-variation-settings:'FILL' 1">
                ${selectedIcon || "wifi"}
              </span>
            </div>
            <p class="font-bold text-lg" id="preview-name">${this.formData.name || "Nama Paket"}</p>
            <p class="text-xs text-base-content/50" id="preview-desc">${this.formData.description || "Deskripsi paket akan muncul di sini."}</p>
            <div class="flex flex-col gap-1 mt-1" id="preview-features">
              ${
                features
                  .filter((f) => f)
                  .map(
                    (f) => /*html*/ `
                <div class="flex items-center gap-2 text-xs text-base-content/60">
                  <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                  ${f}
                </div>
              `,
                  )
                  .join("") ||
                `<p class="text-xs text-base-content/30 italic">Belum ada fitur.</p>`
              }
            </div>
          </div>
        </div>

        <div class="rounded-2xl overflow-hidden h-48 relative shadow-xl">
          <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800" alt="Fiber optic" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <p class="text-white font-bold">Powering the Next Generation of Connectivity</p>
          </div>
        </div>

        <div class="bg-base-200 p-6 rounded-2xl flex flex-col gap-4">
          <h3 class="font-bold">Tips Penamaan</h3>
          <div class="space-y-3">
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings:'FILL' 1">lightbulb</span>
              </div>
              <div>
                <p class="text-sm font-bold">Gunakan Peringkat Bertingkat</p>
                <p class="text-xs text-base-content/60">Kata seperti "Pro", "Ultra", atau "Max" membantu pelanggan memahami hierarki paket.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings:'FILL' 1">visibility</span>
              </div>
              <div>
                <p class="text-sm font-bold">Kejelasan adalah Kunci</p>
                <p class="text-xs text-base-content/60">Pastikan deskripsi menonjolkan manfaat utama — gaming, streaming, atau produktivitas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  renderStep2() {
    return /*html*/ `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <!-- Form -->
        <div class="lg:col-span-7 space-y-12">

          <!-- Speed -->
          <section class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">speed</span>
              </div>
              <h2 class="font-bold text-xl">Kecepatan Jaringan</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-wider text-base-content/50">Download Speed (Mbps)</label>
                <input
                  name="download_speed"
                  type="number"
                  placeholder="e.g. 1000"
                  value="${this.formData.download_speed || ""}"
                  class="w-full bg-transparent border-0 border-b border-neutral/20 focus:ring-0 focus:border-primary focus:outline-none py-3 px-0 text-xl font-bold transition-all"
                  required min="1" />
                <p class="text-error text-xs mt-1 hidden" id="err-download">Download speed wajib diisi.</p>
              </div>
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-wider text-base-content/50">Upload Speed (Mbps)</label>
                <input
                  name="upload_speed"
                  type="number"
                  placeholder="e.g. 500"
                  value="${this.formData.upload_speed || ""}"
                  class="w-full bg-transparent border-0 border-b border-neutral/20 focus:ring-0 focus:border-primary focus:outline-none py-3 px-0 text-xl font-bold transition-all"
                  required min="1" />
                <p class="text-error text-xs mt-1 hidden" id="err-upload">Upload speed wajib diisi.</p>
              </div>
            </div>
            <p class="text-sm text-base-content/50 italic">Kecepatan simetris direkomendasikan untuk paket "Enterprise" dan "Pro".</p>
          </section>

          <!-- Router Hardware -->
          <section class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">router</span>
              </div>
              <h2 class="font-bold text-xl">Hardware Router Default</h2>
            </div>
            <div class="grid grid-cols-1 gap-4" id="router-group">
              ${[
                {
                  value: "gigamesh",
                  name: "EtherFlow GigaMesh v4",
                  desc: "WiFi 6 standar, 4 antena, maks 1.2Gbps.",
                  badge: "Included",
                  badgeClass: "bg-primary/10 text-primary",
                },
                {
                  value: "velocitymesh",
                  name: "Velocity Mesh X-Pro",
                  desc: "WiFi 6E Tri-band, AI Traffic, maks 5Gbps.",
                  badge: "+Rp 75.000/bln",
                  badgeClass: "bg-neutral/10 text-neutral",
                },
                {
                  value: "byo",
                  name: "BYO Device (Tanpa Router)",
                  desc: "Pelanggan menggunakan perangkat sendiri. Hanya perlu ONT.",
                  badge: null,
                },
              ]
                .map(
                  (r) => /*html*/ `
                <label class="group relative flex items-center gap-6 p-6 rounded-2xl bg-base-200 border border-transparent hover:border-primary/20 hover:bg-base-100 transition-all cursor-pointer">
                  <input class="radio radio-primary" name="router" type="radio" value="${r.value}" ${this.formData.router === r.value ? "checked" : ""} required />
                  <div class="flex-1">
                    <h3 class="font-bold">${r.name}</h3>
                    <p class="text-sm text-base-content/60">${r.desc}</p>
                  </div>
                  ${r.badge ? `<span class="hidden sm:inline px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${r.badgeClass}">${r.badge}</span>` : ""}
                </label>
              `,
                )
                .join("")}
            </div>
            <p class="text-error text-xs mt-1 hidden" id="err-router">Pilih hardware router.</p>
          </section>

          <!-- Navigation -->
          <div class="flex justify-between pt-6 border-t border-neutral/10">
            <button type="button" id="btn-back-2"
              class="flex items-center gap-2 px-8 py-3 font-bold text-base-content/50 hover:text-base-content transition-colors">
              <span class="material-symbols-outlined">arrow_back</span> Kembali
            </button>
            <button type="button" id="btn-next-2"
              class="px-10 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              Selanjutnya
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div class="lg:col-span-5 sticky top-24">
          <div class="bg-base-100 rounded-3xl p-8 border border-neutral/10 shadow-xl space-y-8">
            <h4 class="font-bold text-lg">Preview Infrastruktur</h4>
            <div class="space-y-4">
              <div class="p-5 rounded-2xl bg-base-200">
                <p class="text-[10px] font-bold uppercase tracking-widest text-base-content/50 mb-2">Nama Paket</p>
                <p class="font-bold text-xl">${this.formData.name || "—"}</p>
              </div>
              <div class="p-5 rounded-2xl bg-base-200">
                <p class="text-[10px] font-bold uppercase tracking-widest text-base-content/50 mb-4">Kecepatan</p>
                <div class="flex gap-4 items-end">
                  <div class="flex-1">
                    <p class="text-xs text-base-content/50">Download</p>
                    <p class="font-bold text-2xl text-primary">${this.formData.download_speed || "—"}<span class="text-sm font-medium ml-1">Mbps</span></p>
                  </div>
                  <div class="w-px h-8 bg-neutral/20"></div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/50">Upload</p>
                    <p class="font-bold text-2xl text-primary">${this.formData.upload_speed || "—"}<span class="text-sm font-medium ml-1">Mbps</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStep3() {
    return /*html*/ `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Form -->
        <div class="lg:col-span-8 space-y-8">

          <!-- Pricing -->
          <section class="bg-base-100 rounded-2xl p-8 border border-neutral/10 shadow-sm">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">payments</span>
              </div>
              <h3 class="font-bold text-xl">Strategi Harga</h3>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-widest text-primary">Biaya Bulanan (Rp)</label>
                <div class="relative">
                  <span class="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-base-content/40 text-xl">Rp</span>
                  <input
                    name="price"
                    type="number"
                    placeholder="0"
                    value="${this.formData.price || ""}"
                    class="w-full bg-transparent border-0 border-b border-neutral/20 py-4 pl-10 font-bold text-2xl focus:outline-none focus:border-primary transition-colors focus:ring-0"
                    required min="0" />
                </div>
                <p class="text-error text-xs mt-1 hidden" id="err-price">Harga wajib diisi.</p>
                <p class="text-xs text-base-content/40 italic">Siklus penagihan mulai saat aktivasi.</p>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-widest text-primary">Biaya Pemasangan (Rp)</label>
                <div class="relative">
                  <span class="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-base-content/40 text-xl">Rp</span>
                  <input
                    name="setup_fee"
                    type="number"
                    placeholder="0"
                    value="${this.formData.setup_fee || ""}"
                    class="w-full bg-transparent border-0 border-b border-neutral/20 py-4 pl-10 font-bold text-2xl focus:outline-none focus:border-primary transition-colors focus:ring-0"
                    min="0" />
                </div>
                <p class="text-xs text-base-content/40 italic">Termasuk kunjungan teknisi dan sewa perangkat.</p>
              </div>
            </div>
          </section>

          <!-- Visibility -->
          <section class="bg-base-100 rounded-2xl p-8 border border-neutral/10 shadow-sm">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">visibility</span>
              </div>
              <h3 class="font-bold text-xl">Visibilitas Marketplace</h3>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-6 rounded-2xl bg-base-200 hover:bg-base-300 transition-colors group">
                <div class="flex gap-4">
                  <span class="material-symbols-outlined text-primary">public</span>
                  <div>
                    <h4 class="font-bold">Tampilkan di Marketplace</h4>
                    <p class="text-sm text-base-content/60">Paket dapat ditemukan oleh semua pelanggan baru dan lama.</p>
                  </div>
                </div>
                <input type="checkbox" name="is_visible" class="toggle toggle-primary" ${this.formData.is_visible !== false ? "checked" : ""} />
              </div>
              <div class="flex items-center justify-between p-6 rounded-2xl bg-base-200 hover:bg-base-300 transition-colors group">
                <div class="flex gap-4">
                  <span class="material-symbols-outlined text-primary">military_tech</span>
                  <div>
                    <h4 class="font-bold">Badge Terlaris</h4>
                    <p class="text-sm text-base-content/60">Tampilkan badge "Paket Terlaris" di kartu marketplace.</p>
                  </div>
                </div>
                <input type="checkbox" name="is_bestseller" class="toggle toggle-primary" ${this.formData.is_bestseller ? "checked" : ""} />
              </div>
            </div>
          </section>

          <!-- Navigation -->
          <div class="flex items-center justify-between pt-4">
            <button type="button" id="btn-back-3"
              class="flex items-center gap-2 px-8 py-3 font-bold text-base-content/50 hover:text-base-content transition-colors">
              <span class="material-symbols-outlined">arrow_back</span> Kembali
            </button>
            <div class="flex gap-4">
              <button type="button" id="btn-draft"
                class="px-8 py-3 bg-neutral/10 text-base-content font-bold rounded-xl hover:bg-neutral/20 transition-colors">
                Simpan Draft
              </button>
              <button type="button" id="btn-publish"
                class="px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                Publikasikan Paket
              </button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <aside class="lg:col-span-4">
          <div class="sticky top-24">
            <div class="bg-base-100 rounded-3xl p-8 border border-neutral/10 shadow-xl">
              <p class="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Ringkasan Paket</p>
              <div class="mb-8">
                <h4 class="font-extrabold text-2xl mb-2">${this.formData.name || "—"}</h4>
                <span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">${this.formData.category || "—"}</span>
              </div>
              <div class="space-y-6 mb-8">
                <div class="flex justify-between">
                  <div>
                    <p class="text-[11px] font-bold text-base-content/40 uppercase mb-1">Download</p>
                    <p class="font-bold text-xl">${this.formData.download_speed || "—"} Mbps</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[11px] font-bold text-base-content/40 uppercase mb-1">Upload</p>
                    <p class="font-bold text-xl">${this.formData.upload_speed || "—"} Mbps</p>
                  </div>
                </div>
                <div class="h-px bg-neutral/10 w-full"></div>
              </div>
              <div class="bg-primary p-6 rounded-3xl text-white">
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Total Bulanan</p>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-bold">Rp</span>
                  <span class="text-4xl font-extrabold" id="summary-price">${this.formData.price ? Number(this.formData.price).toLocaleString("id-ID") : "0"}</span>
                </div>
                <div class="mt-4 pt-4 border-t border-white/10 flex justify-between">
                  <span class="text-xs opacity-80">Biaya Pasang</span>
                  <span class="text-sm font-bold" id="summary-setup">Rp ${this.formData.setup_fee ? Number(this.formData.setup_fee).toLocaleString("id-ID") : "0"}</span>
                </div>
              </div>
            </div>
            <div class="mt-6 p-6 rounded-2xl bg-base-200 border border-neutral/10">
              <div class="flex gap-4">
                <span class="material-symbols-outlined text-primary/40">info</span>
                <p class="text-xs text-base-content/60 leading-relaxed">
                  <span class="font-bold text-base-content">Kebijakan Publikasi:</span>
                  Perubahan pada paket aktif hanya berlaku untuk pelanggan baru. Pelanggan lama tetap di paket lama.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  validateStep(step) {
    let valid = true;

    if (step === 1) {
      const name = this.querySelector("[name='name']").value.trim();
      const desc = this.querySelector("[name='description']").value.trim();
      const category = this.querySelector("[name='category']:checked");
      const featureInputs = [...this.querySelectorAll("[name='feature']")]
        .map((i) => i.value.trim())
        .filter(Boolean);
      const icon = this.querySelector("[name='icon']:checked");
      // icon

      this.toggleError("err-icon", !icon);
      if (!icon) valid = false;
      else this.formData.icon = icon.value;

      // features
      this.toggleError("err-features", featureInputs.length === 0);
      if (featureInputs.length === 0) valid = false;
      else this.formData.features = featureInputs;

      this.toggleError("err-name", !name);
      this.toggleError("err-description", !desc);
      this.toggleError("err-category", !category);

      if (!name || !desc || !category) valid = false;
      else {
        this.formData.name = name;
        this.formData.description = desc;
        this.formData.category = category.value;
      }
    }

    if (step === 2) {
      const download = this.querySelector("[name='download_speed']").value;
      const upload = this.querySelector("[name='upload_speed']").value;
      const router = this.querySelector("[name='router']:checked");

      this.toggleError("err-download", !download);
      this.toggleError("err-upload", !upload);
      this.toggleError("err-router", !router);

      if (!download || !upload || !router) valid = false;
      else {
        this.formData.download_speed = download;
        this.formData.upload_speed = upload;
        this.formData.router = router.value;
      }
    }

    return valid;
  }

  toggleError(id, show) {
    const el = this.querySelector(`#${id}`);
    if (el) el.classList.toggle("hidden", !show);
  }

  collectStep3() {
    const price = this.querySelector("[name='price']").value;
    const setup_fee = this.querySelector("[name='setup_fee']").value;
    const is_visible = this.querySelector("[name='is_visible']").checked;
    const is_bestseller = this.querySelector("[name='is_bestseller']").checked;

    this.toggleError("err-price", !price);
    if (!price) return false;

    this.formData.price = price;
    this.formData.setup_fee = setup_fee || 0;
    this.formData.is_visible = is_visible;
    this.formData.is_bestseller = is_bestseller;
    return true;
  }

  goToStep(step) {
    const direction = step > this.currentStep ? "forward" : "back";
    this.currentStep = step;
    this.render();
    this.bindEvents();

    // tambahkan class animasi sesuai arah
    const stepEl = this.querySelector(`#step-${step}`);
    stepEl?.classList.add(
      direction === "forward" ? "step-slide" : "step-slide-back",
    );

    this.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  bindEvents() {
    // Step 1 next
    this.querySelector("#btn-next-1")?.addEventListener("click", () => {
      if (this.validateStep(1)) this.goToStep(2);
    });

    // Step 2 nav
    this.querySelector("#btn-back-2")?.addEventListener("click", () =>
      this.goToStep(1),
    );
    this.querySelector("#btn-next-2")?.addEventListener("click", () => {
      if (this.validateStep(2)) this.goToStep(3);
    });

    // Step 3 nav
    this.querySelector("#btn-back-3")?.addEventListener("click", () =>
      this.goToStep(2),
    );

    this.querySelector("#btn-draft")?.addEventListener("click", () => {
      if (this.collectStep3()) {
        this.formData.status = "draft";
        this.dispatchSubmit();
      }
    });

    this.querySelector("#btn-publish")?.addEventListener("click", () => {
      if (this.collectStep3()) {
        this.formData.status = "published";
        this.dispatchSubmit();
      }
    });
    // Icon picker — update preview saat dipilih
    this.querySelectorAll("[name='icon']").forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const icon = e.target.value;
        this.querySelector("#preview-icon").textContent = icon;
      });
    });

    // Live preview nama & deskripsi
    this.querySelector("[name='name']")?.addEventListener("input", (e) => {
      this.querySelector("#preview-name").textContent =
        e.target.value || "Nama Paket";
    });
    this.querySelector("[name='description']")?.addEventListener(
      "input",
      (e) => {
        this.querySelector("#preview-desc").textContent =
          e.target.value || "Deskripsi paket akan muncul di sini.";
      },
    );

    // Tambah fitur baru
    this.querySelector("#btn-add-feature")?.addEventListener("click", () => {
      const list = this.querySelector("#features-list");
      const item = document.createElement("div");
      item.className = "flex items-center gap-3 feature-item";
      item.innerHTML = /*html*/ `
    <span class="material-symbols-outlined text-primary/40 shrink-0 text-lg">check_circle</span>
    <input type="text" name="feature" placeholder="e.g. Tanpa Batas Data"
      class="flex-1 bg-transparent border-0 border-b border-neutral/20 py-2 px-0 text-sm focus:ring-0 focus:border-primary focus:outline-none transition-all placeholder:text-neutral/30" />
    <button type="button" class="btn-remove-feature w-8 h-8 rounded-full flex items-center justify-center text-neutral/30 hover:text-error hover:bg-error/10 transition-all">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;
      list.appendChild(item);
      item.querySelector("input").focus();
      this.updateRemoveButtons();
      this.bindFeaturePreview();
    });

    // Hapus fitur (delegasi)
    this.querySelector("#features-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-remove-feature");
      if (btn) {
        btn.closest(".feature-item").remove();
        this.updateRemoveButtons();
      }
    });

    this.bindFeaturePreview();

    // Live update summary card step 3
    const priceInput = this.querySelector("[name='price']");
    const setupInput = this.querySelector("[name='setup_fee']");

    const updateSummary = () => {
      const price = priceInput?.value;
      const setup = setupInput?.value;

      this.querySelector("#summary-price").textContent = price
        ? Number(price).toLocaleString("id-ID")
        : "0";
      this.querySelector("#summary-setup").textContent =
        "Rp " + (setup ? Number(setup).toLocaleString("id-ID") : "0");
    };

    priceInput?.addEventListener("input", updateSummary);
    setupInput?.addEventListener("input", updateSummary);
  }

  updateRemoveButtons() {
    const items = this.querySelectorAll(".feature-item");
    items.forEach((item) => {
      const btn = item.querySelector(".btn-remove-feature");
      btn.classList.toggle("invisible", items.length === 1);
    });
  }

  bindFeaturePreview() {
    this.querySelector("#features-list")?.addEventListener("input", () => {
      const values = [...this.querySelectorAll("[name='feature']")]
        .map((i) => i.value.trim())
        .filter(Boolean);
      const preview = this.querySelector("#preview-features");
      preview.innerHTML = values.length
        ? values
            .map(
              (f) =>
                `<div class="flex items-center gap-2 text-xs text-base-content/60"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>${f}</div>`,
            )
            .join("")
        : `<p class="text-xs text-base-content/30 italic">Belum ada fitur.</p>`;
    });
  }

  dispatchSubmit() {
    this.dispatchEvent(
      new CustomEvent("wizard-submit", {
        bubbles: true,
        detail: this.formData,
      }),
    );
  }
}

customElements.define("wizard-create-package", WizardCreatePackage);
