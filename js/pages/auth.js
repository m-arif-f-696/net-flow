import { getProfile, switchRole } from "../AuthController.js";
document.addEventListener("DOMContentLoaded", async () => {
  const user = await getProfile();

  if (user.code === 200) {
    switchRole(user.user.role);
  }
  console.log(user);
});
