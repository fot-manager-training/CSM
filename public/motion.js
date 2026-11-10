// Shared ribbon motion follows system preferences and pauses in a hidden tab.
const waves=[...document.querySelectorAll('.hero-wave,.catalog-curve')];
if(waves.length){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function updateMotion(){
  for(const wave of waves){
   if(reduced.matches||document.hidden){wave.pauseAnimations();if(reduced.matches)wave.setCurrentTime(0);}
   else wave.unpauseAnimations();
  }
 }
 reduced.addEventListener('change',updateMotion);
 document.addEventListener('visibilitychange',updateMotion);
 updateMotion();
}
