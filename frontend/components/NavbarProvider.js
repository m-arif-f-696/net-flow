export default class NavBarProvider extends HTMLElement {
  connectedCallback() {
    // 1. Ambil data dari atribut HTML 'data-crumbs'
    const crumbsAttr = this.getAttribute("data-crumbs");

    // 2. Tentukan breadcrumb default jika atribut tidak diisi
    let crumbs = [
      { label: "NetFlow", url: "../index.html" },
      { label: "Dashboard", url: null },
    ];

    // 3. Jika ada atribut, ubah string JSON menjadi Array JavaScript
    if (crumbsAttr) {
      try {
        crumbs = JSON.parse(crumbsAttr);
      } catch (error) {
        console.error("Format JSON pada data-crumbs tidak valid!", error);
      }
      this.render(crumbs);
    }
  }
  // Fungsi khusus untuk membuat list HTML dinamis
  generateBreadcrumbsHTML(crumbs) {
    return crumbs
      .map((crumb, index) => {
        // Cek apakah ini adalah elemen terakhir
        const isLast = index === crumbs.length - 1;

        // Jika ini elemen terakhir ATAU tidak punya URL, jadikan teks biasa (warna primary)
        if (isLast || !crumb.url) {
          return `<li class="text-primary">${crumb.label}</li>`;
        }
        // Jika bukan terakhir dan punya URL, jadikan link
        else {
          return `<li><a href="${crumb.url}">${crumb.label}</a></li>`;
        }
      })
      .join(""); // Gabungkan semua elemen array menjadi satu string HTML
  }

  render(crumbs) {
    this.innerHTML = /*html*/ `
      <nav class="navbar sticky top-0 w-full bg-base-300 shadow-sm z-10">
        
        <div class="flex-none">
          <label for="my-drawer-4" aria-label="open sidebar" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-5">
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
              <path d="M9 4v16"></path>
              <path d="M14 10l2 2l-2 2"></path>
            </svg>
          </label>
        </div>
        
        <div class="flex-1 px-4">
          <div class="breadcrumbs text-sm font-semibold">
            <ul>
              ${this.generateBreadcrumbsHTML(crumbs)}
            </ul>
          </div>
        </div>
        
        <div class="flex-none flex items-center gap-8 mr-4">

          <button class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block h-5 w-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </button>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="font-semibold ">Selamat Datang Kembali</p>
              <p class="text-xs font-bold text-primary">Provider X</p>
            </div>
            <div class="avatar">
              <div class="w-10 rounded-full">
                  <img src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp" />
              </div>
            </div>
          </div>

        </div>
      </nav>
    `;
  }
}

customElements.define("nav-bar-provider", NavBarProvider);
