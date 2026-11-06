import {initRibbons} from './ribbons.js?v=ribbons-20261106';
import {initNavigation} from './navigation.js?v=afisha-20261106';
const $=id=>document.getElementById(id);
const page=document.body.dataset.page;
function iconize(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())if(walker.currentNode.textContent.includes('↗'))nodes.push(walker.currentNode);
 for(const node of nodes){const fragment=document.createDocumentFragment();const parts=node.textContent.split('↗');parts.forEach((part,i)=>{fragment.append(document.createTextNode(part));if(i<parts.length-1){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','arrow-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 19 19 5M5 5h14v14');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');svg.append(path);fragment.append(svg);}});node.replaceWith(fragment);}
}
let toastTimer;
function notify(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}

function updateSavedCount(){try{const saved=JSON.parse(localStorage.getItem('dtaas-favorites')||'[]');$('saved-count').textContent=Array.isArray(saved)?saved.length:0;}catch{$('saved-count').textContent='0';}}
// Keep older shared links working while each section now has a standalone URL.
function migrateLegacyRoute(){const hash=location.hash.slice(1);const target=hash.startsWith('event/')?'events':hash.startsWith('case/')?'cases':hash.startsWith('partner/')?'partners':['home','events','cases','partners'].includes(hash)?hash:null;if(target&&target!==page){location.replace(`./${target==='home'?'index':target}.html${hash.includes('/')?'#'+hash:''}`);return true;}return false;}
initNavigation();updateSavedCount();iconize();initRibbons();
window.addEventListener('storage',updateSavedCount);
if(!migrateLegacyRoute()){
 if(page==='home'){
  $('saved-button').onclick=()=>{location.href='./events.html?saved=1';};
  const {initHome}=await import('./home.js?v=afisha-20261106');initHome({iconize});
  window.addEventListener('hashchange',migrateLegacyRoute);
 }else if(page==='events'){
  const {initEvents,routeEvent}=await import('./events-ui.js?v=afisha-20261106');
  initEvents({iconize,notify});routeEvent();window.addEventListener('hashchange',()=>{if(!migrateLegacyRoute())routeEvent();});

 }else{
  $('saved-button').onclick=()=>{location.href='./events.html?saved=1';};
  const {initCatalog,openCatalogRoute}=await import('./catalog.js?v=afisha-20261106');
  initCatalog({iconize,notify});openCatalogRoute(location.hash.slice(1));
  window.addEventListener('hashchange',()=>{if(!migrateLegacyRoute())openCatalogRoute(location.hash.slice(1));});
 }
}
