import { get, put } from "@vercel/blob";

const API_ORIGIN = "https://api.football-data.org";
const SNAPSHOT_MAX_AGE_MS = 60 * 60 * 1000;

function canUseSnapshots() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

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

function buildSnapshotPath(rawPath = "", queryEntries = []) {
  const normalizedPath = String(rawPath ?? "").replace(/^\/+/, "");
  const query = [...queryEntries]
    .filter(([key, value]) => key !== "path" && value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const snapshotKey = query ? `${normalizedPath}?${query}` : normalizedPath;
  const encodedKey = Buffer.from(snapshotKey).toString("base64url");
  return `football-data-snapshots/${encodedKey}.json`;
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

async function readSnapshot(pathname) {
  if (!canUseSnapshots()) {
    return null;
  }

  try {
    const result = await get(pathname, {
      access: "private",
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const raw = await new Response(result.stream).text();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeSnapshot(pathname, snapshot) {
  if (!canUseSnapshots()) {
    return;
  }

  try {
    await put(pathname, JSON.stringify(snapshot), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  } catch {
    return;
  }
}

function buildSnapshotResponse(snapshot, source = "snapshot") {
  return new Response(snapshot.body, {
    status: snapshot.status,
    headers: {
      "Content-Type": snapshot.contentType ?? "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=180",
      "X-Football-Data-Source": source,
      "X-Football-Data-Fetched-At": snapshot.fetchedAt,
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
    const snapshotPath = buildSnapshotPath(
      requestUrl.searchParams.get("path"),
      requestUrl.searchParams.entries(),
    );
    const upstreamUrl = buildUpstreamUrl(
      requestUrl.searchParams.get("path"),
      requestUrl.searchParams.entries(),
    );
    const snapshot = await readSnapshot(snapshotPath);
    const snapshotAgeMs = snapshot?.fetchedAt ? Date.now() - new Date(snapshot.fetchedAt).getTime() : null;

    if (snapshot && snapshotAgeMs !== null && snapshotAgeMs < SNAPSHOT_MAX_AGE_MS) {
      return buildSnapshotResponse(snapshot);
    }

    try {
      const response = await fetch(upstreamUrl, {
        headers: {
          "X-Auth-Token": token,
        },
      });

      const body = await response.text();
      const contentType = response.headers.get("content-type") ?? "application/json";
      const isMatchFeed = /\/matches(?:\/|$|\?)/u.test(new URL(upstreamUrl).pathname);
      const cacheControl = isMatchFeed
        ? "s-maxage=60, stale-while-revalidate=180"
        : "s-maxage=900, stale-while-revalidate=3600";

      if (response.ok) {
        await writeSnapshot(snapshotPath, {
          fetchedAt: new Date().toISOString(),
          status: response.status,
          contentType,
          body,
        });
      } else if (snapshot) {
        return buildSnapshotResponse(snapshot, "stale-snapshot");
      }

      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
          "X-Football-Data-Source": "live",
          "X-Football-Data-Fetched-At": new Date().toISOString(),
        },
      });
    } catch (error) {
      if (snapshot) {
        return buildSnapshotResponse(snapshot, "stale-snapshot");
      }

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
