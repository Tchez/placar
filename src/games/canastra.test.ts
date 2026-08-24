import { describe, expect, it } from 'vitest';
import {
  addEntry,
  createMatch,
  removeEntry,
  updateEntry,
} from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { CANASTRA } from './canastra';

const baseMatch = createMatch({
  id: 'match-1',
  gameId: 'canastra',
  teams: [
    { id: 'team-us', name: 'Nós' },
    { id: 'team-them', name: 'Eles' },
  ],
  target: 3000,
  allowNegativeEntries: true,
  createdAt: '2026-08-22T12:00:00.000Z',
});

function entry(id: string, teamId: string, value: number): Entry {
  return {
    id,
    teamId,
    value,
    note: '',
    createdAt: `2026-08-22T12:0${id}.000Z`,
  };
}

function withEntries(...entries: readonly Entry[]): Match {
  return entries.reduce(addEntry, baseMatch);
}

describe('canastra', () => {
  it('declares its complete setup and entry contract', () => {
    expect(CANASTRA).toMatchObject({
      id: 'canastra',
      teamCount: 2,
      defaultTeamNames: ['Nós', 'Eles'],
      defaultTarget: 4000,
      targetSuggestions: [3000, 4000],
      targetRequired: true,
      supportsNegativeEntries: true,
      defaultAllowNegativeEntries: false,
      entryAffordance: { type: 'numeric', shortcuts: [] },
    });
    expect(CANASTRA.defaultTeamNames).toHaveLength(CANASTRA.teamCount);
  });

  it('shows an empty match with both teams at zero and no leader', () => {
    expect(CANASTRA.scoreboard(baseMatch)).toEqual({
      standings: [
        { teamId: 'team-us', score: 0 },
        { teamId: 'team-them', score: 0 },
      ],
      leaderTeamId: null,
      winnerTeamId: null,
      detail: 'Faltam 3000 pontos para Nós',
    });
  });

  it('declares exactly one team over the target as winner', () => {
    const scoreboard = CANASTRA.scoreboard(
      withEntries(entry('1', 'team-us', 3100)),
    );

    expect(scoreboard.winnerTeamId).toBe('team-us');
    expect(scoreboard.detail).toBe('Nós venceu');
  });

  it('declares no winner when both teams are over the target', () => {
    const scoreboard = CANASTRA.scoreboard(
      withEntries(entry('1', 'team-us', 3100), entry('2', 'team-them', 3200)),
    );

    expect(scoreboard.winnerTeamId).toBeNull();
    expect(scoreboard.detail).toBe('Empate na meta — a mesa decide');
  });

  it('allows a negative entry to pull a team back under the target', () => {
    const scoreboard = CANASTRA.scoreboard(
      withEntries(
        entry('1', 'team-us', 3100),
        entry('2', 'team-them', 2800),
        entry('3', 'team-us', -200),
      ),
    );

    expect(scoreboard.winnerTeamId).toBeNull();
    expect(scoreboard.standings).toEqual([
      { teamId: 'team-us', score: 2900 },
      { teamId: 'team-them', score: 2800 },
    ]);
    expect(scoreboard.detail).toBe('Faltam 100 pontos para Nós');
  });

  it('keeps standings in team order even when the second team leads', () => {
    const scoreboard = CANASTRA.scoreboard(
      withEntries(entry('1', 'team-us', 100), entry('2', 'team-them', 500)),
    );

    expect(scoreboard.standings.map(({ teamId }) => teamId)).toEqual([
      'team-us',
      'team-them',
    ]);
    expect(scoreboard.leaderTeamId).toBe('team-them');
  });

  it('recomputes totals after editing and deleting an entry', () => {
    const originalEntry = entry('1', 'team-us', 100);
    const match = withEntries(originalEntry);
    const edited = updateEntry(match, { ...originalEntry, value: 250 });
    const removed = removeEntry(edited, originalEntry.id);

    expect(CANASTRA.scoreboard(edited).standings[0]?.score).toBe(250);
    expect(CANASTRA.scoreboard(removed).standings[0]?.score).toBe(0);
  });
});
