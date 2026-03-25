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
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
    body: JSON.stringify(body),
  };
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
  return {
    status: snapshot.status,
    headers: {
      "Content-Type": snapshot.contentType ?? "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=180",
      "X-Football-Data-Source": source,
      "X-Football-Data-Fetched-At": snapshot.fetchedAt,
    },
    body: snapshot.body,
  };
}

export default async function handler(req, res) {
  const token =
    process.env.FOOTBALL_DATA_API_KEY ?? process.env.VITE_FOOTBALL_DATA_API_KEY ?? "";

  if (!token) {
    const response = jsonResponse(
      { error: "Missing football-data.org API key in Vercel environment variables." },
      500,
    );
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => res.setHeader(key, value));
    res.end(response.body);
    return;
  }

  const queryEntries = Object.entries(req.query ?? {});
  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path[0]
    : req.query?.path;
  const snapshotPath = buildSnapshotPath(rawPath, queryEntries);
  const upstreamUrl = buildUpstreamUrl(rawPath, queryEntries);
  const snapshot = await readSnapshot(snapshotPath);
  const snapshotAgeMs = snapshot?.fetchedAt ? Date.now() - new Date(snapshot.fetchedAt).getTime() : null;

  if (snapshot && snapshotAgeMs !== null && snapshotAgeMs < SNAPSHOT_MAX_AGE_MS) {
    const response = buildSnapshotResponse(snapshot);
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => res.setHeader(key, value));
    res.end(response.body);
    return;
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
      const staleResponse = buildSnapshotResponse(snapshot, "stale-snapshot");
      res.status(staleResponse.status);
      Object.entries(staleResponse.headers).forEach(([key, value]) => res.setHeader(key, value));
      res.end(staleResponse.body);
      return;
    }

    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("X-Football-Data-Source", "live");
    res.setHeader("X-Football-Data-Fetched-At", new Date().toISOString());
    res.end(body);
  } catch (error) {
    if (snapshot) {
      const staleResponse = buildSnapshotResponse(snapshot, "stale-snapshot");
      res.status(staleResponse.status);
      Object.entries(staleResponse.headers).forEach(([key, value]) => res.setHeader(key, value));
      res.end(staleResponse.body);
      return;
    }

    const failure = jsonResponse(
      {
        error: "Unable to reach football-data.org from Vercel.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      502,
    );
    res.status(failure.status);
    Object.entries(failure.headers).forEach(([key, value]) => res.setHeader(key, value));
    res.end(failure.body);
  }
}
