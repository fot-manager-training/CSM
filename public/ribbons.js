const namespace='http://www.w3.org/2000/svg';
const label='ЛЮДИ · ТЕХНОЛОГИИ · ВОЗМОЖНОСТИ · ЦИФРОВОЙ СЕВЕРО-ЗАПАД · ';
const curves={
 wave:'M-160 230C120 20 380 40 560 280S960 510 1190 270 1530 20 1760 220',
 loop:'M-130 410C200 510 380 100 650 150C960 200 1010 610 730 530C450 450 690 140 1080 220S1510 430 1750 120',
 arch:'M-160 470C170 540 170 70 480 110S910 540 1160 350 1480 10 1770 160',
 turn:'M-130 180C310-10 590 140 550 300S930 640 1160 390 1480 50 1760 270',
 coil:'M-100 290C220 20 470 160 560 340C650 520 1040 520 1070 300C1100 50 780 30 810 240C850 520 1380 460 1760 150',
 bend:'M-160 130C240 190 210 530 610 480S1040 90 1330 200 1650 480 1770 390'
};
const variants={home:['arch','loop','wave','turn'],events:['loop','wave','bend','coil'],cases:['arch','coil','bend','wave'],partners:['coil','turn','loop','arch']};
function element(name,attributes={}){const node=document.createElementNS(namespace,name);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;}
function ribbon(id,variant){
 const svg=element('svg',{class:'background-ribbon',viewBox:'0 0 1600 600',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true',focusable:'false'});
 const definitions=element('defs'),path=element('path',{id,d:curves[variant]});definitions.append(path);
 const band=element('use',{href:`#${id}`,fill:'none','stroke-width':'43','stroke-linecap':'round'});
 const text=element('text'),textPath=element('textPath',{href:`#${id}`,startOffset:'0%'});textPath.textContent=label.repeat(8);text.append(textPath);svg.append(definitions,band,text);svg.dataset.variant=variant;return svg;
}
export function initRibbons(){
 const main=document.querySelector('main');if(!main||main.dataset.ribbonsReady)return;
 main.dataset.ribbonsReady='true';const page=document.body.dataset.page||'home';
 const surfaces=[main,...document.querySelectorAll('.case-showcase,.partner-showcase-cap')];
 for(const [surfaceIndex,surface] of surfaces.entries()){
  surface.classList.add('ribbon-surface');
  const layer=document.createElement('div');layer.className='ribbon-layer';layer.setAttribute('aria-hidden','true');layer.setAttribute('role','presentation');surface.prepend(layer);
  const sequence=surfaceIndex===1?['loop','bend']:surfaceIndex===2?['arch']:variants[page]||variants.home;
  function layout(){
   const height=surface.getBoundingClientRect().height;
   const isMain=surface===main,isCap=surface.classList.contains('partner-showcase-cap');
   const start=isMain?(page==='home'?(document.querySelector('.hero')?.offsetHeight||600)-190:40):isCap?-40:-110;
   const spacing=740,waveHeight=isCap?Math.max(280,height):540;
   const count=isCap?1:Math.min(80,Math.max(1,Math.ceil((height-start-180)/spacing)));
   while(layer.children.length>count)layer.lastElementChild.remove();
   while(layer.children.length<count){const index=layer.children.length;layer.append(ribbon(`ribbon-${page}-${surfaceIndex}-${index}`,sequence[index%sequence.length]));}
   for(const [index,svg] of [...layer.children].entries()){svg.style.top=`${start+index*spacing}px`;svg.style.height=`${waveHeight}px`;}
  }
  new ResizeObserver(layout).observe(surface);layout();
 }
}
