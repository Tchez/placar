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
import { addEntry, createMatch, finishMatch } from '../domain/match';
import type { Entry, Match } from '../domain/types';
import { InstallProvider } from '../install/InstallProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { NewMatchScreen } from '../screens/NewMatchScreen';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { MatchstickScore } from './TrucoGauderioMatchView';

function createFakeRepository(
  initial: readonly Match[] = [],
): MatchRepository & {
  current(): readonly Match[];
  saved: Match[];
} {
  let matches = [...initial];
  const saved: Match[] = [];
  return {
    current: () => matches,
    saved,
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

function pointEntry(id: string, teamId: string, value: 1 | -1 = 1): Entry {
  return {
    id,
    teamId,
    value,
    note: '',
    createdAt: '2026-08-23T12:01:00.000Z',
  };
}

function gauderioMatch(options?: {
  finished?: boolean;
  them?: number;
  us?: number;
}): Match {
  let match = createMatch({
    id: 'gauderio-1',
    gameId: 'truco-gauderio',
    teams: [
      { id: 'team-us', name: 'Nós' },
      { id: 'team-them', name: 'Eles' },
    ],
    target: null,
    allowNegativeEntries: false,
    createdAt: '2026-08-23T12:00:00.000Z',
  });

  for (let index = 0; index < (options?.us ?? 0); index += 1) {
    match = addEntry(match, pointEntry(`us-${index}`, 'team-us'));
  }
  for (let index = 0; index < (options?.them ?? 0); index += 1) {
    match = addEntry(match, pointEntry(`them-${index}`, 'team-them'));
  }

  return options?.finished
    ? finishMatch(match, '2026-08-23T13:00:00.000Z')
    : match;
}

function renderApp(path: string, repository: MatchRepository) {
  return render(
    <InstallProvider>
      <MatchProvider repository={repository}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.home} element={<HomeScreen />} />
            <Route path={ROUTES.newMatch} element={<NewMatchScreen />} />
            <Route path={ROUTES.match} element={<MatchScreen />} />
          </Routes>
        </MemoryRouter>
      </MatchProvider>
    </InstallProvider>,
  );
}

function currentMatch(repository: ReturnType<typeof createFakeRepository>) {
  const match = repository.current().find(({ id }) => id === 'gauderio-1');
  if (!match) throw new Error('Expected gaudério match');
  return match;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gaudério matchsticks', () => {
  it.each([
    [4, 0, 4],
    [5, 1, 0],
    [12, 2, 2],
    [24, 4, 4],
  ])(
    'renders %i as %i closed boxes and %i loose sticks without text',
    (score, boxes, loose) => {
      const { container } = render(
        <MatchstickScore score={score} team={{ id: 'team-us', name: 'Nós' }} />,
      );

      expect(container.querySelectorAll('[data-matchstick-box]')).toHaveLength(
        boxes,
      );
      expect(
        container.querySelectorAll('[data-loose-matchstick]'),
      ).toHaveLength(loose);
      expect(container.querySelectorAll('[data-matchstick]')).toHaveLength(
        boxes * 5 + loose,
      );
      expect(container).toHaveTextContent('');
      expect(
        screen.getByRole('group', { name: `Nós: ${score} pontos` }),
      ).toBeInTheDocument();
    },
  );

  it('redraws the derived total with no animation hook', () => {
    const { container, rerender } = render(
      <MatchstickScore score={4} team={{ id: 'team-us', name: 'Nós' }} />,
    );

    rerender(
      <MatchstickScore score={5} team={{ id: 'team-us', name: 'Nós' }} />,
    );
    expect(container.querySelectorAll('[data-matchstick]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-matchstick-box]')).toHaveLength(1);

    rerender(
      <MatchstickScore score={4} team={{ id: 'team-us', name: 'Nós' }} />,
    );
    expect(container.querySelectorAll('[data-matchstick]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-matchstick-box]')).toHaveLength(0);
  });
});

describe('truco gaudério screens', () => {
  it('starts directly from the registry and remains listed in progress', async () => {
    const repository = createFakeRepository();
    renderApp('/', repository);

    fireEvent.click(screen.getByRole('button', { name: /Truco gaudério/ }));

    expect(
      await screen.findByRole('heading', { name: 'Truco gaudério' }),
    ).toBeInTheDocument();
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      gameId: 'truco-gauderio',
      target: null,
      allowNegativeEntries: false,
      teams: [{ name: 'Nós' }, { name: 'Eles' }],
    });
    expect(
      document.querySelector('[data-game="truco-gauderio"]'),
    ).not.toBeNull();
    expect(
      screen.queryByRole('textbox', { name: 'Pontos para vencer' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' }));
    expect(
      await screen.findByRole('heading', { name: 'Em andamento' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nós × Eles')).toBeInTheDocument();
    expect(screen.getAllByText('Truco gaudério')).toHaveLength(2);
    expect(screen.queryByText(/Meta: sem meta/)).not.toBeInTheDocument();
  });

  it('offers only unit scoring, prevents negatives and has no rules or log UI', async () => {
    const repository = createFakeRepository([gauderioMatch()]);
    renderApp('/partida/gauderio-1', repository);

    await screen.findByRole('heading', { name: 'Truco gaudério' });
    const add = screen.getByRole('button', {
      name: 'Adicionar 1 ponto para Nós',
    });
    const subtract = screen.getByRole('button', {
      name: 'Remover 1 ponto de Nós',
    });

    expect(subtract).toBeDisabled();
    expect(
      screen.queryByText(/Mão de onze|Mão de ferro/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Lançamentos')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Renomear/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Truco \+3/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(add);
    expect(
      await screen.findByRole('group', { name: 'Nós: 1 ponto' }),
    ).toBeInTheDocument();
    expect(currentMatch(repository).entries.at(-1)?.value).toBe(1);
    expect(subtract).toBeEnabled();

    fireEvent.click(subtract);
    await screen.findByRole('group', { name: 'Nós: 0 pontos' });
    expect(currentMatch(repository).entries.at(-1)?.value).toBe(-1);
    expect(subtract).toBeDisabled();
  });

  it('disables both increments at 24 while keeping correction live and does not finish', async () => {
    const repository = createFakeRepository([gauderioMatch({ us: 23 })]);
    renderApp('/partida/gauderio-1', repository);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Adicionar 1 ponto para Nós',
      }),
    );
    await screen.findByRole('group', { name: 'Nós: 24 pontos' });

    expect(
      screen.getByRole('button', { name: 'Adicionar 1 ponto para Nós' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Adicionar 1 ponto para Eles' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Remover 1 ponto de Nós' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Desfazer último' }),
    ).toBeEnabled();
    expect(currentMatch(repository).finishedAt).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Truco gaudério' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/VENCEMOS|VENCERAM/)).not.toBeInTheDocument();
  });

  it('undoes only the last entry and disables undo when the log is empty', async () => {
    const repository = createFakeRepository([gauderioMatch({ us: 1 })]);
    renderApp('/partida/gauderio-1', repository);

    const undo = await screen.findByRole('button', {
      name: 'Desfazer último',
    });
    fireEvent.click(undo);
    await screen.findByRole('group', { name: 'Nós: 0 pontos' });
    expect(currentMatch(repository).entries).toEqual([]);
    expect(undo).toBeDisabled();
  });

  it('closes options with Escape and browser back without changing the match', async () => {
    const repository = createFakeRepository([gauderioMatch({ us: 1 })]);
    renderApp('/partida/gauderio-1', repository);

    const options = await screen.findByRole('button', {
      name: 'Opções da partida',
    });
    fireEvent.click(options);
    expect(
      screen.getByRole('dialog', { name: 'Opções da partida' }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    fireEvent.click(options);
    fireEvent.popState(window);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(currentMatch(repository).entries).toHaveLength(1);
  });

  it('shows exactly three option rows and distinguishes resetting from deleting', async () => {
    const repository = createFakeRepository([
      gauderioMatch({ us: 2, them: 1 }),
    ]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp('/partida/gauderio-1', repository);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Opções da partida' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Opções da partida' });
    const rows = dialog.querySelectorAll(
      '.gauderio-options-sheet__rows > button',
    );
    expect(rows).toHaveLength(3);
    expect(
      within(dialog).getByRole('button', { name: /^Encerrar partida/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /^Resetar pontos/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /^Apagar partida/ }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole('button', { name: /^Resetar pontos/ }),
    );
    await waitFor(() => expect(currentMatch(repository).entries).toEqual([]));
    expect(currentMatch(repository)).toMatchObject({
      id: 'gauderio-1',
      teams: [
        { id: 'team-us', name: 'Nós' },
        { id: 'team-them', name: 'Eles' },
      ],
      finishedAt: null,
    });
    expect(
      screen.getByRole('button', { name: 'Desfazer último' }),
    ).toBeDisabled();
    expect(repository.current()).toHaveLength(1);
    expect(confirm).toHaveBeenCalledWith(
      'Resetar os pontos desta partida? Esta ação não pode ser desfeita.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Opções da partida' }));
    fireEvent.click(screen.getByRole('button', { name: /^Apagar partida/ }));
    await waitFor(() => expect(repository.current()).toHaveLength(0));
    expect(confirm).toHaveBeenCalledWith(
      'Apagar esta partida? Esta ação não pode ser desfeita.',
    );
  });

  it.each([
    [24, 0, 'NÓS VENCEMOS!'],
    [0, 24, 'ELES VENCERAM!'],
    [12, 6, 'PARTIDA ENCERRADA'],
    [24, 24, 'PARTIDA ENCERRADA'],
  ])(
    'shows the derived finished message for %i × %i',
    async (us, them, message) => {
      const repository = createFakeRepository([
        gauderioMatch({ finished: true, them, us }),
      ]);
      renderApp('/partida/gauderio-1', repository);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Fim de partida' }),
      ).toBeInTheDocument();
      const finalBoard = screen.getByRole('region', { name: 'Placar final' });
      expect(finalBoard).not.toHaveTextContent(/\d/);
      expect(
        within(finalBoard).getByRole('group', {
          name: `Nós: ${us} ${us === 1 ? 'ponto' : 'pontos'}`,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Adicionar 1 ponto para Nós' }),
      ).not.toBeInTheDocument();
    },
  );

  it('reopens a finished match and starts a fresh one without removing it', async () => {
    const repository = createFakeRepository([
      gauderioMatch({ finished: true, us: 24 }),
    ]);
    renderApp('/partida/gauderio-1', repository);

    fireEvent.click(await screen.findByRole('button', { name: 'Reabrir' }));
    expect(
      await screen.findByRole('heading', { name: 'Truco gaudério' }),
    ).toBeInTheDocument();
    expect(currentMatch(repository).finishedAt).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Opções da partida' }));
    fireEvent.click(screen.getByRole('button', { name: /^Encerrar partida/ }));
    await screen.findByRole('heading', { name: 'Fim de partida' });
    fireEvent.click(screen.getByRole('button', { name: 'Nova partida' }));

    await waitFor(() => expect(repository.current()).toHaveLength(2));
    expect(currentMatch(repository).finishedAt).not.toBeNull();
    expect(
      repository.current().find(({ id }) => id !== 'gauderio-1'),
    ).toMatchObject({
      gameId: 'truco-gauderio',
      target: null,
      entries: [],
      finishedAt: null,
    });
    expect(
      await screen.findByRole('heading', { name: 'Truco gaudério' }),
    ).toBeInTheDocument();
  });
});
