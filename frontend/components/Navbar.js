export default class Navbar extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <div id="main-navbar" class="navbar bg-base-100/30 backdrop-blur-md shadow-sm w-full px-20 py-4">
      <div class="navbar-start flex-1">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
          </div>
          <ul tabindex="-1" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            <li><a>Home</a></li>
            <li><a>About</a></li>
          </ul>
        </div>
        <a class="btn btn-ghost text-xl lg:ml-10" href="#"><img src="../assets/images/logo.svg" alt="logo" class="w-8 h-8 shrink-0" > NetFlow</a>
      </div>

      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 text-base">
          <li><a>Home</a></li>
          <li><a>About</a></li>
        </ul>
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
