
/* DJ Brysi v2.2 - Live Hub and Stream Schedule */
(() => {
  const TWITCH_URL = "https://www.twitch.tv/brysi84";
  const SCHEDULE_URL = "/stream-schedule.json";

  const side = document.querySelector("#live .live-side");
  if (!side) return;

  const css = document.createElement("style");
  css.textContent = `
    .brysi-live-hub {
      display: flex;
      flex-direction: column;
      gap: 18px;
      color: #fff;
    }
    .brysi-live-card {
      background: linear-gradient(135deg,
        rgba(107,33,168,.25),
        rgba(17,10,28,.95));
      border: 1px solid rgba(168,85,247,.45);
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
      animation: brysi-pulse 1.6s infinite;
    }
    @keyframes brysi-pulse {
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
      overflow-wrap: anywhere;
    }
    .brysi-stream-date {
      color: #ff963f;
      font-weight: 700;
      font-size: 14px;
      margin: 8px 0;
    }
    .brysi-countdown {
      display: grid;
      grid-template-columns: repeat(4,minmax(0,1fr));
      gap: 8px;
      margin-top: 15px;
    }
    .brysi-countdown-unit {
      background: rgba(168,85,247,.13);
      border: 1px solid rgba(168,85,247,.25);
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
      background: linear-gradient(90deg,#9218fa,#e827b9);
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
    @media (max-width:600px) {
      .brysi-live-card { padding: 15px; }
      .brysi-countdown-number { font-size: 17px; }
    }
  `;
  document.head.appendChild(css);

  // Rebuild only the right-hand Live Hub.
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
         id="brysi-next-title">
        Checking schedule...
      </p>
      <p class="brysi-stream-date"
         id="brysi-next-date"></p>
      <p class="brysi-live-detail"
         id="brysi-next-description"></p>
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
  const nextTitle = hub.querySelector("#brysi-next-title");
  const nextDate = hub.querySelector("#brysi-next-date");
  const nextDescription = hub.querySelector(
    "#brysi-next-description"
  );
  const countdownBox = hub.querySelector(
    "#brysi-countdown-container"
  );

  let nextStream = null;
  let lastStatus = null;

  async function updateTwitch() {
    try {
      const response = await fetch("/api/twitch-status", {
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Twitch API error");

      const data = await response.json();
      if (typeof data.live !== "boolean") {
        throw new Error("Invalid Twitch response");
      }

      lastStatus = data;
      renderStatus(data);
    } catch (error) {
      console.warn("Twitch status:", error);

      if (lastStatus) {
        renderStatus(lastStatus);
        detail.textContent =
          "Unable to refresh. Showing last known status.";
      } else {
        hub.dataset.state = "unknown";
        statusText.textContent = "STATUS UNAVAILABLE";
        detail.textContent =
          "Check Twitch directly for the latest status.";
      }
    }
  }

  function renderStatus(data) {
    if (data.live) {
      hub.dataset.state = "live";
      statusText.textContent = "BRYSI IS LIVE NOW!";
      watchButton.textContent = "WATCH LIVE ↗";

      const viewers = Number.isFinite(data.viewers)
        ? ` · ${data.viewers.toLocaleString()} watching`
        : "";

      detail.textContent =
        (data.title || "DJ Brysi is streaming") + viewers;
    } else {
      hub.dataset.state = "offline";
      statusText.textContent = "BRYSI IS OFFLINE";
      watchButton.textContent = "OPEN TWITCH ↗";
      detail.textContent =
        "Not streaming right now. Check back for the next set!";
    }
  }

  function getUpcomingStreams(data) {
    if (!Array.isArray(data.upcoming)) {
      throw new Error("Invalid stream schedule");
    }

    return data.upcoming
      .filter(stream => {
        if (!stream || typeof stream.date !== "string") {
          return false;
        }

        // Require an explicit timezone offset.
        if (!/(Z|[+-]\d{2}:\d{2})$/.test(stream.date)) {
          return false;
        }

        const timestamp = Date.parse(stream.date);
        return Number.isFinite(timestamp) &&
          timestamp > Date.now();
      })
      .sort((a, b) =>
        Date.parse(a.date) - Date.parse(b.date)
      );
  }

  async function updateSchedule() {
    try {
      const response = await fetch(SCHEDULE_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Schedule file not found");
      }

      const data = await response.json();
      const upcoming = getUpcomingStreams(data);

      nextStream = upcoming[0] || null;
      renderSchedule();
    } catch (error) {
      console.warn("Stream schedule:", error);

      nextStream = null;
      nextTitle.textContent = "Schedule unavailable";
      nextDate.textContent = "";
      nextDescription.textContent =
        "Please check back for the next announcement.";
      countdownBox.replaceChildren();
    }
  }

  function renderSchedule() {
    if (!nextStream) {
      nextTitle.textContent = "To be announced";
      nextDate.textContent = "";
      nextDescription.textContent =
        "Keep an eye out for the next Brysi livestream!";
      countdownBox.replaceChildren();
      return;
    }

    nextTitle.textContent =
      nextStream.title || "DJ Brysi Live";

    const target = new Date(nextStream.date);

    nextDate.textContent = target.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });

    nextDescription.textContent =
      nextStream.description || "";

    updateCountdown();
  }

  function updateCountdown() {
    if (!nextStream) return;

    const remaining =
      Date.parse(nextStream.date) - Date.now();

    if (remaining <= 0) {
      nextStream = null;
      updateSchedule();
      return;
    }

    const units = [
      ["Days", Math.floor(remaining / 86400000)],
      ["Hours", Math.floor(
        (remaining % 86400000) / 3600000
      )],
      ["Mins", Math.floor(
        (remaining % 3600000) / 60000
      )],
      ["Secs", Math.floor(
        (remaining % 60000) / 1000
      )]
    ];

    countdownBox.replaceChildren();

    const grid = document.createElement("div");
    grid.className = "brysi-countdown";

    for (const [name, value] of units) {
      const unit = document.createElement("div");
      unit.className = "brysi-countdown-unit";

      const number = document.createElement("span");
      number.className = "brysi-countdown-number";
      number.textContent = String(value).padStart(2, "0");

      const caption = document.createElement("span");
      caption.className = "brysi-countdown-name";
      caption.textContent = name;

      unit.append(number, caption);
      grid.appendChild(unit);
    }

    countdownBox.appendChild(grid);
  }

  updateTwitch();
  updateSchedule();

  // Twitch status every 60 seconds.
  setInterval(() => {
    if (!document.hidden) updateTwitch();
  }, 60000);

  // Countdown every second.
  setInterval(() => {
    if (!document.hidden) updateCountdown();
  }, 1000);

  // Refresh schedule every five minutes.
  setInterval(() => {
    if (!document.hidden) updateSchedule();
  }, 300000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateTwitch();
      updateSchedule();
    }
  });
})();
