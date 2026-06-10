import "../components/SubscriptionCarousel.js";
import "../components/RecentActivity.js";
import "../components/NearbyProviders.js";
import { initHome } from "../controllers/homeController.js";

document.addEventListener("DOMContentLoaded", () => {
  initHome();
});
