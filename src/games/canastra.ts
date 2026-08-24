import type { GameDefinition, Match, Scoreboard } from '../domain/types';

function getCanastraScoreboard(match: Match): Scoreboard {
  const standings = match.teams.map((team) => ({
    teamId: team.id,
    score: match.entries
      .filter((entry) => entry.teamId === team.id)
      .reduce((total, entry) => total + entry.value, 0),
  }));

  const highestScore = Math.max(...standings.map(({ score }) => score));
  const leaders = standings.filter(({ score }) => score === highestScore);
  const leaderTeamId =
    leaders.length === 1 ? (leaders[0]?.teamId ?? null) : null;
  const target = match.target;
  const teamsAtTarget =
    target === null ? [] : standings.filter(({ score }) => score >= target);

  let winnerTeamId: string | null = null;
  let detail = '';

  if (teamsAtTarget.length >= 2) {
    detail = 'Empate na meta — a mesa decide';
  } else if (teamsAtTarget.length === 1) {
    winnerTeamId = teamsAtTarget[0]?.teamId ?? null;
    const winner = match.teams.find(({ id }) => id === winnerTeamId);
    detail = `${winner?.name ?? ''} venceu`;
  } else if (match.target !== null && leaderTeamId !== null) {
    const leader = match.teams.find(({ id }) => id === leaderTeamId);
    detail = `Faltam ${match.target - highestScore} pontos para ${leader?.name ?? ''}`;
  } else if (match.target !== null) {
    const firstLeader = match.teams.find(({ id }) => id === leaders[0]?.teamId);
    detail = `Faltam ${match.target - highestScore} pontos para ${firstLeader?.name ?? ''}`;
  }

  return { standings, leaderTeamId, winnerTeamId, detail };
}

export const CANASTRA: GameDefinition = {
  id: 'canastra',
  label: 'Canastra',
  teamCount: 2,
  defaultTeamNames: ['Nós', 'Eles'],
  needsSetup: true,
  defaultTarget: 4000,
  targetSuggestions: [3000, 4000],
  targetRequired: true,
  supportsNegativeEntries: true,
  defaultAllowNegativeEntries: false,
  entryAffordance: { type: 'numeric', shortcuts: [] },
  scoreboard: getCanastraScoreboard,
};
