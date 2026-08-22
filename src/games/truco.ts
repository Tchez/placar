import type { GameDefinition, Match, Scoreboard } from '../domain/types';

export type TrucoState =
  | { type: 'normal' }
  | { type: 'mao-de-onze'; teamId: string; opponentTeamId: string }
  | { type: 'mao-de-ferro' }
  | { type: 'won'; winnerTeamId: string | null };

function getScores(match: Match) {
  return match.teams.map((team) => ({
    teamId: team.id,
    score: match.entries
      .filter((entry) => entry.teamId === team.id)
      .reduce((total, entry) => total + entry.value, 0),
  }));
}

export function getTrucoState(match: Match): TrucoState {
  const standings = getScores(match);
  const teamsAtTarget = standings.filter(({ score }) => score >= 12);

  if (teamsAtTarget.length > 0) {
    const highestScore = Math.max(...standings.map(({ score }) => score));
    const leaders = standings.filter(({ score }) => score === highestScore);
    return {
      type: 'won',
      winnerTeamId: leaders.length === 1 ? (leaders[0]?.teamId ?? null) : null,
    };
  }

  const teamsAtEleven = standings.filter(({ score }) => score === 11);
  if (teamsAtEleven.length === 2) return { type: 'mao-de-ferro' };

  const teamAtEleven = teamsAtEleven[0];
  if (teamAtEleven) {
    const opponent = standings.find(
      ({ teamId }) => teamId !== teamAtEleven.teamId,
    );
    if (opponent) {
      return {
        type: 'mao-de-onze',
        teamId: teamAtEleven.teamId,
        opponentTeamId: opponent.teamId,
      };
    }
  }

  return { type: 'normal' };
}

function getTrucoScoreboard(match: Match): Scoreboard {
  const standings = getScores(match);
  const highestScore = Math.max(...standings.map(({ score }) => score));
  const leaders = standings.filter(({ score }) => score === highestScore);
  const leaderTeamId =
    leaders.length === 1 ? (leaders[0]?.teamId ?? null) : null;
  const state = getTrucoState(match);
  const winnerTeamId = state.type === 'won' ? state.winnerTeamId : null;
  const winnerIndex = match.teams.findIndex(({ id }) => id === winnerTeamId);

  let detail = '';
  if (state.type === 'mao-de-onze') detail = 'Mão de onze';
  if (state.type === 'mao-de-ferro') detail = 'Mão de ferro';
  if (state.type === 'won' && winnerIndex === 0) detail = 'Nós vencemos';
  if (state.type === 'won' && winnerIndex === 1) detail = 'Eles venceram';
  if (state.type === 'won' && winnerTeamId === null) {
    detail = 'Empate na meta — a mesa decide';
  }

  return { standings, leaderTeamId, winnerTeamId, detail };
}

export const TRUCO: GameDefinition = {
  id: 'truco',
  label: 'Truco mineiro',
  teamCount: 2,
  defaultTeamNames: ['Nós', 'Eles'],
  needsSetup: false,
  defaultTarget: 12,
  targetSuggestions: [12],
  targetRequired: true,
  supportsNegativeEntries: false,
  entryAffordance: { type: 'buttons', values: [-1, 1, 3, 6, 9, 12] },
  scoreboard: getTrucoScoreboard,
};
