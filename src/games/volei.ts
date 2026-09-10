import type { GameDefinition, Match } from '../domain/types';

export const MAX_VOLEI_SETS = 3;
export const MAX_VOLEI_POINTS = 50;

/** Only resets change the baseline; sets and points are independent. */
export function getVoleiTallies(match: Match) {
  return match.teams.map(({ id }) => {
    let points = 0;
    let sets = 0;
    for (const entry of match.entries) {
      if (entry.teamId !== id) continue;
      if (entry.note === 'set') sets += 1;
      else if (entry.note === 'zerar') points = 0;
      else if (entry.note === '') points += 1;
    }
    return { teamId: id, points, sets };
  });
}

export const VOLEI: GameDefinition = {
  id: 'volei',
  label: 'Vôlei',
  teamCount: 2,
  defaultTeamNames: ['', ''],
  needsSetup: false,
  defaultSavedToHistory: false,
  supportsNegativeEntries: false,
  entryAffordance: { type: 'buttons', values: [1] },
  scoreboard: (match) => ({
    standings: getVoleiTallies(match).map(({ teamId, sets, points }) => ({
      teamId,
      score: sets,
      detail: `${points} ${points === 1 ? 'ponto' : 'pontos'}`,
    })),
    leaderTeamId: null,
    winnerTeamId: null,
  }),
};
