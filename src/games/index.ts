import type { ComponentType } from 'react';
import { ClubIcon, PlayingCardsIcon } from '../components/HubIcons';
import type { Entry, Match } from '../domain/types';
import type { GameDefinition } from '../domain/types';
import { CANASTRA } from './canastra';
import { CanastraMatchView } from './CanastraMatchView';
import { TRUCO } from './truco';
import { TrucoMatchView } from './TrucoMatchView';

export interface GameMatchViewProps {
  game: GameDefinition;
  match: Match;
  actions: GameMatchActions;
}

export interface GameMatchActions {
  addEntry(entry: Entry): Promise<Match>;
  updateEntry(entry: Entry): Promise<Match>;
  removeEntry(entryId: string): Promise<Match>;
  finish(): Promise<Match>;
  reopen(): Promise<Match>;
  remove(): Promise<void>;
  createNew(): Promise<Match>;
  goHome(): void;
}

export interface RegisteredGame extends GameDefinition {
  MatchView: ComponentType<GameMatchViewProps>;
  hub: {
    accent: string;
    description: string;
    Icon: ComponentType;
  };
}

const CANASTRA_GAME: RegisteredGame = {
  ...CANASTRA,
  MatchView: CanastraMatchView,
  hub: {
    accent: '#49c875',
    description: 'Partidas até a meta de pontos.',
    Icon: PlayingCardsIcon,
  },
};

const TRUCO_GAME: RegisteredGame = {
  ...TRUCO,
  MatchView: TrucoMatchView,
  hub: {
    accent: '#d5a24f',
    description: 'Quem bate 12 pontos vence.',
    Icon: ClubIcon,
  },
};

export const GAMES: readonly RegisteredGame[] = [CANASTRA_GAME, TRUCO_GAME];

export function getGame(id: string): RegisteredGame {
  const game = GAMES.find((candidate) => candidate.id === id);

  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }

  return game;
}
