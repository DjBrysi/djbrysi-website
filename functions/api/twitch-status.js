
/*
 * DJ Brysi v2.2
 * Cloudflare Pages - Twitch Status API
 */

const CHANNEL = "brysi84";

let cachedToken = null;
let tokenExpiresAt = 0;

let cachedStatus = null;
let statusExpiresAt = 0;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function getAccessToken(env) {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(
    "https://id.twitch.tv/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials"
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      "Twitch authentication failed: " + response.status
    );
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Twitch returned no access token");
  }

  cachedToken = data.access_token;

  // Refresh five minutes before expiry.
  tokenExpiresAt =
    Date.now() +
    Math.max(60, (data.expires_in || 3600) - 300) * 1000;

  return cachedToken;
}

export async function onRequestGet({ env }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return json({
      error: "Twitch API credentials are not configured"
    }, 503);
  }

  try {
    // Cache status for 45 seconds per worker instance.
    if (cachedStatus && Date.now() < statusExpiresAt) {
      return json(cachedStatus);
    }

    let token = await getAccessToken(env);

    let response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`,
      {
        headers: {
          "Client-ID": env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Refresh the token if Twitch rejects it.
    if (response.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;

      token = await getAccessToken(env);

      response = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`,
        {
          headers: {
            "Client-ID": env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${token}`
          }
        }
      );
    }

    if (!response.ok) {
      throw new Error(
        "Twitch stream lookup failed: " + response.status
      );
    }

    const data = await response.json();
    const stream = data.data?.[0];

    const result = stream
      ? {
          channel: CHANNEL,
          live: true,
          status: "live",
          title: stream.title,
          game: stream.game_name,
          viewers: stream.viewer_count,
          started_at: stream.started_at,
          url: `https://www.twitch.tv/${CHANNEL}`
        }
      : {
          channel: CHANNEL,
          live: false,
          status: "offline",
          url: `https://www.twitch.tv/${CHANNEL}`
        };

    cachedStatus = result;
    statusExpiresAt = Date.now() + 45000;

    return json(result);

  } catch (error) {
    console.error("DJ Brysi Twitch API:", error);

    return json({
      error: "Twitch status temporarily unavailable"
    }, 502);
  }
}
