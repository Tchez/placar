import type { ComponentType } from 'react';
import type { Match } from '../domain/types';
import type { GameDefinition } from '../domain/types';
import { CANASTRA } from './canastra';
import { CanastraMatchView } from './CanastraMatchView';

export interface GameMatchViewProps {
  game: GameDefinition;
  match: Match;
}

export interface RegisteredGame extends GameDefinition {
  MatchView: ComponentType<GameMatchViewProps>;
}

const CANASTRA_GAME: RegisteredGame = {
  ...CANASTRA,
  MatchView: CanastraMatchView,
};

export const GAMES: readonly RegisteredGame[] = [CANASTRA_GAME];

export function getGame(id: string): RegisteredGame {
  const game = GAMES.find((candidate) => candidate.id === id);

  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }

  return game;
}
