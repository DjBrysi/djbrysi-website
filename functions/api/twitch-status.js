
const TWITCH_CHANNEL = "brysi84";

export async function onRequestGet({ env }) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers,
    });

  try {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
      return reply(
        { error: "Twitch API credentials are not configured" },
        503
      );
    }

    // Request an application access token from Twitch.
    const tokenResponse = await fetch(
      "https://id.twitch.tv/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.TWITCH_CLIENT_ID,
          client_secret: env.TWITCH_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
      return reply(
        { error: "Twitch authentication failed" },
        502
      );
    }

    const tokenData = await tokenResponse.json();

    // Check whether Brysi is currently live.
    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${TWITCH_CHANNEL}`,
      {
        headers: {
          "Client-ID": env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!streamResponse.ok) {
      return reply(
        { error: "Unable to retrieve Twitch stream status" },
        502
      );
    }

    const streamData = await streamResponse.json();
    const stream = streamData.data?.[0];

    if (!stream) {
      return reply({
        channel: TWITCH_CHANNEL,
        live: false,
        status: "offline",
        url: `https://www.twitch.tv/${TWITCH_CHANNEL}`,
      });
    }

    return reply({
      channel: TWITCH_CHANNEL,
      live: true,
      status: "live",
      title: stream.title,
      game: stream.game_name,
      viewers: stream.viewer_count,
      started_at: stream.started_at,
      url: `https://www.twitch.tv/${TWITCH_CHANNEL}`,
    });
  } catch (error) {
    console.error("Twitch status error:", error);

    return reply(
      { error: "Twitch status temporarily unavailable" },
      502
    );
  }
}
