import "../components/NotificationItem.js";
import {
  initNotification,
  initDashboardStats,
  initDashboardTopPackage,
  initReportFromCustomer,
} from "../controllers/dashboardController.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initNotification();
  await initDashboardStats();
  await initDashboardTopPackage();
  await initReportFromCustomer();
});
