export default class SideBarProvider extends HTMLElement {
  setMenu(menuItems) {
    this._menuItems = menuItems;
    this.render(menuItems);
  }

  connectedCallback() {
    if (this._menuItems) {
      this.render(this._menuItems);
      return;
    }

    const menuAttr = this.getAttribute("data-menu");

    let menuItems = [
      {
        label: "Dashboard",
        url: "dashboard.html",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>`,
        active: true,
      },
    ];

    if (menuAttr) {
      try {
        const cleanData = menuAttr.replace(/\r?\n|\r/g, " ").trim();
        menuItems = JSON.parse(cleanData);
      } catch (error) {
        console.error("Format JSON pada data-crumbs tidak valid!", error);
      }
    }

    this.render(menuItems);
  }

  generateMenuItemHTML(menuItems) {
    return menuItems
      .map((menu) => {
        // Cek apakah ini adalah elemen terakhir

        // Jika ini elemen terakhir ATAU tidak punya URL, jadikan teks biasa (warna primary)
        if (!menu.active) {
          return /*html*/ `<li>
            <a href="${menu.url}" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-primary hover:bg-primary/10" data-tip="${menu.label}">
              ${menu.svg}

              <span class="is-drawer-close:hidden transition-opacity duration-200">${menu.label}</span>
            </a>
          </li>`;
        }
        // Jika bukan terakhir dan punya URL, jadikan link
        else {
          return /*html*/ `<li>
            <a href="${menu.url}" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-primary bg-primary/10 border-r-2 border-primary/500" data-tip="${menu.label}">
              ${menu.svg}

              <span class="is-drawer-close:hidden transition-opacity duration-200">${menu.label}</span>
            </a>
          </li>`;
        }
      })
      .join(""); // Gabungkan semua elemen array menjadi satu string HTML
  }

  render(menuItems) {
    this.innerHTML = /*html*/ `
      <div class="flex min-h-full flex-col items-start bg-base-200 text-base-content is-drawer-close:w-15 is-drawer-open:w-64 border-r border-base-300 transition-all duration-300 ease-in-out">
        
        <div class="py-4 w-full flex items-center justify-center gap-3 border-b border-base-300 font-bold">
          <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="NetFlow">
            <svg
              viewBox="0 0 500 500"
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8 inline-block text-primary">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M340.833 63.6186C357.655 63.16 373.846 72.7436 379.139 89.1132C384.287 105.035 375.928 121.46 362.745 131.39C350.007 140.985 332.902 142.966 319.889 133.744C306.582 124.313 301.176 106.952 305.907 91.11C310.657 75.2065 324.602 64.0612 340.833 63.6186Z"
                fill="currentColor" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M71.4997 104.935C91.6125 104.387 110.971 115.845 117.3 135.417C123.455 154.454 113.46 174.092 97.6992 185.964C82.4684 197.437 62.0168 199.805 46.4584 188.779C30.5482 177.504 24.0847 156.746 29.7419 137.804C35.421 118.79 52.0934 105.464 71.4997 104.935Z"
                fill="currentColor" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M435.534 307.809C451.785 316.428 461.796 334.68 457.633 353.793C453.584 372.383 436.41 384.187 418.299 386.938C400.797 389.596 383.422 382.336 376.23 366.158C368.876 349.613 373.488 329.455 386.886 316.273C400.335 303.04 419.854 299.493 435.534 307.809Z"
                fill="currentColor" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M143.12 350.111C157.641 357.812 166.586 374.121 162.866 391.199C159.248 407.81 143.902 418.357 127.72 420.815C112.082 423.19 96.5565 416.703 90.1304 402.247C83.559 387.464 87.6804 369.452 99.6515 357.674C111.669 345.85 129.109 342.681 143.12 350.111Z"
                fill="currentColor" />
              <path
                d="M313.233 99.5677C321.233 69.7113 335.9 66.682 346.233 73.0989C356.567 79.5158 388.149 91.8661 362.631 106.599C330.733 125.015 322.233 133.599 313.233 153.599C309.493 161.912 305.68 175.354 302.482 188.526C309.557 196.592 315.234 206.016 319.033 216.645C330.051 210.075 343.015 199.668 349.733 185.963C359.733 165.564 376.798 173.848 380.233 182.963C384.567 194.463 388.333 218.663 368.733 223.463C354.996 226.827 336.69 229.731 322.837 231.627C323.97 239.099 323.99 246.55 323.042 253.866C325.772 254.563 328.586 255.319 331.455 256.139C355.451 262.995 383.451 274.276 399.108 291.978C406.136 299.924 412.023 307.815 416.152 313.718C418.217 316.67 419.844 319.126 420.954 320.845C421.509 321.704 421.935 322.38 422.223 322.841C422.366 323.071 422.476 323.248 422.55 323.367C422.586 323.427 422.614 323.473 422.633 323.503C422.642 323.518 422.649 323.53 422.653 323.537C422.656 323.541 422.658 323.544 422.659 323.546C422.66 323.547 422.66 323.549 422.66 323.549H422.661V323.55L422.755 323.704L422.728 323.883L418.228 353.883L418.141 354.464L417.581 354.285L405.081 350.285L404.881 350.221L404.787 350.033C404.787 350.033 404.786 350.032 404.785 350.031C404.784 350.029 404.783 350.025 404.781 350.022C404.777 350.014 404.771 350.002 404.763 349.987C404.747 349.955 404.724 349.908 404.692 349.847C404.63 349.724 404.537 349.541 404.416 349.306C404.174 348.835 403.821 348.152 403.375 347.302C402.482 345.603 401.217 343.239 399.729 340.582C396.751 335.262 392.889 328.788 389.335 324.112C375.207 305.525 362.742 295.639 343.505 285.753C335.727 281.756 325.086 279.861 315.89 278.982C308.101 296.542 295.042 312.291 279.167 324.249C277.511 325.496 275.825 326.69 274.113 327.832C278.513 340.534 285.123 353.689 296.233 358.809C316.867 368.317 319.264 397.656 310.233 401.309C298.841 405.916 281.002 410.788 275.733 391.309C272.567 379.6 266.775 355.014 262.305 334.664C249.079 341.216 234.795 344.803 220.612 344.934C210.902 362.816 193.43 380.937 170.233 387.153C132.634 397.227 108.567 397.121 101.233 395.809V360.809C101.336 360.825 140.233 366.809 161.233 360.809C174.597 356.991 186.548 350.829 195.869 341.458C187.781 339.02 179.968 335.267 172.674 330.098C139.608 306.665 126.174 263.525 137.932 224.158C141.815 211.157 148.171 199.436 156.389 189.52C149.874 185.015 143.023 181.828 135.233 177.809C124.58 172.312 117.221 171.318 105.233 171.309C90.7197 171.297 72.3003 171.309 72.2334 171.309L69.2334 158.809L76.7334 146.309C76.8129 146.296 106.921 141.592 131.233 146.309C147.993 149.561 164.378 160.822 176.567 171.265C190.582 161.875 207.108 156.326 224.717 155.846C243.25 155.341 261.475 159.741 277.169 168.342C291.598 147.083 307.799 119.847 313.233 99.5677Z"
                fill="currentColor" />
            </svg>
          </a>
          <span class="is-drawer-close:hidden transition-opacity duration-200">NetFlow</span>
        </div>

        <ul class="menu w-full grow gap-3">

        ${this.generateMenuItemHTML(menuItems)}
          
          <!-- <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-primary bg-primary/10 border-r-2 border-primary/50" data-tip="Dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>


              <span class="is-drawer-close:hidden transition-opacity duration-200">Dashboard</span>
            </a>
          </li>

          <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-primary hover:bg-primary/10" data-tip="Paket">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m7.875 14.25 1.214 1.942a2.25 2.25 0 0 0 1.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 0 1 1.872 1.002l.164.246a2.25 2.25 0 0 0 1.872 1.002h2.092a2.25 2.25 0 0 0 1.872-1.002l.164-.246A2.25 2.25 0 0 1 16.954 9h4.636M2.41 9a2.25 2.25 0 0 0-.16.832V12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 12V9.832c0-.287-.055-.57-.16-.832M2.41 9a2.25 2.25 0 0 1 .382-.632l3.285-3.832a2.25 2.25 0 0 1 1.708-.786h8.43c.657 0 1.281.287 1.709.786l3.284 3.832c.163.19.291.404.382.632M4.5 20.25h15A2.25 2.25 0 0 0 21.75 18v-2.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>

              <span class="is-drawer-close:hidden transition-opacity duration-200">Paket</span>
            </a>
          </li>

          <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-primary hover:bg-primary/10" data-tip="Pelanggan">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>

              <span class="is-drawer-close:hidden transition-opacity duration-200">Pelanggan</span>
            </a>
          </li>
          <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-primary hover:bg-primary/10" data-tip="Transaksi">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>

              <span class="is-drawer-close:hidden transition-opacity duration-200">Transaksi</span>
            </a>
          </li> -->

          <li class="mt-auto pt-2 border-t border-base-300">
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-error hover:bg-error/10" data-tip="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
              </svg>

              <span class="is-drawer-close:hidden transition-opacity duration-200">Logout</span>
            </a>
          </li>
        </ul>
      </div>
    `;
  }
}

customElements.define("side-bar-provider", SideBarProvider);
