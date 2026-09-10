/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addEntry as addEntryToMatch,
  clearEntries as clearMatchEntries,
  createMatch as createDomainMatch,
  finishMatch as finishDomainMatch,
  type CreateMatchInput,
  removeEntry as removeEntryFromMatch,
  renameTeam as renameDomainTeam,
  reopenMatch as reopenDomainMatch,
  updateEntry as updateMatchEntry,
} from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { localRepository } from '../storage/localRepository';
import type { MatchRepository } from '../storage/repository';

interface MatchStoreValue {
  matches: readonly Match[];
  isLoading: boolean;
  createMatch(input: CreateMatchInput): Promise<Match>;
  addEntry(matchId: string, entry: Entry): Promise<Match>;
  updateEntry(matchId: string, entry: Entry): Promise<Match>;
  removeEntry(matchId: string, entryId: string): Promise<Match>;
  clearEntries(matchId: string): Promise<Match>;
  renameTeam(matchId: string, teamId: string, name: string): Promise<Match>;
  finishMatch(matchId: string, finishedAt: string): Promise<Match>;
  reopenMatch(matchId: string): Promise<Match>;
  saveToHistory(matchId: string, finishedAt?: string): Promise<Match>;
  removeMatch(matchId: string): Promise<void>;
}

const MatchContext = createContext<MatchStoreValue | null>(null);

interface MatchProviderProps {
  children: ReactNode;
  repository?: MatchRepository;
}

export function MatchProvider({
  children,
  repository = localRepository,
}: MatchProviderProps) {
  const [matches, setMatches] = useState<readonly Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const matchesRef = useRef(matches);

  const replaceMatches = useCallback((next: readonly Match[]) => {
    matchesRef.current = next;
    setMatches(next);
  }, []);

  useEffect(() => {
    let active = true;
    void repository.loadAll().then((loaded) => {
      if (active) {
        replaceMatches(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [repository, replaceMatches]);

  const persistChange = useCallback(
    async (
      matchId: string,
      change: (match: Match) => Match,
    ): Promise<Match> => {
      const current = matchesRef.current.find(({ id }) => id === matchId);
      if (!current) throw new Error(`Match not found: ${matchId}`);
      const changed = change(current);
      await repository.save(changed);
      replaceMatches(
        matchesRef.current.map((match) =>
          match.id === matchId ? changed : match,
        ),
      );
      return changed;
    },
    [repository, replaceMatches],
  );

  const value = useMemo<MatchStoreValue>(
    () => ({
      matches,
      isLoading,
      async createMatch(input) {
        const match = createDomainMatch(input);
        await repository.save(match);
        replaceMatches([...matchesRef.current, match]);
        return match;
      },
      addEntry: (matchId, entry) =>
        persistChange(matchId, (match) => addEntryToMatch(match, entry)),
      updateEntry: (matchId, entry) =>
        persistChange(matchId, (match) => updateMatchEntry(match, entry)),
      removeEntry: (matchId, entryId) =>
        persistChange(matchId, (match) => removeEntryFromMatch(match, entryId)),
      clearEntries: (matchId) => persistChange(matchId, clearMatchEntries),
      renameTeam: (matchId, teamId, name) =>
        persistChange(matchId, (match) =>
          renameDomainTeam(match, teamId, name),
        ),
      finishMatch: (matchId, finishedAt) =>
        persistChange(matchId, (match) => finishDomainMatch(match, finishedAt)),
      saveToHistory: (matchId, finishedAt) =>
        persistChange(matchId, (match) => ({
          ...match,
          savedToHistory: true,
          finishedAt: finishedAt ?? match.finishedAt,
        })),
      reopenMatch: (matchId) => persistChange(matchId, reopenDomainMatch),
      async removeMatch(matchId) {
        await repository.remove(matchId);
        replaceMatches(matchesRef.current.filter(({ id }) => id !== matchId));
      },
    }),
    [isLoading, matches, persistChange, repository, replaceMatches],
  );

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}

export function useMatches(): MatchStoreValue {
  const value = useContext(MatchContext);
  if (!value) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return value;
}
