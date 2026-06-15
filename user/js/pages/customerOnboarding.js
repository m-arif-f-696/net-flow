import config from "../../../js/config.js";
import { getProfile, switchRole } from "../../../js/AuthController.js";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const _formData = {
  full_name: "",
  nik: "",
  gender: "",
  phone: "",
  address: "",
  area_code: "", // kode kecamatan (atau desa jika dipilih)
  coordinate_point: "", // opsional: "lat,lng"
  photo_profile: null, // opsional: File
};

const _labels = { area: "" };

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Check Authentication & Onboarding status
  try {
    const user = await getProfile();
    // Pastikan ngecek apakah variabel user itu ada atau tidak
    if (!user || user.code === 401) {
      window.location.href = "../login.html";
      return;
    } else if (user?.user?.onboarding === "complete") {
      window.location.href = "home.html";
      return;
    } else if (user?.user?.role !== "customer") {
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
  _bindPhotoUpload();

  await _loadProvinsi("area-provinsi");
});

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function _goTo(step) {
  [1, 2, 3].forEach((n) => {
    document
      .getElementById(`step-${n}`)
      ?.classList.toggle("hidden", n !== step);
  });
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
// STEP 1 — Data Diri
// ─────────────────────────────────────────────
function _bindStep1() {
  document.getElementById("btn-next-1")?.addEventListener("click", () => {
    if (_validateStep1()) _goTo(2);
  });
}

function _validateStep1() {
  const name = document.getElementById("full_name").value.trim();
  const nik = document.getElementById("nik").value.trim();
  const gender = document.querySelector("[name='gender']:checked")?.value;
  const phone = document.getElementById("phone").value.trim();

  _toggleError("err-full_name", !name);
  _toggleError("err-nik", !nik || nik.length !== 16 || !/^\d+$/.test(nik));
  _toggleError("err-gender", !gender);
  _toggleError("err-phone", !phone);

  if (
    !name ||
    !nik ||
    nik.length !== 16 ||
    !/^\d+$/.test(nik) ||
    !gender ||
    !phone
  )
    return false;

  _formData.full_name = name;
  _formData.nik = nik;
  _formData.gender = gender;
  _formData.phone = phone.replace(/^0/, "08").startsWith("08")
    ? phone
    : "0" + phone;
  return true;
}

// ─────────────────────────────────────────────
// STEP 2 — Alamat & Lokasi
// ─────────────────────────────────────────────
function _bindStep2() {
  document
    .getElementById("btn-back-2")
    ?.addEventListener("click", () => _goTo(1));
  document.getElementById("btn-next-2")?.addEventListener("click", () => {
    if (_validateStep2()) {
      _fillRecap();
      _goTo(3);
    }
  });

  // Cascade dropdown
  document
    .getElementById("area-provinsi")
    ?.addEventListener("change", async (e) => {
      _resetSelect("area-kabupaten", "Pilih Kabupaten/Kota...", true);
      _resetSelect("area-kecamatan", "Pilih Kecamatan...", true);
      _resetSelect("area-desa", "— Pilih atau lewati", false);
      await _loadWilayah("area-kabupaten", "regency", e.target.value);
    });

  document
    .getElementById("area-kabupaten")
    ?.addEventListener("change", async (e) => {
      _resetSelect("area-kecamatan", "Pilih Kecamatan...", true);
      _resetSelect("area-desa", "— Pilih atau lewati", false);
      await _loadWilayah("area-kecamatan", "district", e.target.value);
    });

  document
    .getElementById("area-kecamatan")
    ?.addEventListener("change", async (e) => {
      const kode = e.target.value;
      _formData.area_code = kode;
      _labels.area = _buildAreaLabel();
      _resetSelect("area-desa", "— Pilih atau lewati", false);
      if (kode) await _loadWilayah("area-desa", "village", kode, true);
    });

  document.getElementById("area-desa")?.addEventListener("change", (e) => {
    const kode = e.target.value;
    // Jika desa dipilih, area_code override ke kode desa
    _formData.area_code =
      kode || document.getElementById("area-kecamatan").value;
    _labels.area = _buildAreaLabel();
  });

  // GPS
  document.getElementById("btn-get-location")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      _showToast("Browser tidak mendukung geolokasi.", "error");
      return;
    }
    const btn = document.getElementById("btn-get-location");
    btn.innerHTML = `<span class="loading loading-spinner loading-xs"></span> Mengambil lokasi...`;
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        document.getElementById("coord-lat").value = lat;
        document.getElementById("coord-lng").value = lng;
        _formData.coordinate_point = `${lat},${lng}`;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Lokasi ditemukan`;
        btn.disabled = false;
      },
      () => {
        _showToast("Izinkan akses lokasi di browser.", "error");
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">my_location</span> Gunakan Lokasi Saat Ini`;
        btn.disabled = false;
      },
    );
  });

  // Manual input koordinat
  ["coord-lat", "coord-lng"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      const lat = document.getElementById("coord-lat").value;
      const lng = document.getElementById("coord-lng").value;
      if (lat && lng) _formData.coordinate_point = `${lat},${lng}`;
    });
  });
}

function _buildAreaLabel() {
  return [
    document.getElementById("area-provinsi")?.selectedOptions[0]?.text,
    document.getElementById("area-kabupaten")?.selectedOptions[0]?.text,
    document.getElementById("area-kecamatan")?.selectedOptions[0]?.text,
    document.getElementById("area-desa")?.value
      ? document.getElementById("area-desa").selectedOptions[0]?.text
      : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function _validateStep2() {
  const address = document.getElementById("address").value.trim();
  const provinsi = document.getElementById("area-provinsi").value;
  const kabupaten = document.getElementById("area-kabupaten").value;
  const kecamatan = document.getElementById("area-kecamatan").value;

  _toggleError("err-address", !address);
  _toggleError("err-area-provinsi", !provinsi);
  _toggleError("err-area-kabupaten", !kabupaten);
  _toggleError("err-area-kecamatan", !kecamatan);

  if (!address || !provinsi || !kabupaten || !kecamatan) return false;

  _formData.address = address;
  return true;
}

// ─────────────────────────────────────────────
// STEP 3 — Konfirmasi
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
  // Foto
  const preview = document.getElementById("photo-preview");
  const recapPhoto = document.getElementById("recap-photo");
  const recapPhotoPlaceholder = document.getElementById(
    "recap-photo-placeholder",
  );
  if (_formData.photo_profile && preview.src) {
    recapPhoto.src = preview.src;
    recapPhoto.classList.remove("hidden");
    recapPhotoPlaceholder.classList.add("hidden");
  }

  document.getElementById("recap-name").textContent = _formData.full_name;
  document.getElementById("recap-gender").textContent =
    _formData.gender === "L" ? "Laki-laki" : "Perempuan";
  document.getElementById("recap-nik").textContent = _formData.nik;
  document.getElementById("recap-phone").textContent = _formData.phone;
  document.getElementById("recap-address").textContent = _formData.address;
  document.getElementById("recap-area").textContent = _labels.area || "—";

  const coordWrap = document.getElementById("recap-coord-wrap");
  if (_formData.coordinate_point) {
    document.getElementById("recap-coordinate").textContent =
      _formData.coordinate_point;
    coordWrap.classList.remove("hidden");
  } else {
    coordWrap.classList.add("hidden");
  }
}

async function _handleSubmit() {
  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  btn.innerHTML = `<span class="loading loading-spinner loading-sm"></span> Menyimpan...`;

  try {
    const fd = new FormData();
    fd.append("full_name", _formData.full_name);
    fd.append("nik", _formData.nik);
    fd.append("gender", _formData.gender);
    fd.append("phone", _formData.phone);
    fd.append("address", _formData.address);
    fd.append("area_code", _formData.area_code);

    if (_formData.coordinate_point) {
      fd.append("coordinate_point", _formData.coordinate_point);
    }
    if (_formData.photo_profile) {
      fd.append("photo_profile", _formData.photo_profile);
    }

    const res = await fetch(`${config.API_BASE_URL}/customer/profile/setup`, {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Gagal menyimpan data.");

    // Tampilkan alert sukses dan logout setelah OK diklik
    const alertModal = document.getElementById("submit-success-alert");
    if (alertModal) {
      alertModal.setAttribute("title", "Setup Berhasil");
      alertModal.setAttribute(
        "message",
        "Profil Anda berhasil dikonfigurasi. Silakan klik OK untuk logout dan login kembali agar dapat menerapkan perubahan akun Anda.",
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
    btn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Simpan & Mulai`;
    _showToast(err.message, "error");
  }
}

// ─────────────────────────────────────────────
// FOTO UPLOAD
// ─────────────────────────────────────────────
function _bindPhotoUpload() {
  const area = document.getElementById("photo-area");
  const input = document.getElementById("photo-input");
  const preview = document.getElementById("photo-preview");
  const placeholder = document.getElementById("photo-placeholder");
  const btnChange = document.getElementById("btn-change-photo");

  area.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      _showToast("File terlalu besar. Maks 2MB.", "error");
      return;
    }
    _formData.photo_profile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
      btnChange.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  btnChange.addEventListener("click", (e) => {
    e.stopPropagation();
    input.click();
  });
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
    const opts = (json.data ?? [])
      .map((p) => `<option value="${p.kode}">${p.nama}</option>`)
      .join("");
    select.innerHTML = `<option value="" disabled selected>Pilih Provinsi...</option>${opts}`;
    select.disabled = false;
  } catch {
    select.innerHTML = `<option value="" disabled selected>Gagal memuat...</option>`;
  }
}

async function _loadWilayah(selectId, type, code, isOptional = false) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="" disabled selected>Memuat...</option>`;
  select.disabled = true;
  try {
    const res = await fetch(
      `${config.API_BASE_URL}/location?type=${type}&code=${code}`,
    );
    const json = await res.json();
    const opts = (json.data ?? [])
      .map((w) => `<option value="${w.kode}">${w.nama}</option>`)
      .join("");
    const ph = isOptional
      ? `<option value="">— Pilih atau lewati</option>`
      : `<option value="" disabled selected>Pilih...</option>`;
    select.innerHTML = ph + opts;
    select.disabled = false;
  } catch {
    select.innerHTML = `<option value="" disabled selected>Gagal memuat...</option>`;
  }
}

function _resetSelect(selectId, placeholder, disabled = true) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="" ${disabled ? "disabled" : ""} selected>${placeholder}</option>`;
  select.disabled = disabled;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function _toggleError(id, show) {
  document.getElementById(id)?.classList.toggle("hidden", !show);
}

function _showToast(message, type = "info") {
  document.getElementById("onboarding-toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "onboarding-toast";
  toast.className = "toast toast-top toast-center z-[999]";
  toast.innerHTML = `<div class="alert ${type === "error" ? "alert-error" : "alert-success"} text-sm font-semibold shadow-lg"><span>${message}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
