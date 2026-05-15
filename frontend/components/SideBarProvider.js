export default class SideBarProvider extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="flex min-h-full flex-col items-start bg-base-200 text-base-content is-drawer-close:w-14 is-drawer-open:w-64 border-r border-base-300 transition-all duration-300 ease-in-out">
        
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

        <ul class="menu w-full grow p-2 gap-1">
          
          <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Homepage">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="size-5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              <span class="is-drawer-close:hidden transition-opacity duration-200">Homepage</span>
            </a>
          </li>

          <li>
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Transaksi">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              <span class="is-drawer-close:hidden transition-opacity duration-200">Transaksi</span>
            </a>
          </li>

          <li class="mt-auto pt-2 border-t border-base-300">
            <a href="#" class="is-drawer-close:tooltip is-drawer-close:tooltip-right text-base-content/70 hover:text-primary" data-tip="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="size-5"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
              <span class="is-drawer-close:hidden transition-opacity duration-200">Settings</span>
            </a>
          </li>
        </ul>
      </div>
    `;
  }
}

customElements.define("side-bar-provider", SideBarProvider);
