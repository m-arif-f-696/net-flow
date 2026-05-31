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
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <g fill="currentColor" stroke-linejoin="miter" stroke-linecap="butt">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2"></circle>
              <path d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135-.395,1.654-.682l2.318.954,1.768-1.768-.954-2.318c.287-.518.515-1.073.682-1.654l2.318-.966Z" fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2"></path>
            </g>
          </svg>
          <span class="dock-label">Billing</span>
        </a>

        <a href="support.html" data-nav="support">
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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
