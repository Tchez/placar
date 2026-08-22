import type { GameDefinition, GameId } from '../domain/types';

export const GAMES: readonly GameDefinition[] = [];

export function getGame(id: GameId): GameDefinition {
  const game = GAMES.find((candidate) => candidate.id === id);

  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }

  return game;
}
