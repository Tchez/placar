import { describe, expect, it } from 'vitest';
import {
  addEntry,
  clearEntries,
  createMatch,
  finishMatch,
  removeEntry,
  renameTeam,
  reopenMatch,
  updateEntry,
  validateEntryValue,
  validateTarget,
  type CreateMatchInput,
} from './match';
import type { Entry, Match } from './types';

const input: CreateMatchInput = {
  id: 'match-1',
  gameId: 'canastra',
  teams: [
    { id: 'team-1', name: 'Time A' },
    { id: 'team-2', name: 'Time B' },
  ],
  target: 12,
  allowNegativeEntries: true,
  createdAt: '2026-08-22T12:00:00.000Z',
};

const entry: Entry = {
  id: 'entry-1',
  teamId: 'team-1',
  value: 3,
  note: '',
  createdAt: '2026-08-22T12:01:00.000Z',
};

function matchWithEntry(): Match {
  return addEntry(createMatch(input), entry);
}

function unchanged<T>(value: T): () => void {
  const before = structuredClone(value);
  return () => expect(value).toEqual(before);
}

describe('match domain', () => {
  it('creates a match without mutating its input', () => {
    const assertInputUnchanged = unchanged(input);
    const result = createMatch(input);

    expect(result).toEqual({
      ...input,
      teams: input.teams,
      entries: [],
      finishedAt: null,
      savedToHistory: true,
    });
    expect(result.teams).not.toBe(input.teams);
    assertInputUnchanged();
  });

  it('adds an entry in order without mutating the match', () => {
    const match = createMatch(input);
    const assertInputUnchanged = unchanged(match);
    const result = addEntry(match, entry);

    expect(result.entries).toEqual([entry]);
    expect(result.entries[0]).not.toBe(entry);
    assertInputUnchanged();
  });

  it('updates an entry without mutating the match', () => {
    const match = matchWithEntry();
    const assertInputUnchanged = unchanged(match);
    const replacement = { ...entry, value: 6, note: 'Changed' };
    const result = updateEntry(match, replacement);

    expect(result.entries).toEqual([replacement]);
    assertInputUnchanged();
  });

  it('removes an entry without mutating the match', () => {
    const match = matchWithEntry();
    const assertInputUnchanged = unchanged(match);
    const result = removeEntry(match, entry.id);

    expect(result.entries).toEqual([]);
    assertInputUnchanged();
  });

  it('clears every entry without changing the match identity or metadata', () => {
    const match = finishMatch(matchWithEntry(), '2026-08-22T13:00:00.000Z');
    const assertInputUnchanged = unchanged(match);
    const result = clearEntries(match);

    expect(result).toEqual({ ...match, entries: [] });
    expect(result.id).toBe(match.id);
    expect(result.teams).toBe(match.teams);
    expect(result.finishedAt).toBe(match.finishedAt);
    assertInputUnchanged();
  });

  it('renames a team without mutating the match', () => {
    const match = createMatch(input);
    const assertInputUnchanged = unchanged(match);
    const result = renameTeam(match, 'team-1', 'Novo nome');

    expect(result.teams).toEqual([
      { id: 'team-1', name: 'Novo nome' },
      { id: 'team-2', name: 'Time B' },
    ]);
    assertInputUnchanged();
  });

  it('keeps the previous team name when the replacement is blank', () => {
    const match = createMatch(input);

    expect(renameTeam(match, 'team-1', '   ').teams[0]?.name).toBe('Time A');
  });

  it('finishes a match without mutating it', () => {
    const match = createMatch(input);
    const assertInputUnchanged = unchanged(match);
    const finishedAt = '2026-08-22T13:00:00.000Z';
    const result = finishMatch(match, finishedAt);

    expect(result.finishedAt).toBe(finishedAt);
    assertInputUnchanged();
  });

  it('reopens a match without mutating it', () => {
    const match = finishMatch(createMatch(input), '2026-08-22T13:00:00.000Z');
    const assertInputUnchanged = unchanged(match);
    const result = reopenMatch(match);

    expect(result.finishedAt).toBeNull();
    assertInputUnchanged();
  });

  it('validates and parses integer entry values', () => {
    expect(validateEntryValue('12,0', true)).toEqual({
      valid: true,
      value: 12,
    });
    expect(validateEntryValue('12.0', true)).toEqual({
      valid: true,
      value: 12,
    });
    expect(validateEntryValue('texto', true)).toEqual({
      valid: false,
      message: 'Informe um número inteiro.',
    });
    expect(validateEntryValue('0', true)).toEqual({
      valid: false,
      message: 'Informe um valor diferente de zero.',
    });
  });

  it('accepts or rejects negative entry values from the match setting', () => {
    expect(validateEntryValue('-100', true)).toEqual({
      valid: true,
      value: -100,
    });
    expect(validateEntryValue('-100', false)).toEqual({
      valid: false,
      message: 'Esta partida não permite pontos negativos.',
    });
  });

  it('validates required positive integer targets', () => {
    expect(validateTarget('3000', true)).toEqual({
      valid: true,
      value: 3000,
    });
    expect(validateTarget('', true)).toEqual({
      valid: false,
      message: 'Informe quantos pontos para vencer.',
    });
    expect(validateTarget('-1', true)).toEqual({
      valid: false,
      message: 'Informe quantos pontos para vencer.',
    });
  });
});
