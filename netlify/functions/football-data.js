import {
  buildSnapshotHeaders,
  fetchAndStoreSnapshot,
  getSnapshot,
  isSnapshotFresh,
} from "./_football-data-cache.js";

function extractPath(event) {
  const queryPath = event.queryStringParameters?.path;
  if (queryPath) {
    return queryPath;
  }

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
  const cachedSnapshot = await getSnapshot(splat, event.queryStringParameters);

  if (cachedSnapshot && isSnapshotFresh(cachedSnapshot)) {
    return {
      statusCode: cachedSnapshot.statusCode,
      headers: buildSnapshotHeaders(cachedSnapshot, "netlify-blob-cache"),
      body: cachedSnapshot.body,
    };
  }

  try {
    const snapshot = await fetchAndStoreSnapshot(splat, event.queryStringParameters, token);

    if (!snapshot.statusCode && cachedSnapshot) {
      return {
        statusCode: cachedSnapshot.statusCode,
        headers: buildSnapshotHeaders(cachedSnapshot, "netlify-blob-stale"),
        body: cachedSnapshot.body,
      };
    }

    return {
      statusCode: snapshot.statusCode,
      headers:
        snapshot.statusCode >= 200 && snapshot.statusCode < 300
          ? buildSnapshotHeaders(snapshot, "live-refresh")
          : {
              "Content-Type": snapshot.contentType ?? "application/json",
              "Cache-Control": "no-store",
            },
      body: snapshot.body,
    };
  } catch (error) {
    if (cachedSnapshot) {
      return {
        statusCode: cachedSnapshot.statusCode,
        headers: buildSnapshotHeaders(cachedSnapshot, "netlify-blob-stale"),
        body: cachedSnapshot.body,
      };
    }

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
