# DJBrysi.co.uk — website and deployment guide

A responsive, single-page DJ website with Home, Twitch Live, SoundCloud Mixes, About, Events and Contact sections. Built as static HTML/CSS/JS for Cloudflare Pages. No paid hosting or build tools required.

## Before publishing

1. Your supplied original white Brysi logo is included at `assets/brysi-logo.png` (black background made transparent and image tightly cropped for web display; lettering and headphones artwork preserved).
2. Check the About text; it is draft marketing copy, not a verified personal biography.
3. The Events section deliberately says dates are to be announced; update it when you have dates.
4. Confirm that `https://soundcloud.com/brysi1` is your correct SoundCloud profile and allows embedding. SoundCloud may require a track/playlist embed code rather than a profile URL. If the player does not display, use SoundCloud > Share > Embed on your preferred playlist and replace the SoundCloud iframe in `index.html` with the supplied iframe code.
5. Contact currently links to Twitch and SoundCloud. No contact email address or third-party form has been assumed.

## 1. GitHub

1. Sign in to https://github.com and create a new repository named `djbrysi-website` (public is easiest).
2. Upload **the contents of this folder** to the root of the repository (`index.html`, `styles.css`, `script.js`, `assets/`, etc.). Do not upload only the ZIP file.
3. Commit to the `main` branch. Do not enable GitHub Pages — Cloudflare Pages will host the site.

## 2. Cloudflare Pages

1. Sign in to https://dash.cloudflare.com and choose **Workers & Pages** > **Create** > **Pages** > **Connect to Git** (wording may vary).
2. Authorize GitHub and select the `djbrysi-website` repository.
3. Framework preset: **None**. Build command: **leave blank**. Build output directory: **/** (repository root, or the UI's root directory setting). Production branch: `main`.
4. Deploy. Cloudflare will give you a preview domain such as `your-project.pages.dev` (the exact name is assigned by Cloudflare).
5. Check the website on desktop and mobile. Every subsequent push to `main` triggers a new deployment.

## 3. IONOS domain + Cloudflare DNS

1. In Cloudflare choose **Add a domain / Onboard a domain**, enter `djbrysi.co.uk`, select **Free**.
2. Review the imported DNS records carefully, including any services still in use. You said IONOS email is not used, but confirm no other service relies on existing DNS records.
3. Cloudflare displays **two nameservers assigned specifically to your domain**. Copy those exact values.
4. In IONOS domain settings for `djbrysi.co.uk`, find **Nameservers** and replace the existing nameservers with the two Cloudflare nameservers. Do not guess these values.
5. Wait for Cloudflare to show the domain as active. DNS changes can take time to propagate.
6. In **Workers & Pages** > your project > **Custom domains** > **Set up a domain**, add `djbrysi.co.uk`. Cloudflare should provision DNS and HTTPS for the apex domain.
7. Add `www.djbrysi.co.uk` as a second custom domain if desired. Configure a redirect to the preferred hostname (usually `djbrysi.co.uk`) once both work.
8. Verify `https://djbrysi.co.uk`, `https://www.djbrysi.co.uk` (if added), Twitch playback and SoundCloud playback.

Do not change IONOS nameservers until the Cloudflare zone and project are ready. IONOS remains your domain registrar; Cloudflare becomes the DNS and website hosting provider.

## Editing the website

- `index.html` — sections, wording and links.
- `styles.css` — design, colours, mobile layouts.
- `script.js` — mobile menu, Twitch embed hostname, logo fallback.
- `assets/brysi-logo.png` — your original logo.

The Twitch embed uses the actual website hostname as the required `parent` parameter. Twitch embeds require HTTPS on public websites. On the Cloudflare preview domain it will automatically use the preview hostname.

## Useful documentation

- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://dev.twitch.tv/docs/embed/
- https://help.soundcloud.com/hc/en-us/articles/115003453587-Embedded-players
