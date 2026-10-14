// Cloudflare Pages Function: fetch profile artwork via SoundCloud's public oEmbed endpoint.
const PROFILES = new Map([
  ['https://on.soundcloud.com/QqP5fOCclzpLRarc3v', true],
  ['https://on.soundcloud.com/m6wPpZhc7cjxpl6Ccf', true],
  ['https://soundcloud.com/djjoetaylor', true],
  ['https://soundcloud.com/hugh-mcgee', true],
  ['https://soundcloud.com/dj-kai-george', true],
]);
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const profile = url.searchParams.get('url') || '';
  if (!PROFILES.has(profile)) return Response.json({ error: 'Unknown profile' }, { status: 400 });
  try {
    const endpoint = 'https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(profile);
    const res = await fetch(endpoint, { redirect: 'follow', headers: { Accept: 'application/json' }, cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!res.ok) return Response.json({ image: null }, { status: 200, headers: { 'Cache-Control': 'public, max-age=1800' } });
    const data = await res.json();
    const image = typeof data.thumbnail_url === 'string' && /^https:\/\//.test(data.thumbnail_url) ? data.thumbnail_url : null;
    return Response.json({ image }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch (_) {
    return Response.json({ image: null }, { headers: { 'Cache-Control': 'public, max-age=600' } });
  }
}
