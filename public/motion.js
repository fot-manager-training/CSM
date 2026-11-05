const wave=document.querySelector('.hero-wave');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function updateMotion(){if(!wave)return;if(reduced.matches||document.hidden){wave.pauseAnimations();if(reduced.matches)wave.setCurrentTime(0);}else wave.unpauseAnimations();}
reduced.addEventListener('change',updateMotion);document.addEventListener('visibilitychange',updateMotion);updateMotion();
