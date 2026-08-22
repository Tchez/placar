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
import type { Match } from '../domain/types';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { HomeScreen } from './HomeScreen';
import { MatchScreen } from './MatchScreen';
import { NewMatchScreen } from './NewMatchScreen';

function createFakeRepository(
  initial: readonly Match[] = [],
): MatchRepository & {
  saved: Match[];
} {
  let matches = [...initial];
  const saved: Match[] = [];
  return {
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

function canastraMatch(options?: {
  allowNegativeEntries?: boolean;
  finished?: boolean;
  target?: number;
  withEntry?: boolean;
}): Match {
  let match = createMatch({
    id: 'match-1',
    gameId: 'canastra',
    teams: [
      { id: 'team-us', name: 'Nós' },
      { id: 'team-them', name: 'Eles' },
    ],
    target: options?.target ?? 3000,
    allowNegativeEntries: options?.allowNegativeEntries ?? true,
    createdAt: '2026-08-22T12:00:00.000Z',
  });

  if (options?.withEntry) {
    match = addEntry(match, {
      id: 'entry-1',
      teamId: 'team-us',
      value: 100,
      note: '',
      createdAt: '2026-08-22T12:05:00.000Z',
    });
  }

  return options?.finished
    ? finishMatch(match, '2026-08-22T13:00:00.000Z')
    : match;
}

function renderApp(
  path: string,
  repository: MatchRepository = createFakeRepository(),
) {
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

function getTeamScore(scoreboard: HTMLElement, value: string): HTMLElement {
  const score = within(scoreboard)
    .getAllByText(value)
    .find(({ classList }) => classList.contains('canastra-score__value'));
  if (!score) throw new Error(`Team score not found: ${value}`);
  return score;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('canastra screens', () => {
  it('renders the home picker from the registry without an empty matches section', async () => {
    renderApp('/');

    expect(screen.getByLabelText('Versão do aplicativo')).toHaveTextContent(
      `versão ${__BUILD_VERSION__}`,
    );
    expect(screen.getByRole('link', { name: 'Canastra' })).toHaveAttribute(
      'href',
      '/nova/canastra',
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Em andamento' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('lists only matches in progress with teams, target, start and current score', async () => {
    const active = addEntry(canastraMatch(), {
      id: 'entry-home',
      teamId: 'team-us',
      value: 385,
      note: '',
      createdAt: '2026-08-22T12:05:00.000Z',
    });
    const finished = finishMatch(
      { ...canastraMatch(), id: 'match-finished' },
      '2026-08-22T13:00:00.000Z',
    );
    renderApp('/', createFakeRepository([active, finished]));

    const section = await screen.findByRole('heading', {
      name: 'Em andamento',
    });
    const link = screen.getByRole('link', {
      name: /Nós × Eles 385 × 0 Meta: 3000 · Iniciada em/,
    });
    expect(section).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/partida/match-1');
    expect(
      screen.queryByRole('link', { name: /match-finished/ }),
    ).not.toBeInTheDocument();
  });

  it('creates a match with the game defaults and free target suggestions', async () => {
    const repository = createFakeRepository();
    renderApp('/nova/canastra', repository);

    const target = screen.getByRole('textbox', {
      name: 'Pontos para vencer',
    });
    const start = screen.getByRole('button', { name: 'Começar partida' });
    expect(target).toHaveValue('');
    expect(start).toBeDisabled();
    expect(
      screen.getByRole('switch', { name: 'Permitir pontos negativos' }),
    ).not.toBeChecked();
    expect(screen.queryByLabelText('Nome do time')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/quantidade de times/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Algumas mesas deixam o time voltar pontos.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Os times começam como/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '3000' }));
    expect(target).toHaveValue('3000');
    fireEvent.click(screen.getByRole('button', { name: '4000' }));
    expect(target).toHaveValue('4000');
    fireEvent.click(start);

    await waitFor(() => expect(repository.saved).toHaveLength(1));
    expect(repository.saved[0]).toMatchObject({
      gameId: 'canastra',
      target: 4000,
      allowNegativeEntries: false,
      teams: [{ name: 'Nós' }, { name: 'Eles' }],
    });
    expect(repository.saved[0]?.teams).toHaveLength(2);
    expect(
      await screen.findByRole('heading', { name: 'Canastra' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Meta: 4K')).toBeInTheDocument();
  });

  it('shows a visible error when creating a match fails', async () => {
    const repository: MatchRepository = {
      async loadAll() {
        return [];
      },
      async save() {
        throw new Error('Storage unavailable');
      },
      async remove() {},
    };
    renderApp('/nova/canastra', repository);

    fireEvent.click(screen.getByRole('button', { name: '3000' }));
    fireEvent.click(screen.getByRole('button', { name: 'Começar partida' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível começar a partida. Tente novamente.',
    );
    expect(
      screen.getByRole('button', { name: 'Começar partida' }),
    ).toBeEnabled();
  });

  it('shows the target validation message and unknown game message', async () => {
    const { unmount } = renderApp('/nova/canastra');
    fireEvent.blur(screen.getByRole('textbox', { name: 'Pontos para vencer' }));
    expect(
      screen.getByText('Informe quantos pontos para vencer.'),
    ).toBeInTheDocument();
    unmount();

    renderApp('/nova/desconhecido');
    expect(screen.getByText('Jogo não encontrado.')).toBeInTheDocument();
  });

  it('keeps team names read-only and gives Canastra its own navigation', async () => {
    const repository = createFakeRepository([canastraMatch()]);
    renderApp('/partida/match-1', repository);

    await screen.findByRole('heading', { name: 'Canastra' });
    expect(
      screen.queryByLabelText('Versão do aplicativo'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Voltar ao início' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Placar')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do time')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Renomear/ }),
    ).not.toBeInTheDocument();
    const scoreboard = screen.getByRole('region', { name: 'Placar' });
    expect(
      within(scoreboard).getByRole('heading', { name: 'Nós' }),
    ).toBeInTheDocument();
    expect(
      within(scoreboard).getByRole('heading', { name: 'Eles' }),
    ).toBeInTheDocument();
    const logToggle = screen.getByRole('button', {
      name: 'Ocultar lançamentos',
    });
    expect(logToggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('heading', { name: 'Lançamentos' }),
    ).toBeInTheDocument();
    fireEvent.click(logToggle);
    expect(
      screen.getByRole('button', { name: 'Mostrar lançamentos' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('heading', { name: 'Lançamentos' }),
    ).not.toBeInTheDocument();
  });

  it('does not round a target that is not an exact thousand', async () => {
    renderApp(
      '/partida/match-1',
      createFakeRepository([canastraMatch({ target: 3500 })]),
    );

    expect(await screen.findByText('Meta: 3.500')).toBeInTheDocument();
  });

  it('shows remaining points, score difference and obrigada emphasis', async () => {
    const matchWithUsScore = addEntry(
      { ...canastraMatch(), target: 4000 },
      {
        id: 'entry-large-score',
        teamId: 'team-us',
        value: 1245,
        note: '',
        createdAt: '2026-08-22T12:10:00.000Z',
      },
    );
    const match = addEntry(matchWithUsScore, {
      id: 'entry-obrigada',
      teamId: 'team-them',
      value: 2000,
      note: '',
      createdAt: '2026-08-22T12:11:00.000Z',
    });
    renderApp('/partida/match-1', createFakeRepository([match]));

    const scoreboard = await screen.findByRole('region', { name: 'Placar' });
    const usScore = within(scoreboard)
      .getAllByText('1.245')
      .find(({ classList }) => classList.contains('canastra-score__value'));
    expect(usScore).toHaveClass('canastra-score__value--compact');
    expect(usScore).not.toHaveClass('canastra-score__value--obrigada');
    expect(
      within(scoreboard).getByLabelText('Faltam 2.755 pontos para Nós'),
    ).toHaveTextContent('2.755');
    const themScore = within(scoreboard)
      .getAllByText('2.000')
      .find(({ classList }) => classList.contains('canastra-score__value'));
    expect(themScore).toHaveClass('canastra-score__value--obrigada');
    expect(
      within(scoreboard).getByLabelText('Diferença de pontos: 755'),
    ).toHaveTextContent('755');
  });

  it('opens the amount modal and closes it without creating an entry', async () => {
    renderApp(
      '/partida/match-1',
      createFakeRepository([canastraMatch({ allowNegativeEntries: true })]),
    );
    await screen.findByRole('heading', { name: 'Lançar pontos' });

    const add = screen.getByRole('button', { name: 'Adicionar pontos' });
    fireEvent.click(add);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(add).toHaveFocus();

    fireEvent.click(add);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(add);
    const backdrop = screen.getByRole('dialog').parentElement;
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('disables point subtraction but still adds points when negatives are off', async () => {
    renderApp(
      '/partida/match-1',
      createFakeRepository([canastraMatch({ allowNegativeEntries: false })]),
    );
    await screen.findByRole('heading', { name: 'Lançar pontos' });

    const subtract = screen.getByRole('button', { name: 'Remover pontos' });
    expect(subtract).toBeDisabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(subtract);

    expect(screen.getByText('Nenhum ponto lançado ainda.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Placar' }))
        .getAllByText('0')
        .filter(({ classList }) => classList.contains('canastra-score__value')),
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pontos' }));
    const dialog = screen.getByRole('dialog', { name: 'Adicionar para Nós' });
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Quantidade de pontos' }),
      { target: { value: '100' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Adicionar pontos' }),
    );
    await waitFor(() =>
      expect(
        getTeamScore(screen.getByRole('region', { name: 'Placar' }), '100'),
      ).toBeInTheDocument(),
    );
  });

  it('accepts a negative entry and advances the team selector when enabled', async () => {
    renderApp(
      '/partida/match-1',
      createFakeRepository([canastraMatch({ allowNegativeEntries: true })]),
    );
    await screen.findByRole('heading', { name: 'Lançar pontos' });

    const usButton = screen.getByRole('button', { name: 'Nós' });
    const themButton = screen.getByRole('button', { name: 'Eles' });
    expect(usButton).toHaveAttribute('aria-pressed', 'true');
    expect(themButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Remover pontos' }));
    const dialog = screen.getByRole('dialog', { name: 'Remover de Nós' });
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Quantidade de pontos' }),
      { target: { value: '100' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remover pontos' }),
    );

    await waitFor(() =>
      expect(themButton).toHaveAttribute('aria-pressed', 'true'),
    );
    const scoreboard = screen.getByRole('region', { name: 'Placar' });
    expect(within(scoreboard).getByText('-100')).toBeInTheDocument();
  });

  it('edits and deletes an entry, recomputing the visible score', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(
      '/partida/match-1',
      createFakeRepository([canastraMatch({ withEntry: true })]),
    );
    const scoreboard = await screen.findByRole('region', { name: 'Placar' });
    expect(getTeamScore(scoreboard, '100')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar 100 pontos de Nós' }),
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Valor do lançamento' }),
      { target: { value: '250' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(getTeamScore(scoreboard, '250')).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Excluir lançamento de Nós' }),
    );
    await screen.findByText('Nenhum ponto lançado ainda.');
    expect(
      within(scoreboard)
        .getAllByText('0')
        .filter(({ classList }) => classList.contains('canastra-score__value')),
    ).toHaveLength(2);
  });

  it('hides editing affordances while finished and restores them on reopen', async () => {
    renderApp(
      '/partida/match-1',
      createFakeRepository([
        canastraMatch({ finished: true, withEntry: true }),
      ]),
    );
    await screen.findByText('Encerrada');

    expect(
      screen.queryByRole('heading', { name: 'Lançar pontos' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Renomear/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Editar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Excluir/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reabrir partida' }));
    await screen.findByRole('heading', { name: 'Lançar pontos' });
    expect(
      screen.getByRole('button', { name: 'Editar 100 pontos de Nós' }),
    ).toBeInTheDocument();
  });

  it('shows the unknown match message after loading', async () => {
    renderApp('/partida/desconhecida');

    expect(
      await screen.findByText('Partida não encontrada.'),
    ).toBeInTheDocument();
  });
});
