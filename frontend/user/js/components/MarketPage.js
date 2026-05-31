import "./IspCard.js";
import "./PaginationControl.js";

export default class MarketPage extends HTMLElement {
  constructor() {
    super();
    // Simulasi data dari Database/API
    this.ispData = [
      {
        id: 1,
        name: "Velocity Fiber",
        provider: "Velocity Networks",
        price: 45,
        speed: "1.5 Gbps",
        distance: "0.8 km",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUcACvBbEmYDI1PsqBWEYYV5E7mFwRF7f2w6D8tJco1z1Se5MbCgKLQYbdPoUmqXao0Z_0k4OdPXxVIsrnHOFdARM07I_Diyhxkfdxwb1Adf_Fktww24vVGt5PQGTRutwzrjAnWjuN_cHyuKPk7EetixKt3dScK3yhS0XHtqwkxxAiAp0zc1jlvsAkyRxRb5BB6I_deJ5F9IeAIk-RB_w55ujMWRdDCmG8zLP7hlu_H13KqlAPIPjY_Znc4tkjSo4by3RD2TFg0yN7",
      },
      {
        id: 2,
        name: "SkyLink Mesh",
        provider: "SkyLink ISP",
        price: 39,
        speed: "800 Mbps",
        distance: "1.2 km",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeAk28oaJg92xUdVN4xsR9PvrSK4eSRjAPYIqaaVXkjb6TuM1853fZ-KOrHCe3YKkELSy89EyI94wtEUApGxh7vxgMrWvWsHIwFX7MG7l_2d2djKWgartMKKDYbu85qj2FL4P_-G1N8NpIcl88MQfQiU6nI4COODHuLfrIkGhI415n9EEjg-gaLgLxOs-ylGhAyDmMWL9syihmJ1Z-bbn55mKadhaZ1thL_p3sE5mvmK5YgbNezYReT_9N_A9YTzVynWnaYCZA3hD5",
      },
      {
        id: 3,
        name: "OmniNet Pro",
        provider: "OmniNet Global",
        price: 55,
        speed: "2.0 Gbps",
        distance: "2.5 km",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxOkqkn7swOa2DIwGMtxAm5t8NtkIJvRIKW53H5l92J0UzRN0NErSmj7kgmhYTp8wqPdO1_WW-zjQ9uTgAe9MJT3MeS5FbCzd3BUO4IPGJnWEWQgiXPTMWLh49n8hg3QuV5i-19YAY-11Cj7FMSxHrCWA5c3B9wPdFFjUjqkFvYYXW-tgNYW_0YMYag96yj0I1P1Wyw3s9eVYMoPKFXeUnryXwGUQzMdrEPbgVNiQpXO7YT0rfu52uIhMazLQmLNFH8PMaaazjLh3l",
      },
      {
        id: 4,
        name: "NetFlow Basic",
        provider: "NetFlow ISP",
        price: 25,
        speed: "100 Mbps",
        distance: "0.5 km",
        logo: "http://googleusercontent.com/profile/picture/6",
      },
      {
        id: 5,
        name: "GigaSpeed Max",
        provider: "Giga Networks",
        price: 75,
        speed: "3.0 Gbps",
        distance: "4.1 km",
        logo: "http://googleusercontent.com/profile/picture/7",
      },
    ];

    // Setup Pagination
    this.currentPage = 1;
    this.itemsPerPage = 2; // Tampilkan 2 ISP per halaman agar pagination langsung terlihat
  }

  connectedCallback() {
    this.render();
    this.renderList();
  }

  render() {
    this.innerHTML = /*html*/ `
      <main class="mt-24 px-6 space-y-8 pb-24">
        
        <section class="mb-10">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">Available Networks</p>
          <h1 class="text-4xl font-extrabold tracking-tight text-base-content mb-6 leading-tight">Find the best mesh near you.</h1>
          <div class="relative">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input class="w-full pl-12 pr-4 py-4 bg-base-200 border-b-2 border-base-300 focus:border-primary focus:outline-none transition-all text-base-content placeholder:text-base-content/40 font-medium" placeholder="Search by zip or area..." type="text" />
          </div>
        </section>

        <section class="flex gap-3 overflow-x-auto pb-6" style="scrollbar-width: none">
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-content font-semibold text-sm whitespace-nowrap shadow-lg shadow-primary/20 transition-transform active:scale-95">All ISPs</button>
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-base-200 text-base-content/60 font-medium text-sm whitespace-nowrap transition-transform active:scale-95">Price</button>
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-base-200 text-base-content/60 font-medium text-sm whitespace-nowrap transition-transform active:scale-95">Speed (Gbps)</button>
        </section>

        <section id="isp-grid" class="grid grid-cols-1 gap-8"></section>

        <pagination-control></pagination-control>
      </main>
    `;

    // Tangkap event saat user klik tombol Prev/Next
    this.querySelector("pagination-control").addEventListener(
      "page-change",
      (e) => {
        this.currentPage = e.detail;
        this.renderList(); // Render ulang data dengan halaman baru
      },
    );
  }

  // Fungsi untuk menyuntikkan <isp-card> ke dalam grid
  renderList() {
    const grid = this.querySelector("#isp-grid");
    const pagination = this.querySelector("pagination-control");
    grid.innerHTML = ""; // Bersihkan list sebelumnya

    // Logika Pemotongan Array (Pagination)
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedItems = this.ispData.slice(startIndex, endIndex);

    // Looping data dan buat elemen <isp-card>
    paginatedItems.forEach((isp) => {
      const card = document.createElement("isp-card");
      card.data = isp; // Lempar object ke setter di dalam IspCard.js
      grid.appendChild(card);
    });

    // Update state tombol Pagination
    pagination.data = {
      currentPage: this.currentPage,
      totalPages: Math.ceil(this.ispData.length / this.itemsPerPage),
    };
  }
}

customElements.define("market-page", MarketPage);
