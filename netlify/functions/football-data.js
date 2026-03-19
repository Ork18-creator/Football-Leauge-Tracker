const API_ORIGIN = "https://api.football-data.org";

function extractPath(event) {
  const directSplat = event.pathParameters?.splat;
  if (directSplat) {
    return directSplat;
  }

  const candidates = [event.path, event.rawUrl];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const match = candidate.match(/\/football-data\/(.+)$/u);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function buildUpstreamUrl(path, queryStringParameters) {
  const cleanPath = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(cleanPath, `${API_ORIGIN}/`);

  if (queryStringParameters) {
    for (const [key, value] of Object.entries(queryStringParameters)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export async function handler(event) {
  const token =
    process.env.FOOTBALL_DATA_API_KEY ?? process.env.VITE_FOOTBALL_DATA_API_KEY ?? "";

  if (!token) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        error: "Missing football-data.org API key in Netlify environment variables.",
      }),
    };
  }

  const splat = extractPath(event);
  const upstreamUrl = buildUpstreamUrl(splat, event.queryStringParameters);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "X-Auth-Token": token,
      },
    });

    const body = await response.text();

    const cacheHeaders = response.ok
      ? {
          "Cache-Control": "public, max-age=60, must-revalidate",
          "CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          "Netlify-CDN-Cache-Control":
            "public, max-age=900, stale-while-revalidate=86400, durable",
        }
      : {
          "Cache-Control": "no-store",
        };

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        ...cacheHeaders,
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        error: "Unable to reach football-data.org from Netlify.",
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}
