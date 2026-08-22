import type { Match } from '../domain/types';

export interface MatchRepository {
  loadAll(): Promise<readonly Match[]>;
  save(match: Match): Promise<void>;
  remove(matchId: string): Promise<void>;
}
