import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../app/routes';
import { addEntry, createMatch, finishMatch } from '../domain/match';
import type { Match } from '../domain/types';
import { GAMES } from '../games';
import { InstallProvider } from '../install/InstallProvider';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { ActiveMatchesScreen } from './ActiveMatchesScreen';
import { HistoryScreen } from './HistoryScreen';
import { HomeScreen } from './HomeScreen';

function fakeRepository(initial: readonly Match[]): MatchRepository {
  return {
    async loadAll() {
      return initial;
    },
    async save() {},
    async remove() {},
  };
}

function match(id: string, createdAt: string, finished = false): Match {
  const created = createMatch({
    id,
    gameId: 'canastra',
    teams: [
      { id: `${id}-us`, name: 'Nós' },
      { id: `${id}-them`, name: 'Eles' },
    ],
    target: 3000,
    allowNegativeEntries: true,
    createdAt,
  });
  return finished ? finishMatch(created, createdAt) : created;
}

function scoredFinishedMatch(
  id: string,
  usScore: number,
  themScore: number,
): Match {
  let scored = match(
    id,
    `2026-08-${id === 'winner' ? '20' : '21'}T12:00:00.000Z`,
  );
  scored = addEntry(scored, {
    id: `${id}-entry-us`,
    teamId: `${id}-us`,
    value: usScore,
    note: '',
    createdAt: scored.createdAt,
  });
  scored = addEntry(scored, {
    id: `${id}-entry-them`,
    teamId: `${id}-them`,
    value: themScore,
    note: '',
    createdAt: scored.createdAt,
  });
  return finishMatch(scored, scored.createdAt);
}

function renderHub(path: string, matches: readonly Match[] = []) {
  return render(
    <InstallProvider>
      <MatchProvider repository={fakeRepository(matches)}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.home} element={<HomeScreen />} />
            <Route
              path={ROUTES.activeMatches}
              element={<ActiveMatchesScreen />}
            />
            <Route path={ROUTES.history} element={<HistoryScreen />} />
            <Route path={ROUTES.match} element={<p>Partida aberta.</p>} />
          </Routes>
        </MemoryRouter>
      </MatchProvider>
    </InstallProvider>,
  );
}

describe('hub screens', () => {
  it('renders every registered game without the obsolete gaúcho placeholder', () => {
    const { container } = renderHub(ROUTES.home);

    for (const game of GAMES) {
      expect(
        screen.getByText(game.label).closest('a, button'),
      ).toBeInTheDocument();
    }

    expect(screen.queryByText('Truco gaúcho')).not.toBeInTheDocument();
    expect(container.querySelector('.hub-game-card--soon')).toBeNull();
    expect(screen.getByText('Mais jogos em breve')).toBeInTheDocument();
  });

  it('hides the complete in-progress section when it is empty', async () => {
    renderHub(ROUTES.home, [
      match('finished', '2026-08-20T12:00:00.000Z', true),
    ]);

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Em andamento' }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('link', { name: /Ver todos/ }),
    ).not.toBeInTheDocument();
  });

  it('shows only the three newest active rows while preserving the true count', async () => {
    const matches = [
      match('first', '2026-08-20T12:00:00.000Z'),
      match('second', '2026-08-21T12:00:00.000Z'),
      match('third', '2026-08-22T12:00:00.000Z'),
      match('fourth', '2026-08-23T12:00:00.000Z'),
    ];
    renderHub(ROUTES.home, matches);

    const section = await screen.findByRole('region', { name: 'Em andamento' });
    const rows = within(section)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/partida/'));
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      '/partida/fourth',
      '/partida/third',
      '/partida/second',
    ]);
    expect(within(section).getByText('4')).toBeInTheDocument();
  });

  it('lists every active match newest first and opens a row', async () => {
    const matches = [
      match('first', '2026-08-20T12:00:00.000Z'),
      match('second', '2026-08-21T12:00:00.000Z'),
      match('third', '2026-08-22T12:00:00.000Z'),
      match('fourth', '2026-08-23T12:00:00.000Z'),
    ];
    renderHub(ROUTES.activeMatches, matches);

    await screen.findByRole('heading', { name: 'Todas em andamento' });
    const rows = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/partida/'));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveAttribute('href', '/partida/fourth');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /apagar|renomear|encerrar/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(rows[0]!);
    expect(await screen.findByText('Partida aberta.')).toBeInTheDocument();
  });

  it('lists this device history with finished outcomes and opens a row', async () => {
    const active = match('active', '2026-08-23T12:00:00.000Z');
    const winner = scoredFinishedMatch('winner', 3000, 1500);
    const tie = scoredFinishedMatch('tie', 3200, 3100);
    renderHub(ROUTES.history, [winner, active, tie]);

    expect(
      await screen.findByText(
        'Este histórico reúne as partidas salvas neste aparelho.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Nós venceu')).toBeInTheDocument();
    expect(
      screen.getByText('Empate na meta — a mesa decide'),
    ).toBeInTheDocument();
    const rows = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/partida/'));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('href', '/partida/active');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    fireEvent.click(rows[0]!);
    expect(await screen.findByText('Partida aberta.')).toBeInTheDocument();
  });

  it('offers the games directly from the history empty state', async () => {
    renderHub(ROUTES.history);

    expect(
      await screen.findByText('Nenhuma partida ainda.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Escolher um jogo' }),
    ).toHaveAttribute('href', '/');
  });
});
