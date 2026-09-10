import { describe, expect, it } from 'vitest';
import {
  addEntry,
  createMatch,
  removeEntry,
  updateEntry,
} from '../domain/match';
import { getGame } from '.';
import { createDefaultMatchInput } from './createDefaultMatchInput';
import {
  getVoleiTallies,
  MAX_VOLEI_POINTS,
  MAX_VOLEI_SETS,
  VOLEI,
} from './volei';

function initial() {
  return createMatch(createDefaultMatchInput(getGame('volei')));
}

describe('vôlei counter', () => {
  it('starts without names, targets or automatic history', () => {
    const match = initial();
    expect(match.teams.map(({ name }) => name)).toEqual(['', '']);
    expect(match.target).toBeNull();
    expect(match.savedToHistory).toBe(false);
  });

  it('derives independent points and sets and replays each undo, including consecutive resets', () => {
    let match = initial();
    const left = match.teams[0]!.id;
    const right = match.teams[1]!.id;
    const events = [
      [left, ''],
      [right, ''],
      [left, ''],
      [left, 'set'],
      [right, 'set'],
      [left, 'zerar'],
      [left, 'zerar'],
      [right, ''],
      [left, ''],
    ] as const;
    const expected = [
      [
        [0, 0],
        [0, 0],
      ],
      [
        [1, 0],
        [0, 0],
      ],
      [
        [1, 0],
        [1, 0],
      ],
      [
        [2, 0],
        [1, 0],
      ],
      [
        [2, 1],
        [1, 0],
      ],
      [
        [2, 1],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 1],
      ],
      [
        [0, 1],
        [2, 1],
      ],
      [
        [1, 1],
        [2, 1],
      ],
    ];
    events.forEach(([teamId, note], i) => {
      match = addEntry(match, {
        id: String(i),
        teamId,
        note,
        value: note === 'zerar' ? 0 : 1,
        createdAt: match.createdAt,
      });
      expect(
        getVoleiTallies(match).map(({ points, sets }) => [points, sets]),
      ).toEqual(expected[i + 1]);
    });
    for (let i = events.length - 1; i >= 0; i--) {
      match = removeEntry(match, String(i));
      expect(
        getVoleiTallies(match).map(({ points, sets }) => [points, sets]),
      ).toEqual(expected[i]);
    }
  });

  it('recomputes later points when a past reset is edited or deleted', () => {
    let match = initial();
    const teamId = match.teams[0]!.id;
    for (const [id, note] of [
      ['1', ''],
      ['2', 'zerar'],
      ['3', ''],
    ]) {
      match = addEntry(match, {
        id: id!,
        teamId,
        note: note!,
        value: note === 'zerar' ? 0 : 1,
        createdAt: match.createdAt,
      });
    }
    expect(getVoleiTallies(match)[0]?.points).toBe(1);
    expect(getVoleiTallies(removeEntry(match, '2'))[0]?.points).toBe(2);
    const edited = updateEntry(match, {
      ...match.entries[1]!,
      note: 'set',
      value: 1,
    });
    expect(getVoleiTallies(edited)[0]).toMatchObject({ points: 2, sets: 1 });
  });

  it('declares the point and set limits without declaring a winner', () => {
    let match = initial();
    for (let i = 0; i < 130; i++) {
      match = addEntry(match, {
        id: String(i),
        teamId: match.teams[0]!.id,
        note: i < 120 ? '' : i < 123 ? 'set' : '',
        value: 1,
        createdAt: match.createdAt,
      });
    }
    expect(getVoleiTallies(match)[0]).toMatchObject({ points: 127, sets: 3 });
    expect(VOLEI.scoreboard(match)).toMatchObject({
      winnerTeamId: null,
      leaderTeamId: null,
      standings: [
        { teamId: match.teams[0]!.id, score: 3, detail: '127 pontos' },
        { teamId: match.teams[1]!.id, score: 0, detail: '0 pontos' },
      ],
    });
    expect(MAX_VOLEI_POINTS).toBe(50);
    expect(MAX_VOLEI_SETS).toBe(3);
    expect(VOLEI.scoreCeiling).toBeUndefined();
  });
});
