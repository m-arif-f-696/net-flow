export default class LogoNavbar extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <a class="text-xl flex gap-2" href="index.html">
      <img
      src="../assets/images/logo.svg"
      alt="logo"
      class="w-8 h-8 shrink-0" />
    NetFlow</a>
    `;
  }
}

customElements.define("logo-navbar", LogoNavbar);
