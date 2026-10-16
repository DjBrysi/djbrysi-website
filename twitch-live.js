
/* DJ Brysi v2.2 — Twitch LIVE/OFFLINE widget */
(() => {
  const side = document.querySelector('#live .live-side');
  if (!side) return;

  const css = document.createElement('style');
  css.textContent = `
    .brysi-twitch-status {
      margin: 0 0 18px;
      padding: 16px 18px;
      border: 1px solid rgba(167,92,255,.45);
      border-radius: 14px;
      background: linear-gradient(125deg,
        rgba(104,38,169,.24),rgba(18,10,31,.94));
      color: #fff;
    }
    .brysi-status-heading {
      display: flex;
      align-items: center;
      gap: 9px;
      font-weight: 800;
      letter-spacing: .08em;
    }
    .brysi-status-dot {
      display: inline-block;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #999;
    }
    .brysi-twitch-status[data-state="live"]
    .brysi-status-dot {
      background: #ff4b66;
      box-shadow: 0 0 0 5px rgba(255,75,102,.16);
      animation: brysi-pulse 1.8s infinite;
    }
    .brysi-twitch-status[data-state="offline"]
    .brysi-status-dot {
      background: #a98cc7;
    }
    .brysi-twitch-status p {
      margin: 9px 0 0;
      color: #e3d9ec;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
    .brysi-twitch-status a {
      color: #ff9b54;
      font-weight: 700;
    }
    @keyframes brysi-pulse {
      50% {
        box-shadow: 0 0 0 9px rgba(255,75,102,0);
      }
    }
  `;
  document.head.appendChild(css);

  const widget = document.createElement('div');
  widget.className = 'brysi-twitch-status';
  widget.dataset.state = 'checking';
  widget.setAttribute('role', 'status');
  widget.setAttribute('aria-live', 'polite');

  widget.innerHTML = `
    <div class="brysi-status-heading">
      <span class="brysi-status-dot"></span>
      <span class="brysi-status-label">
        CHECKING TWITCH…
      </span>
    </div>
    <p class="brysi-status-detail">
      Getting the latest stream status.
    </p>
  `;

  side.prepend(widget);

  const label = widget.querySelector('.brysi-status-label');
  const detail = widget.querySelector('.brysi-status-detail');
  const twitchUrl = 'https://www.twitch.tv/brysi84';
  let lastState = '';

  async function refresh() {
    try {
      const response = await fetch('/api/twitch-status', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Twitch API error: ' + response.status);
      }

      const data = await response.json();

      if (typeof data.live !== 'boolean') {
        throw new Error('Unexpected Twitch response');
      }

      const state = data.live ? 'live' : 'offline';
      widget.dataset.state = state;

      label.textContent = data.live
        ? 'BRYSI IS LIVE NOW'
        : 'BRYSI IS OFFLINE';

      detail.replaceChildren();

      if (data.live) {
        if (data.title) {
          detail.append(
            document.createTextNode(data.title + ' · ')
          );
        }

        const link = document.createElement('a');
        link.href = twitchUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'WATCH LIVE ↗';
        detail.append(link);
      } else {
        detail.textContent =
          'Not streaming right now. Check back for the next set!';
      }

      lastState = state;
    } catch (error) {
      console.warn('DJ Brysi Twitch status:', error);

      if (lastState) return;

      widget.dataset.state = 'unknown';
      label.textContent = 'TWITCH STATUS UNAVAILABLE';
      detail.replaceChildren(
        document.createTextNode('You can still ')
      );

      const link = document.createElement('a');
      link.href = twitchUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'open Twitch ↗';
      detail.append(link);
    }
  }

  refresh();

  setInterval(() => {
    if (!document.hidden) refresh();
  }, 60000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
})();
