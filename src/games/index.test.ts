import { describe, expect, it } from 'vitest';
import { GAMES, getGame } from '.';

describe('game registry', () => {
  it('starts empty', () => {
    expect(GAMES).toEqual([]);
  });

  it('describes an unknown game clearly', () => {
    expect(() => getGame('missing')).toThrow('Unknown game: missing');
  });
});
