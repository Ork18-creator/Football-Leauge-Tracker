import { getStore } from "@netlify/blobs";

const API_ORIGIN = "https://api.football-data.org";
const CACHE_STORE_NAME = "football-data-snapshots";
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

const WARM_COMPETITION_CODES = ["PL", "PD", "SA", "BL1", "CL", "FAC", "FLC"];

function normalizeQuery(queryStringParameters = {}) {
  return Object.entries(queryStringParameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right));
}

function buildCacheIdentifier(path, queryStringParameters = {}) {
  const normalizedPath = String(path ?? "").replace(/^\/+/, "");
  const query = new URLSearchParams(normalizeQuery(queryStringParameters)).toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

function buildCacheKey(path, queryStringParameters = {}) {
  const identifier = buildCacheIdentifier(path, queryStringParameters);
  return `snapshot-${Buffer.from(identifier).toString("base64url")}`;
}

function buildUpstreamUrl(path, queryStringParameters) {
  const cleanPath = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(cleanPath, `${API_ORIGIN}/`);

  for (const [key, value] of normalizeQuery(queryStringParameters)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function getWarmRequests() {
  return WARM_COMPETITION_CODES.flatMap((competitionCode) => [
    {
      path: `v4/competitions/${competitionCode}/standings`,
      queryStringParameters: {},
    },
    {
      path: `v4/competitions/${competitionCode}/matches`,
      queryStringParameters: { limit: competitionCode === "CL" ? 240 : 380 },
    },
    ...(competitionCode === "CL"
      ? []
      : [
          {
            path: `v4/competitions/${competitionCode}/scorers`,
            queryStringParameters: { limit: 10 },
          },
        ]),
  ]);
}

function getStoreInstance() {
  return getStore(CACHE_STORE_NAME);
}

export async function getSnapshot(path, queryStringParameters = {}) {
  const store = getStoreInstance();
  const snapshot = await store.get(buildCacheKey(path, queryStringParameters), { type: "json" });

  if (!snapshot) {
    return null;
  }

  return snapshot;
}

export async function putSnapshot(path, queryStringParameters = {}, snapshot) {
  const store = getStoreInstance();
  await store.setJSON(buildCacheKey(path, queryStringParameters), snapshot);
}

export async function fetchAndStoreSnapshot(path, queryStringParameters = {}, token) {
  const upstreamUrl = buildUpstreamUrl(path, queryStringParameters);
  const response = await fetch(upstreamUrl, {
    headers: {
      "X-Auth-Token": token,
    },
  });
  const body = await response.text();

  const snapshot = {
    statusCode: response.status,
    contentType: response.headers.get("content-type") ?? "application/json",
    body,
    fetchedAt: Date.now(),
    identifier: buildCacheIdentifier(path, queryStringParameters),
  };

  if (response.ok) {
    await putSnapshot(path, queryStringParameters, snapshot);
  }

  return snapshot;
}

export function isSnapshotFresh(snapshot) {
  return Boolean(snapshot?.fetchedAt) && Date.now() - snapshot.fetchedAt < SNAPSHOT_TTL_MS;
}

export function buildSnapshotHeaders(snapshot, source = "snapshot") {
  return {
    "Content-Type": snapshot.contentType ?? "application/json",
    "Cache-Control": "public, max-age=300, must-revalidate",
    "CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=900",
    "Netlify-CDN-Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
    "X-Football-Data-Source": source,
    "X-Football-Data-Fetched-At": snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toISOString() : "",
  };
}
