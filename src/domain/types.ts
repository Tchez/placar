export type GameId = string;

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
  targetOptions: readonly number[];
  entryAffordance: EntryAffordance;
  scoreboard(match: Match): Scoreboard;
}
