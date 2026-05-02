export default class Hero extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
    <div class="hero bg-base-200 min-h-screen">
      <div class="hero-content text-center flex-col">
        <div class="max-w-xl">
          <h1 class="text-5xl font-bold">
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
        <div class="flex items-center justify-center relative z-20">
          <div
            class="flex flex-col gap-3 bg-white shadow-md absolute top-4 right-6 rounded-lg px-4 py-2">
            <div class="flex items-center gap-4">
              <img
                src="assets/images/logo.svg"
                class="w-8 h-8 flex-1"
                alt="logo" />
              <div class="flex flex-col items-start">
                <span class="flex-3 font-bold text-sm"
                  >{$this->name_provider}</span
                >
                <p class="text-xs text-slate-400">{$this->location}</p>
              </div>
            </div>

            <div class="flex gap-2">
              <span class="bg-slate-200 rounded-md px-2 py-1 text-xs"
                >{$tag}</span
              >
            </div>
          </div>
          <img
            class="opacity-50 w-[75%]"
            src="assets/images/globe.svg"
            alt="globe" />
        </div>
      </div>
    </div>
    `;
  }
}

customElements.define("hero-header", Hero);
