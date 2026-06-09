import config from "../../../js/config.js";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const now = new Date();
let _month = now.getMonth() + 1;
let _year = now.getFullYear();
let _status = "all";
let _page = 1;
let _perPage = 10;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export const initTransaction = async () => {
  // Dengarkan period-change dari komponen langsung
  document
    .querySelector("transaction-summary-card")
    ?.addEventListener("period-change", (e) => {
      _month = e.detail.month;
      _year = e.detail.year;
      _page = 1;
      _loadSummary();
      _loadTransactions();
    });

  await Promise.all([_loadSummary(), _loadOutstanding(), _loadTransactions()]);
};

// Hapus fungsi _initPeriodPicker() — tidak dibutuhkan lagi

// ─────────────────────────────────────────────
// LOAD SUMMARY
// ─────────────────────────────────────────────
async function _loadSummary() {
  const card = document.querySelector("transaction-summary-card");
  if (!card) return;

  card.setLoading(true);

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/transactions/summary?month=${_month}&year=${_year}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const json = await res.json();
    const d = json.data ?? {};

    card.setData({
      mrr: d.mrr ?? 0,
      growth: d.growth_percent ?? 0,
      subscriptions: d.total_active_subscriptions ?? 0,
      arpu: d.arpu ?? 0,
      churn: d.churn_rate ?? 0,
    });
  } catch (err) {
    console.error("Gagal memuat summary:", err);
    card.setLoading(false);
  }
}

// ─────────────────────────────────────────────
// LOAD OUTSTANDING
// ─────────────────────────────────────────────
async function _loadOutstanding() {
  const card = document.querySelector("invoice-outstanding-card");
  if (!card) return;

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/transactions/outstanding`,
      { headers: { "Content-Type": "application/json" } },
    );
    const json = await res.json();
    const d = json.data ?? {};

    card.setData({
      total: d.total_unpaid ?? 0,
      collected: d.collected_percent ?? 0,
      pastDue30: d.past_due_30 ?? 0,
      pastDue31: d.past_due_31_plus ?? 0,
    });
  } catch (err) {
    console.error("Gagal memuat outstanding:", err);
  }
}

// ─────────────────────────────────────────────
// LOAD TRANSACTIONS (table)
// ─────────────────────────────────────────────
async function _loadTransactions() {
  const table = document.querySelector("transaction-table");
  if (!table) return;

  table.setLoading(true);

  const params = new URLSearchParams({
    month: _month,
    year: _year,
    page: _page,
    per_page: _perPage,
    status: _status,
  });

  try {
    const res = await fetch(
      `${config.API_BASE_URL}/provider/transactions/list?${params}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const json = await res.json();

    table.setData({
      transactions: json.transactions ?? [],
      pagination: json.pagination ?? {},
      onPageChange: (page) => {
        _page = page;
        _loadTransactions();
      },
      onFilterChange: (status) => {
        _status = status;
        _page = 1;
        _loadTransactions();
      },
    });
  } catch (err) {
    console.error("Gagal memuat transaksi:", err);
    table.setLoading(false);
  }
}
