import { describe, expect, it } from 'vitest';
import { addEntry, createMatch } from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { getTrucoGauderioState, TRUCO_GAUDERIO } from './trucoGauderio';

const baseMatch = createMatch({
  id: 'gauderio-1',
  gameId: 'truco-gauderio',
  teams: [
    { id: 'team-us', name: 'Nós' },
    { id: 'team-them', name: 'Eles' },
  ],
  target: null,
  allowNegativeEntries: false,
  createdAt: '2026-08-23T12:00:00.000Z',
});

function entry(id: string, teamId: string, value: number): Entry {
  return {
    id,
    teamId,
    value,
    note: '',
    createdAt: `2026-08-23T12:${id.padStart(2, '0')}:00.000Z`,
  };
}

function withEntries(...entries: readonly Entry[]): Match {
  return entries.reduce(addEntry, baseMatch);
}

describe('truco gaudério', () => {
  it('declares direct play, no target, unit controls and a control ceiling', () => {
    expect(TRUCO_GAUDERIO).toMatchObject({
      id: 'truco-gauderio',
      label: 'Truco gaudério',
      teamCount: 2,
      defaultTeamNames: ['Nós', 'Eles'],
      needsSetup: false,
      scoreCeiling: 24,
      supportsNegativeEntries: false,
      entryAffordance: { type: 'buttons', values: [-1, 1] },
    });
    expect(TRUCO_GAUDERIO).not.toHaveProperty('defaultTarget');
    expect(TRUCO_GAUDERIO).not.toHaveProperty('targetSuggestions');
    expect(TRUCO_GAUDERIO).not.toHaveProperty('targetRequired');
  });

  it('sums the log without clamping and stays normal below the ceiling', () => {
    const match = withEntries(
      entry('1', 'team-us', 12),
      entry('2', 'team-us', -1),
      entry('3', 'team-them', 6),
    );

    expect(getTrucoGauderioState(match)).toEqual({ type: 'normal' });
    expect(TRUCO_GAUDERIO.scoreboard(match)).toMatchObject({
      standings: [
        { teamId: 'team-us', score: 11 },
        { teamId: 'team-them', score: 6 },
      ],
      leaderTeamId: 'team-us',
      winnerTeamId: null,
    });
  });

  it('derives one winner at the ceiling and no winner for a tie', () => {
    const won = withEntries(entry('1', 'team-us', 24));
    const tied = withEntries(
      entry('1', 'team-us', 24),
      entry('2', 'team-them', 24),
    );

    expect(getTrucoGauderioState(won)).toEqual({
      type: 'won',
      winnerTeamId: 'team-us',
    });
    expect(TRUCO_GAUDERIO.scoreboard(won).detail).toBe('Nós vencemos');
    expect(getTrucoGauderioState(tied)).toEqual({
      type: 'won',
      winnerTeamId: null,
    });
  });
});
