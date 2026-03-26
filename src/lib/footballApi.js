const inFlightRequests = new Map();
const MATCH_CACHE_MAX_AGE_MS = 60 * 1000;
const STANDINGS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const SCORERS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const TEAM_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PROXY_BASE_URL = (import.meta.env.VITE_FOOTBALL_PROXY_BASE_URL ?? "").replace(/\/+$/, "");

function readCache(key, maxAgeMs) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function readStaleCache(key) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
  } catch {
    return;
  }
}

function buildProxyUrl(path, query = {}) {
  const url = new URL(PROXY_BASE_URL || "https://invalid.local");
  url.searchParams.set("path", path.replace(/^\/+/, ""));

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return PROXY_BASE_URL ? url.toString() : "";
}

async function requestJson(url, signal) {
  if (!url) {
    const error = new Error("Missing football backend URL");
    error.status = 500;
    throw error;
  }

  if (!signal && inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const promise = (async () => {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      const error = new Error(`Football backend request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  })();

  if (!signal) {
    inFlightRequests.set(url, promise);
  }

  try {
    return await promise;
  } finally {
    if (!signal) {
      inFlightRequests.delete(url);
    }
  }
}

async function requestWithCacheFallback(url, cacheKey, signal, { maxAgeMs } = {}) {
  const cached = readCache(cacheKey, maxAgeMs);

  if (cached) {
    return { data: cached, fromStaleCache: false };
  }

  try {
    const data = await requestJson(url, signal);
    return { data, fromStaleCache: false };
  } catch (error) {
    const stale = readStaleCache(cacheKey);
    if (stale) {
      return { data: stale, fromStaleCache: true };
    }
    throw error;
  }
}

export function hasFootballApiToken() {
  return Boolean(PROXY_BASE_URL);
}

export async function getCompetitionStandings(competitionCode, signal, season = null) {
  const seasonSuffix = season ? `-${season}` : "";
  const cacheKey = `football-data-standings-${competitionCode}${seasonSuffix}`;
  const url = buildProxyUrl(`v4/competitions/${competitionCode}/standings`, season ? { season } : {});
  const result = await requestWithCacheFallback(url, cacheKey, signal, {
    maxAgeMs: STANDINGS_CACHE_MAX_AGE_MS,
  });

  if (!result.fromStaleCache) {
    writeCache(cacheKey, result.data);
  }

  return result.data?.standings?.[0]?.table ?? result.data?.standings ?? result.data ?? [];
}

export async function getMatchesForTeam(teamId, signal) {
  const cacheKey = `football-data-matches-v3-${teamId}`;
  const url = buildProxyUrl(`v4/teams/${teamId}/matches`);
  const result = await requestWithCacheFallback(url, cacheKey, signal, {
    maxAgeMs: MATCH_CACHE_MAX_AGE_MS,
  });

  if (!result.fromStaleCache) {
    writeCache(cacheKey, result.data);
  }

  return result.data?.matches ?? result.data ?? [];
}

export async function getCompetitionMatches(competitionCode, signal) {
  const cacheKey = `football-data-competition-matches-v3-${competitionCode}`;
  const url = buildProxyUrl(`v4/competitions/${competitionCode}/matches`);
  const result = await requestWithCacheFallback(url, cacheKey, signal, {
    maxAgeMs: MATCH_CACHE_MAX_AGE_MS,
  });

  if (!result.fromStaleCache) {
    writeCache(cacheKey, result.data);
  }

  return result.data?.matches ?? result.data ?? [];
}

export async function getCompetitionScorers(competitionCode, signal) {
  const cacheKey = `football-data-competition-scorers-${competitionCode}`;
  const url = buildProxyUrl(`v4/competitions/${competitionCode}/scorers`);
  const result = await requestWithCacheFallback(url, cacheKey, signal, {
    maxAgeMs: SCORERS_CACHE_MAX_AGE_MS,
  });

  if (!result.fromStaleCache) {
    writeCache(cacheKey, result.data);
  }

  return result.data?.scorers ?? result.data ?? [];
}

export async function getTeamDetails(teamId, signal) {
  const cacheKey = `football-data-team-${teamId}`;
  const url = buildProxyUrl(`v4/teams/${teamId}`);
  const result = await requestWithCacheFallback(url, cacheKey, signal, {
    maxAgeMs: TEAM_CACHE_MAX_AGE_MS,
  });

  if (!result.fromStaleCache) {
    writeCache(cacheKey, result.data);
  }

  return result.data ?? null;
}
