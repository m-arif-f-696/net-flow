export default class Hero extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <div class="hero bg-transparent min-h-screen">
      <div class="hero-content text-center flex-col">
        <div class="max-w-xl">
          <div class=" flex justify-center gap-1.5 items-center py-1 px-2 mx-auto
           border-1 rounded-full border-slate-500 w-fit">
            <span class=" py-0.5 px-2 bg-primary rounded-full text-base-100">New</span>
            <p>Version 1.0 has launch</p>
          </div>
          <h1 class="text-5xl font-bold mt-3">
            Find Your Dream Hotspot<br />with
            <span class="text-primary">NetFlow</span>
          </h1>
          
          <p class="py-6">
            Provident cupiditate voluptatem et in. Quaerat fugiat ut
            assumenda excepturi exercitationem quasi. In deleniti eaque aut
            repudiandae et a id nisi.
          </p>
          <div class="flex gap-4 items-center justify-center">
            <button class="btn btn-primary">Find Provider</button>
            <button class="btn btn-outline btn-primary">
              Become as Provider
            </button>
          </div>
        </div>
        <div class="flex items-center justify-center relative z-20 min-h-[400px]">
  
  <!-- Card Random 1 (Kiri Atas) -->
  <div class="flex flex-col gap-3 bg-white shadow-lg absolute top-[20%] left-[30%] rounded-xl px-4 py-3 z-30 hover:-translate-y-1 transition-all duration-300">
    <div class="flex items-center gap-4">
      <img src="../assets/images/logo.svg" class="w-8 h-8 flex-1" alt="logo" />
      <div class="flex flex-col items-start">
        <span class="font-bold text-sm text-gray-800">IndiHome</span>
        <p class="text-xs text-slate-400">Yogyakarta, ID</p>
      </div>
    </div>
    <div class="flex gap-2">
      <span class="bg-primary/10 text-primary font-medium rounded-md px-2 py-1 text-xs">Fiber Optic</span>
    </div>
  </div>

  <!-- Card Random 2 (Kanan Tengah) -->
  <div class="flex flex-col gap-3 bg-white shadow-lg absolute top-[40%] right-[20%] rounded-xl px-4 py-3 z-30 hover:-translate-y-1 transition-all duration-300">
    <div class="flex items-center gap-4">
      <img src="../assets/images/logo.svg" class="w-8 h-8 flex-1" alt="logo" />
      <div class="flex flex-col items-start">
        <span class="font-bold text-sm text-gray-800">Biznet Home</span>
        <p class="text-xs text-slate-400">Jakarta, ID</p>
      </div>
    </div>
    <div class="flex gap-2">
      <span class="bg-secondary/10 text-secondary font-medium rounded-md px-2 py-1 text-xs">Up to 1 Gbps</span>
    </div>
  </div>

  <!-- Card Random 3 (Kiri Bawah) -->
  <div class="flex flex-col gap-3 bg-white shadow-lg absolute bottom-[15%] left-[20%] rounded-xl px-4 py-3 z-30 hover:-translate-y-1 transition-all duration-300">
    <div class="flex items-center gap-4">
      <img src="../assets/images/logo.svg" class="w-8 h-8 flex-1" alt="logo" />
      <div class="flex flex-col items-start">
        <span class="font-bold text-sm text-gray-800">First Media</span>
        <p class="text-xs text-slate-400">Bandung, ID</p>
      </div>
    </div>
    <div class="flex gap-2">
      <span class="bg-accent/10 text-accent font-medium rounded-md px-2 py-1 text-xs">Cable + TV</span>
    </div>
  </div>

  <!-- Gambar Globe (Background) -->
  <img
    class="w-[75%] relative -bottom-16 opacity-90 drop-shadow-2xl"
    src="../assets/images/globe.svg"
    alt="globe" />
</div>
      </div>
    </div>
    `;
  }
}

customElements.define("hero-header", Hero);
