import type { Entry, Match, Team } from '../domain/types';
import type { MatchRepository } from './repository';

const STORAGE_KEY = 'placar:matches';
const STORAGE_VERSION = 2;

interface StoredPayload {
  version: number;
  matches: Match[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTeam(value: unknown): value is Team {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}

function isEntry(value: unknown): value is Entry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.teamId === 'string' &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value) &&
    typeof value.note === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isMatch(value: unknown): value is Match {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.gameId === 'string' &&
    Array.isArray(value.teams) &&
    value.teams.every(isTeam) &&
    Array.isArray(value.entries) &&
    value.entries.every(isEntry) &&
    (typeof value.target === 'number' || value.target === null) &&
    typeof value.allowNegativeEntries === 'boolean' &&
    typeof value.createdAt === 'string' &&
    (typeof value.finishedAt === 'string' || value.finishedAt === null)
  );
}

function parsePayload(raw: string | null): StoredPayload | null {
  if (raw === null) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== STORAGE_VERSION ||
      !Array.isArray(value.matches) ||
      !value.matches.every(isMatch)
    ) {
      return null;
    }
    return { version: STORAGE_VERSION, matches: value.matches };
  } catch {
    return null;
  }
}

export function createLocalRepository(
  storage: Storage = window.localStorage,
): MatchRepository {
  const read = (): Match[] => {
    const payload = parsePayload(storage.getItem(STORAGE_KEY));
    return payload ? payload.matches : [];
  };

  const write = (matches: readonly Match[]): void => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, matches }),
    );
  };

  return {
    async loadAll() {
      return read();
    },
    async save(match) {
      const matches = read();
      const index = matches.findIndex(({ id }) => id === match.id);
      if (index === -1) {
        write([...matches, match]);
      } else {
        write(
          matches.map((current) => (current.id === match.id ? match : current)),
        );
      }
    },
    async remove(matchId) {
      write(read().filter(({ id }) => id !== matchId));
    },
  };
}

export const localRepository = createLocalRepository();
