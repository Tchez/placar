import { beforeEach, describe, expect, it } from 'vitest';
import { addEntry, createMatch } from '../domain/match';
import { createLocalRepository } from './localRepository';

const key = 'placar:matches';
const match = addEntry(
  createMatch({
    id: 'match-1',
    gameId: 'canastra',
    teams: [
      { id: 'team-1', name: 'Time A' },
      { id: 'team-2', name: 'Time B' },
    ],
    target: 3000,
    allowNegativeEntries: true,
    createdAt: '2026-08-22T12:00:00.000Z',
  }),
  {
    id: 'entry-1',
    teamId: 'team-1',
    value: -100,
    note: '',
    createdAt: '2026-08-22T12:05:00.000Z',
  },
);

describe('localRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and loads a match in a versioned payload', async () => {
    const repository = createLocalRepository(window.localStorage);
    await repository.save(match);

    await expect(repository.loadAll()).resolves.toEqual([match]);
    expect(JSON.parse(window.localStorage.getItem(key) ?? '')).toEqual({
      version: 2,
      matches: [match],
    });
  });

  it('returns an empty list for unparseable JSON', async () => {
    window.localStorage.setItem(key, '{broken');
    const repository = createLocalRepository(window.localStorage);

    await expect(repository.loadAll()).resolves.toEqual([]);
  });

  it('returns an empty list for a version mismatch', async () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ version: 999, matches: [match] }),
    );
    const repository = createLocalRepository(window.localStorage);

    await expect(repository.loadAll()).resolves.toEqual([]);
  });

  it('returns an empty list for a payload of the wrong shape', async () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ version: 2, matches: [{}] }),
    );
    const repository = createLocalRepository(window.localStorage);

    await expect(repository.loadAll()).resolves.toEqual([]);
  });

  it('removes a saved match', async () => {
    const repository = createLocalRepository(window.localStorage);
    await repository.save(match);
    await repository.remove(match.id);

    await expect(repository.loadAll()).resolves.toEqual([]);
  });
});
