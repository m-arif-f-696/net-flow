export default class Navbar extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <div id="main-navbar" class="navbar bg-base-100/30 backdrop-blur-md shadow-sm w-full px-20 py-4">
      <div class="navbar-start flex-1">
        <!-- <a class="btn btn-ghost text-xl lg:ml-10" href="#"><img src="../assets/images/logo.svg" alt="logo" class="w-8 h-8 shrink-0" > NetFlow</a> -->
         <logo-navbar></logo-navbar>
      </div>

     
      <!-- <div class="navbar-end flex-1 justify-end">
        <div class="flex gap-10">
          <a class="btn">Button</a>
          <a class="btn">Button</a>  
        </div>
      </div> -->
      <div class="navbar-end flex flex-1 justify-end gap-4">
      
        <a class="btn btn-outline btn-primary" href="register.html">Register</a>
        <a class="btn btn-primary" href="login.html">Login</a>  
        
      </div>

    </div>
    `;
  }
}

customElements.define("navbar-header", Navbar);
