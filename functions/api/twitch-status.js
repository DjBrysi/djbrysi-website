
/*
 * DJ Brysi v2.2 - Cached Twitch Status API
 * Cloudflare Pages Function
 */

const CHANNEL = "brysi84";
const STATUS_CACHE_SECONDS = 45;
const TOKEN_SAFETY_SECONDS = 300;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });

export async function onRequestGet({ env, request }) {
  const clientId = env.TWITCH_CLIENT_ID;
  const clientSecret = env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return json({
      error: "Twitch credentials are not configured"
    }, 503);
  }

  try {
    const cache = caches.default;

    // Separate cache entries for Preview and Production.
    const baseUrl = new URL(request.url);
    const statusKey = new Request(
      `${baseUrl.origin}/__cache/twitch-status-v2`
    );

    const cachedStatus = await cache.match(statusKey);

    if (cachedStatus) {
      return json(await cachedStatus.json());
    }

    // Cache the application access token.
    const tokenKey = new Request(
      `${baseUrl.origin}/__cache/twitch-app-token-v2`
    );

    let tokenData;
    const cachedToken = await cache.match(tokenKey);

    if (cachedToken) {
      tokenData = await cachedToken.json();
    } else {
      const tokenResponse = await fetch(
        "https://id.twitch.tv/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials"
          })
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          "Twitch token request failed:",
          tokenResponse.status
        );

        return json({
          error: "Twitch authentication failed"
        }, 502);
      }

      tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return json({
          error: "Twitch returned no access token"
        }, 502);
      }

      const tokenTtl = Math.max(
        1,
        Math.floor(tokenData.expires_in || 3600) -
          TOKEN_SAFETY_SECONDS
      );

      await cache.put(
        tokenKey,
        new Response(JSON.stringify(tokenData), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${tokenTtl}`
          }
        })
      );
    }

    // Fetch the current stream information.
    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${tokenData.access_token}`
        }
      }
    );

    if (!streamResponse.ok) {
      console.error(
        "Twitch stream request failed:",
        streamResponse.status
      );

      return json({
        error: "Unable to retrieve Twitch stream status"
      }, 502);
    }

    const streamData = await streamResponse.json();
    const stream = streamData.data?.[0];

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

    await cache.put(
      statusKey,
      new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            `public, max-age=${STATUS_CACHE_SECONDS}`
        }
      })
    );

    return json(result);
  } catch (error) {
    console.error("DJ Brysi Twitch API:", error);

    return json({
      error: "Twitch status temporarily unavailable"
    }, 502);
  }
}
