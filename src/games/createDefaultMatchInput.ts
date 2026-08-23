import { createId } from '../app/createId';
import type { CreateMatchInput } from '../domain/match';
import type { RegisteredGame } from '.';

export function createDefaultMatchInput(
  game: RegisteredGame,
  createdAt = new Date().toISOString(),
): CreateMatchInput {
  if (game.needsSetup) {
    throw new Error(`Game requires setup: ${game.id}`);
  }

  return {
    id: createId('match'),
    gameId: game.id,
    teams: game.defaultTeamNames.map((name) => ({
      id: createId('team'),
      name,
    })),
    target: game.defaultTarget ?? null,
    allowNegativeEntries: false,
    createdAt,
  };
}
