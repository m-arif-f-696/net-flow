<?php
class CardHero {
  public $name_provider;
  public $location;
  public $position;
  public $tags = [];

  public function __construct($name_provider, $location, $position, $tags) {
    $this->name_provider = $name_provider;
    $this->location = $location;
    $this->position = $position;
    $this->tags = $tags;
  }

  public function render() {
   // GUNAKAN KUTIP GANDA UNTUK ECHO, DAN KUTIP TUNGGAL UNTUK HTML
   echo "
   <div class='flex flex-col gap-3 bg-white shadow-md absolute {$this->position} rounded-lg px-4 py-2'>
    <div class='flex items-center gap-4'>
      <img src='assets/images/logo.svg' class='w-8 h-8 flex-1' alt='logo'>
      <div class='flex flex-col items-start'>
        <span class='flex-3 font-bold text-sm'>{$this->name_provider}</span>
        <p class='text-xs text-slate-400'>{$this->location}</p>
      </div>
    </div>";  
    
    echo "<div class='flex gap-2'>";
    
    foreach ($this->tags as $tag) {
      // SAMA DI SINI, GUNAKAN KUTIP GANDA DI LUAR
      echo "<span class='bg-slate-200 rounded-md px-2 py-1 text-xs'>{$tag}</span>";
    }
  
    echo "
      </div>
    </div>";
  }
}
?>