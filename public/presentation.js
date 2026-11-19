(()=>{
 'use strict';
 const film=document.getElementById('film');
 const scenes=[...document.querySelectorAll('.scene')];
 const chapters=[...document.querySelectorAll('.chapters [data-scene]')];
 const timeline=document.getElementById('timeline');
 const play=document.getElementById('play');
 const previous=document.getElementById('previous');
 const next=document.getElementById('next');
 const fullscreen=document.getElementById('fullscreen');
 const status=document.getElementById('presentation-status');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const starts=[];let total=0;
 for(const scene of scenes){starts.push(total);total+=Number(scene.dataset.duration);}
 let time=0,current=-1,playing=!reduced.matches,last=0;
 const clock=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
 const announce=text=>{status.textContent=text;};
 timeline.max=String(total);
 function setPlaying(value){
  playing=value;last=0;film.classList.toggle('is-paused',!playing);film.classList.toggle('is-playing',playing);
  const ended=time>=total;
  play.setAttribute('aria-label',playing?'Приостановить презентацию':ended?'Посмотреть сначала':'Воспроизвести презентацию');
  play.title=playing?'Пауза · Пробел':'Воспроизвести · Пробел';
  document.getElementById('play-icon').innerHTML=playing?'<path d="M7 5h4v14H7zM15 5h4v14h-4z"/>':ended?'<path d="M12 4a8 8 0 1 1-7.5 5H2l4-5 4 5H7a5 5 0 1 0 5-2Z"/>':'<path d="m9 5 11 7-11 7Z"/>';
 }
 function update(value){
  time=Math.max(0,Math.min(total,Number(value)||0));
  const index=starts.findLastIndex(start=>time>=start);
  if(index!==current){
   current=index;
   scenes.forEach((scene,i)=>{const active=i===index;scene.classList.toggle('is-active',active);scene.inert=!active;scene.setAttribute('aria-hidden',String(!active));});
   chapters.forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
   document.getElementById('scene-number').textContent=`${String(index+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;
   document.getElementById('stage-caption').textContent=scenes[index].dataset.title;
   document.getElementById('transport-caption').textContent=scenes[index].dataset.title;
   announce(`Сцена ${index+1} из ${scenes.length}. ${scenes[index].dataset.title}`);
   film.dataset.scene=String(index);
  }
  timeline.value=String(time);timeline.style.setProperty('--progress',`${time/total*100}%`);
  timeline.setAttribute('aria-valuetext',`${clock(time)} из ${clock(total)}. ${scenes[current].dataset.title}`);
  document.getElementById('elapsed').textContent=clock(time);
  previous.disabled=current===0;next.disabled=current===scenes.length-1;
  const ended=time>=total,wasEnded=film.classList.contains('is-ended');film.classList.toggle('is-ended',ended);
  if(ended&&(playing||!wasEnded)){setPlaying(false);announce('Презентация завершена. Можно посмотреть сначала или открыть платформу.');}
  else if(!ended&&wasEnded)setPlaying(playing);
 }
 function toggle(){if(time>=total)update(0);setPlaying(!playing);}
 function jump(index){update(starts[Math.max(0,Math.min(scenes.length-1,index))]);last=0;}
 play.addEventListener('click',toggle);
 previous.addEventListener('click',()=>jump(current-1));
 next.addEventListener('click',()=>jump(current+1));
 chapters.forEach(button=>button.addEventListener('click',()=>jump(Number(button.dataset.scene))));
 timeline.addEventListener('input',()=>{update(timeline.value);last=0;});
 document.addEventListener('visibilitychange',()=>{last=0;});
 reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});
 document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('button,a,input,select,textarea'))return;
  if([' ','ArrowLeft','ArrowRight','Home','End','k','K','f','F'].includes(event.key))event.preventDefault();else return;
  if([' ','k','K'].includes(event.key))toggle();
  if(event.key==='ArrowLeft')jump(current-1);
  if(event.key==='ArrowRight')jump(current+1);
  if(event.key==='Home')jump(0);
  if(event.key==='End')jump(scenes.length-1);
  if(['f','F'].includes(event.key))fullscreen.click();
 });
 const canFullscreen=Boolean(film.requestFullscreen&&document.fullscreenEnabled);
 fullscreen.hidden=!canFullscreen;
 fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await film.requestFullscreen();}catch{announce('Не удалось открыть полноэкранный режим. Продолжайте смотреть в окне.');}});
 document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===film;fullscreen.setAttribute('aria-label',active?'Выйти из полноэкранного режима':'На весь экран');fullscreen.setAttribute('aria-pressed',String(active));});
 function frame(now){if(last&&playing&&!document.hidden)update(time+(now-last)/1000);last=now;requestAnimationFrame(frame);}
 update(0);setPlaying(playing);requestAnimationFrame(frame);

 // Export the same presentation as one HTML file, including its fonts and logo.
 const download=document.getElementById('download');
 if(location.protocol==='file:')download.hidden=true;
 download.addEventListener('click',async()=>{
  const label=download.querySelector('span');download.disabled=true;label.textContent='Готовим HTML…';
  const dataCache=new Map();
  async function dataUrl(url){
   const absolute=new URL(url,location.href).href;
   if(!dataCache.has(absolute))dataCache.set(absolute,(async()=>{const response=await fetch(absolute);if(!response.ok)throw Error('Asset unavailable');const blob=await response.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});})());
   return dataCache.get(absolute);
  }
  try{
   const clone=document.documentElement.cloneNode(true);
   for(const link of clone.querySelectorAll('link[rel=stylesheet]')){
    const url=new URL(link.getAttribute('href'),location.href),response=await fetch(url);if(!response.ok)throw Error('Styles unavailable');let css=await response.text();
    const assets=[...new Set([...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match=>match[1]))];
    for(const asset of assets){if(asset.startsWith('data:'))continue;css=css.split(asset).join(await dataUrl(new URL(asset,url)));}
    const style=document.createElement('style');style.textContent=css;link.replaceWith(style);
   }
   for(const script of clone.querySelectorAll('script[src]')){const response=await fetch(new URL(script.getAttribute('src'),location.href));if(!response.ok)throw Error('Script unavailable');const inline=document.createElement('script');inline.type='module';inline.textContent=await response.text();script.replaceWith(inline);}
   for(const image of clone.querySelectorAll('img[src]'))image.setAttribute('src',await dataUrl(image.getAttribute('src')));
   for(const icon of clone.querySelectorAll('link[rel=icon]'))icon.setAttribute('href',await dataUrl(icon.getAttribute('href')));
   for(const anchor of clone.querySelectorAll('a[href]'))anchor.setAttribute('href',new URL(anchor.getAttribute('href'),location.href).href);
   clone.querySelector('#download').hidden=true;clone.querySelector('#download').disabled=false;clone.querySelector('#presentation-status').textContent='';
   const blob=new Blob(['<!doctype html>\n',clone.outerHTML],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download='DTaaS-SZB-presentation.html';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   announce('HTML-презентация скачана. Её можно открыть в браузере без интернета. Ссылки на платформу доступны при подключении к сети.');
  }catch{announce('Не удалось скачать HTML. Проверьте соединение и попробуйте ещё раз.');}
  finally{download.disabled=false;label.textContent='Скачать HTML';}
 });
})();
