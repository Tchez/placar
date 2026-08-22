import { describe, expect, it } from 'vitest';
import { GAMES, getGame } from '.';

describe('game registry', () => {
  it('registers canastra and truco with their own views', () => {
    expect(GAMES.map(({ id }) => id)).toEqual(['canastra', 'truco']);
    expect(getGame('canastra')).toBe(GAMES[0]);
    expect(getGame('canastra').MatchView).toBeTypeOf('function');
    expect(getGame('truco')).toBe(GAMES[1]);
    expect(getGame('truco').MatchView).toBeTypeOf('function');
  });

  it('describes an unknown game clearly', () => {
    expect(() => getGame('missing')).toThrow('Unknown game: missing');
  });
});
