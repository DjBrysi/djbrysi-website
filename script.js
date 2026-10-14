const menu=document.querySelector('.menu');const links=document.querySelector('#navlinks');menu.addEventListener('click',()=>{const opened=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened));});links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.querySelector('#year').textContent=new Date().getFullYear();const dialog=document.querySelector('#tracklist-dialog');document.querySelector('#show-tracklist').addEventListener('click',()=>dialog.showModal());document.querySelector('#close-tracklist').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});


// Events are loaded from events.json (independent promoters) and optional Ticketmaster feed.
const eventsList=document.querySelector('#events-list');
const eventsStatus=document.querySelector('#events-status');
let allEvents=[];
let map=null,markers=null;
const mapElement=document.querySelector('#events-map');
const mapCaption=document.querySelector('.map-caption');
mapElement.hidden=true;mapCaption.hidden=true;
function ensureMap(){
  if(map||!window.L)return;
  map=L.map(mapElement,{scrollWheelZoom:false}).setView([54.2,-3.0],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:18}).addTo(map);
  markers=L.featureGroup().addTo(map);
}
const safeUrl=u=>{try{const v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:null}catch{return null}};
function eventCard(e){const card=document.createElement('article');card.className='event-card';const h=document.createElement('h3');h.textContent=e.title;card.append(h);const p=document.createElement('p');p.textContent=[e.date,e.venue,e.city].filter(Boolean).join(' · ');card.append(p);if(e.lineup){const q=document.createElement('p');q.textContent='Lineup: '+e.lineup;card.append(q)}const links=document.createElement('div');const ticket=safeUrl(e.url);if(ticket){const a=document.createElement('a');a.href=ticket;a.target='_blank';a.rel='noopener noreferrer';a.textContent='EVENT / TICKETS ↗';links.append(a)}if(e.venue||e.city){const a=document.createElement('a');a.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([e.venue,e.city].filter(Boolean).join(', '));a.target='_blank';a.rel='noopener noreferrer';a.textContent='DIRECTIONS ↗';links.append(a)}card.append(links);return card}
function renderEvents(){const search=document.querySelector('#event-search').value.toLowerCase().trim(),region=document.querySelector('#event-region').value,date=document.querySelector('#event-date').value;const list=allEvents.filter(e=>(!search||[e.title,e.venue,e.city,e.lineup].join(' ').toLowerCase().includes(search))&&(!region||e.region===region)&&(!date||e.date>=date));eventsList.replaceChildren();const hasMappedEvents=list.some(e=>e.lat!=null&&e.lon!=null&&Number.isFinite(Number(e.lat))&&Number.isFinite(Number(e.lon)));mapElement.hidden=!hasMappedEvents;mapCaption.hidden=!hasMappedEvents;if(hasMappedEvents)ensureMap();if(markers)markers.clearLayers();for(const e of list){eventsList.append(eventCard(e));if(markers&&Number.isFinite(+e.lat)&&Number.isFinite(+e.lon)&&e.lat!==null&&e.lon!==null){const m=L.marker([+e.lat,+e.lon]).bindPopup(document.createTextNode(e.title+' — '+(e.venue||e.city||'')));markers.addLayer(m)}}eventsStatus.textContent=list.length?list.length+' upcoming event'+(list.length===1?'':'s')+' found.':'No matching confirmed events are listed yet. Try the event discovery links below.';if(map&&markers&&markers.getLayers().length){requestAnimationFrame(()=>{map.invalidateSize();map.fitBounds(markers.getBounds().pad(.2),{maxZoom:10})})}}
async function loadEvents(){let manual=[];try{const response=await fetch('events.json',{cache:'no-store'});if(response.ok){const data=await response.json();manual=Array.isArray(data)?data:[]}}catch{}const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});allEvents=manual.filter(e=>e&&e.title&&e.date&&e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));renderEvents()}
for(const id of ['event-search','event-region','event-date'])document.getElementById(id).addEventListener('input',renderEvents);
document.getElementById('event-reset').addEventListener('click',()=>{for(const id of ['event-search','event-region','event-date'])document.getElementById(id).value='';renderEvents()});loadEvents();


// Highlight current section in the navigation (works on desktop and mobile).
(()=>{const anchors=[...document.querySelectorAll('#navlinks a[href^="#"]')];if(!anchors.length)return;
const mark=(hash)=>anchors.forEach(a=>{const active=a.getAttribute('href')===hash;a.classList.toggle('is-active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
mark(location.hash||'#home');window.addEventListener('hashchange',()=>mark(location.hash||'#home'));
if('IntersectionObserver'in window){const sections=anchors.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)mark('#'+visible[0].target.id)},{rootMargin:'-18% 0px -52% 0px',threshold:[0,.15,.4]});sections.forEach(s=>observer.observe(s));}
})();
