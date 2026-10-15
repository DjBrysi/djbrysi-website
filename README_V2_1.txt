DJ Brysi v2.1 — SEO foundation (15 October 2026)

Based on Friends Profile Photos v15. Preserves existing page content, design, map, Skiddle and SoundCloud functions.

Added: canonical URL, robots directive, Open Graph and Twitter previews, Person structured data, sitemap.xml, robots.txt, social-preview.jpg. Cache version 20261015-21.

DEPLOY: Commit all files to a new GitHub branch first and inspect Cloudflare Pages preview URL. Check homepage, friend avatars, map, filters, and links before merging to main. Keep SKIDDLE_API_KEY secret in Cloudflare; do not commit it.

GOOGLE SEARCH CONSOLE: Add URL-prefix property https://djbrysi.co.uk/; verify ownership with the DNS TXT record Google supplies in Cloudflare DNS. Then submit https://djbrysi.co.uk/sitemap.xml.

CLOUDFLARE WEB ANALYTICS: Enable in Cloudflare dashboard. If Cloudflare gives a JavaScript beacon snippet, add that exact snippet before </head> (not included here because site-specific token is required). If Cloudflare auto-injects analytics on Pages, avoid duplicate snippet.

NOTE: This is a single-page website. Sitemap lists only homepage; anchors are not separate URLs. Social image is a crop of the existing approved hero artwork. Test preview appearance with social debugger after deployment.
