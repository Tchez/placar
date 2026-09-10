import type { ComponentType } from 'react';
import {
  ClubIcon,
  MateGourdIcon,
  PlayingCardsIcon,
  VolleyballIcon,
} from '../components/HubIcons';
import type { Entry, Match } from '../domain/types';
import type { GameDefinition } from '../domain/types';
import { VOLEI } from './volei';
import { VoleiMatchView } from './VoleiMatchView';
import { CANASTRA } from './canastra';
import { CanastraMatchView } from './CanastraMatchView';
import { TRUCO } from './truco';
import { TrucoMatchView } from './TrucoMatchView';
import { TRUCO_GAUDERIO } from './trucoGauderio';
import { TrucoGauderioMatchView } from './TrucoGauderioMatchView';

export interface GameMatchViewProps {
  game: GameDefinition;
  match: Match;
  actions: GameMatchActions;
}

export interface GameMatchActions {
  addEntry(entry: Entry): Promise<Match>;
  updateEntry(entry: Entry): Promise<Match>;
  removeEntry(entryId: string): Promise<Match>;
  clearEntries(): Promise<Match>;
  finish(): Promise<Match>;
  reopen(): Promise<Match>;
  remove(): Promise<void>;
  createNew(): Promise<Match>;
  goHome(): void;
  saveToHistory(finish?: boolean): Promise<Match>;
  discard(): Promise<void>;
  goHistory(): void;
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

const TRUCO_GAUDERIO_GAME: RegisteredGame = {
  ...TRUCO_GAUDERIO,
  MatchView: TrucoGauderioMatchView,
  hub: {
    // Its own accent: sharing mineiro's gold made the two trucos
    // indistinguishable in the listing.
    accent: 'var(--hub-copper)',
    description: 'Um ponto por vez, até 24.',
    Icon: MateGourdIcon,
  },
};

export const GAMES: readonly RegisteredGame[] = [
  CANASTRA_GAME,
  TRUCO_GAME,
  TRUCO_GAUDERIO_GAME,
  {
    ...VOLEI,
    MatchView: VoleiMatchView,
    hub: {
      accent: '#fff000',
      description: 'Pontos e sets, no seu ritmo.',
      Icon: VolleyballIcon,
    },
  },
];

export function getGame(id: string): RegisteredGame {
  const game = GAMES.find((candidate) => candidate.id === id);

  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }

  return game;
}
