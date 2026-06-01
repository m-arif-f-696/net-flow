import { getProfile, switchRole } from "../AuthController.js";
document.addEventListener("DOMContentLoaded", async () => {
  const user = await getProfile();

  if (user.code === 401) {
    window.location.href = "/login.html";
  } else {
    switchRole(user.user.role);
  }
  console.log(user);
});
