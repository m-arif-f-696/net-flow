export default class NavBar extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <nav class="dock z-50 bg-base-100/90 backdrop-blur-xl border-t border-base-200 shadow-lg pb-safe">
        
        <a href="home.html" data-nav="home">
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <g fill="currentColor" stroke-linejoin="miter" stroke-linecap="butt">
              <polyline points="1 11 12 2 23 11" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="2"></polyline>
              <path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2"></path>
              <line x1="12" y1="22" x2="12" y2="18" fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2"></line>
            </g>
          </svg>
          <span class="dock-label">Home</span>
        </a>

        <a href="market.html" data-nav="market">
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <g fill="currentColor" stroke-linejoin="miter" stroke-linecap="butt">
              <polyline points="3 14 9 14 9 17 15 17 15 14 21 14" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="2"></polyline>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2"></rect>
            </g>
          </svg>
          <span class="dock-label">Market</span>
        </a>

        <a href="billing.html" data-nav="billing">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-[1.4em]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
</svg>

          <span class="dock-label">Billing</span>
        </a>

        <a href="support.html" data-nav="support">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-[1.4em]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
</svg>

          <span class="dock-label">Support</span>
        </a>

      </nav>
    `;

    this._setupActiveState();
  }

  _setupActiveState() {
    const currentPage = document.body.dataset.page || "home";
    const links = this.querySelectorAll("a[data-nav]");

    links.forEach((link) => {
      const nav = link.dataset.nav;

      // Cukup tambahkan class 'dock-active' jika halaman sesuai
      if (nav === currentPage) {
        link.classList.add("dock-active");
        link.classList.add("text-primary");
        link.classList.add("font-bold");
      } else {
        link.classList.remove("dock-active");
        link.classList.remove("text-primary");
        link.classList.remove("font-bold");
      }
    });
  }
}

customElements.define("nav-bar", NavBar);
