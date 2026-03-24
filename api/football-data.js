const API_ORIGIN = "https://api.football-data.org";

function buildUpstreamUrl(rawPath = "", queryEntries = []) {
  const normalizedPath = String(rawPath ?? "").replace(/^\/+/, "");
  const url = new URL(normalizedPath, `${API_ORIGIN}/`);

  for (const [key, value] of queryEntries) {
    if (key === "path") {
      continue;
    }

    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function jsonResponse(body, status, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
  });
}

export default {
  async fetch(request) {
    const token =
      process.env.FOOTBALL_DATA_API_KEY ?? process.env.VITE_FOOTBALL_DATA_API_KEY ?? "";

    if (!token) {
      return jsonResponse(
        { error: "Missing football-data.org API key in Vercel environment variables." },
        500,
      );
    }

    const requestUrl = new URL(request.url);
    const upstreamUrl = buildUpstreamUrl(
      requestUrl.searchParams.get("path"),
      requestUrl.searchParams.entries(),
    );

    try {
      const response = await fetch(upstreamUrl, {
        headers: {
          "X-Auth-Token": token,
        },
      });

      const body = await response.text();
      const contentType = response.headers.get("content-type") ?? "application/json";
      const isMatchFeed = /\/matches(?:\/|$|\?)/u.test(new URL(upstreamUrl).pathname);

      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": isMatchFeed
            ? "s-maxage=60, stale-while-revalidate=180"
            : "s-maxage=900, stale-while-revalidate=3600",
        },
      });
    } catch (error) {
      return jsonResponse(
        {
          error: "Unable to reach football-data.org from Vercel.",
          detail: error instanceof Error ? error.message : "Unknown error",
        },
        502,
      );
    }
  },
};
