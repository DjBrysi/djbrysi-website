// Cloudflare Pages Function: server-side Skiddle API proxy.
// Set SKIDDLE_API_KEY as an encrypted Production environment variable in Pages.
const API='https://www.skiddle.com/api/v1/events/search/';
const QUERIES=['trance','uplifting trance','hard trance','psytrance'];
const UK=/^(GB|UK|United Kingdom)$/i;
// Skiddle keyword search is fuzzy; exclude clearly unrelated listings.
const TRANCE= /\b(?:trance|psytrance|psy[- ]?trance|uplifting|hardtrance|hard[- ]?trance|progressive trance|tech trance|goa trance|vocal trance|anjunabeats|anjunadeep|above\s*&\s*beyond|armin van buuren|aly\s*&\s*fila|paul van dyk|ferry corsten|giuseppe ottaviani|bryan kearney|john o.?callaghan|factor b|solarstone|markus schulz|subculture|luminosity|dreamstate|transmission festival|trance classics)\b/i;
const EXCLUDE=/\b(?:audio tour|walking tour|history tour|museum|comedy|theatre|theater|quiz night|pub quiz|business conference|heritage tour|ghost walk)\b/i;
function isTrance(e){const v=[e.title,e.genres,e.lineup].filter(Boolean).join(' ');return TRANCE.test(v)&&!EXCLUDE.test(e.title)}
function string(v){return typeof v==='string'?v:''}
function coords(venue){const lat=Number(venue?.latitude??venue?.lat),lon=Number(venue?.longitude??venue?.lon??venue?.lng);return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=49.5&&lat<=61&&lon>=-9&&lon<=3?{lat,lon}:{lat:null,lon:null}}
function region(lat,lon,city){const c=String(city||'').toLowerCase();if(/belfast|derry|northern ireland/.test(c)||lat>=54&&lon<-5.3)return 'Northern Ireland';if(/cardiff|swansea|newport|wales/.test(c)||lat<53.5&&lon<-3.0)return 'Wales';if(lat>=55.4)return 'Scotland';if(lat>=53.4)return 'North England';if(lat>=52)return 'Midlands';return 'South England'}
function normalise(e){const venue=e.venue||{},p=coords(venue),title=string(e.eventname||e.name).trim();const date=string(e.date||e.startdate).slice(0,10);const url=string(e.link||e.url);if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^https:\/\//i.test(url))return null;
 const city=string(venue.town||venue.city||e.town||e.city);const genres=Array.isArray(e.genres)?e.genres.map(x=>string(x.name||x)).join(', '):'';
 const lineup=Array.isArray(e.artists)?e.artists.map(x=>string(x.name||x)).filter(Boolean).join(', '):string(e.artists||e.lineup);
 const image=string(e.largeimageurl||e.imageurl||e.image||'');
 return {id:String(e.id||url),title,date,venue:string(venue.name),city,region:region(p.lat,p.lon,city),lat:p.lat,lon:p.lon,url, image:/^https:\/\//i.test(image)?image:'',lineup,genres,source:'Skiddle'};
}
export async function onRequestGet({env}){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600','Access-Control-Allow-Origin':'*'};
 if(!env.SKIDDLE_API_KEY)return new Response(JSON.stringify({error:'Skiddle API key is not configured for this deployment.',events:[]}),{status:503,headers:{...headers,'Cache-Control':'no-store'}});
 const now=new Date();const ukToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 try{
 const responses=await Promise.all(QUERIES.map(async keyword=>{const q=new URL(API);q.search=new URLSearchParams({api_key:env.SKIDDLE_API_KEY,country:'GB',keyword,minDate:ukToday,order:'date',limit:'100',description:'1'}).toString();const r=await fetch(q.toString(),{cf:{cacheTtl:3600,cacheEverything:true}});if(!r.ok)throw Error('Skiddle request failed ('+r.status+')');const json=await r.json();if(json.error&&String(json.error)!=='0')throw Error('Skiddle returned an API error');return Array.isArray(json.results)?json.results:[]}));
 const seen=new Set();const events=responses.flat().filter(e=>!e.cancelled||String(e.cancelled)==='0').map(normalise).filter(e=>e&&e.date>=ukToday&&isTrance(e)).filter(e=>{if(seen.has(e.id))return false;seen.add(e.id);return true}).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,250);
 return new Response(JSON.stringify({events,source:'Skiddle',updated:now.toISOString(),notice:'Listings from Skiddle; not an exhaustive UK events directory.'}),{headers});
 }catch(e){return new Response(JSON.stringify({error:'Unable to load Skiddle events at present.',events:[]}),{status:502,headers:{...headers,'Cache-Control':'no-store'}})}
}
