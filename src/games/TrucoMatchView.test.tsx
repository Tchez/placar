import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../app/routes';
import { AppHeader } from '../components/AppHeader';
import { addEntry, createMatch, finishMatch } from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { NewMatchScreen } from '../screens/NewMatchScreen';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { Tally } from './TrucoMatchView';
import { TRUCO } from './truco';

function createFakeRepository(
  initial: readonly Match[] = [],
): MatchRepository & {
  saved: Match[];
  current(): readonly Match[];
} {
  let matches = [...initial];
  const saved: Match[] = [];
  return {
    saved,
    current: () => matches,
    async loadAll() {
      return matches;
    },
    async save(match) {
      matches = [...matches.filter(({ id }) => id !== match.id), match];
      saved.push(match);
    },
    async remove(matchId) {
      matches = matches.filter(({ id }) => id !== matchId);
    },
  };
}

function scoreEntry(id: string, teamId: string, value: number): Entry {
  return {
    id,
    teamId,
    value,
    note: '',
    createdAt: `2026-08-22T12:${id.padStart(2, '0')}:00.000Z`,
  };
}

function trucoMatch(options?: {
  finished?: boolean;
  them?: number;
  us?: number;
}): Match {
  let match = createMatch({
    id: 'truco-1',
    gameId: 'truco',
    teams: [
      { id: 'team-us', name: 'Nós' },
      { id: 'team-them', name: 'Eles' },
    ],
    target: 12,
    allowNegativeEntries: false,
    createdAt: '2026-08-22T12:00:00.000Z',
  });

  if (options?.us)
    match = addEntry(match, scoreEntry('1', 'team-us', options.us));
  if (options?.them) {
    match = addEntry(match, scoreEntry('2', 'team-them', options.them));
  }

  return options?.finished
    ? finishMatch(match, '2026-08-22T13:00:00.000Z')
    : match;
}

function renderApp(path: string, repository: MatchRepository) {
  return render(
    <MatchProvider repository={repository}>
      <MemoryRouter initialEntries={[path]}>
        <AppHeader />
        <Routes>
          <Route path={ROUTES.home} element={<HomeScreen />} />
          <Route path={ROUTES.newMatch} element={<NewMatchScreen />} />
          <Route path={ROUTES.match} element={<MatchScreen />} />
        </Routes>
      </MemoryRouter>
    </MatchProvider>,
  );
}

function currentMatch(repository: ReturnType<typeof createFakeRepository>) {
  const match = repository.current().find(({ id }) => id === 'truco-1');
  if (!match) throw new Error('Expected truco match');
  return match;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('truco tally', () => {
  it.each([
    [4, 1],
    [5, 1],
    [11, 3],
    [12, 3],
    [14, 3],
  ])(
    'renders %i marks in %i groups without a visible numeral',
    (score, groups) => {
      const { container } = render(<Tally animateFrom={score} score={score} />);

      expect(container.querySelectorAll('[data-tally-mark]')).toHaveLength(
        score,
      );
      expect(container.querySelectorAll('[data-tally-group]')).toHaveLength(
        groups,
      );
      expect(container).toHaveTextContent('');
      expect(
        container.querySelectorAll('.truco-tally__mark--new'),
      ).toHaveLength(0);
    },
  );

  it('marks only newly added strokes for animation', () => {
    const { container } = render(<Tally animateFrom={5} score={9} />);

    expect(container.querySelectorAll('[data-tally-mark]')).toHaveLength(9);
    expect(container.querySelectorAll('.truco-tally__mark--new')).toHaveLength(
      4,
    );
  });
});

describe('truco screens', () => {
  it('creates truco directly from the registry while canastra keeps setup', async () => {
    const repository = createFakeRepository();
    renderApp('/', repository);

    expect(screen.getByRole('link', { name: 'Canastra' })).toHaveAttribute(
      'href',
      '/nova/canastra',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Truco mineiro' }));

    expect(
      await screen.findByRole('heading', { name: 'Truco mineiro' }),
    ).toBeInTheDocument();
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      gameId: 'truco',
      target: 12,
      allowNegativeEntries: false,
      teams: [{ name: 'Nós' }, { name: 'Eles' }],
    });
    expect(document.querySelector('[data-game="truco"]')).not.toBeNull();
  });

  it('never renders setup when the direct truco URL is opened', async () => {
    const repository = createFakeRepository();
    renderApp('/nova/truco', repository);

    expect(
      screen.queryByRole('textbox', { name: 'Pontos para vencer' }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Truco mineiro' }),
    ).toBeInTheDocument();
    expect(repository.current()).toHaveLength(1);
  });

  it('adds, subtracts and undoes raised points without rendering a log', async () => {
    const repository = createFakeRepository([trucoMatch()]);
    renderApp('/partida/truco-1', repository);

    const usScore = await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 0 pontos',
    });
    const subtract = screen.getByRole('button', {
      name: 'Remover 1 ponto de Nós',
    });
    expect(subtract).toBeDisabled();
    expect(screen.queryByText('Lançamentos')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar 1 ponto para Nós' }),
    );
    await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 1 ponto',
    });
    expect(usScore.querySelectorAll('.truco-tally__mark--new')).toHaveLength(1);
    expect(subtract).toBeEnabled();
    fireEvent.click(subtract);
    await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 0 pontos',
    });

    fireEvent.click(usScore);
    const dialog = screen.getByRole('dialog', { name: 'Nós' });
    expect(
      within(dialog).getByRole('button', { name: 'Truco +3' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Seis +6' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Doze +12' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Na mão de onze ou de ferro, use apenas as opções daquela mão.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Nove +9' }));

    await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 9 pontos',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer último' }));
    await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 0 pontos',
    });
    expect(currentMatch(repository).entries).toHaveLength(2);
  });

  it('dismisses a raised-value sheet without recording and restores focus', async () => {
    const repository = createFakeRepository([trucoMatch()]);
    renderApp('/partida/truco-1', repository);

    const usScore = await screen.findByRole('button', {
      name: 'Abrir opções de Nós. Placar: 0 pontos',
    });
    fireEvent.click(usScore);
    fireEvent.click(
      screen.getByRole('button', { name: 'Fechar opções de pontuação' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(usScore).toHaveFocus());
    expect(currentMatch(repository).entries).toHaveLength(0);

    fireEvent.click(usScore);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    fireEvent.click(usScore);
    fireEvent.popState(window);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(currentMatch(repository).entries).toHaveLength(0);
  });

  it.each([
    ['Vitória: Nós +3', [14, 0], 'mão de onze'],
    ['Vitória: Eles +3', [11, 3], 'mão de onze'],
    ['Correu: Nós +1 para Eles', [11, 1], 'correu'],
  ])(
    'records the mão de onze outcome %s with its note',
    async (buttonName, expectedScores, note) => {
      const repository = createFakeRepository([trucoMatch({ us: 11 })]);
      renderApp('/partida/truco-1', repository);

      expect(
        await screen.findByRole('heading', { name: 'Mão de onze' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Equipe Nós: 11 pontos')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Abrir opções/ }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: buttonName }));

      await waitFor(() => {
        expect(
          TRUCO.scoreboard(currentMatch(repository)).standings.map(
            ({ score }) => score,
          ),
        ).toEqual(expectedScores);
      });
      expect(currentMatch(repository).entries.at(-1)?.note).toBe(note);

      if (expectedScores[0] === 11) {
        expect(
          screen.getByRole('heading', { name: 'Mão de onze' }),
        ).toBeInTheDocument();
        fireEvent.click(
          screen.getByRole('button', { name: 'Desfazer último' }),
        );
        await waitFor(() =>
          expect(currentMatch(repository).entries).toHaveLength(1),
        );
        expect(
          screen.getByRole('heading', { name: 'Mão de onze' }),
        ).toBeInTheDocument();
      }
    },
  );

  it('offers only two mão de ferro outcomes and reaches fourteen', async () => {
    const repository = createFakeRepository([trucoMatch({ us: 11, them: 11 })]);
    renderApp('/partida/truco-1', repository);

    expect(
      await screen.findByRole('heading', { name: 'Mão de ferro' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Vitória:/ })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: /Correu/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Vitória: Nós +3' }));

    expect(
      await screen.findByRole('button', {
        name: 'Abrir opções de Nós. Placar: 14 pontos',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nós vencemos!')).toBeInTheDocument();
    expect(currentMatch(repository).entries.at(-1)?.note).toBe('mão de ferro');
  });

  it('announces a winner without auto-finishing or hiding live controls', async () => {
    const repository = createFakeRepository([trucoMatch({ us: 12 })]);
    renderApp('/partida/truco-1', repository);

    expect(await screen.findByText('Nós vencemos!')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Adicionar 1 ponto para Nós' }),
    ).toBeInTheDocument();
    expect(currentMatch(repository).finishedAt).toBeNull();
  });

  it('finishes, reopens and preserves a finished match when starting another', async () => {
    const repository = createFakeRepository([trucoMatch({ us: 14 })]);
    renderApp('/partida/truco-1', repository);

    await screen.findByText('Nós vencemos!');
    fireEvent.click(screen.getByRole('button', { name: 'Opções da partida' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Encerrar partida' }));

    expect(
      await screen.findByRole('heading', { name: 'Fim de partida' }),
    ).toBeInTheDocument();
    expect(screen.getByText('NÓS VENCEMOS!')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Nós: 14 pontos' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Adicionar 1 ponto para Nós' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reabrir' }));
    expect(await screen.findByText('Nós vencemos!')).toBeInTheDocument();
    expect(currentMatch(repository).finishedAt).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Opções da partida' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Encerrar partida' }));
    await screen.findByText('NÓS VENCEMOS!');
    fireEvent.click(screen.getByRole('button', { name: 'Nova partida' }));

    await waitFor(() => expect(repository.current()).toHaveLength(2));
    expect(
      repository.current().find(({ id }) => id === 'truco-1')?.finishedAt,
    ).not.toBeNull();
    expect(
      repository.current().find(({ id }) => id !== 'truco-1'),
    ).toMatchObject({
      gameId: 'truco',
      target: 12,
      entries: [],
    });
  });

  it('uses a neutral finished message and the shared delete confirmation', async () => {
    const repository = createFakeRepository([
      trucoMatch({ finished: true, us: 6, them: 3 }),
    ]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp('/partida/truco-1', repository);

    expect(await screen.findByText('PARTIDA ENCERRADA')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    await waitFor(() => expect(repository.current()).toHaveLength(0));
    expect(confirm).toHaveBeenCalledWith(
      'Apagar esta partida? Esta ação não pode ser desfeita.',
    );
    expect(
      await screen.findByRole('heading', { name: 'Novo placar' }),
    ).toBeInTheDocument();
  });
});
