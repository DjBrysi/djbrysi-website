
/*
 * DJ BRYSI - LIVE EXPERIENCE v2.2
 *
 * Twitch live/offline detection
 * Random livestream announcements
 * Automatic countdown
 * Previous Twitch broadcasts
 *
 * Schedule: /stream-schedule.json
 * Twitch API: /api/twitch-status
 */

(() => {
  "use strict";

  const TWITCH_URL = "https://www.twitch.tv/brysi84";
  const SCHEDULE_URL = "/stream-schedule.json";
  const STATUS_URL = "/api/twitch-status";

  const STATUS_REFRESH_MS = 60000;
  const SCHEDULE_REFRESH_MS = 300000;

  const side = document.querySelector("#live .live-side");

  if (!side) {
    console.warn("DJ Brysi: Live Hub container not found.");
    return;
  }

  // ------------------------------------------
  // STYLES
  // ------------------------------------------

  const style = document.createElement("style");
  style.textContent = `
    .brysi-hub {
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #ffffff;
    }

    .brysi-hub-card {
      background: linear-gradient(
        135deg,
        rgba(105, 35, 150, 0.24),
        rgba(22, 10, 35, 0.96)
      );
      border: 1px solid rgba(175, 75, 245, 0.45);
      border-radius: 15px;
      padding: 20px;
    }

    .brysi-hub-label {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #cba9e9;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .brysi-hub-status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 19px;
      font-weight: 900;
    }

    .brysi-hub-dot {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      border-radius: 50%;
      background: #a68db5;
    }

    .brysi-hub[data-status="live"] .brysi-hub-dot {
      background: #ff365f;
      box-shadow: 0 0 15px #ff365f;
      animation: brysi-live-pulse 1.5s infinite;
    }

    @keyframes brysi-live-pulse {
      50% { opacity: 0.35; }
    }

    .brysi-hub-detail {
      color: #d5c4e0;
      font-size: 14px;
      line-height: 1.6;
      margin: 12px 0 0;
      overflow-wrap: anywhere;
    }

    .brysi-hub-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 900;
      margin: 0 0 8px;
      overflow-wrap: anywhere;
    }

    .brysi-hub-date {
      color: #ff963f;
      font-size: 14px;
      font-weight: 800;
      margin: 8px 0;
    }

    .brysi-countdown {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 18px;
    }

    .brysi-countdown-box {
      background: rgba(166, 65, 230, 0.15);
      border: 1px solid rgba(166, 65, 230, 0.3);
      border-radius: 9px;
      text-align: center;
      padding: 11px 4px;
    }

    .brysi-countdown-number {
      display: block;
      color: #ff9139;
      font-size: 22px;
      font-weight: 900;
    }

    .brysi-countdown-label {
      display: block;
      color: #d8bde9;
      font-size: 10px;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .brysi-hub-link {
      color: #ff963f;
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
    }

    .brysi-hub-button {
      display: block;
      padding: 15px;
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        #9115fa,
        #e825b9
      );
      color: #ffffff !important;
      text-decoration: none;
      text-align: center;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
    }

    .brysi-hub-button:hover {
      filter: brightness(1.15);
    }

    @media (max-width: 600px) {
      .brysi-hub-card {
        padding: 15px;
      }

      .brysi-countdown-number {
        font-size: 17px;
      }
    }
  `;

  document.head.appendChild(style);

  // ------------------------------------------
  // LIVE HUB HTML
  // ------------------------------------------

  side.innerHTML = `
    <div class="brysi-hub" data-status="checking">

      <div class="brysi-hub-card">
        <div class="brysi-hub-label">
          Stream Status
        </div>

        <div class="brysi-hub-status"
             role="status"
             aria-live="polite">
          <span class="brysi-hub-dot"></span>
          <span id="brysi-status">
            CHECKING TWITCH...
          </span>
        </div>

        <p class="brysi-hub-detail"
           id="brysi-status-detail">
          Connecting to Twitch...
        </p>
      </div>

      <div class="brysi-hub-card">
        <div class="brysi-hub-label">
          Next Livestream
        </div>

        <div class="brysi-hub-title"
             id="brysi-next-title">
          Checking schedule...
        </div>

        <div class="brysi-hub-date"
             id="brysi-next-date"></div>

        <p class="brysi-hub-detail"
           id="brysi-next-description"></p>

        <div id="brysi-countdown-container"></div>
      </div>

      <div class="brysi-hub-card">
        <div class="brysi-hub-label">
          Previous Broadcasts
        </div>

        <p class="brysi-hub-detail">
          Missed a set? Catch up on previous
          livestreams on Twitch.
        </p>

        <a class="brysi-hub-link"
           href="https://www.twitch.tv/brysi84/videos?filter=archives&sort=time"
           target="_blank"
           rel="noopener noreferrer">
          VIEW PAST BROADCASTS ↗
        </a>
      </div>

      <a class="brysi-hub-button"
         id="brysi-twitch-button"
         href="${TWITCH_URL}"
         target="_blank"
         rel="noopener noreferrer">
        OPEN TWITCH ↗
      </a>

    </div>
  `;

  // ------------------------------------------
  // ELEMENTS
  // ------------------------------------------

  const hub = side.querySelector(".brysi-hub");

  const statusElement = side.querySelector("#brysi-status");
  const statusDetail = side.querySelector(
    "#brysi-status-detail"
  );

  const nextTitle = side.querySelector("#brysi-next-title");
  const nextDate = side.querySelector("#brysi-next-date");
  const nextDescription = side.querySelector(
    "#brysi-next-description"
  );

  const countdownContainer = side.querySelector(
    "#brysi-countdown-container"
  );

  const twitchButton = side.querySelector(
    "#brysi-twitch-button"
  );

  let nextStream = null;
  let lastKnownStatus = null;

  // ------------------------------------------
  // TWITCH STATUS
  // ------------------------------------------

  async function updateTwitchStatus() {
    try {
      const response = await fetch(STATUS_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          "Twitch API returned " + response.status
        );
      }

      const data = await response.json();

      if (typeof data.live !== "boolean") {
        throw new Error("Invalid Twitch API response");
      }

      lastKnownStatus = data;

      renderTwitchStatus(data);

    } catch (error) {
      console.warn("DJ Brysi Twitch:", error);

      if (lastKnownStatus) {
        renderTwitchStatus(lastKnownStatus);
        statusDetail.textContent =
          "Unable to refresh. Showing last known status.";
      } else {
        hub.dataset.status = "unknown";
        statusElement.textContent = "STATUS UNAVAILABLE";
        statusDetail.textContent =
          "Twitch status could not be checked. Open Twitch directly.";
      }
    }
  }

  function renderTwitchStatus(data) {
    if (data.live) {
      hub.dataset.status = "live";

      statusElement.textContent = "BRYSI IS LIVE NOW!";

      twitchButton.textContent = "WATCH LIVE ↗";

      const viewers = Number.isFinite(data.viewers)
        ? " · " + data.viewers.toLocaleString() +
          " watching"
        : "";

      statusDetail.textContent =
        (data.title || "DJ Brysi is streaming!") +
        viewers;

    } else {
      hub.dataset.status = "offline";

      statusElement.textContent = "BRYSI IS OFFLINE";

      statusDetail.textContent =
        "Not streaming right now. Check back for the next set!";

      twitchButton.textContent = "OPEN TWITCH ↗";
    }
  }

  // ------------------------------------------
  // STREAM SCHEDULE
  // ------------------------------------------

  function findNextStream(data) {
    if (!data || !Array.isArray(data.upcoming)) {
      throw new Error("Invalid schedule format");
    }

    const now = Date.now();

    const upcoming = data.upcoming
      .filter(stream => {
        if (!stream || typeof stream.date !== "string") {
          return false;
        }

        // Dates must include UK offset or UTC Z.
        if (!/(Z|[+-]\d{2}:\d{2})$/.test(stream.date)) {
          return false;
        }

        const timestamp = Date.parse(stream.date);

        return Number.isFinite(timestamp) &&
          timestamp > now;
      })
      .sort((a, b) =>
        Date.parse(a.date) - Date.parse(b.date)
      );

    return upcoming[0] || null;
  }

  async function updateSchedule() {
    try {
      const response = await fetch(SCHEDULE_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          "Schedule returned " + response.status
        );
      }

      const data = await response.json();

      nextStream = findNextStream(data);

      renderSchedule();

    } catch (error) {
      console.warn("DJ Brysi Schedule:", error);

      nextStream = null;

      nextTitle.textContent = "Schedule unavailable";
      nextDate.textContent = "";
      nextDescription.textContent =
        "Please check back for the next announcement.";

      countdownContainer.replaceChildren();
    }
  }

  function renderSchedule() {
    if (!nextStream) {
      nextTitle.textContent = "To be announced";
      nextDate.textContent = "";
      nextDescription.textContent =
        "Keep an eye out for the next Brysi livestream!";

      countdownContainer.replaceChildren();
      return;
    }

    const streamDate = new Date(nextStream.date);

    nextTitle.textContent =
      nextStream.title || "DJ Brysi Live";

    nextDate.textContent =
      streamDate.toLocaleString("en-GB", {
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

    renderCountdown();
  }

  // ------------------------------------------
  // COUNTDOWN
  // ------------------------------------------

  function renderCountdown() {
    if (!nextStream) return;

    const target = Date.parse(nextStream.date);
    const remaining = target - Date.now();

    if (remaining <= 0) {
      nextStream = null;
      updateSchedule();
      return;
    }

    const days = Math.floor(
      remaining / 86400000
    );

    const hours = Math.floor(
      (remaining % 86400000) / 3600000
    );

    const minutes = Math.floor(
      (remaining % 3600000) / 60000
    );

    const seconds = Math.floor(
      (remaining % 60000) / 1000
    );

    const values = [
      ["Days", days],
      ["Hours", hours],
      ["Mins", minutes],
      ["Secs", seconds]
    ];

    countdownContainer.replaceChildren();

    const countdown = document.createElement("div");
    countdown.className = "brysi-countdown";

    values.forEach(([label, value]) => {
      const box = document.createElement("div");
      box.className = "brysi-countdown-box";

      const number = document.createElement("span");
      number.className = "brysi-countdown-number";
      number.textContent =
        String(value).padStart(2, "0");

      const caption = document.createElement("span");
      caption.className = "brysi-countdown-label";
      caption.textContent = label;

      box.append(number, caption);
      countdown.appendChild(box);
    });

    countdownContainer.appendChild(countdown);
  }

  // ------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------

  updateTwitchStatus();
  updateSchedule();

  // Refresh Twitch status every minute.
  setInterval(() => {
    if (!document.hidden) {
      updateTwitchStatus();
    }
  }, STATUS_REFRESH_MS);

  // Refresh stream schedule every 5 minutes.
  setInterval(() => {
    if (!document.hidden) {
      updateSchedule();
    }
  }, SCHEDULE_REFRESH_MS);

  // Update countdown every second.
  setInterval(() => {
    if (!document.hidden && nextStream) {
      renderCountdown();
    }
  }, 1000);

  // Refresh when returning to the browser tab.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        updateTwitchStatus();
        updateSchedule();
      }
    }
  );

  console.log("DJ Brysi Live Experience v2.2 loaded");
})();
