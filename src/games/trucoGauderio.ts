import type { GameDefinition, Match, Scoreboard } from '../domain/types';

export type TrucoGauderioState =
  { type: 'normal' } | { type: 'won'; winnerTeamId: string | null };

function getStandings(match: Match) {
  return match.teams.map((team) => ({
    teamId: team.id,
    score: match.entries
      .filter((entry) => entry.teamId === team.id)
      .reduce((total, entry) => total + entry.value, 0),
  }));
}

export function getTrucoGauderioState(match: Match): TrucoGauderioState {
  const standings = getStandings(match);

  if (standings.some(({ score }) => score >= 24)) {
    const highestScore = Math.max(...standings.map(({ score }) => score));
    const leaders = standings.filter(({ score }) => score === highestScore);
    return {
      type: 'won',
      winnerTeamId: leaders.length === 1 ? (leaders[0]?.teamId ?? null) : null,
    };
  }

  return { type: 'normal' };
}

function getTrucoGauderioScoreboard(match: Match): Scoreboard {
  const standings = getStandings(match);
  const highestScore = Math.max(...standings.map(({ score }) => score));
  const leaders = standings.filter(({ score }) => score === highestScore);
  const leaderTeamId =
    leaders.length === 1 ? (leaders[0]?.teamId ?? null) : null;
  const state = getTrucoGauderioState(match);
  const winnerTeamId = state.type === 'won' ? state.winnerTeamId : null;
  const winnerIndex = match.teams.findIndex(({ id }) => id === winnerTeamId);

  const detail =
    winnerIndex === 0
      ? 'Nós vencemos'
      : winnerIndex === 1
        ? 'Eles venceram'
        : undefined;

  return { standings, leaderTeamId, winnerTeamId, detail };
}

export const TRUCO_GAUDERIO: GameDefinition = {
  id: 'truco-gauderio',
  label: 'Truco gaudério',
  teamCount: 2,
  defaultTeamNames: ['Nós', 'Eles'],
  needsSetup: false,
  scoreCeiling: 24,
  supportsNegativeEntries: false,
  entryAffordance: { type: 'buttons', values: [-1, 1] },
  scoreboard: getTrucoGauderioScoreboard,
};
