import config from "../../../js/config.js";

// ─────────────────────────────────────────────
// FETCH PACKAGES (Customer-side)
// ─────────────────────────────────────────────

/**
 * Melakukan fetch daftar paket internet dari API.
 *
 * @param {Object} params - Parameter query dinamis.
 * @param {string} [params.search] - Kata kunci pencarian.
 * @param {number} [params.limit=10] - Jumlah data per halaman.
 * @param {number} [params.offset=0] - Offset data (skip).
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const fetchPackages = async ({ search, limit = 10, offset = 0 } = {}) => {
  // 1️⃣ Susun query string dengan URLSearchParams
  //    Hanya parameter yang memiliki nilai yang akan masuk ke URL
  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (limit) params.append("limit", limit);
  if (offset !== undefined && offset !== null) params.append("offset", offset);

  // 2️⃣ Bangun full URL: base + endpoint + query
  const url = `${config.API_BASE_URL}/customer/packages/?${params.toString()}`;

  // 3️⃣ Panggil API dengan fetch() bawaan browser
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const result = await response.json();

  // 4️⃣ Return data & pagination dari response
  return {
    data: result.data ?? [],
    pagination: result.pagination ?? {},
  };
};

// ─────────────────────────────────────────────
// INIT MARKET PAGE
// ─────────────────────────────────────────────

/**
 * Inisialisasi halaman Market.
 * Menghubungkan komponen MarketPage dengan fetchPackages.
 */
export const initMarket = () => {
  const marketPage = document.querySelector("market-page");
  if (!marketPage) return;

  // State lokal untuk pagination & search
  let currentSearch = "";
  let currentLimit = 10;
  let currentOffset = 0;

  /**
   * Fungsi utama: fetch data lalu serahkan ke komponen.
   */
  const loadPackages = async () => {
    // Tampilkan loading state di komponen
    marketPage.setLoading(true);

    try {
      const { data, pagination } = await fetchPackages({
        search: currentSearch,
        limit: currentLimit,
        offset: currentOffset,
      });

      // Serahkan data ke komponen MarketPage untuk dirender
      marketPage.setPackages(data, pagination);
    } catch (error) {
      console.error("Gagal memuat paket:", error);
      marketPage.setError(error.message);
    }
  };

  // ─── Event Listeners ───

  // 1. Tangkap event pencarian dari MarketPage
  marketPage.addEventListener("search-change", (e) => {
    currentSearch = e.detail;
    currentOffset = 0; // Reset ke halaman pertama saat search berubah
    loadPackages();
  });

  // 2. Tangkap event pagination dari MarketPage
  marketPage.addEventListener("page-change", (e) => {
    const { offset } = e.detail;
    currentOffset = offset;
    loadPackages();
  });

  // 3. Load data pertama kali
  loadPackages();
};
