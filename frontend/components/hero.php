<?php 
require_once 'components/CardHero.php';

$card1 = new CardHero("Net Jagoan", "Ciamis", "top-10 right-50", ["Wifi", "TV"]);
$card2 = new CardHero("Net Jagoan", "Ciamis", "top-40 left-30", ["Wifi"]);
$card3 = new CardHero("Net Jagoan", "Tasikmalaya", "bottom-20 left-30", ["Wifi", "Database"]);

?>



<div class="hero bg-base-200 min-h-screen">
  <div class="hero-content text-center flex-col">
    <div class="max-w-xl">
      <h1 class="text-5xl font-bold">Find Your Dream Hotspot<br>with <span class="text-primary">NetFlow</span></h1>
      <p class="py-6">
        Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
        quasi. In deleniti eaque aut repudiandae et a id nisi.
      </p>
      <div class="flex gap-4 items-center justify-center">
        <button class="btn btn-primary">Find Provider</button>
        <button class="btn btn-outline btn-primary">Become as Provider</button>
      </div>
    </div>
    <div class="flex items-center justify-center relative z-20">
      <?php 
        $card1->render();
        $card2->render();
        $card3->render();
      ?>
      <img class="opacity-50 w-[75%]" src="assets/images/globe.svg" alt="globe">
    </div>
  </div>
</div>