import config from "../../../js/config.js";
import { getProfile, switchRole } from "../../../js/AuthController.js";
import NotificationAlert from "../../../components/NotificationAlert.js";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const _formData = {
  name_company: "",
  nib: "",
  contact_cs: "",
  area_code: "", // kode kelurahan/desa kantor
  coordinate_point: "", // koordinat kantor
  address: "", // alamat detail kantor
  coverage_area: "", // kode wilayah jangkauan terendah yang dipilih
  logo_provider: null, // File object
};

// Label untuk recap (nama wilayah)
const _labels = {
  area: "",
  coverage: "",
};

let _currentStep = 1;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Check Authentication & Onboarding status
  try {
    const user = await getProfile();
    if (user.code === 401) {
      window.location.href = "../login.html";
      return;
    } else if (user.user.onboarding !== "register") {
      window.location.href = "dashboard.html";
      return;
    } else if (user.user.role !== "provider") {
      switchRole(user.user.role);
      return;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    window.location.href = "../login.html";
    return;
  }

  _bindStep1();
  _bindStep2();
  _bindStep3();
  _bindLogoUpload();

  // Load provinsi untuk kedua dropdown
  await Promise.all([
    _loadProvinsi("area-provinsi"),
    _loadProvinsi("cov-provinsi"),
  ]);
});

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function _goTo(step) {
  // Sembunyikan semua step
  [1, 2, 3].forEach((n) => {
    document
      .getElementById(`step-${n}`)
      ?.classList.toggle("hidden", n !== step);
  });

  _currentStep = step;
  _updateProgressUI(step);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function _updateProgressUI(step) {
  [1, 2, 3].forEach((n) => {
    const indicator = document.getElementById(`step-indicator-${n}`);
    if (!indicator) return;

    const circle = indicator.querySelector("div");
    const label = indicator.querySelector("span");

    const isDone = n < step;
    const isActive = n === step;

    if (isDone) {
      circle.className =
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-primary text-primary-content";
      circle.innerHTML = `<span class="material-symbols-outlined text-sm">check</span>`;
      label.className =
        "mt-2 text-[10px] uppercase tracking-widest font-bold text-primary/60";
    } else if (isActive) {
      circle.className =
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-primary text-primary-content ring-4 ring-primary/20";
      circle.innerHTML = String(n);
      label.className =
        "mt-2 text-[10px] uppercase tracking-widest font-bold text-primary";
    } else {
      circle.className =
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 bg-base-300 text-base-content/40";
      circle.innerHTML = String(n);
      label.className =
        "mt-2 text-[10px] uppercase tracking-widest font-bold text-base-content/30";
    }
  });

  // Update garis connector
  document
    .getElementById("line-1-2")
    ?.classList.toggle("bg-primary", step >= 2);
  document
    .getElementById("line-1-2")
    ?.classList.toggle("bg-base-300", step < 2);
  document
    .getElementById("line-2-3")
    ?.classList.toggle("bg-primary", step >= 3);
  document
    .getElementById("line-2-3")
    ?.classList.toggle("bg-base-300", step < 3);
}

// ─────────────────────────────────────────────
// STEP 1 — Informasi Perusahaan
// ─────────────────────────────────────────────
function _bindStep1() {
  document.getElementById("btn-next-1")?.addEventListener("click", () => {
    if (!_validateStep1()) return;
    _goTo(2);
  });
}

function _validateStep1() {
  let valid = true;

  const name = document.getElementById("name_company").value.trim();
  const nib = document.getElementById("nib").value.trim();
  const contact = document.getElementById("contact_cs").value.trim();

  _toggleError("err-name_company", !name);
  _toggleError("err-nib", !nib || nib.length < 13);
  _toggleError("err-contact_cs", !contact);

  if (!name || !nib || nib.length < 13 || !contact) {
    valid = false;
  } else {
    _formData.name_company = name;
    _formData.nib = nib;
    _formData.contact_cs = "62" + contact.replace(/^0/, "");
  }

  return valid;
}

// ─────────────────────────────────────────────
// STEP 2 — Lokasi & Jangkauan
// ─────────────────────────────────────────────
function _bindStep2() {
  document
    .getElementById("btn-back-2")
    ?.addEventListener("click", () => _goTo(1));
  document.getElementById("btn-next-2")?.addEventListener("click", () => {
    if (!_validateStep2()) return;
    _fillRecap();
    _goTo(3);
  });

  // Helper helper update nilai wilayah kantor
  const updateOfficeArea = () => {
    const prov = document.getElementById("area-provinsi");
    const kab = document.getElementById("area-kabupaten");
    const kec = document.getElementById("area-kecamatan");
    const desa = document.getElementById("area-desa");

    let code = "";
    let labelParts = [];

    if (prov && prov.value) {
      code = prov.value;
      labelParts.push(prov.selectedOptions[0]?.text);
    }
    if (kab && kab.value) {
      code = kab.value;
      labelParts.push(kab.selectedOptions[0]?.text);
    }
    if (kec && kec.value) {
      code = kec.value;
      labelParts.push(kec.selectedOptions[0]?.text);
    }
    if (desa && desa.value) {
      code = desa.value;
      labelParts.push(desa.selectedOptions[0]?.text);
    }

    _formData.area_code = code;
    _labels.area = labelParts.filter(Boolean).join(", ");
  };

  // Helper helper update nilai coverage area
  const updateCoverageArea = () => {
    const prov = document.getElementById("cov-provinsi");
    const kab = document.getElementById("cov-kabupaten");
    const kec = document.getElementById("cov-kecamatan");
    const desa = document.getElementById("cov-desa");

    let code = "";
    let labelParts = [];

    if (prov && prov.value) {
      code = prov.value;
      labelParts.push(prov.selectedOptions[0]?.text);
    }
    if (kab && kab.value) {
      code = kab.value;
      labelParts.push(kab.selectedOptions[0]?.text);
    }
    if (kec && kec.value) {
      code = kec.value;
      labelParts.push(kec.selectedOptions[0]?.text);
    }
    if (desa && desa.value) {
      code = desa.value;
      labelParts.push(desa.selectedOptions[0]?.text);
    }

    _formData.coverage_area = code;
    _labels.coverage = labelParts.filter(Boolean).join(", ");
  };

  // Cascade dropdown area kantor
  document
    .getElementById("area-provinsi")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("area-kabupaten", "Pilih Kabupaten/Kota...");
      _resetSelect("area-kecamatan", "Pilih Kecamatan...");
      _resetSelect("area-desa", "Pilih Kelurahan/Desa...");
      updateOfficeArea();
      await _loadWilayah("area-kabupaten", "regency", kode);
    });

  document
    .getElementById("area-kabupaten")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("area-kecamatan", "Pilih Kecamatan...");
      _resetSelect("area-desa", "Pilih Kelurahan/Desa...");
      updateOfficeArea();
      await _loadWilayah("area-kecamatan", "district", kode);
    });

  document
    .getElementById("area-kecamatan")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("area-desa", "Pilih Kelurahan/Desa...");
      updateOfficeArea();
      await _loadWilayah("area-desa", "village", kode);
    });

  document.getElementById("area-desa")?.addEventListener("change", () => {
    updateOfficeArea();
  });

  // Cascade dropdown coverage area
  document
    .getElementById("cov-provinsi")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("cov-kabupaten", "Pilih Kabupaten/Kota...");
      _resetSelect("cov-kecamatan", "Pilih Kecamatan...");
      _resetSelect("cov-desa", "Pilih Kelurahan/Desa...");
      updateCoverageArea();
      await _loadWilayah("cov-kabupaten", "regency", kode);
    });

  document
    .getElementById("cov-kabupaten")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("cov-kecamatan", "Pilih Kecamatan...");
      _resetSelect("cov-desa", "Pilih Kelurahan/Desa...");
      updateCoverageArea();
      await _loadWilayah("cov-kecamatan", "district", kode);
    });

  document
    .getElementById("cov-kecamatan")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _resetSelect("cov-desa", "Pilih Kelurahan/Desa...");
      updateCoverageArea();
      await _loadWilayah("cov-desa", "village", kode);
    });

  document.getElementById("cov-desa")?.addEventListener("change", () => {
    updateCoverageArea();
  });
}

function _validateStep2() {
  let valid = true;

  const areaProvinsi = document.getElementById("area-provinsi").value;
  const areaKabupaten = document.getElementById("area-kabupaten").value;
  const areaKecamatan = document.getElementById("area-kecamatan").value;
  const areaDesa = document.getElementById("area-desa").value;
  const coordPoint = document.getElementById("coordinate_point").value.trim();
  const address = document.getElementById("address").value.trim();
  const covProvinsi = document.getElementById("cov-provinsi").value;

  _toggleError("err-area-provinsi", !areaProvinsi);
  _toggleError("err-area-kabupaten", !areaKabupaten);
  _toggleError("err-area-kecamatan", !areaKecamatan);
  _toggleError("err-area-desa", !areaDesa);
  _toggleError("err-coordinate_point", !coordPoint);
  _toggleError("err-address", !address);
  _toggleError("err-cov-provinsi", !covProvinsi);

  if (
    !areaProvinsi ||
    !areaKabupaten ||
    !areaKecamatan ||
    !areaDesa ||
    !coordPoint ||
    !address ||
    !covProvinsi
  ) {
    valid = false;
  } else {
    _formData.coordinate_point = coordPoint;
    _formData.address = address;
  }

  return valid;
}

// ─────────────────────────────────────────────
// STEP 3 — Rekap & Submit
// ─────────────────────────────────────────────
function _bindStep3() {
  document
    .getElementById("btn-back-3")
    ?.addEventListener("click", () => _goTo(2));
  document
    .getElementById("btn-submit")
    ?.addEventListener("click", _handleSubmit);
}

function _fillRecap() {
  document.getElementById("recap-name").textContent = _formData.name_company;
  document.getElementById("recap-nib").textContent = _formData.nib;
  document.getElementById("recap-contact").textContent =
    "+" + _formData.contact_cs;

  // Menampilkan Alamat Lengkap + Koordinat di Recap Lokasi Kantor
  const areaLabel = _labels.area || "—";
  const addressDetail = _formData.address ? `${_formData.address}, ` : "";
  const coordDetail = _formData.coordinate_point
    ? ` [Koord: ${_formData.coordinate_point}]`
    : "";
  document.getElementById("recap-area").textContent =
    `${addressDetail}${areaLabel}${coordDetail}`;

  document.getElementById("recap-coverage").textContent =
    _labels.coverage || "—";
}

async function _handleSubmit() {
  if (!_formData.logo_provider) {
    _toggleError("err-logo", true);
    return;
  }

  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  btn.innerHTML = `<span class="loading loading-spinner loading-sm"></span> Menyimpan...`;

  try {
    const formData = new FormData();
    formData.append("name_company", _formData.name_company);
    formData.append("nib", _formData.nib);
    formData.append("contact_cs", _formData.contact_cs);
    formData.append("area_code", _formData.area_code);
    formData.append("coordinate_point", _formData.coordinate_point);
    formData.append("address", _formData.address);
    formData.append("coverage_area", _formData.coverage_area);
    formData.append("logo_provider", _formData.logo_provider);

    const res = await fetch(`${config.API_BASE_URL}/provider/profile/setup`, {
      method: "POST",
      body: formData,
      // Jangan set Content-Type — biarkan browser set boundary multipart
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message ?? "Gagal menyimpan data.");

    // Tampilkan alert sukses dan logout setelah OK diklik
    const alertModal = document.getElementById("submit-success-alert");
    if (alertModal) {
      alertModal.setAttribute("title", "Setup Berhasil");
      alertModal.setAttribute(
        "message",
        "Profil provider Anda berhasil dikonfigurasi. Silakan klik OK untuk logout dan login kembali agar dapat menerapkan perubahan akun Anda.",
      );
      alertModal.setAttribute("color", "success");
      alertModal.render();
      alertModal.connectedCallback();
      alertModal.show();

      alertModal.addEventListener("onOk", async () => {
        try {
          const logoutRes = await fetch(`${config.API_BASE_URL}/auth/logout`, {
            method: "POST",
          });
          const logoutData = await logoutRes.json();
          if (logoutData.success) {
            window.location.href = "../login.html";
          } else {
            window.location.href = "../login.html";
          }
        } catch (logoutErr) {
          console.error("Logout error:", logoutErr);
          window.location.href = "../login.html";
        }
      });
    } else {
      window.location.href = "../login.html";
    }
  } catch (err) {
    console.error("Submit error:", err);
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Selesaikan Setup`;

    // Tampilkan toast error
    _showToast(err.message, "error");
  }
}

// ─────────────────────────────────────────────
// LOGO UPLOAD
// ─────────────────────────────────────────────
function _bindLogoUpload() {
  const area = document.getElementById("upload-area");
  const input = document.getElementById("logo-input");
  const preview = document.getElementById("logo-preview");
  const placeholder = document.getElementById("upload-placeholder");
  const btnChange = document.getElementById("btn-change-logo");

  area.addEventListener("click", () => input.click());

  // Drag & drop
  area.addEventListener("dragover", (e) => {
    e.preventDefault();
    area.classList.add("border-primary", "bg-primary/5");
  });
  area.addEventListener("dragleave", () => {
    area.classList.remove("border-primary", "bg-primary/5");
  });
  area.addEventListener("drop", (e) => {
    e.preventDefault();
    area.classList.remove("border-primary", "bg-primary/5");
    const file = e.dataTransfer.files[0];
    if (file) _handleLogoFile(file);
  });

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) _handleLogoFile(file);
  });

  btnChange.addEventListener("click", (e) => {
    e.stopPropagation();
    input.click();
  });

  function _handleLogoFile(file) {
    if (file.size > 2 * 1024 * 1024) {
      _showToast("File terlalu besar. Maks 2MB.", "error");
      return;
    }

    _formData.logo_provider = file;
    _toggleError("err-logo", false);

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
      btnChange.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
}

// ─────────────────────────────────────────────
// API — Wilayah
// ─────────────────────────────────────────────
async function _loadProvinsi(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Memuat provinsi...</option>`;

  try {
    const res = await fetch(`${config.API_BASE_URL}/location`);
    const json = await res.json();

    const options = (json.data ?? [])
      .map((p) => `<option value="${p.kode}">${p.nama}</option>`)
      .join("");

    select.innerHTML = `<option value="" disabled selected>Pilih Provinsi...</option>${options}`;
    select.disabled = false;
  } catch {
    select.innerHTML = `<option value="" disabled selected>Gagal memuat...</option>`;
  }
}

async function _loadWilayah(selectId, type, code) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Memuat...</option>`;
  select.disabled = true;

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/location?type=${type}&code=${code}`,
    );
    const json = await res.json();

    const options = (json.data ?? [])
      .map((w) => `<option value="${w.kode}">${w.nama}</option>`)
      .join("");

    select.innerHTML = `<option value="" disabled selected>Pilih...</option>${options}`;
    select.disabled = false;
  } catch {
    select.innerHTML = `<option value="" disabled selected>Gagal memuat...</option>`;
  }
}

function _resetSelect(selectId, placeholder) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
  select.disabled = true;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function _toggleError(id, show) {
  document.getElementById(id)?.classList.toggle("hidden", !show);
}

function _showToast(message, type = "info") {
  const existing = document.getElementById("onboarding-toast");
  existing?.remove();

  const alertClass = type === "error" ? "alert-error" : "alert-info";
  const toast = document.createElement("div");
  toast.id = "onboarding-toast";
  toast.className = "toast toast-top toast-center z-[999]";
  toast.innerHTML = `
    <div class="alert ${alertClass} text-sm font-semibold shadow-lg">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
