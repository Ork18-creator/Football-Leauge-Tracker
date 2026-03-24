const inFlightRequests = new Map();
const MATCH_CACHE_MAX_AGE_MS = 60 * 1000;
const STANDINGS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const SCORERS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const TEAM_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

async function request(path, signal) {
  const normalizedPath = `v4${path}`.replace(/^\/+/, "");
  const requestUrl = `/api/football-data?path=${encodeURIComponent(normalizedPath)}`;

  if (!signal && inFlightRequests.has(requestUrl)) {
    return inFlightRequests.get(requestUrl);
  }

  const promise = (async () => {
    const response = await fetch(requestUrl, {
      signal,
    });

    if (!response.ok) {
      const error = new Error(`Football data request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  })();

  if (!signal) {
    inFlightRequests.set(requestUrl, promise);
  }

  try {
    return await promise;
  } finally {
    if (!signal) {
      inFlightRequests.delete(requestUrl);
    }
  }
}

async function requestWithCacheFallback(path, cacheKey, signal, { maxAgeMs, preferFresh = false } = {}) {
  const cached = preferFresh ? null : readCache(cacheKey, maxAgeMs);

  if (cached) {
    return { data: cached, fromStaleCache: false };
  }

  try {
    const data = await request(path, signal);
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
  return __HAS_FOOTBALL_API_TOKEN__;
}

export async function getCompetitionStandings(competitionCode, signal, season = null) {
  const seasonSuffix = season ? `-${season}` : "";
  const cacheKey = `football-data-standings-${competitionCode}${seasonSuffix}`;
  const cached = readCache(cacheKey, STANDINGS_CACHE_MAX_AGE_MS);

  if (cached) {
    return cached;
  }

  const seasonQuery = season ? `?season=${season}` : "";
  try {
    const data = await request(`/competitions/${competitionCode}/standings${seasonQuery}`, signal);
    const table =
      data.standings?.find((standing) => standing.type === "TOTAL")?.table ?? [];
    writeCache(cacheKey, table);
    return table;
  } catch (error) {
    const stale = readStaleCache(cacheKey);
    if (stale) {
      return stale;
    }
    throw error;
  }
}

export async function getMatchesForTeam(teamId, signal, options = {}) {
  const cacheKey = `football-data-matches-v3-${teamId}`;
  const data = await requestWithCacheFallback(`/teams/${teamId}/matches?limit=500`, cacheKey, signal, {
    maxAgeMs: MATCH_CACHE_MAX_AGE_MS,
    preferFresh: options.preferFresh,
  });
  const matches = data.data?.matches ?? data.data ?? [];

  if (!data.fromStaleCache) {
    writeCache(cacheKey, matches);
  }

  return matches;
}

export async function getCompetitionMatches(competitionCode, signal, options = {}) {
  const cacheKey = `football-data-competition-matches-v3-${competitionCode}`;
  const data = await requestWithCacheFallback(
    `/competitions/${competitionCode}/matches?limit=380`,
    cacheKey,
    signal,
    {
      maxAgeMs: MATCH_CACHE_MAX_AGE_MS,
      preferFresh: options.preferFresh,
    },
  );
  const matches = data.data?.matches ?? data.data ?? [];

  if (!data.fromStaleCache) {
    writeCache(cacheKey, matches);
  }

  return matches;
}

export async function getCompetitionScorers(competitionCode, signal) {
  const cacheKey = `football-data-competition-scorers-${competitionCode}`;
  const cached = readCache(cacheKey, SCORERS_CACHE_MAX_AGE_MS);

  if (cached) {
    return cached;
  }

  try {
    const data = await request(`/competitions/${competitionCode}/scorers?limit=10`, signal);
    const scorers = data.scorers ?? [];
    writeCache(cacheKey, scorers);
    return scorers;
  } catch (error) {
    const stale = readStaleCache(cacheKey);
    if (stale) {
      return stale;
    }
    throw error;
  }
}

export async function getTeamDetails(teamId, signal) {
  const cacheKey = `football-data-team-${teamId}`;
  const cached = readCache(cacheKey, TEAM_CACHE_MAX_AGE_MS);

  if (cached) {
    return cached;
  }

  try {
    const team = await request(`/teams/${teamId}`, signal);
    writeCache(cacheKey, team);
    return team;
  } catch (error) {
    const stale = readStaleCache(cacheKey);
    if (stale) {
      return stale;
    }
    throw error;
  }
}
