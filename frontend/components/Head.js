export default class Head extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    
    `;
  }
}

customElements.define("head-landing", Hero);
