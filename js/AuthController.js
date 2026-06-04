import config from "./config.js";

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

export { getProfile, switchRole };
