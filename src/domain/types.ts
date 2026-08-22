export type GameId = 'canastra' | 'truco' | 'padel' | 'generico';

export interface Team {
  id: string;
  name: string;
}

export interface Entry {
  id: string;
  teamId: string;
  value: number;
  note: string;
  createdAt: string;
}

export interface Match {
  id: string;
  gameId: GameId;
  teams: readonly Team[];
  entries: readonly Entry[];
  target: number | null;
  allowNegativeEntries: boolean;
  createdAt: string;
  finishedAt: string | null;
}

export interface Standing {
  teamId: string;
  score: number;
  detail?: string;
}

export interface Scoreboard {
  standings: readonly Standing[];
  leaderTeamId: string | null;
  winnerTeamId: string | null;
  detail?: string;
}

export type EntryAffordance =
  | { type: 'numeric'; shortcuts: readonly number[] }
  | { type: 'buttons'; values: readonly number[] };

export interface GameDefinition {
  id: GameId;
  label: string;
  teamCount: number;
  defaultTeamNames: readonly string[];
  targetSuggestions: readonly number[];
  targetRequired: boolean;
  supportsNegativeEntries: boolean;
  entryAffordance: EntryAffordance;
  scoreboard(match: Match): Scoreboard;
}
