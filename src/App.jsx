import { useEffect, useMemo, useState } from "react";
import { teams } from "./data/teams";
import {
  getCompetitionMatches,
  getCompetitionScorers,
  getCompetitionStandings,
  getMatchesForTeam,
  getTeamDetails,
  hasFootballApiToken,
} from "./lib/footballApi";

const competitions = [
  { code: "PL", name: "Premier League", short: "PL" },
  { code: "PD", name: "LaLiga", short: "LL" },
  { code: "SA", name: "Serie A", short: "SA" },
  { code: "BL1", name: "Bundesliga", short: "BL" },
  { code: "CL", name: "Champions League", short: "UCL" },
];
const domesticCupCompetitions = [
  { code: "FAC", name: "FA Cup" },
  { code: "FLC", name: "EFL Cup" },
];
const manualDomesticCupFixtures = [
  {
    id: "manual-flc-final-2026-arsenal-mancity",
    competition: { code: "FLC", name: "Football League Cup / EFL Cup" },
    status: "SCHEDULED",
    utcDate: "2026-03-22T16:30:00Z",
    stage: "FINAL",
    venue: "Wembley Stadium",
    homeTeam: { id: "arsenal", name: "Arsenal", shortName: "Arsenal" },
    awayTeam: { id: "man-city", name: "Manchester City", shortName: "Man City" },
    score: {
      fullTime: { home: null, away: null },
    },
  },
  {
    id: "manual-fac-qf-2026-southampton-arsenal",
    competition: { code: "FAC", name: "FA Cup" },
    status: "SCHEDULED",
    utcDate: "2026-04-04T14:00:00Z",
    stage: "QUARTER_FINALS",
    venue: "St. Mary's Stadium",
    homeTeam: { id: "southampton", name: "Southampton", shortName: "Southampton" },
    awayTeam: { id: "arsenal", name: "Arsenal", shortName: "Arsenal" },
    score: {
      fullTime: { home: null, away: null },
    },
  },
  {
    id: "manual-fac-qf-2026-chelsea-portvale",
    competition: { code: "FAC", name: "FA Cup" },
    status: "SCHEDULED",
    utcDate: "2026-04-04T14:00:00Z",
    stage: "QUARTER_FINALS",
    venue: "Stamford Bridge",
    homeTeam: { id: "chelsea", name: "Chelsea", shortName: "Chelsea" },
    awayTeam: { id: "port-vale", name: "Port Vale", shortName: "Port Vale" },
    score: {
      fullTime: { home: null, away: null },
    },
  },
  {
    id: "manual-fac-qf-2026-mancity-liverpool",
    competition: { code: "FAC", name: "FA Cup" },
    status: "SCHEDULED",
    utcDate: "2026-04-04T14:00:00Z",
    stage: "QUARTER_FINALS",
    venue: "Etihad Stadium",
    homeTeam: { id: "man-city", name: "Manchester City", shortName: "Man City" },
    awayTeam: { id: "liverpool", name: "Liverpool", shortName: "Liverpool" },
    score: {
      fullTime: { home: null, away: null },
    },
  },
  {
    id: "manual-fac-qf-2026-westham-leeds",
    competition: { code: "FAC", name: "FA Cup" },
    status: "SCHEDULED",
    utcDate: "2026-04-04T14:00:00Z",
    stage: "QUARTER_FINALS",
    venue: "London Stadium",
    homeTeam: { id: "west-ham", name: "West Ham United", shortName: "West Ham" },
    awayTeam: { id: "leeds", name: "Leeds United", shortName: "Leeds" },
    score: {
      fullTime: { home: null, away: null },
    },
  },
];
const manualCrestMapEntries = [
  [
    "Southampton",
    "https://crests.football-data.org/340.png",
  ],
  [
    "Southampton FC",
    "https://crests.football-data.org/340.png",
  ],
  [
    "Port Vale",
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Port_Vale_FC_crest.svg/120px-Port_Vale_FC_crest.svg.png",
  ],
  [
    "Port Vale FC",
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Port_Vale_FC_crest.svg/120px-Port_Vale_FC_crest.svg.png",
  ],
];
const DEFAULT_PL_TEAM_ID = "arsenal";
const championsLeagueExcludedTeams = new Set(["Aston Villa", "Manchester United"]);
const premierLeagueRecentWinners = [
  { season: "2024/25", club: "Liverpool" },
  { season: "2023/24", club: "Manchester City" },
  { season: "2022/23", club: "Manchester City" },
];
const laLigaRecentWinners = [
  { season: "2024/25", club: "Barcelona" },
  { season: "2023/24", club: "Real Madrid" },
  { season: "2022/23", club: "Barcelona" },
];
const serieARecentWinners = [
  { season: "2024/25", club: "Napoli" },
  { season: "2023/24", club: "Inter Milan" },
  { season: "2022/23", club: "Napoli" },
];
const bundesligaRecentWinners = [
  { season: "2024/25", club: "Bayern Munich" },
  { season: "2023/24", club: "Bayer Leverkusen" },
  { season: "2022/23", club: "Bayern Munich" },
];
const LIVE_MATCH_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE", "SUSPENDED"]);

export default function App() {
  const [selectedCompetitionCode, setSelectedCompetitionCode] = useState("PL");
  const [selectedTeamId, setSelectedTeamId] = useState(DEFAULT_PL_TEAM_ID);
  const [isSwitchingClub, setIsSwitchingClub] = useState(false);
  const [switchingTeamId, setSwitchingTeamId] = useState(null);
  const [standingsByCompetition, setStandingsByCompetition] = useState({});
  const [competitionMatchesByCode, setCompetitionMatchesByCode] = useState({});
  const [scorersByCompetition, setScorersByCompetition] = useState({});
  const [matchesByTeamId, setMatchesByTeamId] = useState({});
  const [teamDetailsById, setTeamDetailsById] = useState({});
  const [standingsUpdatedAtByCompetition, setStandingsUpdatedAtByCompetition] = useState({});
  const [competitionMatchesUpdatedAtByCode, setCompetitionMatchesUpdatedAtByCode] = useState({});
  const [scorersUpdatedAtByCompetition, setScorersUpdatedAtByCompetition] = useState({});
  const [matchesUpdatedAtByTeamId, setMatchesUpdatedAtByTeamId] = useState({});
  const [standingsErrorByCompetition, setStandingsErrorByCompetition] = useState({});
  const [matchesErrorByTeamId, setMatchesErrorByTeamId] = useState({});
  const [scorersErrorByCompetition, setScorersErrorByCompetition] = useState({});
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingScorers, setIsLoadingScorers] = useState(false);

  const apiReady = hasFootballApiToken();
  const competition =
    competitions.find((item) => item.code === selectedCompetitionCode) ??
    competitions[0];
  const isLeagueCompetition = ["PL", "PD", "SA", "BL1"].includes(competition.code);
  const plStandings = standingsByCompetition.PL ?? [];
  const championsLeagueStandings = standingsByCompetition.CL ?? [];
  const currentStandings = standingsByCompetition[competition.code] ?? [];
  const competitionMatches = competitionMatchesByCode[competition.code] ?? [];
  const faCupMatches = competitionMatchesByCode.FAC ?? [];
  const eflCupMatches = competitionMatchesByCode.FLC ?? [];
  const championsLeagueMatches = competitionMatchesByCode.CL ?? [];
  const standingsUpdatedAt = standingsUpdatedAtByCompetition[competition.code] ?? null;
  const competitionMatchesUpdatedAt = competitionMatchesUpdatedAtByCode[competition.code] ?? null;
  const scorersUpdatedAt = scorersUpdatedAtByCompetition[competition.code] ?? null;
  const standingsError = standingsErrorByCompetition[competition.code] ?? "";
  const scorersError = scorersErrorByCompetition[competition.code] ?? "";
  const competitionScorers = scorersByCompetition[competition.code] ?? [];
  const selectedLocalTeam = teams.find((team) => String(team.id) === String(selectedTeamId)) ?? null;
  const championsLeagueTeams = useMemo(
    () => buildActiveChampionsLeagueTeams(championsLeagueMatches, championsLeagueStandings),
    [championsLeagueMatches, championsLeagueStandings],
  );
  const availableTeams = useMemo(
    () =>
      buildTeamOptions(
        competition.code === "PL" ? teams : [],
        competition.code === "CL"
          ? championsLeagueTeams
          : currentStandings,
      ),
    [competition.code, championsLeagueTeams, currentStandings],
  );
  const selectedStanding =
    findStanding(currentStandings, selectedTeamId) ??
    findStandingByName(currentStandings, selectedLocalTeam?.apiTeamName ?? selectedLocalTeam?.name) ??
    (competition.code === "PL" ? findStanding(plStandings, selectedTeamId) : null) ??
    (competition.code === "PL"
      ? findStandingByName(plStandings, selectedLocalTeam?.apiTeamName ?? selectedLocalTeam?.name)
      : null);
  const selectedTeam = buildSelectedTeam(
    selectedTeamId,
    teams,
    selectedStanding,
    teamDetailsById,
  );
  const switchingTeam =
    teams.find((team) => String(team.id) === String(switchingTeamId)) ??
    availableTeams.find((team) => String(team.id) === String(switchingTeamId)) ??
    null;
  const activeChampionsLeagueTeamKeys = useMemo(
    () => buildActiveChampionsLeagueTeamKeys(championsLeagueMatches, championsLeagueStandings),
    [championsLeagueMatches, championsLeagueStandings],
  );
  const selectedCompetitionMatches = useMemo(() => {
    if (!selectedStanding?.team?.id) {
      return [];
    }

    return competitionMatches.filter(
      (match) =>
        String(match.homeTeam?.id) === String(selectedStanding.team.id) ||
        String(match.awayTeam?.id) === String(selectedStanding.team.id),
    );
  }, [competitionMatches, selectedStanding?.team?.id]);
  const selectedMatches = selectedCompetitionMatches.length
    ? selectedCompetitionMatches
    : selectedStanding
      ? matchesByTeamId[selectedStanding.team.id] ?? []
      : [];
  const matchesUpdatedAt = selectedCompetitionMatches.length
    ? competitionMatchesUpdatedAt
    : selectedStanding
      ? matchesUpdatedAtByTeamId[selectedStanding.team.id] ?? null
      : competitionMatchesUpdatedAt;
  const matchesError = selectedStanding?.team?.id
    ? matchesErrorByTeamId[selectedStanding.team.id] ?? ""
    : "";
  const hasSelectedMatchesFallback = selectedMatches.length > 0;
  const visibleMatchesError = hasSelectedMatchesFallback ? "" : matchesError;
  const recentMatches = selectedMatches
    .filter(
      (match) =>
        match.competition?.code === competition.code && match.status === "FINISHED",
    )
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 5);
  const upcomingMatches = selectedMatches
    .filter(
      (match) =>
        match.competition?.code === competition.code &&
        !["FINISHED", "CANCELLED"].includes(match.status),
    )
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, competition.code === "CL" ? 1 : 5);
  const domesticCupUpcomingMatches = useMemo(() => {
    if (competition.code !== "PL" || !selectedStanding?.team?.id) {
      return [];
    }

    const selectedTeamId = String(selectedStanding.team.id);
    const upcomingByCompetition = [...faCupMatches, ...eflCupMatches]
      .filter(
        (match) =>
          !["FINISHED", "CANCELLED"].includes(match.status) &&
          (String(match.homeTeam?.id) === selectedTeamId ||
            String(match.awayTeam?.id) === selectedTeamId),
      )
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    return domesticCupCompetitions
      .map(({ code }) => upcomingByCompetition.find((match) => match.competition?.code === code))
      .filter(Boolean);
  }, [competition.code, eflCupMatches, faCupMatches, selectedStanding?.team?.id]);
  const upcomingChampionsLeagueMatches = useMemo(() => {
    if (!["PL", "PD", "SA", "BL1"].includes(competition.code) || !selectedStanding?.team?.id) {
      return [];
    }

    const selectedTeamId = String(selectedStanding.team.id);
    return championsLeagueMatches
      .filter(
        (match) =>
          !["FINISHED", "CANCELLED"].includes(match.status) &&
          (String(match.homeTeam?.id) === selectedTeamId ||
            String(match.awayTeam?.id) === selectedTeamId),
      )
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 1);
  }, [championsLeagueMatches, competition.code, selectedStanding?.team?.id]);
  const displayedDomesticCupUpcomingMatches = useMemo(() => {
    if (domesticCupUpcomingMatches.length > 0) {
      return domesticCupUpcomingMatches;
    }

    if (competition.code !== "PL") {
      return [];
    }

    const selectedTeamKeys = new Set(
      [
        selectedTeam.name,
        selectedTeam.apiTeamName,
        simplifyName(selectedTeam.name),
        simplifyName(selectedTeam.apiTeamName),
      ]
        .filter(Boolean)
        .map((name) => normalizeTeamKey(name)),
    );

    return manualDomesticCupFixtures.filter((match) => {
      const isUpcoming = new Date(match.utcDate).getTime() >= Date.now();
      const homeKeys = [
        match.homeTeam.name,
        match.homeTeam.shortName,
        simplifyName(match.homeTeam.name),
        simplifyName(match.homeTeam.shortName || ""),
      ]
        .filter(Boolean)
        .map((name) => normalizeTeamKey(name));
      const awayKeys = [
        match.awayTeam.name,
        match.awayTeam.shortName,
        simplifyName(match.awayTeam.name),
        simplifyName(match.awayTeam.shortName || ""),
      ]
        .filter(Boolean)
        .map((name) => normalizeTeamKey(name));
      return (
        isUpcoming &&
        [...homeKeys, ...awayKeys].some((key) => selectedTeamKeys.has(key))
      );
    });
  }, [competition.code, domesticCupUpcomingMatches, selectedTeam.apiTeamName, selectedTeam.name]);
  const extraCompetitionUpcomingMatches = useMemo(
    () =>
      [...displayedDomesticCupUpcomingMatches, ...upcomingChampionsLeagueMatches].sort(
        (a, b) => new Date(a.utcDate) - new Date(b.utcDate),
      ),
    [displayedDomesticCupUpcomingMatches, upcomingChampionsLeagueMatches],
  );
  const liveMatchFromCompetition =
    competitionMatches.find(
      (match) =>
        match.competition?.code === competition.code &&
        LIVE_MATCH_STATUSES.has(match.status) &&
        isMatchForSelectedTeam(match, selectedTeam),
    ) ?? null;
  const liveMatch =
    selectedMatches.find(
      (match) =>
        match.competition?.code === competition.code &&
        LIVE_MATCH_STATUSES.has(match.status),
    ) ??
    liveMatchFromCompetition ??
    null;
  const primaryUpcomingMatch = upcomingMatches[0] ?? null;
  const upcomingSectionTitle =
    liveMatch || (primaryUpcomingMatch && LIVE_MATCH_STATUSES.has(primaryUpcomingMatch.status))
      ? "Currently Live"
      : "Upcoming Match";
  const cleanSheets = countCleanSheets(selectedMatches, selectedTeam, competition.code);
  const averageGoals = calculateAverageGoals(selectedStanding);
  const averageGoalsConceded = calculateAverageGoalsConceded(selectedStanding);
  const currentChampionsLeagueRound =
    competition.code === "CL"
      ? resolveChampionsLeagueRoundLabel(selectedMatches, competitionMatches)
      : null;
  const formResults = buildFormResults(selectedStanding?.form, recentMatches, selectedTeam);
  const formMomentum = buildFormMomentum(recentMatches, selectedTeam);
  const positionStreak = buildPositionStreak(
    competitionMatches,
    selectedStanding,
    competition.code,
  );
  const recentWinners =
    competition.code === "PD"
      ? laLigaRecentWinners
      : competition.code === "SA"
        ? serieARecentWinners
        : competition.code === "BL1"
          ? bundesligaRecentWinners
          : premierLeagueRecentWinners;
  const showRecentWinners = ["PL", "PD", "SA", "BL1"].includes(competition.code);
  const crestMap = new Map(
    [
      ...currentStandings,
      ...plStandings,
      ...championsLeagueStandings,
      ...(standingsByCompetition.PD ?? []),
      ...(standingsByCompetition.SA ?? []),
      ...(standingsByCompetition.BL1 ?? []),
    ].flatMap((entry) => [
      [entry.team.id, entry.team.crest],
      [entry.team.name, entry.team.crest],
      [entry.team.shortName, entry.team.crest],
      [simplifyName(entry.team.name), entry.team.crest],
      [simplifyName(entry.team.shortName || entry.team.name), entry.team.crest],
      [normalizeTeamKey(entry.team.name), entry.team.crest],
      [normalizeTeamKey(entry.team.shortName || entry.team.name), entry.team.crest],
    ]),
  );
  [
    ["Manchester City", "Man City"],
    ["Manchester City FC", "Man City"],
    ["West Ham United", "West Ham"],
    ["Liverpool FC", "Liverpool"],
    ["Arsenal FC", "Arsenal"],
    ["Chelsea FC", "Chelsea"],
    ["Leeds United FC", "Leeds United"],
    ["Southampton FC", "Southampton"],
    ["Southampton FC", "South Hampton"],
  ].forEach(([sourceName, aliasName]) => {
    const crest =
      crestMap.get(sourceName) ??
      crestMap.get(normalizeTeamKey(sourceName)) ??
      crestMap.get(simplifyName(sourceName));

    if (crest) {
      crestMap.set(aliasName, crest);
      crestMap.set(normalizeTeamKey(aliasName), crest);
      crestMap.set(simplifyName(aliasName), crest);
    }
  });
  manualCrestMapEntries.forEach(([name, crest]) => {
    crestMap.set(name, crest);
    crestMap.set(normalizeTeamKey(name), crest);
    crestMap.set(simplifyName(name), crest);
  });

  function handleSelectTeam(teamId) {
    const nextTeamId = String(teamId);
    if (nextTeamId === String(selectedTeamId)) {
      return;
    }

    setIsSwitchingClub(true);
    setSwitchingTeamId(nextTeamId);
    setSelectedTeamId(nextTeamId);
  }

  useEffect(() => {
    if (availableTeams.length === 0) {
      return;
    }

    const exists = availableTeams.some((team) => String(team.id) === String(selectedTeamId));
    if (!exists) {
      setSelectedTeamId(String(availableTeams[0].id));
    }
  }, [availableTeams, selectedTeamId]);

  useEffect(() => {
    if (!apiReady || standingsByCompetition[competition.code]) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingStandings(true);
        setStandingsErrorByCompetition((current) => ({
          ...current,
          [competition.code]: "",
        }));
        const table = await getCompetitionStandings(competition.code, controller.signal);
        setStandingsByCompetition((current) => ({ ...current, [competition.code]: table }));
        setStandingsUpdatedAtByCompetition((current) => ({
          ...current,
          [competition.code]: Date.now(),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          setStandingsErrorByCompetition((current) => ({
            ...current,
            [competition.code]:
              error.status === 429
                ? `The live ${competition.name} API is rate-limited right now. Please wait a moment and refresh.`
                : `Unable to load the live ${competition.name} table right now.`,
          }));
        }
      } finally {
        setIsLoadingStandings(false);
      }
    })();
    return () => controller.abort();
  }, [apiReady, competition, standingsByCompetition]);

  useEffect(() => {
    if (!apiReady || competitionMatchesByCode[competition.code]) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const matches = await getCompetitionMatches(competition.code, controller.signal, {
          preferFresh: true,
        });
        setCompetitionMatchesByCode((current) => ({
          ...current,
          [competition.code]: matches,
        }));
        setCompetitionMatchesUpdatedAtByCode((current) => ({
          ...current,
          [competition.code]: Date.now(),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [apiReady, competition.code, competitionMatchesByCode]);

  useEffect(() => {
    if (!apiReady || competitionMatchesByCode.CL) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const matches = await getCompetitionMatches("CL", controller.signal, {
          preferFresh: true,
        });
        setCompetitionMatchesByCode((current) => ({
          ...current,
          CL: matches,
        }));
        setCompetitionMatchesUpdatedAtByCode((current) => ({
          ...current,
          CL: Date.now(),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [apiReady, competitionMatchesByCode]);

  useEffect(() => {
    if (!apiReady || competition.code !== "PL") {
      return undefined;
    }

    const missingCupCodes = domesticCupCompetitions
      .map((item) => item.code)
      .filter((code) => !competitionMatchesByCode[code]);

    if (missingCupCodes.length === 0) {
      return undefined;
    }

    const controller = new AbortController();

    (async () => {
      await Promise.all(
        missingCupCodes.map(async (code) => {
          try {
            const matches = await getCompetitionMatches(code, controller.signal, {
              preferFresh: true,
            });
            setCompetitionMatchesByCode((current) => ({
              ...current,
              [code]: matches,
            }));
            setCompetitionMatchesUpdatedAtByCode((current) => ({
              ...current,
              [code]: Date.now(),
            }));
          } catch (error) {
            if (error.name !== "AbortError") {
              return;
            }
          }
        }),
      );
    })();

    return () => controller.abort();
  }, [apiReady, competition.code, competitionMatchesByCode]);

  useEffect(() => {
    if (!apiReady || standingsByCompetition.CL) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const table = await getCompetitionStandings("CL", controller.signal);
        setStandingsByCompetition((current) => ({ ...current, CL: table }));
      } catch (error) {
        if (error.name !== "AbortError") {
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [apiReady, standingsByCompetition]);

  useEffect(() => {
    if (!apiReady || scorersByCompetition[competition.code]) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingScorers(true);
        setScorersErrorByCompetition((current) => ({
          ...current,
          [competition.code]: "",
        }));
        const scorers = await getCompetitionScorers(competition.code, controller.signal);
        setScorersByCompetition((current) => ({
          ...current,
          [competition.code]: scorers,
        }));
        setScorersUpdatedAtByCompetition((current) => ({
          ...current,
          [competition.code]: Date.now(),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          setScorersErrorByCompetition((current) => ({
            ...current,
            [competition.code]:
              error.status === 429
                ? `The live ${competition.name} scorers API is rate-limited right now. Please wait a moment and refresh.`
                : `Unable to load the live ${competition.name} top scorer right now.`,
          }));
        }
      } finally {
        setIsLoadingScorers(false);
      }
    })();
    return () => controller.abort();
  }, [apiReady, competition.code, competition.name, scorersByCompetition]);

  useEffect(() => {
    if (
      !apiReady ||
      !selectedStanding?.team?.id ||
      matchesByTeamId[selectedStanding.team.id] ||
      selectedCompetitionMatches.length > 0
    ) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingMatches(true);
        setMatchesErrorByTeamId((current) => ({
          ...current,
          [selectedStanding.team.id]: "",
        }));
        const matches = await getMatchesForTeam(selectedStanding.team.id, controller.signal, {
          preferFresh: true,
        });
        setMatchesByTeamId((current) => ({ ...current, [selectedStanding.team.id]: matches }));
        setMatchesUpdatedAtByTeamId((current) => ({
          ...current,
          [selectedStanding.team.id]: Date.now(),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          setMatchesErrorByTeamId((current) => ({
            ...current,
            [selectedStanding.team.id]:
              error.status === 429
                ? "The live fixtures API is rate-limited right now. Please wait a moment and refresh."
                : "Unable to load the club's live fixtures right now.",
          }));
        }
      } finally {
        setIsLoadingMatches(false);
      }
    })();
    return () => controller.abort();
  }, [apiReady, matchesByTeamId, selectedCompetitionMatches.length, selectedStanding?.team?.id]);


  useEffect(() => {
    if (!apiReady || !selectedStanding?.team?.id || teamDetailsById[selectedStanding.team.id]) {
      return undefined;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const team = await getTeamDetails(selectedStanding.team.id, controller.signal);
        setTeamDetailsById((current) => ({ ...current, [selectedStanding.team.id]: team }));
      } catch (error) {
        if (error.name !== "AbortError") {
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [apiReady, selectedStanding?.team?.id, teamDetailsById]);

  useEffect(() => {
    if (!isSwitchingClub) {
      return undefined;
    }

    if (!apiReady) {
      setIsSwitchingClub(false);
      setSwitchingTeamId(null);
      return undefined;
    }

    const hasMatchesForSelection = selectedStanding?.team?.id
      ? Boolean(matchesByTeamId[selectedStanding.team.id]) ||
        selectedCompetitionMatches.length > 0 ||
        Boolean(matchesError)
      : false;

    if (!selectedStanding || isLoadingMatches || !hasMatchesForSelection) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsSwitchingClub(false);
      setSwitchingTeamId(null);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    apiReady,
    isLoadingMatches,
    isSwitchingClub,
    matchesByTeamId,
    matchesError,
    selectedCompetitionMatches.length,
    selectedStanding,
  ]);

  return (
    <div className="app-shell min-h-screen bg-[#06131d] px-3 py-4 text-slate-100 sm:px-5 sm:py-5 lg:px-8">
      <div className="w-full">
        <header className="app-header sticky top-3 z-30 mb-3 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(3,9,16,0.82),rgba(5,14,24,0.78))] backdrop-blur-xl sm:top-4 sm:mb-4 sm:rounded-[28px]">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[1.25rem] font-extrabold tracking-[0.01em] text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.18)] sm:text-[1.75rem]">
                Football League Tracker
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px] sm:tracking-[0.24em]">
                Realtime Analysis
              </p>
            </div>
            <nav className="w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 sm:grid-cols-3 lg:flex lg:min-w-max lg:items-center">
                {competitions.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedCompetitionCode(item.code)}
                  className={`w-full rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3.5 lg:w-auto ${
                    item.code === competition.code
                      ? "border border-cyan-300/30 bg-cyan-300/12 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_8px_24px_rgba(8,145,178,0.16)]"
                      : "border border-white/0 text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.name}
                </button>
                ))}
              </div>
            </nav>
          </div>
        </header>

        <div className="app-frame relative rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(9,20,31,0.96),rgba(12,28,42,0.92))] p-3 shadow-[0_30px_120px_rgba(2,10,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[28px] before:border before:border-white/[0.03] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_38%)] sm:rounded-[36px] sm:p-5 lg:p-8">
          {isSwitchingClub ? (
            <ClubSwitchOverlay clubName={switchingTeam?.name ?? selectedTeam.name} />
          ) : null}
          <div>
          <section className="hero-panel relative z-20 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[28px] sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
              <div>
                <p className="accent-analysis text-sm font-semibold uppercase tracking-[0.22em] sm:text-base sm:tracking-[0.26em] lg:text-lg">
                  Live football dashboard
                </p>
                <p className="mt-1.5 max-w-[520px] text-sm leading-6 text-slate-400">
                  Select your favourite club and see some interesting insights.
                </p>
              </div>
              <div className="selector-panel relative rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,12,0.46),rgba(15,23,42,0.44))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[24px] sm:p-3.5">
                <label
                  htmlFor="team-select"
                  className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400"
                >
                  Choose club
                </label>
                <select
                  id="team-select"
                  value={selectedTeamId}
                  onChange={(event) => handleSelectTeam(event.target.value)}
                  className="mt-2.5 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] font-medium text-white outline-none transition focus:border-cyan-300/30 focus:bg-white/[0.08]"
                >
                  {availableTeams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-slate-950 text-white">
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <main className={`relative z-0 mt-4 grid items-stretch gap-4 ${isLeagueCompetition ? "xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)] 2xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.75fr)]" : ""}`}>
            {isLeagueCompetition ? (
              <div className="flex h-full min-h-full flex-col gap-4">
                <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[26px] sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        League table
                      </p>
                      <h3 className="display-heading mt-3 text-[1.75rem] leading-none text-white sm:text-3xl">
                        {competition.name}
                      </h3>
                      {standingsUpdatedAt ? (
                        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Updated {formatUpdatedAt(standingsUpdatedAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="hidden sm:block">
                      <PremierLeagueTrophyArt />
                    </div>
                  </div>
                  <div className="mt-4 max-h-[520px] overflow-y-auto pr-1 sm:max-h-[700px]">
                    {!apiReady ? (
                      <EmptyMessage>Add your API key to view the live table.</EmptyMessage>
                    ) : isLoadingStandings ? (
                      <SkeletonPanel rows={6} />
                    ) : standingsError ? (
                      <EmptyMessage>{standingsError}</EmptyMessage>
                    ) : (
                      <LeagueTable
                        standings={currentStandings}
                        selectedTeamId={selectedTeamId}
                        onSelectTeam={handleSelectTeam}
                        activeChampionsLeagueTeamKeys={activeChampionsLeagueTeamKeys}
                      />
                    )}
                  </div>
                </section>

                <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Title race
                  </p>
                  <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                    Top 4 comparison
                  </h3>
                  {standingsUpdatedAt ? (
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Updated {formatUpdatedAt(standingsUpdatedAt)}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    {!apiReady ? (
                      <EmptyMessage>Add your API key to view the title-race chart.</EmptyMessage>
                    ) : isLoadingStandings ? (
                      <SkeletonPanel rows={3} />
                    ) : standingsError ? (
                      <EmptyMessage>{standingsError}</EmptyMessage>
                    ) : (
                      <TitleRaceComparisonChart
                        standings={currentStandings}
                        matches={competitionMatches}
                        selectedTeamId={selectedTeamId}
                      />
                    )}
                  </div>
                </section>

                <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    League scoring
                  </p>
                  <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                    Current Top Scorers
                  </h3>
                  {scorersUpdatedAt ? (
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Updated {formatUpdatedAt(scorersUpdatedAt)}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    {!apiReady ? (
                      <EmptyMessage>Add your API key to view top scorers.</EmptyMessage>
                    ) : isLoadingScorers && competitionScorers.length === 0 ? (
                      <SkeletonPanel rows={1} />
                    ) : scorersError ? (
                      <EmptyMessage>{scorersError}</EmptyMessage>
                    ) : (
                      <TopScorerCard
                        scorers={competitionScorers}
                        competitionName={competition.name}
                        crestMap={crestMap}
                      />
                    )}
                  </div>
                </section>

                <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Club scoring
                  </p>
                  <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                    Most Goals
                  </h3>
                  <div className="mt-4">
                    {!apiReady ? (
                      <EmptyMessage>Add your API key to view club scoring leaders.</EmptyMessage>
                    ) : isLoadingStandings ? (
                      <SkeletonPanel rows={4} />
                    ) : standingsError ? (
                      <EmptyMessage>{standingsError}</EmptyMessage>
                    ) : (
                      <TopScoringClubsCard standings={currentStandings} crestMap={crestMap} />
                    )}
                  </div>
                </section>

                <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[28px] sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Club defending
                  </p>
                  <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                    Most Clean Sheets
                  </h3>
                  <div className="mt-4">
                    {!apiReady ? (
                      <EmptyMessage>Add your API key to view clean sheet leaders.</EmptyMessage>
                    ) : !competitionMatchesByCode[competition.code] ? (
                      <SkeletonPanel rows={4} />
                    ) : (
                      <TopCleanSheetsCard matches={competitionMatches} crestMap={crestMap} />
                    )}
                  </div>
                </section>

                {showRecentWinners ? (
                  <section className="side-panel rounded-[22px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[26px] sm:p-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Recent champions
                      </p>
                      <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                        {competition.code === "PD"
                          ? "Last 3 LaLiga Winners"
                          : competition.code === "SA"
                            ? "Last 3 Serie A Winners"
                            : competition.code === "BL1"
                              ? "Last 3 Bundesliga Winners"
                              : "Last 3 PL Winners"}
                      </h3>
                    </div>
                    <div className="mt-4">
                      <RecentWinnersTable winners={recentWinners} crestMap={crestMap} />
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            <div className="flex min-h-full flex-col gap-4">
              <div>
                <section className="summary-panel relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] p-4 sm:rounded-[28px] sm:p-5">
                  <TeamBackdrop
                    name={selectedTeam.name}
                    logoUrl={selectedStanding?.team?.crest}
                  />
                  <div className="relative z-10">
                  <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
                    <div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <ClubLogo name={selectedTeam.name} logoUrl={selectedStanding?.team?.crest} size="hero" />
                        <div>
                          <h2 className="display-heading text-[2.4rem] leading-none text-white sm:text-5xl">
                            {selectedTeam.name}
                          </h2>
                          <p className="mt-3 text-sm text-slate-400">
                            {selectedTeam.city}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        <Metric label="Manager" value={selectedTeam.manager ?? "NA"} />
                        <Metric label="Stadium" value={selectedTeam.stadium ?? "NA"} />
                        <Metric label="Current rank" value={selectedStanding ? `#${selectedStanding.position}` : "NA"} />
                        <Metric label="Points" value={selectedStanding?.points ?? "NA"} />
                        <Metric label="Goals scored" value={selectedStanding?.goalsFor ?? "NA"} />
                        <Metric label="Clean sheets" value={cleanSheets} />
                        <Metric label="AVG Goals Per Game" value={averageGoals} />
                        <Metric label="AVG Goals Conceded" value={averageGoalsConceded} />
                      </div>
                    </div>
                    <div className="form-guide-panel rounded-[24px] border border-white/10 bg-slate-950/40 p-4 sm:rounded-[28px] sm:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Form guide
                      </p>
                      {!apiReady ? (
                        <EmptyMessage>Add your API key to show live form data.</EmptyMessage>
                      ) : isLoadingStandings ? (
                        <LoadingMessage text={`Loading ${competition.name} table...`} />
                      ) : standingsError ? (
                        <EmptyMessage>{standingsError}</EmptyMessage>
                      ) : selectedStanding ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Metric label="Played" value={selectedStanding.playedGames} />
                            <Metric label="Goal diff" value={selectedStanding.goalDifference} />
                          </div>
                          {competition.code === "CL" ? (
                            <Metric label="Current round" value={currentChampionsLeagueRound ?? "NA"} />
                          ) : null}
                          <MomentumMetric momentum={formMomentum} compact />
                          <div className="flex flex-wrap gap-2">
                            {(formResults.length > 0 ? formResults : ["NA"]).map((result, index) => (
                              <span
                                key={`${result}-${index}`}
                                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] ${
                                  result === "NA" ? "bg-white/[0.06] text-slate-400" : badgeClass(result)
                                }`}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <EmptyMessage>This club is not listed in the live {competition.name} table.</EmptyMessage>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 border-t border-white/8 pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          Live match
                        </p>
                        <h3 className="display-heading mt-3 text-[2rem] leading-none text-white sm:text-3xl">
                          Current action
                        </h3>
                      </div>
                      {matchesUpdatedAt ? (
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Updated {formatUpdatedAt(matchesUpdatedAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      {!apiReady ? (
                        <EmptyMessage>Add your API key to view live matches.</EmptyMessage>
                      ) : isLoadingMatches ? (
                        <SkeletonPanel rows={2} />
                      ) : liveMatch ? (
                        <CompactLiveMatch
                          match={liveMatch}
                          selectedTeam={selectedTeam}
                          crestMap={crestMap}
                        />
                      ) : (
                        <EmptyMessage>
                          No live {competition.name} match for {selectedTeam.name} right now.
                        </EmptyMessage>
                      )}
                    </div>
                  </div>
                  </div>
                </section>
              </div>

              <InfoCard
                title={upcomingSectionTitle}
                divided
                updatedAt={matchesUpdatedAt}
              >
                {!apiReady ? (
                  <EmptyMessage>Add your API key to view the upcoming match.</EmptyMessage>
                ) : isLoadingMatches && upcomingMatches.length === 0 ? (
                  <SkeletonPanel rows={1} />
                ) : visibleMatchesError ? (
                  <EmptyMessage>{visibleMatchesError}</EmptyMessage>
                ) : upcomingMatches.length > 0 ? (
                  <MatchList
                    matches={upcomingMatches.slice(0, 1)}
                    selectedTeam={selectedTeam}
                    crestMap={crestMap}
                    standings={currentStandings}
                    allMatches={selectedMatches}
                    competitionCode={competition.code}
                    upcoming
                  />
                ) : (
                  <EmptyMessage>No upcoming {competition.name} match found.</EmptyMessage>
                )}
              </InfoCard>

              {["PL", "PD", "SA", "BL1"].includes(competition.code) ? (
                <InfoCard title="Upcoming Cup & European Competitions" divided updatedAt={matchesUpdatedAt}>
                  {!apiReady ? (
                    <EmptyMessage>Add your API key to view upcoming cup and European fixtures.</EmptyMessage>
                  ) : extraCompetitionUpcomingMatches.length > 0 ? (
                    <MatchList
                      matches={extraCompetitionUpcomingMatches}
                      selectedTeam={selectedTeam}
                      crestMap={crestMap}
                      standings={currentStandings}
                      allMatches={[
                        ...selectedMatches,
                        ...faCupMatches,
                        ...eflCupMatches,
                        ...championsLeagueMatches,
                      ]}
                      competitionCode={competition.code}
                      upcoming
                    />
                  ) : (
                    <EmptyMessage>No upcoming domestic cup or Champions League fixture available.</EmptyMessage>
                  )}
                </InfoCard>
              ) : null}

              <InfoCard title="Last Match Result" divided updatedAt={matchesUpdatedAt}>
                {!apiReady ? (
                  <EmptyMessage>Add your API key to view the last match result.</EmptyMessage>
                ) : isLoadingMatches && recentMatches.length === 0 ? (
                  <SkeletonPanel rows={1} />
                ) : visibleMatchesError ? (
                  <EmptyMessage>{visibleMatchesError}</EmptyMessage>
                ) : recentMatches.length > 0 ? (
                  <LastMatchResultCard
                    match={recentMatches[0]}
                    selectedTeam={selectedTeam}
                    crestMap={crestMap}
                  />
                ) : (
                  <EmptyMessage>No recent {competition.name} match found.</EmptyMessage>
                )}
              </InfoCard>

              <InfoCard title="Form Analysis" divided updatedAt={matchesUpdatedAt}>
                {!apiReady ? (
                  <EmptyMessage>Add your API key to view the form trend.</EmptyMessage>
                ) : isLoadingMatches && recentMatches.length === 0 ? (
                  <SkeletonPanel rows={2} />
                ) : visibleMatchesError ? (
                  <EmptyMessage>{visibleMatchesError}</EmptyMessage>
                ) : recentMatches.length > 0 ? (
                  <LineFormTrendChart
                    matches={recentMatches}
                    allMatches={selectedMatches}
                    selectedTeam={selectedTeam}
                    competitionCode={competition.code}
                  />
                ) : (
                  <EmptyMessage>No recent {competition.name} matches found for the trend chart.</EmptyMessage>
                )}
              </InfoCard>

              <div className="space-y-4">
                <InfoCard title={`Last 5 ${competition.name} matches`} divided updatedAt={matchesUpdatedAt}>
                  {!apiReady ? (
                    <EmptyMessage>Add your API key to view recent matches.</EmptyMessage>
                  ) : isLoadingMatches && recentMatches.length === 0 ? (
                    <SkeletonPanel rows={3} />
                  ) : visibleMatchesError ? (
                    <EmptyMessage>{visibleMatchesError}</EmptyMessage>
                  ) : recentMatches.length > 0 ? (
                    <MatchList matches={recentMatches} selectedTeam={selectedTeam} crestMap={crestMap} />
                  ) : (
                    <EmptyMessage>No recent {competition.name} matches found.</EmptyMessage>
                  )}
                </InfoCard>

                <InfoCard title={competition.code === "CL" ? "Next Champions League match" : `Next 5 ${competition.name} matches`} divided updatedAt={matchesUpdatedAt}>
                  {!apiReady ? (
                    <EmptyMessage>Add your API key to view upcoming matches.</EmptyMessage>
                  ) : isLoadingMatches && upcomingMatches.length === 0 ? (
                    <SkeletonPanel rows={2} />
                  ) : visibleMatchesError ? (
                    <EmptyMessage>{visibleMatchesError}</EmptyMessage>
                  ) : upcomingMatches.length > 0 ? (
                    <MatchList
                      matches={upcomingMatches}
                      selectedTeam={selectedTeam}
                      crestMap={crestMap}
                      standings={currentStandings}
                      allMatches={selectedMatches}
                      competitionCode={competition.code}
                      upcoming
                    />
                  ) : (
                    <EmptyMessage>No upcoming {competition.name} matches found.</EmptyMessage>
                  )}
                </InfoCard>
              </div>
            </div>
          </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function findStanding(standings, teamId) {
  return standings.find((entry) => String(entry.team.id) === String(teamId)) ?? null;
}

function findStandingByName(standings, teamName) {
  if (!teamName) {
    return null;
  }
  const normalizedName = normalizeTeamKey(teamName);
  return (
    standings.find((entry) =>
      [entry.team.name, entry.team.shortName, simplifyName(entry.team.name), simplifyName(entry.team.shortName || "")]
        .filter(Boolean)
        .some((name) => normalizeTeamKey(name) === normalizedName),
    ) ?? null
  );
}

function buildSelectedTeam(selectedTeamId, localTeams, selectedStanding, teamDetailsById) {
  const local = localTeams.find((team) => team.id === selectedTeamId) ?? null;
  const live = selectedStanding ? teamDetailsById[selectedStanding.team.id] : null;
  return {
    id: selectedTeamId,
    name: local?.name ?? simplifyName(live?.shortName || selectedStanding?.team.shortName || selectedStanding?.team.name || "Club"),
    apiTeamName: local?.apiTeamName ?? selectedStanding?.team.name ?? live?.name ?? local?.name,
    founded: local?.founded ?? live?.founded ?? "NA",
    city: local?.city ?? extractCity(live?.address) ?? "NA",
    stadium: local?.stadium ?? live?.venue ?? "NA",
    manager: local?.manager ?? live?.coach?.name ?? "NA",
  };
}

function buildTeamOptions(localTeams, standings) {
  const liveStandingsByKey = new Map();
  standings.forEach((entry) => {
    const liveOption = {
      id: String(entry.team.id),
      name: simplifyName(entry.team.shortName || entry.team.name),
    };
    [entry.team.name, entry.team.shortName, simplifyName(entry.team.name), simplifyName(entry.team.shortName || "")]
      .filter(Boolean)
      .forEach((name) => {
        liveStandingsByKey.set(normalizeTeamKey(name), liveOption);
      });
  });

  const map = new Map();
  localTeams.forEach((team) => {
    const matchedLiveTeam =
      liveStandingsByKey.get(normalizeTeamKey(team.apiTeamName || team.name)) ??
      liveStandingsByKey.get(normalizeTeamKey(team.name));
    const option = matchedLiveTeam ?? { id: team.id, name: team.name };
    if (!map.has(option.id)) {
      map.set(option.id, { id: option.id, name: team.name });
    }
  });
  standings.forEach((entry) => {
    const id = String(entry.team.id);
    if (!map.has(id)) {
      map.set(id, { id, name: simplifyName(entry.team.shortName || entry.team.name) });
    }
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function isMatchForSelectedTeam(match, selectedTeam) {
  if (!match || !selectedTeam) {
    return false;
  }

  const candidateNames = [
    selectedTeam.apiTeamName,
    selectedTeam.name,
    simplifyName(selectedTeam.apiTeamName),
    simplifyName(selectedTeam.name),
  ]
    .filter(Boolean)
    .map((name) => normalizeTeamKey(name));

  return [match.homeTeam?.name, match.homeTeam?.shortName, match.awayTeam?.name, match.awayTeam?.shortName]
    .filter(Boolean)
    .some((name) => candidateNames.includes(normalizeTeamKey(name)));
}

function buildFormResults(form, recentMatches, selectedTeam) {
  const live = (form ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 5);
  if (live.length > 0) {
    return live;
  }
  if (!selectedTeam) {
    return [];
  }
  return recentMatches.map((match) => {
    const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
    const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
    const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;
    if (teamScore > opponentScore) return "W";
    if (teamScore < opponentScore) return "L";
    return "D";
  });
}

function buildTrendPoints(matches, selectedTeam) {
  return [...matches]
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map((match, index) => {
      const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
      const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
      const goalsAgainst = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;
      const points = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;
      const result = points === 3 ? "W" : points === 1 ? "D" : "L";

      return {
        id: match.id,
        label: `M${index + 1}`,
        points,
        result,
        scoreline: `${goalsFor}-${goalsAgainst}`,
        opponent: simplifyName(isHome ? match.awayTeam.name : match.homeTeam.name),
      };
    });
}

function buildGoalTrendPoints(matches, selectedTeam) {
  return [...matches]
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map((match, index) => {
      const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
      const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
      const goalsAgainst = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;

      return {
        id: match.id,
        label: `M${index + 1}`,
        opponent: simplifyName(isHome ? match.awayTeam.name : match.homeTeam.name),
        goalsFor,
        goalsAgainst,
      };
    });
}

function buildScoringConsistencyPoints(matches, selectedTeam) {
  let streak = 0;

  return [...matches]
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map((match, index) => {
      const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
      const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
      streak = goalsFor > 0 ? streak + 1 : 0;

      return {
        id: match.id,
        label: `M${index + 1}`,
        opponent: simplifyName(isHome ? match.awayTeam.name : match.homeTeam.name),
        goalsFor,
        streak,
        scored: goalsFor > 0,
      };
    });
}

function resolveChampionsLeagueRoundLabel(selectedMatches, competitionMatches) {
  const activeCompetitionStage = resolveActiveChampionsLeagueStage(competitionMatches);
  if (activeCompetitionStage) {
    return formatChampionsLeagueStage(activeCompetitionStage);
  }

  const selectedCompetitionMatches = selectedMatches
    .filter((match) => match.competition?.code === "CL")
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const prioritizedSelectedMatch =
    selectedCompetitionMatches.find((match) => LIVE_MATCH_STATUSES.has(match.status)) ??
    selectedCompetitionMatches.find((match) => !["FINISHED", "CANCELLED"].includes(match.status)) ??
    selectedCompetitionMatches[selectedCompetitionMatches.length - 1] ??
    null;

  if (prioritizedSelectedMatch?.stage) {
    return formatChampionsLeagueStage(prioritizedSelectedMatch.stage);
  }

  const allCompetitionMatches = competitionMatches
    .filter((match) => match.competition?.code === "CL")
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

  const prioritizedCompetitionMatch =
    allCompetitionMatches.find(
      (match) =>
        LIVE_MATCH_STATUSES.has(match.status) || !["FINISHED", "CANCELLED"].includes(match.status),
    ) ??
    allCompetitionMatches[0] ??
    null;

  return prioritizedCompetitionMatch?.stage
    ? formatChampionsLeagueStage(prioritizedCompetitionMatch.stage)
    : null;
}

function formatChampionsLeagueStage(stage) {
  const stageLabels = {
    LEAGUE_STAGE: "League Stage",
    QUALIFICATION: "Qualification",
    QUALIFICATION_1: "Qualification Round 1",
    QUALIFICATION_2: "Qualification Round 2",
    QUALIFICATION_3: "Qualification Round 3",
    PLAYOFFS: "Play-offs",
    LAST_16: "Round of 16",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-finals",
    SEMI_FINALS: "Semi-finals",
    FINAL: "Final",
  };

  return (
    stageLabels[stage] ??
    stage
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function buildVenueForm(matches, selectedTeam, competitionCode) {
  const venueBuckets = matches.reduce(
    (accumulator, match) => {
      if (match.competition?.code !== competitionCode || match.status !== "FINISHED") {
        return accumulator;
      }

      const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
      const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
      const goalsAgainst = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;
      const points = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;
      const bucket = isHome ? accumulator.home : accumulator.away;

      bucket.played += 1;
      bucket.points += points;

      return accumulator;
    },
    {
      home: { played: 0, points: 0 },
      away: { played: 0, points: 0 },
    },
  );

  return venueBuckets;
}

function getSeasonKey(match) {
  if (match?.season?.id) {
    return String(match.season.id);
  }

  if (match?.season?.startDate && match?.season?.endDate) {
    return `${match.season.startDate}:${match.season.endDate}`;
  }

  return "";
}

function getActiveSeasonKey(matches, competitionCode) {
  const latestSeasonMatch = matches
    .filter((match) => match.competition?.code === competitionCode && getSeasonKey(match))
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];

  return latestSeasonMatch ? getSeasonKey(latestSeasonMatch) : "";
}

function countSeasonFiveWinStreaks(matches, selectedTeam, competitionCode) {
  if (!selectedTeam) {
    return 0;
  }

  const activeSeasonKey = getActiveSeasonKey(matches, competitionCode);
  const seasonMatches = matches
    .filter(
      (match) =>
        match.competition?.code === competitionCode &&
        match.status === "FINISHED" &&
        (!activeSeasonKey || getSeasonKey(match) === activeSeasonKey) &&
        [match.homeTeam.name, match.awayTeam.name].includes(selectedTeam.apiTeamName),
    )
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  if (seasonMatches.length < 5) {
    return 0;
  }

  let streak = 0;
  let streakCount = 0;

  seasonMatches.forEach((match) => {
    const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
    const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
    const goalsAgainst = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;

    if (goalsFor > goalsAgainst) {
      streak += 1;
      if (streak === 5) {
        streakCount += 1;
      }
      return;
    }

    streak = 0;
  });

  return streakCount;
}

function buildResultDistribution(matches, selectedTeam, competitionCode) {
  if (!selectedTeam) {
    return { wins: 0, draws: 0, losses: 0, total: 0 };
  }

  const seasonMatches = matches.filter(
    (match) =>
      match.competition?.code === competitionCode &&
      match.status === "FINISHED" &&
      [match.homeTeam.name, match.awayTeam.name].includes(selectedTeam.apiTeamName),
  );

  return seasonMatches.reduce(
    (summary, match) => {
      const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
      const goalsFor = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
      const goalsAgainst = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;

      if (goalsFor > goalsAgainst) {
        summary.wins += 1;
      } else if (goalsFor < goalsAgainst) {
        summary.losses += 1;
      } else {
        summary.draws += 1;
      }

      summary.total += 1;
      return summary;
    },
    { wins: 0, draws: 0, losses: 0, total: 0 },
  );
}

function buildPositionStreak(matches, selectedStanding, competitionCode) {
  if (!selectedStanding?.team?.id || competitionCode !== "PL") {
    return null;
  }

  const finishedMatches = matches
    .filter(
      (match) =>
        match.competition?.code === competitionCode &&
        match.status === "FINISHED" &&
        typeof match.score?.fullTime?.home === "number" &&
        typeof match.score?.fullTime?.away === "number",
    )
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  if (finishedMatches.length === 0) {
    return null;
  }

  const table = new Map();
  const snapshots = [];

  finishedMatches.forEach((match) => {
    const home = ensureTableRow(table, match.homeTeam.id, match.homeTeam.name);
    const away = ensureTableRow(table, match.awayTeam.id, match.awayTeam.name);
    const homeGoals = match.score.fullTime.home;
    const awayGoals = match.score.fullTime.away;

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.points += 3;
      home.wins += 1;
      away.losses += 1;
    } else if (homeGoals < awayGoals) {
      away.points += 3;
      away.wins += 1;
      home.losses += 1;
    } else {
      home.points += 1;
      away.points += 1;
      home.draws += 1;
      away.draws += 1;
    }

    const ranking = [...table.values()].sort(compareTableRows);
    const position = ranking.findIndex((row) => row.id === selectedStanding.team.id) + 1;

    snapshots.push({
      date: match.utcDate,
      position,
    });
  });

  const currentPosition = selectedStanding.position;
  let streakStart = snapshots[snapshots.length - 1]?.date ?? null;

  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    if (snapshots[index].position !== currentPosition) {
      break;
    }
    streakStart = snapshots[index].date;
  }

  if (!streakStart) {
    return null;
  }

  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(streakStart).getTime()) / (24 * 60 * 60 * 1000)) + 1,
  );

  return {
    position: currentPosition,
    days,
  };
}

function ensureTableRow(table, id, name) {
  if (!table.has(id)) {
    table.set(id, {
      id,
      name,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  return table.get(id);
}

function compareTableRows(left, right) {
  const goalDifferenceLeft = left.goalsFor - left.goalsAgainst;
  const goalDifferenceRight = right.goalsFor - right.goalsAgainst;

  if (right.points !== left.points) return right.points - left.points;
  if (goalDifferenceRight !== goalDifferenceLeft) return goalDifferenceRight - goalDifferenceLeft;
  if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
  return left.name.localeCompare(right.name);
}

function buildKnockoutTies(matches, stage) {
  const roundMatches = matches
    .filter((match) => match.competition?.code === "CL" && match.stage === stage)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const ties = new Map();

  roundMatches.forEach((match) => {
    const pairKey = [match.homeTeam.name, match.awayTeam.name]
      .map((name) => simplifyName(name))
      .sort((left, right) => left.localeCompare(right))
      .join("::");

    if (!ties.has(pairKey)) {
      ties.set(pairKey, []);
    }

    ties.get(pairKey).push(match);
  });

  return [...ties.values()].map((tieMatches) => {
    const orderedMatches = [...tieMatches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    const firstMatch = orderedMatches[0];
    const aggregate = orderedMatches.reduce(
      (totals, match) => {
        const homeName = simplifyName(match.homeTeam.name);
        const awayName = simplifyName(match.awayTeam.name);
        totals[homeName] = (totals[homeName] ?? 0) + (match.score.fullTime.home ?? 0);
        totals[awayName] = (totals[awayName] ?? 0) + (match.score.fullTime.away ?? 0);
        return totals;
      },
      {},
    );

    return {
      id: orderedMatches.map((match) => match.id).join("-"),
      homeTeam: firstMatch.homeTeam,
      awayTeam: firstMatch.awayTeam,
      status: orderedMatches.some((match) => match.status !== "FINISHED")
        ? orderedMatches.find((match) => match.status !== "FINISHED")?.status ?? firstMatch.status
        : "FINISHED",
      aggregate: `${aggregate[simplifyName(firstMatch.homeTeam.name)] ?? 0}-${aggregate[simplifyName(firstMatch.awayTeam.name)] ?? 0}`,
      legsPlayed: orderedMatches.filter((match) => match.status === "FINISHED").length,
      nextDate:
        orderedMatches.find((match) => match.status !== "FINISHED")?.utcDate ??
        orderedMatches[orderedMatches.length - 1]?.utcDate,
    };
  });
}

function buildRoundOf16Ties(matches) {
  return buildKnockoutTies(matches, "LAST_16");
}

function buildStageTeamList(matches, stage) {
  const roundMatches = matches.filter(
    (match) => match.competition?.code === "CL" && match.stage === stage,
  );
  const teams = new Map();

  roundMatches.forEach((match) => {
    const candidateTeams = [match.homeTeam, match.awayTeam];

    candidateTeams.forEach((team) => {
      if (!team?.id || !team?.name) {
        return;
      }

      teams.set(String(team.id), {
        team: {
          id: String(team.id),
          name: team.name,
          shortName: team.shortName || team.name,
        },
      });
    });
  });

  return [...teams.values()];
}

function buildRoundOf16TeamList(matches) {
  return buildStageTeamList(matches, "LAST_16");
}

function resolveActiveChampionsLeagueStage(matches) {
  const championsLeagueMatches = matches.filter((match) => match.competition?.code === "CL");
  const stagePriority = [
    "FINAL",
    "SEMI_FINALS",
    "QUARTER_FINALS",
    "LAST_16",
    "PLAYOFFS",
    "LEAGUE_STAGE",
  ];

  const stageHasResolvedTeams = (stage) =>
    championsLeagueMatches.some(
      (match) =>
        match.stage === stage &&
        match.homeTeam?.id &&
        match.homeTeam?.name &&
        match.awayTeam?.id &&
        match.awayTeam?.name,
    );

  const activeStage =
    stagePriority.find((stage) =>
      championsLeagueMatches.some(
        (match) =>
          match.stage === stage &&
          !["FINISHED", "CANCELLED"].includes(match.status) &&
          match.homeTeam?.id &&
          match.homeTeam?.name &&
          match.awayTeam?.id &&
          match.awayTeam?.name,
      ),
    ) ??
    stagePriority.find((stage) => stageHasResolvedTeams(stage)) ??
    null;

  return activeStage;
}

function buildActiveChampionsLeagueTeams(matches, standings) {
  const activeStage = resolveActiveChampionsLeagueStage(matches);
  const stageTeams = activeStage ? buildStageTeamList(matches, activeStage) : [];
  const source = stageTeams.length > 0 ? stageTeams : standings;

  return source.filter(
    (entry) =>
      entry?.team?.name &&
      !championsLeagueExcludedTeams.has(
        simplifyName(entry.team.shortName || entry.team.name),
      ),
  );
}

function buildActiveChampionsLeagueTeamKeys(matches, standings) {
  const activeStage = resolveActiveChampionsLeagueStage(matches);

  const keys = new Set();

  if (activeStage) {
    matches
      .filter((match) => match.competition?.code === "CL")
      .filter((match) => match.stage === activeStage)
      .forEach((match) => {
        [match.homeTeam?.name, match.homeTeam?.shortName, match.awayTeam?.name, match.awayTeam?.shortName]
          .filter(Boolean)
          .forEach((name) => {
            keys.add(normalizeTeamKey(name));
            keys.add(normalizeTeamKey(simplifyName(name)));
          });
      });
  }

  if (keys.size === 0) {
    standings.forEach((entry) => {
      [entry.team.name, entry.team.shortName, simplifyName(entry.team.name), simplifyName(entry.team.shortName || "")]
        .filter(Boolean)
        .forEach((name) => keys.add(normalizeTeamKey(name)));
    });
  }

  return keys;
}

function buildTitleRaceSeries(standings, matches) {
  const topTeams = standings.slice(0, 4);

  if (topTeams.length === 0 || matches.length === 0) {
    return [];
  }

  const trackedTeams = new Map(
    topTeams.map((entry) => [
      entry.team.id,
      {
        id: entry.team.id,
        name: simplifyName(entry.team.shortName || entry.team.name),
        finalPoints: entry.points,
        points: 0,
        pointsByMatchday: [],
      },
    ]),
  );

  const finishedMatches = matches
    .filter(
      (match) =>
        match.status === "FINISHED" &&
        typeof match.score?.fullTime?.home === "number" &&
        typeof match.score?.fullTime?.away === "number" &&
        (trackedTeams.has(match.homeTeam.id) || trackedTeams.has(match.awayTeam.id)),
    )
    .sort((a, b) => {
      const matchdayDiff = (a.matchday ?? 0) - (b.matchday ?? 0);
      if (matchdayDiff !== 0) return matchdayDiff;
      return new Date(a.utcDate) - new Date(b.utcDate);
    });

  finishedMatches.forEach((match) => {
    const home = trackedTeams.get(match.homeTeam.id) ?? null;
    const away = trackedTeams.get(match.awayTeam.id) ?? null;
    const homeGoals = match.score.fullTime.home ?? 0;
    const awayGoals = match.score.fullTime.away ?? 0;

    if (home && away) {
      if (homeGoals > awayGoals) {
        home.points += 3;
      } else if (homeGoals < awayGoals) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    } else if (home) {
      if (homeGoals > awayGoals) {
        home.points += 3;
      } else if (homeGoals === awayGoals) {
        home.points += 1;
      }
    } else if (away) {
      if (awayGoals > homeGoals) {
        away.points += 3;
      } else if (awayGoals === homeGoals) {
        away.points += 1;
      }
    }

    if (home) {
      home.pointsByMatchday.push({
        matchday: match.matchday ?? home.pointsByMatchday.length + 1,
        points: home.points,
      });
    }

    if (away) {
      away.pointsByMatchday.push({
        matchday: match.matchday ?? away.pointsByMatchday.length + 1,
        points: away.points,
      });
    }
  });

  return [...trackedTeams.values()]
    .map((team) => ({
      ...team,
      pointsByMatchday: collapseLatestMatchdayPoints(team.pointsByMatchday),
    }))
    .filter((team) => team.pointsByMatchday.length > 0);
}

function collapseLatestMatchdayPoints(pointsByMatchday) {
  const latestByMatchday = new Map();
  pointsByMatchday.forEach((point) => {
    latestByMatchday.set(point.matchday, point);
  });
  return [...latestByMatchday.values()].sort((a, b) => a.matchday - b.matchday);
}

function countCleanSheets(matches, selectedTeam, competitionCode) {
  if (!selectedTeam) {
    return "NA";
  }

  return matches.filter((match) => {
    if (match.competition?.code !== competitionCode || match.status !== "FINISHED") {
      return false;
    }

    const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
    const goalsAgainst = isHome
      ? match.score.fullTime.away ?? 0
      : match.score.fullTime.home ?? 0;

    return goalsAgainst === 0;
  }).length;
}

function calculateCleanSheetRate(matches, selectedTeam, competitionCode) {
  if (!selectedTeam) {
    return "NA";
  }

  const finishedMatches = matches.filter(
    (match) => match.competition?.code === competitionCode && match.status === "FINISHED",
  );

  if (finishedMatches.length === 0) {
    return "NA";
  }

  const cleanSheets = finishedMatches.filter((match) => {
    const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
    const opponentGoals = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;
    return opponentGoals === 0;
  }).length;

  return `${((cleanSheets / finishedMatches.length) * 100).toFixed(0)}%`;
}

function calculateAverageGoals(standing) {
  if (!standing?.playedGames) {
    return "NA";
  }

  return (standing.goalsFor / standing.playedGames).toFixed(2);
}

function calculateAverageGoalsConceded(standing) {
  if (!standing?.playedGames) {
    return "NA";
  }

  return (standing.goalsAgainst / standing.playedGames).toFixed(2);
}

function buildFormMomentum(matches, selectedTeam) {
  if (!selectedTeam || matches.length < 2) {
    return { label: "Steady", score: "NA", tone: "neutral", summary: "Need more recent matches" };
  }

  const trendPoints = buildTrendPoints(matches, selectedTeam);
  const lastTwo = trendPoints.slice(-2).map((item) => item.result);

  if (lastTwo.every((result) => result === "W")) {
    return { label: "↑ Rising", score: "WW", tone: "up", summary: "Back-to-back wins" };
  }

  if (lastTwo.every((result) => result === "D")) {
    return { label: "→ Steady", score: "DD", tone: "neutral", summary: "Back-to-back draws" };
  }

  if (lastTwo.every((result) => result === "L")) {
    return { label: "↓ Downward", score: "LL", tone: "down", summary: "Back-to-back losses" };
  }

  return { label: "→ Steady", score: lastTwo.join(""), tone: "neutral", summary: "Mixed recent form" };
}

function badgeClass(result) {
  if (result === "W") return "accent-badge-positive ring-1 ring-emerald-300/18";
  if (result === "L") return "accent-badge-negative ring-1 ring-rose-300/18";
  return "accent-badge-caution ring-1 ring-amber-200/18";
}

function trendBarClass(result) {
  if (result === "W") return "bg-emerald-400/80";
  if (result === "L") return "bg-rose-400/80";
  return "bg-amber-300/80";
}

function MatchList({ matches, selectedTeam, crestMap, standings = [], allMatches = [], competitionCode = "PL", upcoming = false }) {
  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
        const isLiveMatch = ["IN_PLAY", "PAUSED", "LIVE"].includes(match.status);
        const matchCompetitionCode = match.competition?.code ?? competitionCode;
        const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
        const opponentScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;
        const homeLogo = crestMap.get(match.homeTeam.id) ?? crestMap.get(match.homeTeam.name);
        const awayLogo = crestMap.get(match.awayTeam.id) ?? crestMap.get(match.awayTeam.name);
        const previousMeeting =
          upcoming && matchCompetitionCode === "CL"
            ? findLastLeg(match, allMatches, selectedTeam)
            : upcoming
              ? findLastMeeting(match, allMatches, selectedTeam)
              : "";
        const probability = upcoming ? estimateOutcomeProbabilities(match, selectedTeam, standings) : null;

        return (
          <article key={match.id} className="match-card rounded-[20px] border border-white/8 bg-slate-950/35 p-3">
            <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                {upcoming && match.competition?.name ? (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1">
                      {match.competition.name}
                    </span>
                    {match.stage ? (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1">
                        {formatChampionsLeagueStage(match.stage)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)] xl:items-center">
                  <ClubSide name={simplifyName(match.homeTeam.name)} logoUrl={homeLogo} sideLabel="Home" />
                  <div className="hidden text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 xl:block">vs</div>
                  <ClubSide name={simplifyName(match.awayTeam.name)} logoUrl={awayLogo} sideLabel="Away" right />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-medium text-slate-400">
                  <span className="rounded-full bg-white/[0.06] px-3 py-1.5">{formatKickoff(match.utcDate)}</span>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1.5">
                    Stadium: {match.venue ?? (isHome ? selectedTeam.stadium : simplifyName(match.homeTeam.name))}
                  </span>
                  {previousMeeting ? (
                    <span className="rounded-full bg-white/[0.06] px-3 py-1.5">
                      {matchCompetitionCode === "CL" ? "Last leg" : "Last meeting"}: {previousMeeting}
                    </span>
                  ) : null}
                </div>
              </div>
              {upcoming ? (
                <div className="w-full md:mx-auto md:max-w-[220px] xl:mx-0 xl:w-[220px] xl:max-w-[220px] px-0.5 py-0.5">
                  <p
                    className={`text-[8px] font-semibold uppercase tracking-[0.22em] ${
                      isLiveMatch ? "text-rose-200" : "text-slate-400"
                    }`}
                  >
                    {isLiveMatch ? "Live" : formatStatus(match.status)}
                  </p>
                  <div className="mt-1 grid grid-cols-3 gap-1.5">
                    <div className="min-w-0 text-left">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">Win</p>
                      <p className="text-[10px] font-semibold leading-tight text-slate-100 break-words">{selectedTeam.name}</p>
                      <p className="text-[18px] font-semibold leading-none text-rose-100">{probability.win}%</p>
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">Draw</p>
                      <p className="text-[10px] font-semibold text-slate-100">Draw</p>
                      <p className="text-[18px] font-semibold leading-none text-slate-200">{probability.draw}%</p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">Loss</p>
                      <p className="text-[10px] font-semibold leading-tight text-white break-words">
                        {simplifyName(isHome ? match.awayTeam.name : match.homeTeam.name)}
                      </p>
                      <p className="text-[18px] font-semibold leading-none text-sky-100">{probability.loss}%</p>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-white/6">
                    <div className="flex h-full w-full">
                      <div className="bg-[#f2b7bc]" style={{ width: `${probability.win}%` }} />
                      <div className="bg-[#c7d0dc]" style={{ width: `${probability.draw}%` }} />
                      <div className="bg-[#b7bdf0]" style={{ width: `${probability.loss}%` }} />
                    </div>
                  </div>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-slate-500">Outcome probability</p>
                </div>
              ) : (
                <div className="w-full sm:w-auto sm:min-w-[120px] rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-left xl:text-right">
                  <p className="text-3xl font-semibold text-white">{teamScore}-{opponentScore}</p>
                  <p className={`mt-1 text-xs font-bold uppercase tracking-[0.22em] ${teamScore > opponentScore ? "text-emerald-300" : teamScore < opponentScore ? "text-rose-300" : "text-amber-200"}`}>
                    {teamScore > opponentScore ? "Win" : teamScore < opponentScore ? "Loss" : "Draw"}
                  </p>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ClubSide({ name, logoUrl, sideLabel, right = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${right ? "lg:justify-self-end lg:text-right" : ""}`}>
      {!right ? <ClubLogo name={name} logoUrl={logoUrl} size="sm" /> : null}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-white break-words sm:text-sm">{name}</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">{sideLabel}</p>
      </div>
      {right ? <ClubLogo name={name} logoUrl={logoUrl} size="sm" /> : null}
    </div>
  );
}

function FormTrendChart({ matches, selectedTeam }) {
  const trendPoints = buildTrendPoints(matches, selectedTeam);
  const maxPoints = Math.max(...trendPoints.map((item) => item.points), 3);

  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/35 p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Last five points
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Oldest result to newest result.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-3">
        {trendPoints.map((item) => (
          <div key={item.id} className="flex flex-col items-center">
            <div className="flex h-32 w-full items-end justify-center rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06))] px-3 pb-3">
              <div
                className={`w-full rounded-[14px] ${trendBarClass(item.result)}`}
                style={{ height: `${Math.max((item.points / maxPoints) * 100, 18)}%` }}
                title={`${item.opponent} • ${item.scoreline} • ${item.points} point${item.points === 1 ? "" : "s"}`}
              />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white">{item.result}</p>
            <p className="mt-1 text-[11px] text-slate-400">{item.scoreline}</p>
            <p className="mt-1 max-w-full truncate text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineFormTrendChart({
  matches,
  allMatches,
  selectedTeam,
  competitionCode,
}) {
  const trendPoints = buildTrendPoints(matches, selectedTeam);
  const goalTrendPoints = buildGoalTrendPoints(matches, selectedTeam);
  const scoringConsistencyPoints = buildScoringConsistencyPoints(matches, selectedTeam);
  const venueForm = buildVenueForm(allMatches, selectedTeam, competitionCode);
  const seasonFiveWinStreaks = countSeasonFiveWinStreaks(allMatches, selectedTeam, competitionCode);
  const cleanSheetRate = calculateCleanSheetRate(allMatches, selectedTeam, competitionCode);
  const resultDistribution = buildResultDistribution(allMatches, selectedTeam, competitionCode);
  const chartWidth = 520;
  const chartHeight = 120;
  const points = trendPoints.map((item, index) => {
    const x = ((index + 0.5) / Math.max(trendPoints.length, 1)) * chartWidth;
    const y = chartHeight - 10 - (item.points / 3) * (chartHeight - 20);
    return { ...item, x, y };
  });
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/35 p-5">
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06))] p-4">
          <p className="mb-3 text-sm text-slate-400">
            Last 5 match results / Points accumulated
          </p>
          <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
            <div className="flex h-40 flex-col justify-between py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>
            <div>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-40 w-full overflow-visible"
                preserveAspectRatio="none"
              >
                {[0, 1, 2, 3].map((value) => {
                  const y = chartHeight - 10 - (value / 3) * (chartHeight - 20);
                  return (
                    <line
                      key={value}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="rgba(148,163,184,0.18)"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                    />
                  );
                })}
                <path
                  d={pathData}
                  fill="none"
                  stroke="rgba(34,211,238,0.95)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((point) => (
                  <g key={point.id}>
                    <circle cx={point.x} cy={point.y} r="3.2" fill="rgba(8,145,178,1)" />
                    <circle cx={point.x} cy={point.y} r="1.4" fill="rgba(240,249,255,1)" />
                  </g>
                ))}
              </svg>

            <div className="mt-4 grid grid-cols-5 gap-3">
              {points.map((point) => (
                <div key={point.id} className="min-w-0 text-center">
                    <p
                      className={`text-xs font-bold uppercase tracking-[0.18em] ${
                        point.result === "W"
                          ? "text-emerald-300"
                          : point.result === "L"
                            ? "text-rose-300"
                            : "text-amber-200"
                      }`}
                    >
                      {point.result}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{point.scoreline}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-500">{point.opponent}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                      {point.label}
                    </p>
                </div>
              ))}
            </div>

          <p className="accent-analysis mt-4 text-left text-sm font-semibold">
            {trendPoints.reduce((sum, item) => sum + item.points, 0)} pts
          </p>
          </div>
        </div>
        </div>

        <ResultDistributionDonut distribution={resultDistribution} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GoalsTrendChart points={goalTrendPoints} />
        <ScoringConsistencyChart points={scoringConsistencyPoints} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <VenueFormBar
          label="Home form"
          points={venueForm.home.points}
          played={venueForm.home.played}
          colorClass="bg-emerald-300"
        />
        <VenueFormBar
          label="Away form"
          points={venueForm.away.points}
          played={venueForm.away.played}
          colorClass="bg-cyan-300"
        />
        <StatMiniCard
          label="5-win streak"
          value={seasonFiveWinStreaks}
          note="this season"
          colorClass="bg-amber-300"
          width={Math.max(Math.min(seasonFiveWinStreaks * 24, 100), seasonFiveWinStreaks > 0 ? 20 : 0)}
        />
        <StatMiniCard
          label="Clean sheet rate"
          value={cleanSheetRate}
          note="per match"
          colorClass="bg-sky-300"
          width={cleanSheetRate === "NA" ? 0 : parseFloat(cleanSheetRate)}
        />
      </div>
    </div>
  );
}

function GoalsTrendChart({ points }) {
  const chartWidth = 520;
  const chartHeight = 120;
  const maxGoals = Math.max(
    1,
    ...points.flatMap((point) => [point.goalsFor, point.goalsAgainst]),
  );
  const scaledPoints = points.map((item, index) => {
    const x = ((index + 0.5) / Math.max(points.length, 1)) * chartWidth;
    const forY = chartHeight - 10 - (item.goalsFor / maxGoals) * (chartHeight - 20);
    const againstY = chartHeight - 10 - (item.goalsAgainst / maxGoals) * (chartHeight - 20);

    return {
      ...item,
      x,
      forY,
      againstY,
    };
  });
  const scoredPath = scaledPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.forY}`)
    .join(" ");
  const concededPath = scaledPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.againstY}`)
    .join(" ");

  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06))] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Goals trend
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Scored vs conceded over the last 5 matches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            Scored
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            Conceded
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <div className="flex h-40 flex-col justify-between py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {Array.from({ length: maxGoals + 1 }, (_, index) => maxGoals - index).map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <div>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-40 w-full overflow-visible"
            preserveAspectRatio="none"
          >
            {Array.from({ length: maxGoals + 1 }, (_, index) => index).map((value) => {
              const y = chartHeight - 10 - (value / maxGoals) * (chartHeight - 20);
              return (
                <line
                  key={value}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
              );
            })}
            <path
              d={scoredPath}
              fill="none"
              stroke="rgba(110,231,183,0.95)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={concededPath}
              fill="none"
              stroke="rgba(253,164,175,0.95)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {scaledPoints.map((point) => (
              <g key={`${point.id}-goals`}>
                <circle cx={point.x} cy={point.forY} r="3.2" fill="rgba(16,185,129,1)" />
                <circle cx={point.x} cy={point.forY} r="1.4" fill="rgba(240,253,244,1)" />
                <circle cx={point.x} cy={point.againstY} r="3.2" fill="rgba(244,63,94,1)" />
                <circle cx={point.x} cy={point.againstY} r="1.4" fill="rgba(255,241,242,1)" />
              </g>
            ))}
          </svg>

          <div className="mt-4 grid grid-cols-5 gap-3">
            {scaledPoints.map((point) => (
              <div key={point.id} className="min-w-0 text-center">
                <p className="text-xs font-bold text-emerald-300">{point.goalsFor}</p>
                <p className="mt-1 text-xs font-bold text-rose-300">{point.goalsAgainst}</p>
                <p className="mt-1 truncate text-[10px] text-slate-500">{point.opponent}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                  {point.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoringConsistencyChart({ points }) {
  const chartWidth = 520;
  const chartHeight = 120;
  const maxStreak = Math.max(1, ...points.map((point) => point.streak));
  const scaledPoints = points.map((item, index) => {
    const x = ((index + 0.5) / Math.max(points.length, 1)) * chartWidth;
    const y = chartHeight - 10 - (item.streak / maxStreak) * (chartHeight - 20);

    return {
      ...item,
      x,
      y,
    };
  });
  const streakPath = scaledPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06))] p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Scoring consistency
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Consecutive matches with at least one goal scored.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <div className="flex h-40 flex-col justify-between py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {Array.from({ length: maxStreak + 1 }, (_, index) => maxStreak - index).map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <div>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-40 w-full overflow-visible"
            preserveAspectRatio="none"
          >
            {Array.from({ length: maxStreak + 1 }, (_, index) => index).map((value) => {
              const y = chartHeight - 10 - (value / maxStreak) * (chartHeight - 20);
              return (
                <line
                  key={value}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
              );
            })}
            <path
              d={streakPath}
              fill="none"
              stroke="rgba(250,204,21,0.95)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {scaledPoints.map((point) => (
              <g key={`${point.id}-streak`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3.2"
                  fill={point.scored ? "rgba(250,204,21,1)" : "rgba(148,163,184,1)"}
                />
                <circle cx={point.x} cy={point.y} r="1.4" fill="rgba(255,251,235,1)" />
              </g>
            ))}
          </svg>

          <div className="mt-4 grid grid-cols-5 gap-3">
            {scaledPoints.map((point) => (
              <div key={point.id} className="min-w-0 text-center">
                <p
                  className={`text-xs font-bold ${
                    point.scored ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  {point.streak}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {point.scored ? `${point.goalsFor} goal${point.goalsFor === 1 ? "" : "s"}` : "No goal"}
                </p>
                <p className="mt-1 truncate text-[10px] text-slate-500">{point.opponent}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                  {point.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function findLastLeg(match, allMatches, selectedTeam) {
  const opponent = match.homeTeam.name === selectedTeam.apiTeamName ? match.awayTeam.name : match.homeTeam.name;
  const previous = allMatches
    .filter((item) => item.id !== match.id && item.competition?.code === "CL" && item.status === "FINISHED" && [item.homeTeam.name, item.awayTeam.name].includes(selectedTeam.apiTeamName) && [item.homeTeam.name, item.awayTeam.name].includes(opponent))
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
  if (!previous) return "";
  const isHome = previous.homeTeam.name === selectedTeam.apiTeamName;
  const score = isHome ? `${previous.score.fullTime.home}-${previous.score.fullTime.away}` : `${previous.score.fullTime.away}-${previous.score.fullTime.home}`;
  return `${simplifyName(selectedTeam.name)} ${score} ${simplifyName(opponent)}`;
}

function findLastMeeting(match, allMatches, selectedTeam) {
  const opponent =
    match.homeTeam.name === selectedTeam.apiTeamName ? match.awayTeam.name : match.homeTeam.name;
  const previous = allMatches
    .filter(
      (item) =>
        item.id !== match.id &&
        item.status === "FINISHED" &&
        [item.homeTeam.name, item.awayTeam.name].includes(selectedTeam.apiTeamName) &&
        [item.homeTeam.name, item.awayTeam.name].includes(opponent),
    )
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];

  if (!previous) {
    return "";
  }

  const isHome = previous.homeTeam.name === selectedTeam.apiTeamName;
  const score = isHome
    ? `${previous.score.fullTime.home}-${previous.score.fullTime.away}`
    : `${previous.score.fullTime.away}-${previous.score.fullTime.home}`;

  return `${simplifyName(selectedTeam.name)} ${score} ${simplifyName(opponent)}`;
}

function estimateOutcomeProbabilities(match, selectedTeam, standings) {
  const teamStanding = standings.find((entry) => entry.team.name === selectedTeam.apiTeamName);
  const opponentStanding = standings.find((entry) =>
    [match.homeTeam.name, match.awayTeam.name].includes(entry.team.name) && entry.team.name !== selectedTeam.apiTeamName,
  );
  if (!teamStanding || !opponentStanding) {
    return { win: 40, draw: 28, loss: 32 };
  }

  const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
  const strengthDelta =
    strengthScore(teamStanding) -
    strengthScore(opponentStanding) +
    formScore(teamStanding.form) -
    formScore(opponentStanding.form) +
    (isHome ? 0.28 : -0.16);

  const winWeight = Math.exp(strengthDelta * 0.95);
  const lossWeight = Math.exp(-strengthDelta * 0.95);
  const drawBase = Math.max(0.55, 1.18 - Math.abs(strengthDelta) * 0.45);
  const totalWeight = winWeight + drawBase + lossWeight;

  const rawWin = (winWeight / totalWeight) * 100;
  const rawDraw = (drawBase / totalWeight) * 100;
  const rawLoss = (lossWeight / totalWeight) * 100;

  const win = Math.round(rawWin);
  const draw = Math.round(rawDraw);
  const loss = Math.max(0, 100 - win - draw);

  return rebalanceProbabilities({ win, draw, loss });
}

function strengthScore(standing) {
  const played = Math.max(standing.playedGames || 1, 1);
  const pointsPerGame = standing.points / played;
  const goalDifferencePerGame = standing.goalDifference / played;
  const tablePositionBoost = (21 - standing.position) * 0.12;

  return pointsPerGame * 1.45 + goalDifferencePerGame * 0.55 + tablePositionBoost;
}

function formScore(form) {
  const recentResults = (form ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (recentResults.length === 0) {
    return 0;
  }

  const total = recentResults.reduce((sum, result) => {
    if (result === "W") return sum + 1;
    if (result === "D") return sum + 0.35;
    return sum - 0.55;
  }, 0);

  return total / recentResults.length;
}

function rebalanceProbabilities(probabilities) {
  const entries = Object.entries(probabilities);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total === 100) {
    return probabilities;
  }

  const [largestKey] = entries.reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
    entries[0],
  );

  return {
    ...probabilities,
    [largestKey]: Math.max(0, probabilities[largestKey] + (100 - total)),
  };
}

function simplifyName(name) {
  return (name || "")
    .replace(/^AFC\s+/u, "")
    .replace(/\sFC$/u, "")
    .replace(/\sAFC$/u, "");
}

function normalizeTeamKey(name) {
  return simplifyName(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "");
}

function resolveCrestUrl(crestMap, teamName) {
  if (!crestMap || !teamName) {
    return null;
  }

  const aliasMap = {
    Barcelona: ["FC Barcelona"],
    "Real Madrid": ["Real Madrid CF"],
    Napoli: ["SSC Napoli"],
    "Inter Milan": ["Internazionale", "FC Internazionale Milano", "Inter"],
    "Bayern Munich": ["FC Bayern München", "FC Bayern Munich", "Bayern Munchen"],
    "Bayer Leverkusen": ["Bayer 04 Leverkusen"],
    "Manchester City": ["Manchester City FC"],
    "Liverpool": ["Liverpool FC"],
    Southampton: ["Southampton FC", "South Hampton"],
    "Port Vale": ["Port Vale FC"],
    Chelsea: ["Chelsea FC"],
    "West Ham": ["West Ham United", "West Ham United FC"],
    "Leeds United": ["Leeds United FC", "Leeds"],
  };

  const candidates = [
    teamName,
    simplifyName(teamName),
    normalizeTeamKey(teamName),
    `FC ${teamName}`,
    `${teamName} FC`,
    `${teamName} CF`,
    normalizeTeamKey(`FC ${teamName}`),
    normalizeTeamKey(`${teamName} FC`),
    normalizeTeamKey(`${teamName} CF`),
    ...(aliasMap[teamName] ?? []),
    ...(aliasMap[teamName] ?? []).map((alias) => simplifyName(alias)),
    ...(aliasMap[teamName] ?? []).map((alias) => normalizeTeamKey(alias)),
  ];

  for (const candidate of candidates) {
    const logo = crestMap.get(candidate);
    if (logo) {
      return logo;
    }
  }

  return null;
}

function extractCity(address) {
  if (!address) return "";
  return address.split(",").map((part) => part.trim()).filter(Boolean).at(-2) ?? "";
}

function formatKickoff(utcDate) {
  if (!utcDate) {
    return "TBC";
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(utcDate));
}

function buildYouTubeHighlightUrl(match) {
  const competitionName = match?.competition?.name ?? "football";
  const home = simplifyName(match?.homeTeam?.name ?? "Home");
  const away = simplifyName(match?.awayTeam?.name ?? "Away");
  const query = `${competitionName} ${home} vs ${away} highlights`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function formatUpdatedAt(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes === 1) {
    return "1 min ago";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) {
    return "1 hour ago";
  }

  return `${diffHours} hours ago`;
}

function formatStatus(status) {
  if (status === "TIMED" || status === "SCHEDULED") return "Scheduled";
  if (status === "POSTPONED") return "Postponed";
  return status;
}

function formatLiveMatchTime(match) {
  if (!["IN_PLAY", "PAUSED", "LIVE"].includes(match?.status)) {
    return "";
  }

  if (match.status === "PAUSED") {
    return "HT";
  }

  const kickoffTime = new Date(match.utcDate).getTime();
  const currentTime = Date.now();

  if (Number.isNaN(kickoffTime) || currentTime <= kickoffTime) {
    return "Live";
  }

  const rawElapsed = Math.floor((currentTime - kickoffTime) / 60000);

  if (rawElapsed <= 45) {
    return `${rawElapsed}'`;
  }

  // Approximate the halftime break since the API does not expose a live minute field.
  if (rawElapsed <= 60) {
    return "HT";
  }

  const secondHalfMinute = rawElapsed - 15;

  if (secondHalfMinute >= 90) {
    return "90+'";
  }

  return `${secondHalfMinute}'`;
}

function ClubLogo({ name, logoUrl, size = "md" }) {
  const sizes = {
    xs: "h-9 w-9 rounded-xl p-1.5",
    sm: "h-12 w-12 rounded-2xl p-2.5",
    hero: "h-20 w-20 rounded-[26px] p-4 sm:h-24 sm:w-24",
    md: "h-14 w-14 rounded-2xl p-3",
    table: "h-11 w-11 rounded-2xl p-2",
    "table-mobile": "h-8 w-8 rounded-xl p-1.5 sm:h-11 sm:w-11 sm:rounded-2xl sm:p-2",
  };
  const label = name.split(" ").slice(0, 3).map((part) => part[0]).join("").toUpperCase();
  return logoUrl ? (
    <div className={`flex items-center justify-center border border-white/10 bg-white/[0.08] ${sizes[size]}`}>
      <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain" />
    </div>
  ) : (
    <div className={`flex items-center justify-center border border-white/10 bg-[linear-gradient(145deg,#0f2740,#102f52)] text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 ${sizes[size]}`}>
      {label}
    </div>
  );
}

function TeamBackdrop({ name, logoUrl }) {
  if (!logoUrl) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.1),transparent_24%)]" />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/7 blur-3xl"
        style={{ width: "clamp(260px, 34vw, 420px)", height: "clamp(260px, 34vw, 420px)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/6 blur-3xl"
        style={{ width: "clamp(320px, 42vw, 520px)", height: "clamp(320px, 42vw, 520px)" }}
      />
      <img
        src={logoUrl}
        alt={`${name} background crest`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.065] blur-[1px] select-none"
        style={{ width: "clamp(260px, 54vw, 620px)", height: "clamp(260px, 54vw, 620px)" }}
      />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card flex h-full min-h-[118px] flex-col justify-between rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.028))] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-4 text-lg font-semibold leading-snug text-slate-100">{value}</p>
    </div>
  );
}

function MomentumMetric({ momentum, compact = false }) {
  const toneClass =
    momentum.tone === "up"
      ? "accent-positive"
      : momentum.tone === "down"
        ? "accent-negative"
        : "accent-caution";

  return (
    <div className={`momentum-card flex h-full flex-col justify-between rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] ${compact ? "min-h-[96px] p-3.5" : "min-h-[118px] p-4"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Form momentum</p>
      <p className={`font-semibold ${toneClass} ${compact ? "mt-2 text-base" : "mt-3 text-lg"}`}>{momentum.label}</p>
      <p className={`text-[11px] uppercase tracking-[0.16em] text-slate-500 ${compact ? "mt-1.5" : "mt-2"}`}>{momentum.summary}</p>
    </div>
  );
}

function VenueFormBar({ label, points, played, colorClass }) {
  const maxPoints = Math.max(played * 3, 1);
  const width = Math.max((points / maxPoints) * 100, played > 0 ? 12 : 0);

  return (
    <div className="mini-stat-card rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <p className="font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="font-medium text-slate-300">
          {points} pts / {played || 0}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, note, colorClass, width }) {
  return (
    <div className="mini-stat-card rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <p className="font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="font-medium text-slate-300">{value}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-300">{note}</p>
    </div>
  );
}

function ResultDistributionDonut({ distribution }) {
  const total = Math.max(distribution.total, 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const winLength = (distribution.wins / total) * circumference;
  const drawLength = (distribution.draws / total) * circumference;
  const lossLength = Math.max(circumference - winLength - drawLength, 0);

  return (
    <div className="donut-card rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Win / Draw / Loss distribution
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {distribution.total} played
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#86efac"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${winLength} ${circumference}`}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#fde68a"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${drawLength} ${circumference}`}
              strokeDashoffset={-winLength}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#fda4af"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${lossLength} ${circumference}`}
              strokeDashoffset={-(winLength + drawLength)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold text-white">{distribution.total}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">matches</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-2.5 py-2 text-center">
          <p className="font-semibold uppercase tracking-[0.14em] text-emerald-300">Win</p>
          <p className="mt-1 text-base font-semibold text-white">{distribution.wins}</p>
        </div>
        <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-2.5 py-2 text-center">
          <p className="font-semibold uppercase tracking-[0.14em] text-amber-200">Draw</p>
          <p className="mt-1 text-base font-semibold text-white">{distribution.draws}</p>
        </div>
        <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-2.5 py-2 text-center">
          <p className="font-semibold uppercase tracking-[0.14em] text-rose-300">Loss</p>
          <p className="mt-1 text-base font-semibold text-white">{distribution.losses}</p>
        </div>
      </div>
    </div>
  );
}

function PremierLeagueTrophyArt() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-amber-300/12 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),rgba(15,23,42,0.14)_58%)]">
      <svg
        viewBox="0 0 64 64"
        className="h-9 w-9"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pl-trophy-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path
          d="M24 10h16v5l4 4v10c0 7.6-4.6 14.4-11.7 17.4L32 47l-.3-.1C24.6 43.9 20 37.1 20 29V19l4-4z"
          fill="url(#pl-trophy-fill)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M20 19h-6c0 8.1 3.5 13.4 9 15.6"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M44 19h6c0 8.1-3.5 13.4-9 15.6"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M26 50h12"
          stroke="#fcd34d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M24 55h16"
          stroke="#f59e0b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="26" cy="14" r="2" fill="#fef3c7" />
        <circle cx="38" cy="14" r="2" fill="#fef3c7" />
      </svg>
    </div>
  );
}



function LeagueTable({ standings, selectedTeamId, onSelectTeam, activeChampionsLeagueTeamKeys }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,26,0.86),rgba(7,12,20,0.72))]">
      <div className="overflow-x-auto">
        <div className="min-w-[300px] sm:min-w-[360px]">
          <div className="grid grid-cols-[28px_minmax(0,1fr)_42px_42px] items-center gap-2 border-b border-white/8 px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[44px_minmax(0,1fr)_56px_56px] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.22em]">
            <span className="text-center">Pos</span>
            <span>Club</span>
            <span className="text-center">MP</span>
            <span className="text-center">Pts</span>
          </div>
          <div className="divide-y divide-white/6">
            {standings.map((entry, index) => {
              const isSelected = String(entry.team.id) === String(selectedTeamId);
              const isLeader = index === 0;
              const teamName = simplifyName(entry.team.shortName || entry.team.name);
              const isInChampionsLeague = activeChampionsLeagueTeamKeys.has(
                normalizeTeamKey(teamName),
              );

              return (
                <button
                  key={entry.team.id}
                  type="button"
                  onClick={() => onSelectTeam(String(entry.team.id))}
                  className={`group relative grid w-full grid-cols-[28px_minmax(0,1fr)_42px_42px] items-center gap-2 px-3 py-3 text-left transition sm:grid-cols-[44px_minmax(0,1fr)_56px_56px] sm:gap-3 sm:px-4 ${
                    isSelected
                      ? "bg-[linear-gradient(90deg,rgba(148,163,184,0.24),rgba(148,163,184,0.12))]"
                      : isLeader
                        ? "bg-[linear-gradient(90deg,rgba(251,191,36,0.12),rgba(251,191,36,0.04))]"
                      : "hover:bg-white/[0.035]"
                  }`}
                >
                  <span
                    className={`absolute bottom-0 left-0 top-0 w-[3px] ${
                      index === 0
                        ? "bg-cyan-400"
                        : index < 4
                          ? "bg-slate-500/60"
                          : "bg-transparent group-hover:bg-white/12"
                    }`}
                  />

                  <div className={`text-center text-[11px] font-semibold sm:text-sm ${isLeader ? "text-amber-100" : "text-slate-200"}`}>
                    {entry.position}
                  </div>

                  <div className="flex min-w-0 items-center gap-2 sm:gap-3 sm:pr-2">
                    <ClubLogo name={teamName} logoUrl={entry.team.crest} size="table-mobile" />
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <p className={`min-w-0 text-[12px] font-semibold leading-tight text-white sm:text-sm ${isLeader ? "text-amber-50" : "text-white"} ${teamName.length > 11 ? "break-words" : "truncate"}`}>{teamName}</p>
                      {isInChampionsLeague ? (
                        <span className="hidden shrink-0 rounded-full bg-cyan-300/14 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-100 ring-1 ring-cyan-200/16 sm:inline-flex">
                          CL
                        </span>
                      ) : null}
                      {isLeader ? (
                        <span className="hidden shrink-0 rounded-full bg-amber-300/14 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-100 ring-1 ring-amber-200/16 sm:inline-flex">
                          Leader
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={`text-center text-[11px] font-medium sm:text-sm ${isLeader ? "text-amber-100/90" : "text-slate-300"}`}>
                    {entry.playedGames}
                  </div>
                  <div className={`text-center text-[13px] font-semibold sm:text-base ${isLeader ? "text-amber-50" : "text-white"}`}>
                    {entry.points}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClubList({ teams, selectedTeamId, onSelectTeam, crestMap }) {
  return (
    <div className="space-y-2">
      {teams.map((team) => {
        const logoUrl =
          crestMap.get(team.id) ??
          crestMap.get(team.name) ??
          crestMap.get(simplifyName(team.name)) ??
          crestMap.get(normalizeTeamKey(team.name));

        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(String(team.id))}
            className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition ${
              String(team.id) === String(selectedTeamId)
                ? "border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(34,211,238,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(8,145,178,0.12)]"
                : "border border-white/8 bg-[linear-gradient(145deg,rgba(2,6,12,0.48),rgba(15,23,42,0.4))] hover:border-white/15 hover:bg-white/[0.06]"
            }`}
          >
            <ClubLogo name={team.name} logoUrl={logoUrl} size="table" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{team.name}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Champions League
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RecentWinnersTable({ winners, crestMap }) {
  return (
    <div className="winners-table overflow-hidden rounded-[20px] border border-white/8 bg-slate-950/35">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] border-b border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        <p>Season</p>
        <p>Winner</p>
      </div>
      {winners.map((winner, index) => (
        <div
          key={winner.season}
          className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] px-4 py-3 ${
            index < winners.length - 1 ? "border-b border-white/6" : ""
          }`}
        >
          <p className="text-sm font-semibold text-slate-200">{winner.season}</p>
          <div className="flex min-w-0 items-center gap-3">
            <ClubLogo
              name={winner.club}
              logoUrl={resolveCrestUrl(crestMap, winner.club)}
              size="sm"
            />
            <p className="truncate text-sm font-semibold text-white">{winner.club}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TitleRaceComparisonChart({ standings, matches, selectedTeamId }) {
  const series = buildTitleRaceSeries(standings, matches);

  if (series.length === 0) {
    return <EmptyMessage>No title-race comparison available right now.</EmptyMessage>;
  }

  const maxMatchday = Math.max(...series.flatMap((team) => team.pointsByMatchday.map((item) => item.matchday)), 1);
  const maxPoints = Math.max(...series.flatMap((team) => team.pointsByMatchday.map((item) => item.points)), 3);
  const chartWidth = 300;
  const chartHeight = 164;
  const colors = ["#fbbf24", "#22d3ee", "#a78bfa", "#34d399"];

  return (
    <div className="chart-card rounded-[20px] border border-white/8 bg-slate-950/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Points by matchweek
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Top 4 clubs
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[22px_minmax(0,1fr)] gap-2 sm:grid-cols-[28px_minmax(0,1fr)] sm:gap-3">
        <div className="flex h-44 flex-col justify-between py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {[maxPoints, Math.round(maxPoints * 0.66), Math.round(maxPoints * 0.33), 0].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-36 w-full overflow-visible sm:h-44">
            {[0, 0.33, 0.66, 1].map((ratio) => {
              const y = chartHeight - 12 - ratio * (chartHeight - 24);
              return (
                <line
                  key={ratio}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(148,163,184,0.16)"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                />
              );
            })}
            {series.map((team, index) => {
              const pathData = team.pointsByMatchday
                .map((point, pointIndex) => {
                  const x = maxMatchday <= 1 ? 0 : ((point.matchday - 1) / (maxMatchday - 1)) * chartWidth;
                  const y = chartHeight - 12 - (point.points / Math.max(maxPoints, 1)) * (chartHeight - 24);
                  return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ");
              const stroke = colors[index] ?? "#22d3ee";
              const isSelected = String(team.id) === String(selectedTeamId);

              return (
                <path
                  key={team.id}
                  d={pathData}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isSelected ? "3.2" : "2.1"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? "1" : "0.9"}
                />
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap gap-2">
            {series.map((team, index) => {
              const isSelected = String(team.id) === String(selectedTeamId);
              return (
                <div
                  key={team.id}
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 sm:px-3 ${
                    isSelected ? "border-cyan-300/25 bg-cyan-400/10" : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[index] ?? "#22d3ee" }}
                  />
                  <span className="text-[11px] font-semibold text-slate-200">
                    {team.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {team.finalPoints} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundOf16Table({ matches, crestMap }) {
  const ties = buildRoundOf16Ties(matches);

  if (ties.length === 0) {
    return <EmptyMessage>No Round of 16 ties available right now.</EmptyMessage>;
  }

  return (
    <div className="space-y-2">
      {ties.map((tie) => {
        const homeLogo = crestMap.get(tie.homeTeam.id) ?? crestMap.get(tie.homeTeam.name);
        const awayLogo = crestMap.get(tie.awayTeam.id) ?? crestMap.get(tie.awayTeam.name);

        return (
          <div
            key={tie.id}
            className="rounded-[18px] border border-white/8 bg-slate-950/35 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ClubLogo
                  name={simplifyName(tie.homeTeam.shortName || tie.homeTeam.name)}
                  logoUrl={homeLogo}
                  size="table"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {simplifyName(tie.homeTeam.shortName || tie.homeTeam.name)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">vs</p>
                  <p className="truncate text-sm font-semibold text-white">
                    {simplifyName(tie.awayTeam.shortName || tie.awayTeam.name)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">{tie.aggregate}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {tie.legsPlayed === 2 ? "Aggregate" : formatStatus(tie.status)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>{tie.legsPlayed} leg{tie.legsPlayed === 1 ? "" : "s"} played</span>
              <span>{formatKickoff(tie.nextDate)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildTitleRaceMap(standings) {
  if (standings.length === 0) {
    return new Map();
  }

  const leader = standings[0];
  return new Map(
    standings.map((entry) => {
      const pointsGap = leader.points - entry.points;
      const playedGap = entry.playedGames - leader.playedGames;
      const goalDiffGap = leader.goalDifference - entry.goalDifference;

      let band = "Low";
      if (entry.position <= 2 && pointsGap <= 3 && goalDiffGap <= 8) {
        band = "High";
      } else if (entry.position <= 5 && pointsGap <= 9 && playedGap <= 1) {
        band = "Medium";
      }

      return [entry.team.id, band];
    }),
  );
}

function titleRaceClass(level) {
  if (level === "High") {
    return "accent-badge-positive";
  }
  if (level === "Medium") {
    return "accent-badge-caution";
  }
  return "bg-slate-400/15 text-slate-300";
}

function CompactLiveMatch({ match, selectedTeam, crestMap }) {
  const homeLogo = crestMap.get(match.homeTeam.id) ?? crestMap.get(match.homeTeam.name);
  const awayLogo = crestMap.get(match.awayTeam.id) ?? crestMap.get(match.awayTeam.name);
  const liveMatchTime = formatLiveMatchTime(match);

  return (
    <div className="live-card rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {liveMatchTime ? (
            <span className="accent-badge-analysis rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]">
              {liveMatchTime}
            </span>
          ) : null}
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {selectedTeam.name}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ClubLogo name={simplifyName(match.homeTeam.name)} logoUrl={homeLogo} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {simplifyName(match.homeTeam.name)}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Home
            </p>
          </div>
        </div>

        <div className="text-center sm:text-center">
          <p className="text-2xl font-semibold text-white">
            {match.score.fullTime.home ?? 0}-{match.score.fullTime.away ?? 0}
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {liveMatchTime || "Live"}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-3 text-left sm:justify-end sm:text-right">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {simplifyName(match.awayTeam.name)}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Away
            </p>
          </div>
          <ClubLogo name={simplifyName(match.awayTeam.name)} logoUrl={awayLogo} size="sm" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5">
          {formatKickoff(match.utcDate)}
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5">
          Venue: {simplifyName(match.homeTeam.name)}
        </span>
      </div>
    </div>
  );
}

function TopScorerCard({ scorers, competitionName, crestMap }) {
  if (!scorers || scorers.length === 0) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-slate-950/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Top scorers
            </p>
            <p className="mt-2 text-sm text-slate-300">
              No live {competitionName} scorer data available right now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/8 bg-slate-950/30">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_52px] gap-2 border-b border-white/8 px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Goals</span>
      </div>
      <div className="divide-y divide-white/6">
        {scorers.slice(0, 10).map((scorer, index) => {
          const playerName = scorer.player?.name ?? "NA";
          const teamName = simplifyName(scorer.team?.shortName || scorer.team?.name || "Club");
          const goals = scorer.goals ?? scorer.numberOfGoals ?? "NA";
          const logoUrl = resolveCrestUrl(
            crestMap,
            scorer.team?.shortName || scorer.team?.name || teamName,
          );

          return (
            <div
              key={`${playerName}-${teamName}-${index}`}
              className="grid grid-cols-[28px_minmax(0,1fr)_52px] items-center gap-2 px-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4"
            >
              <span className="text-xs font-semibold text-slate-300 sm:text-sm">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-3">
                <ClubLogo name={teamName} logoUrl={logoUrl} size="xs" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white sm:text-sm">{playerName}</p>
                  <p className="truncate text-xs text-slate-400">{teamName}</p>
                </div>
              </div>
              <span className="text-right text-base font-semibold text-white sm:text-lg">{goals}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopScoringClubsCard({ standings, crestMap }) {
  const clubs = [...standings]
    .sort((a, b) => {
      const goalsDiff = (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
      if (goalsDiff !== 0) {
        return goalsDiff;
      }
      return (a.position ?? 999) - (b.position ?? 999);
    })
    .slice(0, 10);

  if (clubs.length === 0) {
    return <EmptyMessage>No club scoring data available right now.</EmptyMessage>;
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-slate-950/30">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_52px] gap-2 border-b border-white/8 px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
        <span>#</span>
        <span>Club</span>
        <span className="text-right">Goals</span>
      </div>
      <div className="divide-y divide-white/6">
        {clubs.map((entry, index) => {
          const teamName = simplifyName(entry.team.shortName || entry.team.name);
          const logoUrl = resolveCrestUrl(
            crestMap,
            entry.team.shortName || entry.team.name,
          );

          return (
            <div
              key={entry.team.id}
              className="grid grid-cols-[28px_minmax(0,1fr)_52px] items-center gap-2 px-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4"
            >
              <span className="text-xs font-semibold text-slate-300 sm:text-sm">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-3">
                <ClubLogo name={teamName} logoUrl={logoUrl} size="xs" />
                <p className="truncate text-[13px] font-semibold text-white sm:text-sm">{teamName}</p>
              </div>
              <span className="text-right text-base font-semibold text-white sm:text-lg">
                {entry.goalsFor ?? 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopCleanSheetsCard({ matches, crestMap }) {
  const cleanSheetMap = new Map();

  matches
    .filter(
      (match) =>
        match.status === "FINISHED" &&
        typeof match.score?.fullTime?.home === "number" &&
        typeof match.score?.fullTime?.away === "number",
    )
    .forEach((match) => {
      const homeKey = match.homeTeam.id ?? match.homeTeam.name;
      const awayKey = match.awayTeam.id ?? match.awayTeam.name;

      if (!cleanSheetMap.has(homeKey)) {
        cleanSheetMap.set(homeKey, {
          id: homeKey,
          name: simplifyName(match.homeTeam.shortName || match.homeTeam.name),
          logoUrl: resolveCrestUrl(crestMap, match.homeTeam.shortName || match.homeTeam.name),
          cleanSheets: 0,
        });
      }

      if (!cleanSheetMap.has(awayKey)) {
        cleanSheetMap.set(awayKey, {
          id: awayKey,
          name: simplifyName(match.awayTeam.shortName || match.awayTeam.name),
          logoUrl: resolveCrestUrl(crestMap, match.awayTeam.shortName || match.awayTeam.name),
          cleanSheets: 0,
        });
      }

      if ((match.score.fullTime.away ?? 0) === 0) {
        cleanSheetMap.get(homeKey).cleanSheets += 1;
      }

      if ((match.score.fullTime.home ?? 0) === 0) {
        cleanSheetMap.get(awayKey).cleanSheets += 1;
      }
    });

  const clubs = [...cleanSheetMap.values()]
    .sort((a, b) => {
      const diff = b.cleanSheets - a.cleanSheets;
      if (diff !== 0) {
        return diff;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  if (clubs.length === 0) {
    return <EmptyMessage>No clean sheet data available right now.</EmptyMessage>;
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-slate-950/30">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_52px] gap-2 border-b border-white/8 px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
        <span>#</span>
        <span>Club</span>
        <span className="text-right">CS</span>
      </div>
      <div className="divide-y divide-white/6">
        {clubs.map((club, index) => (
          <div
            key={club.id}
            className="grid grid-cols-[28px_minmax(0,1fr)_52px] items-center gap-2 px-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)_64px] sm:gap-3 sm:px-4"
          >
            <span className="text-xs font-semibold text-slate-300 sm:text-sm">{index + 1}</span>
            <div className="flex min-w-0 items-center gap-3">
              <ClubLogo name={club.name} logoUrl={club.logoUrl} size="xs" />
              <p className="truncate text-[13px] font-semibold text-white sm:text-sm">{club.name}</p>
            </div>
            <span className="text-right text-base font-semibold text-white sm:text-lg">
              {club.cleanSheets}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LastMatchResultCard({ match, selectedTeam, crestMap }) {
  const isHome = match.homeTeam.name === selectedTeam.apiTeamName;
  const teamLogo = isHome
    ? crestMap.get(match.homeTeam.id) ?? crestMap.get(match.homeTeam.name)
    : crestMap.get(match.awayTeam.id) ?? crestMap.get(match.awayTeam.name);
  const opponentLogo = isHome
    ? crestMap.get(match.awayTeam.id) ?? crestMap.get(match.awayTeam.name)
    : crestMap.get(match.homeTeam.id) ?? crestMap.get(match.homeTeam.name);
  const opponentName = simplifyName(isHome ? match.awayTeam.name : match.homeTeam.name);
  const teamScore = isHome ? match.score.fullTime.home ?? 0 : match.score.fullTime.away ?? 0;
  const opponentScore = isHome ? match.score.fullTime.away ?? 0 : match.score.fullTime.home ?? 0;
  const resultLabel = teamScore > opponentScore ? "Win" : teamScore < opponentScore ? "Loss" : "Draw";
  const highlightsUrl = buildYouTubeHighlightUrl(match);
  const resultTone =
    resultLabel === "Win"
      ? "text-emerald-300"
      : resultLabel === "Loss"
        ? "text-rose-300"
        : "text-amber-200";

  return (
    <div className="last-match-card rounded-[22px] border border-white/8 bg-slate-950/30 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_120px] xl:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {formatKickoff(match.utcDate)}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] sm:items-center">
            <div className="flex min-w-0 items-center gap-3.5">
              <ClubLogo name={selectedTeam.name} logoUrl={teamLogo} size="md" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{selectedTeam.name}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {isHome ? "Home" : "Away"}
                </p>
              </div>
            </div>

            <div className="hidden text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
              vs
            </div>

            <div className="flex min-w-0 items-center gap-3.5 sm:justify-end sm:text-right">
              <div className="min-w-0 sm:order-1">
                <p className="truncate text-base font-semibold text-white">{opponentName}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {isHome ? "Away" : "Home"}
                </p>
              </div>
              <ClubLogo name={opponentName} logoUrl={opponentLogo} size="md" />
            </div>
          </div>

          <a
            href={highlightsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/12"
          >
            Watch highlights
          </a>
        </div>

        <div className="justify-self-start rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left xl:justify-self-end xl:text-right">
          <p className="text-2xl font-semibold text-white">
            {teamScore}-{opponentScore}
          </p>
          <p className={`mt-1 text-xs font-bold uppercase tracking-[0.22em] ${resultTone}`}>
            {resultLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-18 animate-pulse rounded-[22px] border border-white/8 bg-white/[0.05]"
        />
      ))}
    </div>
  );
}

function InfoCard({ title, children, divided = false, updatedAt = null }) {
  return (
    <section className={`info-card rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 sm:rounded-[30px] sm:p-5 ${divided ? "relative before:absolute before:left-5 before:right-5 before:top-0 before:h-px before:bg-white/[0.06]" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="display-heading text-[1.85rem] leading-none text-white sm:text-[2.15rem]">{title}</h3>
        {updatedAt ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            Updated {formatUpdatedAt(updatedAt)}
          </p>
        ) : null}
      </div>
      <div className="mt-4 text-sm leading-7 text-slate-300 sm:text-[15px]">{children}</div>
    </section>
  );
}

function EmptyMessage({ children }) {
  return <p className="text-sm leading-7 text-slate-400">{children}</p>;
}

function LoadingMessage({ text }) {
  return <p className="text-sm font-medium text-slate-400">{text}</p>;
}

function ClubSwitchOverlay({ clubName }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[36px] bg-[rgba(3,9,16,0.58)] backdrop-blur-md">
      <div className="switch-overlay-card rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,20,31,0.94),rgba(12,28,42,0.9))] px-8 py-7 text-center shadow-[0_20px_60px_rgba(2,10,18,0.4)]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          Loading club
        </p>
        <p className="mt-2 text-lg font-semibold text-white">{clubName}</p>
        <p className="mt-1 text-sm text-slate-400">
          Updating standings, form, and fixtures.
        </p>
      </div>
    </div>
  );
}
