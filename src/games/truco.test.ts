import { describe, expect, it } from 'vitest';
import { addEntry, createMatch } from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { getTrucoState, TRUCO } from './truco';

const baseMatch = createMatch({
  id: 'truco-1',
  gameId: 'truco',
  teams: [
    { id: 'team-us', name: 'Nós' },
    { id: 'team-them', name: 'Eles' },
  ],
  target: 12,
  allowNegativeEntries: false,
  createdAt: '2026-08-22T12:00:00.000Z',
});

function entry(id: string, teamId: string, value: number): Entry {
  return {
    id,
    teamId,
    value,
    note: '',
    createdAt: `2026-08-22T12:${id.padStart(2, '0')}:00.000Z`,
  };
}

function withEntries(...entries: readonly Entry[]): Match {
  return entries.reduce(addEntry, baseMatch);
}

describe('truco mineiro', () => {
  it('declares the direct-start and fixed scoring contract', () => {
    expect(TRUCO).toMatchObject({
      id: 'truco',
      teamCount: 2,
      defaultTeamNames: ['Nós', 'Eles'],
      needsSetup: false,
      defaultTarget: 12,
      targetRequired: true,
      supportsNegativeEntries: false,
      entryAffordance: { type: 'buttons', values: [-1, 1, 3, 6, 9, 12] },
    });
  });

  it('derives normal play and keeps standings in team order', () => {
    const match = withEntries(entry('1', 'team-them', 6));

    expect(getTrucoState(match)).toEqual({ type: 'normal' });
    expect(TRUCO.scoreboard(match)).toMatchObject({
      standings: [
        { teamId: 'team-us', score: 0 },
        { teamId: 'team-them', score: 6 },
      ],
      leaderTeamId: 'team-them',
      winnerTeamId: null,
    });
  });

  it('derives mão de onze for exactly one team at eleven', () => {
    const match = withEntries(entry('1', 'team-us', 11));

    expect(getTrucoState(match)).toEqual({
      type: 'mao-de-onze',
      teamId: 'team-us',
      opponentTeamId: 'team-them',
    });
    expect(TRUCO.scoreboard(match).detail).toBe('Mão de onze');
  });

  it('derives mão de ferro when both teams are exactly at eleven', () => {
    const match = withEntries(
      entry('1', 'team-us', 11),
      entry('2', 'team-them', 11),
    );

    expect(getTrucoState(match)).toEqual({ type: 'mao-de-ferro' });
    expect(TRUCO.scoreboard(match).detail).toBe('Mão de ferro');
  });

  it('declares a winner above twelve without capping the score', () => {
    const match = withEntries(
      entry('1', 'team-us', 11),
      entry('2', 'team-us', 3),
    );

    expect(getTrucoState(match)).toEqual({
      type: 'won',
      winnerTeamId: 'team-us',
    });
    expect(TRUCO.scoreboard(match)).toMatchObject({
      standings: [
        { teamId: 'team-us', score: 14 },
        { teamId: 'team-them', score: 0 },
      ],
      winnerTeamId: 'team-us',
      detail: 'Nós vencemos',
    });
  });

  it('does not declare a winner when both teams pass twelve tied', () => {
    const match = withEntries(
      entry('1', 'team-us', 12),
      entry('2', 'team-them', 12),
    );

    expect(getTrucoState(match)).toEqual({
      type: 'won',
      winnerTeamId: null,
    });
    expect(TRUCO.scoreboard(match).detail).toBe(
      'Empate na meta — a mesa decide',
    );
  });
});
