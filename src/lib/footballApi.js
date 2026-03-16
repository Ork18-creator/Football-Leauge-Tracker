const API_BASE_URL = "/api/football-data/v4";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
  });

  if (!response.ok) {
    const error = new Error(`Football data request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function hasFootballApiToken() {
  return __HAS_FOOTBALL_API_TOKEN__;
}

export async function getCompetitionStandings(competitionCode, signal, season = null) {
  const seasonSuffix = season ? `-${season}` : "";
  const cacheKey = `football-data-standings-${competitionCode}${seasonSuffix}`;
  const cached = readCache(cacheKey, 15 * 60 * 1000);

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
    if (error.status === 429) {
      const stale = readStaleCache(cacheKey);
      if (stale) {
        return stale;
      }
    }
    throw error;
  }
}

export async function getMatchesForTeam(teamId, signal) {
  const cacheKey = `football-data-matches-v2-${teamId}`;
  const cached = readCache(cacheKey, 15 * 60 * 1000);

  if (cached) {
    return cached;
  }

  try {
    const data = await request(`/teams/${teamId}/matches?limit=500`, signal);
    const matches = data.matches ?? [];
    writeCache(cacheKey, matches);
    return matches;
  } catch (error) {
    if (error.status === 429) {
      const stale = readStaleCache(cacheKey);
      if (stale) {
        return stale;
      }
    }
    throw error;
  }
}

export async function getCompetitionMatches(competitionCode, signal) {
  const cacheKey = `football-data-competition-matches-${competitionCode}`;
  const cached = readCache(cacheKey, 15 * 60 * 1000);

  if (cached) {
    return cached;
  }

  try {
    const data = await request(`/competitions/${competitionCode}/matches?limit=380`, signal);
    const matches = data.matches ?? [];
    writeCache(cacheKey, matches);
    return matches;
  } catch (error) {
    if (error.status === 429) {
      const stale = readStaleCache(cacheKey);
      if (stale) {
        return stale;
      }
    }
    throw error;
  }
}

export async function getCompetitionScorers(competitionCode, signal) {
  const cacheKey = `football-data-competition-scorers-${competitionCode}`;
  const cached = readCache(cacheKey, 15 * 60 * 1000);

  if (cached) {
    return cached;
  }

  try {
    const data = await request(`/competitions/${competitionCode}/scorers?limit=10`, signal);
    const scorers = data.scorers ?? [];
    writeCache(cacheKey, scorers);
    return scorers;
  } catch (error) {
    if (error.status === 429) {
      const stale = readStaleCache(cacheKey);
      if (stale) {
        return stale;
      }
    }
    throw error;
  }
}

export async function getTeamDetails(teamId, signal) {
  const cacheKey = `football-data-team-${teamId}`;
  const cached = readCache(cacheKey, 24 * 60 * 60 * 1000);

  if (cached) {
    return cached;
  }

  try {
    const team = await request(`/teams/${teamId}`, signal);
    writeCache(cacheKey, team);
    return team;
  } catch (error) {
    if (error.status === 429) {
      const stale = readStaleCache(cacheKey);
      if (stale) {
        return stale;
      }
    }
    throw error;
  }
}
