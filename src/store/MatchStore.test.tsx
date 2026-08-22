import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Match } from '../domain/types';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider, useMatches } from './MatchStore';

function createFakeRepository(
  initial: readonly Match[] = [],
): MatchRepository & {
  save: ReturnType<typeof vi.fn<MatchRepository['save']>>;
  remove: ReturnType<typeof vi.fn<MatchRepository['remove']>>;
} {
  let matches = [...initial];
  const save = vi.fn<MatchRepository['save']>(async (match) => {
    matches = [...matches.filter(({ id }) => id !== match.id), match];
  });
  const remove = vi.fn<MatchRepository['remove']>(async (matchId) => {
    matches = matches.filter(({ id }) => id !== matchId);
  });
  return {
    loadAll: async () => matches,
    save,
    remove,
  };
}

describe('MatchStore', () => {
  it('loads and changes matches through its public hook and injected repository', async () => {
    const repository = createFakeRepository();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MatchProvider repository={repository}>{children}</MatchProvider>
    );
    const { result } = renderHook(() => useMatches(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createMatch({
        id: 'match-1',
        gameId: 'game-1',
        teams: [
          { id: 'team-1', name: 'Time A' },
          { id: 'team-2', name: 'Time B' },
        ],
        target: 12,
        createdAt: '2026-08-22T12:00:00.000Z',
      });
    });
    expect(result.current.matches).toHaveLength(1);

    await act(async () => {
      await result.current.addEntry('match-1', {
        id: 'entry-1',
        teamId: 'team-1',
        value: 3,
        note: '',
        createdAt: '2026-08-22T12:01:00.000Z',
      });
      await result.current.updateEntry('match-1', {
        id: 'entry-1',
        teamId: 'team-1',
        value: 6,
        note: 'Changed',
        createdAt: '2026-08-22T12:01:00.000Z',
      });
      await result.current.renameTeam('match-1', 'team-1', 'Novo nome');
      await result.current.finishMatch('match-1', '2026-08-22T13:00:00.000Z');
    });
    expect(result.current.matches[0]).toMatchObject({
      teams: [
        { id: 'team-1', name: 'Novo nome' },
        { id: 'team-2', name: 'Time B' },
      ],
      entries: [{ value: 6, note: 'Changed' }],
      finishedAt: '2026-08-22T13:00:00.000Z',
    });

    await act(async () => {
      await result.current.reopenMatch('match-1');
      await result.current.removeEntry('match-1', 'entry-1');
    });
    expect(result.current.matches[0]?.finishedAt).toBeNull();
    expect(result.current.matches[0]?.entries).toEqual([]);

    await act(async () => {
      await result.current.removeMatch('match-1');
    });
    expect(result.current.matches).toEqual([]);
    expect(repository.save).toHaveBeenCalledTimes(7);
    expect(repository.remove).toHaveBeenCalledWith('match-1');
  });

  it('throws a clear error outside the provider', () => {
    expect(() => renderHook(() => useMatches())).toThrow(
      'useMatches must be used within a MatchProvider',
    );
  });
});
