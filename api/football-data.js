const API_ORIGIN = "https://api.football-data.org";

function buildUpstreamUrl(rawPath = "", query = {}) {
  const normalizedPath = String(rawPath ?? "").replace(/^\/+/, "");
  const url = new URL(normalizedPath, `${API_ORIGIN}/`);

  for (const [key, value] of Object.entries(query)) {
    if (key === "path") {
      continue;
    }

    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export default async function handler(req, res) {
  const token =
    process.env.FOOTBALL_DATA_API_KEY ?? process.env.VITE_FOOTBALL_DATA_API_KEY ?? "";

  if (!token) {
    res.status(500).setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error: "Missing football-data.org API key in Vercel environment variables.",
      }),
    );
    return;
  }

  const upstreamUrl = buildUpstreamUrl(req.query.path, req.query);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "X-Auth-Token": token,
      },
    });

    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "application/json";
    const isMatchFeed = /\/matches(?:\/|$|\?)/u.test(new URL(upstreamUrl).pathname);

    res.status(response.status).setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      isMatchFeed
        ? "s-maxage=60, stale-while-revalidate=180"
        : "s-maxage=900, stale-while-revalidate=3600",
    );
    res.end(body);
  } catch (error) {
    res.status(502).setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error: "Unable to reach football-data.org from Vercel.",
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
    );
  }
}
