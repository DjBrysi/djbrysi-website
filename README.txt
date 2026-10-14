DJ BRYSI — SKIDDLE LIVE EVENTS (20261014-8)

Upload the CONTENTS of this ZIP to the ROOT of your GitHub repository, preserving the functions/api/skiddle.js folder structure.

Cloudflare Pages > Settings > Variables and Secrets > Production:
SKIDDLE_API_KEY = your Skiddle API key (encrypted). Do not put the key in GitHub. Redeploy after setting the secret.

After Cloudflare deploys, test https://djbrysi.co.uk/api/skiddle (JSON should contain events) then https://djbrysi.co.uk/?v=20261014-8#events.

Uses Skiddle official Events Search API, searches four trance-related keywords, up to 100 per query; this is not exhaustive UK coverage. Results are cached at Cloudflare for one hour. No live events were fetched during package creation; validate on deployment.

If Cloudflare returns 404 for /api/skiddle, check that this is a Git-integrated Pages project and that functions/api/skiddle.js is in the repository root.

Keep Skiddle attribution and links. Commercial use may require Skiddle written permission.
