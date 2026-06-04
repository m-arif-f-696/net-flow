import TopBar from "./components/TopBar.js";
import NavBar from "./components/NavBar.js";
import MarketPage from "./components/MarketPage.js";
import IspCard from "./components/IspCard.js";
import PaginationControl from "./components/PaginationControl.js";
import NotificationConfirm from "../../components/NotificationConfirm.js";
import NotificationAlert from "../../components/NotificationAlert.js";
import config from "../../js/config.js";
import { getProfile, switchRole } from "../../js/AuthController.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    customElements.whenDefined("top-bar"),
    customElements.whenDefined("nav-bar"),
    customElements.whenDefined("notification-confirm"),
  ]);

  // Semua komponen sudah terdefinisi & dirender
  // Hapus loader setelah sedikit delay agar transisi terasa smooth
  setTimeout(() => {
    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 400);
    }
  }, 600);

  try {
    const user = await getProfile();

    if (user.code === 401) {
      window.location.href = "../login.html";
    } else if (user.user.role !== "customer") {
      switchRole(user.user.role);
    } else {
      // 1. Get the elements
      const userNameEl = document.getElementById("user-name");
      const userImageEl = document.getElementById("user-image");

      // 2. Assign values only if the elements exist
      if (userNameEl) {
        userNameEl.innerText = user.user.name;
      }

      if (userImageEl) {
        userImageEl.innerHTML = `<img alt="User profile avatar" src="${config.BASE_URL}/${user.user.img}" class="w-full h-full object-cover" />`;
      }
    }
  } catch (error) {
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = "Error";

    const imgEl = document.getElementById("user-image");
    if (imgEl)
      imgEl.innerHTML = `<span class="material-symbols-outlined">error</span>`;
  }

  document.getElementById("btn-logout").addEventListener("click", async () => {
    const modal = document.querySelector("notification-confirm");

    modal.setAttribute("title", "Logout");
    modal.setAttribute("message", "Apakah Anda yakin ingin logout?");
    modal.setAttribute("confirmText", "Logout");
    modal.setAttribute("color", "error");

    modal.render();
    modal.connectedCallback();

    modal.show();
  });

  document
    ?.querySelector("notification-confirm")
    .addEventListener("onConfirm", async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        console.log(data);
        window.location.href = "../login.html";
      } catch (error) {
        console.error("Error System/Jaringan:", error);
      }
    });
});
