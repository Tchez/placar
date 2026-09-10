import type { Entry, GameId, Match, Team } from './types';

export interface CreateMatchInput {
  id: string;
  gameId: GameId;
  teams: readonly Team[];
  target: number | null;
  allowNegativeEntries: boolean;
  createdAt: string;
  savedToHistory?: boolean;
}

export type EntryValueValidation =
  { valid: true; value: number } | { valid: false; message: string };

export type TargetValidation =
  { valid: true; value: number | null } | { valid: false; message: string };

export function validateTarget(
  rawValue: string,
  required: boolean,
): TargetValidation {
  const normalized = rawValue.trim().replace(',', '.');

  if (normalized === '' && !required) {
    return { valid: true, value: null };
  }

  const value = normalized === '' ? Number.NaN : Number(normalized);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return {
      valid: false,
      message: 'Informe quantos pontos para vencer.',
    };
  }

  return { valid: true, value };
}

export function validateEntryValue(
  rawValue: string,
  allowNegativeEntries: boolean,
): EntryValueValidation {
  const normalized = rawValue.trim().replace(',', '.');
  const value = normalized === '' ? Number.NaN : Number(normalized);

  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { valid: false, message: 'Informe um número inteiro.' };
  }

  if (value === 0) {
    return { valid: false, message: 'Informe um valor diferente de zero.' };
  }

  if (value < 0 && !allowNegativeEntries) {
    return {
      valid: false,
      message: 'Esta partida não permite pontos negativos.',
    };
  }

  return { valid: true, value };
}

export function createMatch(input: CreateMatchInput): Match {
  return {
    id: input.id,
    gameId: input.gameId,
    teams: input.teams.map((team) => ({ ...team })),
    entries: [],
    target: input.target,
    allowNegativeEntries: input.allowNegativeEntries,
    createdAt: input.createdAt,
    finishedAt: null,
    savedToHistory: input.savedToHistory ?? true,
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

export function clearEntries(match: Match): Match {
  return { ...match, entries: [] };
}

export function renameTeam(match: Match, teamId: string, name: string): Match {
  if (!match.teams.some(({ id }) => id === teamId)) {
    throw new Error(`Team not found: ${teamId}`);
  }

  const previousName = match.teams.find(({ id }) => id === teamId)?.name ?? '';
  const nextName = name.trim() || previousName;

  return {
    ...match,
    teams: match.teams.map((team) =>
      team.id === teamId ? { ...team, name: nextName } : team,
    ),
  };
}

export function finishMatch(match: Match, finishedAt: string): Match {
  return { ...match, finishedAt };
}

export function reopenMatch(match: Match): Match {
  return { ...match, finishedAt: null };
}
