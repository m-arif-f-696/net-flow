import config from "./config.js";
import NotificationAlert from "../components/NotificationAlert.js";

const loginForm = document.querySelector("#login-form");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    // Ambil data JSON respon dari PHP terlebih dahulu
    const data = await res.json();

    if (!res.ok) {
      // Menampilkan pesan error spesifik dari backend (misal: "Email and password must be input")
      console.error("Gagal Login (Backend Message):", data.message);
      alert(data.message || "Gagal login");
      return;
    }

    // Jika sukses (Status 200 OK)
    console.log("Login Sukses, Respon Server:", data);

    switchRole(data.user.role);
  } catch (error) {
    console.error("Error Sistem/Jaringan:", error);
  }
});

const registerForm = document.querySelector("#register-form");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(registerForm);
  const submitterButton = e.submitter;
  if (submitterButton && submitterButton.name === "role") {
    formData.append("role", submitterButton.value);
  }
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");
  console.log(email, password, role);
  try {
    const res = await fetch(`${config.API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
      credentials: "include",
    });

    // Ambil data JSON respon dari PHP terlebih dahulu
    const data = await res.json();

    if (!res.ok) {
      // Menampilkan pesan error spesifik dari backend (misal: "Email and password must be input")
      const alertModal = document.getElementById("submit-error-alert");
      if (alertModal) {
        alertModal.setAttribute("title", "Registrasi Gagal");
        alertModal.setAttribute("message", data.message);
        alertModal.setAttribute("color", "error");
        alertModal.render();
        alertModal.connectedCallback();
        alertModal.show();

        alertModal.addEventListener("onOk", async () => {
          alertModal.hide();
        });
      }
      return;
    }
    // Jika sukses (Status 200 OK)
    console.log("Register Sukses, Respon Server:", data);

    const alertModal = document.getElementById("submit-success-alert");
    if (alertModal) {
      alertModal.setAttribute("title", "Registrasi Berhasil");
      alertModal.setAttribute(
        "message",
        "Silakan klik OK untuk login ke akun anda.",
      );
      alertModal.setAttribute("color", "success");
      alertModal.render();
      alertModal.connectedCallback();
      alertModal.show();

      alertModal.addEventListener("onOk", async () => {
        window.location.href = "/login.html";
      });
    }
  } catch (error) {
    // console.error("Error Sistem/Jaringan:", error);
    const alertModal = document.getElementById("submit-error-alert");
    if (alertModal) {
      alertModal.setAttribute("title", "Registrasi Gagal");
      alertModal.setAttribute("message", error);
      alertModal.setAttribute("color", "error");
      alertModal.render();
      alertModal.connectedCallback();
      alertModal.show();

      alertModal.addEventListener("onOk", async () => {
        alertModal.hide();
      });
    }
  }
});

async function getProfile() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/auth/me`, {
      credentials: "include",
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    return error;
  }
}

function switchRole(role) {
  switch (role) {
    case "customer":
      window.location.href = "/user/home.html";
      break;
    case "provider":
      window.location.href = "/provider/dashboard.html";
      break;
    case "admin":
      window.location.href = "/admin/";
      break;
    default:
      // Akan terpanggil jika role tidak dikenali
      alert(`Role tidak dikenali: ${role}`);
      console.error("Role dari backend:", role);
      break;
  }
}
async function checkOnboarding() {
  const user = await getProfile();

  if (!user || user.code === 401) {
    window.location.href = "../login.html";
    return null;
  }

  if (user.user.onboarding === "register") {
    return "register";
  }

  return "completed";
}

export { getProfile, switchRole, checkOnboarding };
