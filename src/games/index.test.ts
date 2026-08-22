import { describe, expect, it } from 'vitest';
import { GAMES, getGame } from '.';

describe('game registry', () => {
  it('registers canastra as its only game', () => {
    expect(GAMES.map(({ id }) => id)).toEqual(['canastra']);
    expect(getGame('canastra')).toBe(GAMES[0]);
    expect(getGame('canastra').MatchView).toBeTypeOf('function');
  });

  it('describes an unknown game clearly', () => {
    expect(() => getGame('missing')).toThrow('Unknown game: missing');
  });
});
