
/* DJ Brysi v2.2 - Twitch Live Hub */
(() => {
  const CHANNEL = "brysi84";
  const TWITCH_URL = `https://www.twitch.tv/${CHANNEL}`;

  // Set a date when your next livestream is confirmed.
  // Example: "2026-10-24T20:00:00+01:00"
  // Leave blank to show "To be announced".
  const NEXT_STREAM = "";

  const side = document.querySelector("#live .live-side");
  if (!side) return;

  const css = document.createElement("style");
  css.textContent = `
    .brysi-live-hub {
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .brysi-live-card {
      background: linear-gradient(
        135deg,
        rgba(107, 33, 168, .25),
        rgba(17, 10, 28, .95)
      );
      border: 1px solid rgba(168, 85, 247, .45);
      border-radius: 14px;
      padding: 20px;
    }

    .brysi-live-label {
      color: #c9a7e8;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .brysi-live-status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 19px;
      font-weight: 900;
    }

    .brysi-live-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #a78bba;
      flex-shrink: 0;
    }

    .brysi-live-hub[data-state="live"]
    .brysi-live-dot {
      background: #ff435e;
      box-shadow: 0 0 12px #ff435e;
      animation: brysi-live-pulse 1.6s infinite;
    }

    @keyframes brysi-live-pulse {
      50% { opacity: .4; }
    }

    .brysi-live-detail {
      color: #d6c8e0;
      font-size: 14px;
      line-height: 1.6;
      margin: 12px 0 0;
      overflow-wrap: anywhere;
    }

    .brysi-live-value {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 8px;
    }

    .brysi-countdown {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 15px;
    }

    .brysi-countdown-unit {
      background: rgba(168, 85, 247, .13);
      border: 1px solid rgba(168, 85, 247, .25);
      border-radius: 9px;
      text-align: center;
      padding: 10px 3px;
    }

    .brysi-countdown-number {
      display: block;
      font-size: 21px;
      font-weight: 900;
      color: #ff8a35;
    }

    .brysi-countdown-name {
      display: block;
      font-size: 10px;
      color: #d3bde3;
      text-transform: uppercase;
    }

    .brysi-hub-link {
      display: block;
      padding: 14px;
      background: linear-gradient(
        90deg, #9218fa, #e827b9
      );
      color: #fff !important;
      text-align: center;
      text-decoration: none;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
      border-radius: 5px;
    }

    .brysi-hub-secondary {
      color: #ff963f;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
    }

    .brysi-live-hub .brysi-hub-link:hover {
      filter: brightness(1.15);
    }

    @media (max-width: 600px) {
      .brysi-live-card { padding: 15px; }
      .brysi-countdown-number { font-size: 17px; }
    }
  `;
  document.head.appendChild(css);

  // Replace only the right-hand Twitch panel contents.
  side.replaceChildren();

  const hub = document.createElement("div");
  hub.className = "brysi-live-hub";
  hub.dataset.state = "checking";

  hub.innerHTML = `
    <div class="brysi-live-card">
      <div class="brysi-live-label">Stream status</div>
      <div class="brysi-live-status" role="status"
           aria-live="polite">
        <span class="brysi-live-dot"></span>
        <span id="brysi-status-text">CHECKING...</span>
      </div>
      <p class="brysi-live-detail"
         id="brysi-stream-detail">
        Connecting to Twitch...
      </p>
    </div>

    <div class="brysi-live-card">
      <div class="brysi-live-label">Next livestream</div>
      <p class="brysi-live-value"
         id="brysi-next-stream">
        To be announced
      </p>
      <div id="brysi-countdown-container"></div>
    </div>

    <div class="brysi-live-card">
      <div class="brysi-live-label">Previous broadcasts</div>
      <p class="brysi-live-detail">
        Missed a set? Catch up on previous
        livestreams on Twitch.
      </p>
      <a class="brysi-hub-secondary"
         href="https://www.twitch.tv/brysi84/videos?filter=archives&sort=time"
         target="_blank"
         rel="noopener noreferrer">
        VIEW PAST BROADCASTS ↗
      </a>
    </div>

    <a class="brysi-hub-link"
       href="${TWITCH_URL}"
       target="_blank"
       rel="noopener noreferrer"
       id="brysi-watch-button">
      OPEN TWITCH ↗
    </a>
  `;

  side.appendChild(hub);

  const statusText = hub.querySelector("#brysi-status-text");
  const detail = hub.querySelector("#brysi-stream-detail");
  const watchButton = hub.querySelector("#brysi-watch-button");
  const nextText = hub.querySelector("#brysi-next-stream");
  const countdownBox = hub.querySelector(
    "#brysi-countdown-container"
  );

  let previousState = "";

  async function updateTwitch() {
    try {
      const response = await fetch("/api/twitch-status", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Twitch API returned ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.live !== "boolean") {
        throw new Error("Invalid Twitch response");
      }

      if (data.live) {
        hub.dataset.state = "live";
        statusText.textContent = "BRYSI IS LIVE NOW!";
        watchButton.textContent = "WATCH LIVE ↗";

        const title = data.title || "DJ Brysi is streaming";
        const viewers = Number.isFinite(data.viewers)
          ? ` · ${data.viewers.toLocaleString()} watching`
          : "";

        detail.textContent = title + viewers;
        previousState = "live";
      } else {
        hub.dataset.state = "offline";
        statusText.textContent = "BRYSI IS OFFLINE";
        detail.textContent =
          "Not streaming right now. Check back for the next set!";
        watchButton.textContent = "OPEN TWITCH ↗";
        previousState = "offline";
      }
    } catch (error) {
      console.warn("DJ Brysi Twitch status:", error);

      if (previousState) {
        detail.textContent =
          "Unable to refresh. Showing last known status.";
        return;
      }

      hub.dataset.state = "unknown";
      statusText.textContent = "STATUS UNAVAILABLE";
      detail.textContent =
        "Twitch status could not be checked. Open Twitch directly.";
    }
  }

  function updateCountdown() {
    if (!NEXT_STREAM) {
      nextText.textContent = "To be announced";
      countdownBox.replaceChildren();
      return;
    }

    const target = new Date(NEXT_STREAM);
    if (Number.isNaN(target.getTime())) {
      nextText.textContent = "Schedule unavailable";
      countdownBox.replaceChildren();
      return;
    }

    nextText.textContent = target.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });

    const remaining = target.getTime() - Date.now();

    if (remaining <= 0) {
      countdownBox.textContent =
        "Scheduled start time reached — check Twitch!";
      return;
    }

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(
      (remaining % 86400000) / 3600000
    );
    const minutes = Math.floor(
      (remaining % 3600000) / 60000
    );
    const seconds = Math.floor(
      (remaining % 60000) / 1000
    );

    const units = [
      ["Days", days],
      ["Hours", hours],
      ["Mins", minutes],
      ["Secs", seconds]
    ];

    countdownBox.innerHTML =
      '<div class="brysi-countdown">' +
      units.map(([name, value]) => `
        <div class="brysi-countdown-unit">
          <span class="brysi-countdown-number">
            ${String(value).padStart(2, "0")}
          </span>
          <span class="brysi-countdown-name">
            ${name}
          </span>
        </div>
      `).join("") +
      "</div>";
  }

  updateTwitch();
  updateCountdown();

  setInterval(() => {
    if (!document.hidden) updateTwitch();
  }, 60000);

  setInterval(() => {
    if (!document.hidden) updateCountdown();
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateTwitch();
      updateCountdown();
    }
  });
})();
