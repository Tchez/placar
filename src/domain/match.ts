import type { Entry, GameId, Match, Team } from './types';

export interface CreateMatchInput {
  id: string;
  gameId: GameId;
  teams: readonly Team[];
  target: number | null;
  createdAt: string;
}

export function createMatch(input: CreateMatchInput): Match {
  return {
    id: input.id,
    gameId: input.gameId,
    teams: input.teams.map((team) => ({ ...team })),
    entries: [],
    target: input.target,
    createdAt: input.createdAt,
    finishedAt: null,
  };
}

export function addEntry(match: Match, entry: Entry): Match {
  return { ...match, entries: [...match.entries, { ...entry }] };
}

export function updateEntry(match: Match, entry: Entry): Match {
  if (!match.entries.some(({ id }) => id === entry.id)) {
    throw new Error(`Entry not found: ${entry.id}`);
  }

  return {
    ...match,
    entries: match.entries.map((current) =>
      current.id === entry.id ? { ...entry } : current,
    ),
  };
}

export function removeEntry(match: Match, entryId: string): Match {
  return {
    ...match,
    entries: match.entries.filter(({ id }) => id !== entryId),
  };
}

export function renameTeam(match: Match, teamId: string, name: string): Match {
  if (!match.teams.some(({ id }) => id === teamId)) {
    throw new Error(`Team not found: ${teamId}`);
  }

  return {
    ...match,
    teams: match.teams.map((team) =>
      team.id === teamId ? { ...team, name } : team,
    ),
  };
}

export function finishMatch(match: Match, finishedAt: string): Match {
  return { ...match, finishedAt };
}

export function reopenMatch(match: Match): Match {
  return { ...match, finishedAt: null };
}
