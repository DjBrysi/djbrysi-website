const menu=document.querySelector('.menu');const links=document.querySelector('#navlinks');menu.addEventListener('click',()=>{const opened=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened));});links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.querySelector('#year').textContent=new Date().getFullYear();const dialog=document.querySelector('#tracklist-dialog');document.querySelector('#show-tracklist').addEventListener('click',()=>dialog.showModal());document.querySelector('#close-tracklist').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});


// UK trance and bounce events: live Skiddle feed via a Cloudflare Pages Function.
const eventsList=document.querySelector('#events-list');
const eventsStatus=document.querySelector('#events-status');
const mapElement=document.querySelector('#events-map');
const mapCaption=document.querySelector('.map-caption');
let allEvents=[],map=null,markers=null,visibleEventCount=8;
const moreEventsButton=document.querySelector('#events-more');
// Explicit Leaflet marker images: avoid broken relative asset paths on Cloudflare Pages.
const brysiEventMarker=L.icon({
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]
});
const safeUrl=u=>{try{const v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:null}catch{return null}};
function ensureMap(){
  if(map||!window.L)return;
  map=L.map(mapElement,{scrollWheelZoom:false,zoomControl:true,preferCanvas:true,fadeAnimation:false,zoomAnimation:false}).setView([54.4,-3.4],5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom:19,keepBuffer:2,updateWhenIdle:true
  }).addTo(map);
  markers=L.featureGroup().addTo(map);
  setTimeout(()=>map.invalidateSize({pan:false}),350);
  window.addEventListener("resize",()=>map.invalidateSize({pan:false}));
  if("ResizeObserver" in window)new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(mapElement);
}
function eventCoords(e){const lat=Number(e.lat),lon=Number(e.lon);return e.lat!==null&&e.lat!==undefined&&e.lat!==''&&e.lon!==null&&e.lon!==undefined&&e.lon!==''&&Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=49.5&&lat<=61&&lon>=-9&&lon<=3?[lat,lon]:null}
function eventCard(e){
 const card=document.createElement('article');card.className='event-card';
 const h=document.createElement('h3');h.textContent=e.title;card.append(h);if(e.genre){const badge=document.createElement('span');badge.className='event-genre-badge';badge.textContent=e.genre;card.append(badge)}
 const p=document.createElement('p');p.textContent=[e.date,e.venue,e.city].filter(Boolean).join(' · ');card.append(p);
 if(e.image){const img=document.createElement('img');img.className='event-poster';img.src=e.image;img.alt='Poster for '+e.title;img.loading='lazy';img.referrerPolicy='no-referrer';card.prepend(img)}
 if(e.lineup){const q=document.createElement('p');q.textContent='Lineup: '+e.lineup;card.append(q)}
 const links=document.createElement('div');const ticket=safeUrl(e.url);
 if(ticket){const a=document.createElement('a');a.href=ticket;a.target='_blank';a.rel='noopener noreferrer';a.textContent='EVENT / TICKETS ↗';links.append(a)}
 if(e.venue||e.city){const a=document.createElement('a');a.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([e.venue,e.city].filter(Boolean).join(', '));a.target='_blank';a.rel='noopener noreferrer';a.textContent='DIRECTIONS ↗';links.append(a)}
 card.append(links);if(e.source==='Skiddle'){const credit=document.createElement('small');credit.className='event-credit';credit.textContent='Event information: Skiddle';card.append(credit)}return card;
}
function renderEvents(){
 const search=document.querySelector('#event-search').value.toLowerCase().trim(),region=document.querySelector('#event-region').value,date=document.querySelector('#event-date').value,genre=document.querySelector('#event-genre').value;
 const list=allEvents.filter(e=>(!search||[e.title,e.venue,e.city,e.lineup,e.genre].join(' ').toLowerCase().includes(search))&&(!region||e.region===region)&&(!date||e.date>=date)&&(!genre||e.genre===genre));
 eventsList.replaceChildren();
 for(const e of list.slice(0,visibleEventCount))eventsList.append(eventCard(e));
 moreEventsButton.hidden=list.length<=visibleEventCount;
 if(!moreEventsButton.hidden)moreEventsButton.textContent='SHOW MORE EVENTS ('+(list.length-visibleEventCount)+' REMAINING) ↓';
 eventsStatus.textContent=list.length?list.length+' upcoming Skiddle event'+(list.length===1?'':'s')+' found. Results may not include every UK trance or bounce night.':(allEvents.length?'No events match your filters.':'No upcoming Skiddle events found. Try again later or use the discovery links below.');
 if(!map)return;
 markers.clearLayers();
 for(const e of list){const coords=eventCoords(e);if(!coords)continue;
   const popup=document.createElement('div');const title=document.createElement('strong');title.textContent=e.title;popup.append(title);
   const details=document.createElement('p');details.textContent=[e.date,e.venue,e.city].filter(Boolean).join(' · ');popup.append(details);
   const url=safeUrl(e.url);if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Event / tickets ↗';popup.append(link)}
   markers.addLayer(L.marker(coords,{icon:brysiEventMarker}).bindPopup(popup));
 }
 if(markers.getLayers().length){const bounds=markers.getBounds();if(markers.getLayers().length===1)map.setView(bounds.getCenter(),9);else map.fitBounds(bounds.pad(.22),{maxZoom:10});mapCaption.textContent='Select an event pin for details and ticket links.'}
 else {map.setView([54.4,-3.4],5);mapCaption.textContent='UK venue map — event pins appear as verified listings are added.'}
 requestAnimationFrame(()=>setTimeout(()=>map.invalidateSize({pan:false}),250));
}
async function loadEvents(){
 eventsStatus.textContent='Loading upcoming events from Skiddle…';
 try{
  const response=await fetch('/api/skiddle',{cache:'default'});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Event feed temporarily unavailable');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  allEvents=(Array.isArray(data.events)?data.events:[]).filter(e=>e&&typeof e.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')&&e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  renderEvents();
 }catch(err){allEvents=[];renderEvents();eventsStatus.textContent='Skiddle events could not be loaded right now. Please try again later or use the links below.';}
}
moreEventsButton.addEventListener('click',()=>{visibleEventCount+=8;renderEvents()});
for(const id of ['event-search','event-region','event-date','event-genre'])document.getElementById(id).addEventListener('input',()=>{visibleEventCount=8;renderEvents()});
document.getElementById('event-reset').addEventListener('click',()=>{for(const id of ['event-search','event-region','event-date','event-genre'])document.getElementById(id).value='';visibleEventCount=8;renderEvents()});
function initEventsMap(){
 loadEvents();
 if(!window.L){mapCaption.textContent='Map temporarily unavailable. Event details and directions are still available below.';return;}
 const startMap=()=>{if(map)return;ensureMap();renderEvents();setTimeout(()=>map&&map.invalidateSize(true),350)};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();startMap()}},{rootMargin:'300px 0px'});
  observer.observe(mapElement);
 }else startMap();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initEventsMap);else initEventsMap();

// Highlight current section in the navigation (works on desktop and mobile).
(()=>{const anchors=[...document.querySelectorAll('#navlinks a[href^="#"]')];if(!anchors.length)return;
const mark=(hash)=>anchors.forEach(a=>{const active=a.getAttribute('href')===hash;a.classList.toggle('is-active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
mark(location.hash||'#home');window.addEventListener('hashchange',()=>mark(location.hash||'#home'));
if('IntersectionObserver'in window){const sections=anchors.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)mark('#'+visible[0].target.id)},{rootMargin:'-18% 0px -52% 0px',threshold:[0,.15,.4]});sections.forEach(s=>observer.observe(s));}
})();
