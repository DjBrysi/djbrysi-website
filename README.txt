DJ BRYSI WEBSITE UPDATE

Upload the contents of this ZIP (not the ZIP itself) to the ROOT of your GitHub repository. Replace index.html, style.css, script.js; keep all PNGs at root. No assets folder.

Includes: header artwork and clickable social buttons; live Twitch; SoundCloud profile player (if SoundCloud permits profile embedding); Unrestricted Bounce approved artwork; Friends of Brysi; About photo; UK events list and Leaflet/OpenStreetMap map.

EVENTS: events.json is EMPTY intentionally. No unverified events are displayed. To add a verified event, use JSON entries such as:
[{"title":"Example trance night","date":"2027-01-30","venue":"Example venue","city":"Manchester","region":"North England","lineup":"DJ Example","url":"https://example.com/tickets","lat":53.48,"lon":-2.24}]
Only use real verified events and URLs. The site filters past dates and supports map pins when coordinates exist. Automatic feed ingestion is NOT configured: Ticketmaster requires an API key and server-side refresh workflow. Smaller independent events need additional sources/manual submissions.

SoundCloud profile embed availability depends on SoundCloud permissions; replace with a track or playlist embed if the profile player does not load.

Use Cloudflare Pages root deployment; commit changes and clear browser cache if needed.
