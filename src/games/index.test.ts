import { describe, expect, it } from 'vitest';
import { GAMES, getGame } from '.';

describe('game registry', () => {
  it('registers every available game with its own view', () => {
    expect(GAMES.map(({ id }) => id)).toEqual([
      'canastra',
      'truco',
      'truco-gauderio',
    ]);
    expect(getGame('canastra')).toBe(GAMES[0]);
    expect(getGame('canastra').MatchView).toBeTypeOf('function');
    expect(getGame('truco')).toBe(GAMES[1]);
    expect(getGame('truco').MatchView).toBeTypeOf('function');
    expect(getGame('truco-gauderio')).toBe(GAMES[2]);
    expect(getGame('truco-gauderio').MatchView).toBeTypeOf('function');
  });

  it('gives every game its own hub accent and icon', () => {
    const accents = GAMES.map(({ hub }) => hub.accent);
    const icons = GAMES.map(({ hub }) => hub.Icon);

    expect(new Set(accents).size).toBe(GAMES.length);
    expect(new Set(icons).size).toBe(GAMES.length);
  });

  it('describes an unknown game clearly', () => {
    expect(() => getGame('missing')).toThrow('Unknown game: missing');
  });
});
