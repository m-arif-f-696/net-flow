import config from "../../../js/config.js";

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initHome = async () => {
  // Fetch semua data paralel
  await Promise.all([
    _loadSubscriptions(),
    _loadRecentActivity(),
    _loadNearbyProviders(),
  ]);

  // Handle live search dari komponen NearbyProviders langsung ke API
  const nearbySection = document.querySelector("nearby-providers");
  if (nearbySection) {
    let debounceTimer;
    nearbySection.addEventListener("search", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        _loadNearbyProviders(e.detail.query);
      }, 300); // Debounce 300ms agar tidak membebani API saat mengetik
    });
  }
};

// ─────────────────────────────────────────────
// LOAD SUBSCRIPTIONS → SubscriptionCarousel
// ─────────────────────────────────────────────
async function _loadSubscriptions() {
  const carousel = document.querySelector("subscription-carousel");
  if (!carousel) return;

  try {
    const res = await fetch(`${config.API_BASE_URL}/customer/my-subscription`, {
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    console.log(json);

    if (!res.ok) throw new Error(json.message ?? "Gagal memuat langganan.");

    const subscriptions = (json.data ?? []).map((s) => ({
      id: s.id_subscription,
      packageName: s.name_package,
      speed: `${s.download_speed} ${s.download_unit}`,
      category:
        s.type_package === "unlimited"
          ? "Paket Unlimited"
          : `Paket Kuota ${s.quota_limit_gb} GB`,
      nextBilling: s.next_billing
        ? new Date(s.next_billing).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
      status: s.status_subscription,
      price: s.price_per_month,
      providerName: s.provider_name,
    }));

    carousel.setData(subscriptions);

    // Isi nama user di greeting jika ada
    const nameEl = document.getElementById("user-name");
    if (nameEl && json.data?.[0]?.provider_name) {
      // nama user dari auth sudah dihandle AuthController, skip
    }
  } catch (err) {
    console.error("Gagal memuat langganan:", err);
    carousel.setData([]); // tampilkan empty state
  }
}

// ─────────────────────────────────────────────
// LOAD RECENT ACTIVITY → RecentActivity
// hanya ambil settlement (transaksi yang sudah lunas)
// ─────────────────────────────────────────────
async function _loadRecentActivity() {
  const activity = document.querySelector("recent-activity");
  if (!activity) return;

  try {
    const params = new URLSearchParams({
      status: "settlement",
      limit: 10,
      page: 1,
    });
    const res = await fetch(
      `${config.API_BASE_URL}/customer/my-transactions?${params}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const json = await res.json();

    if (!res.ok) throw new Error(json.message ?? "Gagal memuat transaksi.");

    const transactions = (json.data ?? []).map((t) => ({
      id: t.id_transaction,
      invoice: t.invoice_number,
      packageName: t.name_package,
      providerName: t.provider_name,
      amount: t.amount,
      paymentType: t.payment_type,
      status: t.payment_status,
      paidAt: t.paid_at,
      createdAt: t.created_at,
    }));

    activity.setData(transactions);
  } catch (err) {
    console.error("Gagal memuat aktivitas:", err);
    activity.setData([]);
  }
}

// ─────────────────────────────────────────────
// LOAD NEARBY PROVIDERS → NearbyProviders
// ─────────────────────────────────────────────
async function _loadNearbyProviders(searchQuery = "") {
  const section = document.querySelector("nearby-providers");
  if (!section) return;

  try {
    let url = `${config.API_BASE_URL}/customer/packages?coverage=available&limit=10`;
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message ?? "Gagal memuat provider.");

    const providers = (json.data ?? []).map((p) => ({
      id_provider: p.id_provider,
      slug: p.slug,
      packageName: p.name_package,
      icon: p.icon_package,
      coverageArea: p.coverage_area_name ?? p.area_name ?? "—",
      startPrice: p.price_per_month ?? "-",
    }));

    section.setData(providers);
  } catch (err) {
    console.error("Gagal memuat provider terdekat:", err);
    section.setData([]);
  }
}
