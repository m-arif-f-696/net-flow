// user/js/components/SupportPage.js

// ─── STATUS & SEVERITY CONFIG ───────────────────────────────────────────────
const STATUS_CONFIG = {
  open: { label: "Open", cls: "badge-info" },
  investigating: { label: "Investigating", cls: "badge-warning" },
  progress: { label: "In Progress", cls: "badge-primary" },
  resolved: { label: "Resolved", cls: "badge-success" },
};

const SEVERITY_CONFIG = {
  low: { label: "Rendah", cls: "badge-success", icon: "🟢" },
  medium: { label: "Sedang", cls: "badge-warning", icon: "🟡" },
  high: { label: "Tinggi", cls: "badge-error", icon: "🔴" },
};

const STEPS = ["open", "investigating", "progress", "resolved"];
const STEP_LABELS = {
  open: "Open",
  investigating: "Investigating",
  progress: "In Progress",
  resolved: "Resolved",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function renderStepper(currentStatus) {
  const currentIdx = STEPS.indexOf(currentStatus);
  const items = STEPS.map((step, i) => {
    const done = i <= currentIdx;
    return `<li class="step ${done ? "step-primary" : ""} text-[9px]">${STEP_LABELS[step]}</li>`;
  }).join("");
  return `<ul class="steps steps-horizontal w-full mt-3">${items}</ul>`;
}

function renderIssueCard(issue) {
  const status = STATUS_CONFIG[issue.status_issue] ?? {
    label: issue.status_issue,
    cls: "badge-neutral",
  };
  const sev = SEVERITY_CONFIG[issue.severity] ?? {
    label: issue.severity,
    cls: "badge-neutral",
    icon: "",
  };
  const date = new Date(issue.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return /* html */ `
    <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
      <input type="checkbox" />
      <div class="collapse-title pr-10">
        <div class="flex items-start justify-between gap-2">
          <span class="font-semibold text-sm leading-snug">${issue.title_issue}</span>
          <span class="badge ${status.cls} badge-sm shrink-0 mt-0.5">${status.label}</span>
        </div>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <span class="badge badge-ghost badge-sm text-[10px]">${sev.icon} ${sev.label}</span>
          <span class="text-base-content/40 text-[10px]">${date}</span>
        </div>
      </div>
      <div class="collapse-content text-sm text-base-content/70 space-y-3">
        <p class="leading-relaxed">${issue.description_issue}</p>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-base-content/40 mb-1">
            Progress Penanganan
          </p>
          ${renderStepper(issue.status_issue)}
        </div>
        <div class="pt-2 border-t border-base-200 text-[11px] text-base-content/40">
          Provider: <span class="font-semibold text-base-content/60">${issue.provider_name}</span>
          &nbsp;·&nbsp; Tiket #${issue.id_issue}
        </div>
      </div>
    </div>
  `;
}

// ─── TEMPLATE ───────────────────────────────────────────────────────────────
const template = document.createElement("template");
template.innerHTML = /* html */ `
<main class="mt-20 px-6 pt-6 pb-28 space-y-8 mx-auto">
  <!-- HEADER -->
  <section>
    <p class="text-[11px] uppercase tracking-widest text-primary font-bold mb-2">
      Support Center
    </p>
    <h2 class="text-4xl font-extrabold tracking-tight text-base-content leading-tight mb-2">
      Butuh bantuan?<br />
      <span class="text-primary/70">Kami siap membantu.</span>
    </h2>
    <p class="text-base-content/50 text-sm">
      Laporkan gangguan, pantau tiket, atau cari jawaban dari FAQ.
    </p>
  </section>

  <!-- BANNER LAPORAN -->
  <section>
    <div class="bg-error rounded-3xl p-5 flex items-center justify-between relative overflow-hidden gap-3">
      <div class="z-10 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-base-100 text-xl">warning</span>
          <span class="text-base text-base-100 font-bold leading-tight">Terjadi Gangguan?</span>
        </div>
        <p class="text-xs text-base-100/80 leading-relaxed">
          Ajukan tiket — tim kami siap memulihkan layanan Anda.
        </p>
      </div>
      <button
        id="btn-open-modal"
        class="z-10 bg-base-100 text-error font-bold px-4 py-2 rounded-full shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap shrink-0 text-sm"
      >
        + Buat Laporan
      </button>
      <div class="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  </section>

  <!-- MODAL BUAT LAPORAN -->
  <dialog id="modal-laporan" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box rounded-3xl">
      <h3 class="font-extrabold text-lg mb-1">Buat Laporan Baru</h3>
      <p class="text-base-content/50 text-xs mb-5">Isi detail gangguan yang Anda alami.</p>

      <!-- Subscription -->
      <fieldset class="fieldset mb-4">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/60">
          Paket Langganan
        </legend>
        <select id="select-subscription" class="select select-bordered w-full rounded-2xl">
          <option value="" disabled selected>Pilih Paket Langganan</option>
        </select>
        <p id="err-subscription" class="text-error text-xs mt-1 hidden">Silakan pilih paket langganan Anda.</p>
      </fieldset>

      <!-- Title -->
      <fieldset class="fieldset mb-4">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/60">
          Judul Laporan
        </legend>
        <input
          id="input-title"
          type="text"
          placeholder="cth. Indikator LOS modem merah"
          class="input input-bordered w-full rounded-2xl"
        />
        <p id="err-title" class="text-error text-xs mt-1 hidden">Judul wajib diisi.</p>
      </fieldset>

      <!-- Description -->
      <fieldset class="fieldset mb-4">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/60">
          Deskripsi Masalah
        </legend>
        <textarea
          id="input-desc"
          rows="4"
          placeholder="Jelaskan kapan terjadi, gejala yang muncul, langkah yang sudah dicoba, dll."
          class="textarea textarea-bordered w-full rounded-2xl resize-none"
        ></textarea>
        <p id="err-desc" class="text-error text-xs mt-1 hidden">Deskripsi wajib diisi.</p>
      </fieldset>

      <!-- Severity -->
      <fieldset class="fieldset mb-6">
        <legend class="fieldset-legend text-xs font-semibold text-base-content/60 mb-2">
          Tingkat Keparahan
        </legend>
        <div class="flex gap-2 flex-wrap" id="severity-group">
          <label class="severity-btn cursor-pointer">
            <input type="radio" name="severity" value="low" class="hidden" />
            <span class="badge badge-outline badge-lg px-4 py-3 rounded-xl select-none transition-all">
              🟢 Rendah
            </span>
          </label>
          <label class="severity-btn cursor-pointer">
            <input type="radio" name="severity" value="medium" class="hidden" />
            <span class="badge badge-outline badge-lg px-4 py-3 rounded-xl select-none transition-all">
              🟡 Sedang
            </span>
          </label>
          <label class="severity-btn cursor-pointer">
            <input type="radio" name="severity" value="high" class="hidden" />
            <span class="badge badge-outline badge-lg px-4 py-3 rounded-xl select-none transition-all">
              🔴 Tinggi
            </span>
          </label>
        </div>
        <p id="err-severity" class="text-error text-xs mt-2 hidden">Pilih tingkat keparahan.</p>
      </fieldset>

      <div class="modal-action flex gap-3 mt-0">
        <button id="btn-cancel-modal" class="btn btn-ghost rounded-2xl flex-1">Batal</button>
        <button id="btn-submit-report" class="btn btn-error text-white rounded-2xl flex-1">
          <span id="btn-submit-text">Kirim Laporan</span>
          <span id="btn-submit-spinner" class="loading loading-spinner loading-sm hidden"></span>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>tutup</button></form>
  </dialog>

  <!-- RIWAYAT LAPORAN -->
  <section>
    <div class="flex justify-between items-center mb-5">
      <h3 class="font-bold text-xl text-base-content">Riwayat Laporan</h3>
      <select id="filter-status" class="select select-sm select-bordered rounded-xl text-xs">
        <option value="all">Semua</option>
        <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>

    <!-- Skeleton -->
    <div id="issues-skeleton" class="space-y-3">
      <div class="skeleton h-16 rounded-2xl w-full"></div>
      <div class="skeleton h-16 rounded-2xl w-full"></div>
      <div class="skeleton h-16 rounded-2xl w-full"></div>
    </div>

    <!-- List -->
    <div id="issues-list" class="space-y-3 hidden"></div>

    <!-- Empty -->
    <div id="issues-empty" class="hidden text-center py-12">
      <div class="text-5xl mb-3">📭</div>
      <p class="text-base-content/50 text-sm font-medium">Belum ada laporan ditemukan.</p>
      <p class="text-base-content/30 text-xs mt-1">Coba ubah filter atau buat laporan baru.</p>
    </div>
  </section>

  <!-- FAQ -->
  <section>
    <h3 class="font-bold text-xl text-base-content mb-5">FAQ</h3>
    <div class="space-y-2">

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Apa itu ISP Marketplace?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          ISP Marketplace adalah platform yang mempertemukan pelanggan dengan berbagai penyedia layanan internet (ISP) di wilayah Anda. Anda bisa membandingkan paket, harga, dan ulasan sebelum berlangganan.
        </div>
      </div>

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Bagaimana cara mengganti paket internet?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          Buka menu <strong>Langganan</strong> → pilih paket aktif → tap <em>Ubah Paket</em>. Perubahan efektif di awal siklus tagihan berikutnya.
        </div>
      </div>

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Bagaimana cara melacak status laporan gangguan?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          Lihat bagian <strong>Riwayat Laporan</strong> di halaman ini. Setiap tiket punya stepper: <em>Open → Investigating → In Progress → Resolved</em>. Anda akan mendapat notifikasi saat status berubah.
        </div>
      </div>

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Apakah bisa punya lebih dari satu langganan aktif?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          Ya, ISP Marketplace mendukung beberapa langganan aktif dari ISP berbeda dalam satu akun — cocok untuk kebutuhan rumah dan kantor sekaligus.
        </div>
      </div>

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Apa arti tingkat keparahan (severity) laporan?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          <ul class="space-y-1 mt-1">
            <li>🟢 <strong>Rendah</strong> — Gangguan kecil, internet masih bisa digunakan.</li>
            <li>🟡 <strong>Sedang</strong> — Internet lambat / tidak stabil, mengganggu aktivitas.</li>
            <li>🔴 <strong>Tinggi</strong> — Internet mati total, tidak bisa terhubung.</li>
          </ul>
        </div>
      </div>

      <div class="collapse collapse-arrow bg-base-100 rounded-2xl shadow-sm border border-base-200">
        <input type="radio" name="faq" />
        <div class="collapse-title font-semibold text-sm">Bagaimana cara menghubungi ISP secara langsung?</div>
        <div class="collapse-content text-sm text-base-content/70 leading-relaxed">
          Buka profil ISP melalui menu <strong>Provider</strong>. Di sana tersedia kontak resmi: nomor telepon, email, dan live chat (jika tersedia).
        </div>
      </div>

    </div>
  </section>
</max>
`;

// ─── WEB COMPONENT ──────────────────────────────────────────────────────────
class SupportPage extends HTMLElement {
  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    this._bindModal();
    this._bindFilter();
    this._bindSeverity();
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  _bindModal() {
    const modal = this.querySelector("#modal-laporan");
    const btnOpen = this.querySelector("#btn-open-modal");
    const btnCancel = this.querySelector("#btn-cancel-modal");
    const btnSubmit = this.querySelector("#btn-submit-report");

    btnOpen.addEventListener("click", () => {
      this._resetModal();
      modal.showModal();
    });

    btnCancel.addEventListener("click", () => modal.close());

    btnSubmit.addEventListener("click", () => {
      if (!this._validate()) return;
      this.dispatchEvent(
        new CustomEvent("submit-report", {
          bubbles: true,
          detail: {
            id_subscription: this.querySelector("#select-subscription").value,
            title_issue: this.querySelector("#input-title").value.trim(),
            description_issue: this.querySelector("#input-desc").value.trim(),
            severity: this.querySelector("input[name='severity']:checked")
              ?.value,
          },
        }),
      );
    });
  }

  _bindSeverity() {
    const colorMap = {
      low: "badge-success",
      medium: "badge-warning",
      high: "badge-error",
    };
    this.querySelectorAll(".severity-btn").forEach((lbl) => {
      lbl.addEventListener("change", () => {
        // reset semua
        this.querySelectorAll(".severity-btn span").forEach((s) =>
          s.classList.remove("badge-success", "badge-warning", "badge-error"),
        );
        const radio = lbl.querySelector("input");
        lbl.querySelector("span").classList.add(colorMap[radio.value]);
      });
    });
  }

  _validate() {
    const sub = this.querySelector("#select-subscription").value;
    const title = this.querySelector("#input-title").value.trim();
    const desc = this.querySelector("#input-desc").value.trim();
    const sev = this.querySelector("input[name='severity']:checked");

    this.querySelector("#err-subscription").classList.toggle("hidden", !!sub);
    this.querySelector("#err-title").classList.toggle("hidden", !!title);
    this.querySelector("#err-desc").classList.toggle("hidden", !!desc);
    this.querySelector("#err-severity").classList.toggle("hidden", !!sev);

    return !!(sub && title && desc && sev);
  }

  _resetModal() {
    this.querySelector("#select-subscription").value = "";
    this.querySelector("#input-title").value = "";
    this.querySelector("#input-desc").value = "";
    this.querySelectorAll("input[name='severity']").forEach(
      (r) => (r.checked = false),
    );
    this.querySelectorAll(".severity-btn span").forEach((s) =>
      s.classList.remove("badge-success", "badge-warning", "badge-error"),
    );
    ["#err-subscription", "#err-title", "#err-desc", "#err-severity"].forEach(
      (sel) => this.querySelector(sel).classList.add("hidden"),
    );
    this.setSubmitLoading(false);
  }

  // ── Filter ───────────────────────────────────────────────────────────────
  _bindFilter() {
    this.querySelector("#filter-status").addEventListener("change", (e) => {
      this.dispatchEvent(
        new CustomEvent("filter-change", {
          bubbles: true,
          detail: { status: e.target.value },
        }),
      );
    });
  }

  // ── Public API (dipanggil oleh controller) ───────────────────────────────

  setSubscriptions(subscriptions = []) {
    const select = this.querySelector("#select-subscription");
    select.innerHTML =
      '<option value="" disabled selected>Pilih Paket Langganan</option>';

    // Hanya tampilkan langganan aktif
    const activeSubs = subscriptions.filter(
      (s) => s.status_subscription === "active",
    );

    activeSubs.forEach((s) => {
      const option = document.createElement("option");
      option.value = s.id_subscription;
      option.textContent = `${s.name_package} (${s.provider_name}) - ${s.download_speed} ${s.download_unit}`;
      select.appendChild(option);
    });
  }

  showSkeleton() {
    this.querySelector("#issues-skeleton").classList.remove("hidden");
    this.querySelector("#issues-list").classList.add("hidden");
    this.querySelector("#issues-empty").classList.add("hidden");
  }

  renderIssues(issues = []) {
    this.querySelector("#issues-skeleton").classList.add("hidden");

    const list = this.querySelector("#issues-list");
    const empty = this.querySelector("#issues-empty");

    if (issues.length === 0) {
      list.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }

    list.innerHTML = issues.map(renderIssueCard).join("");
    list.classList.remove("hidden");
    empty.classList.add("hidden");
  }

  setSubmitLoading(loading) {
    this.querySelector("#btn-submit-text").classList.toggle("hidden", loading);
    this.querySelector("#btn-submit-spinner").classList.toggle(
      "hidden",
      !loading,
    );
    this.querySelector("#btn-submit-report").disabled = loading;
  }

  closeModal() {
    this.querySelector("#modal-laporan").close();
  }
}

customElements.define("support-page", SupportPage);
