import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES, matchPath } from '../app/routes';
import { createMatch } from '../domain/match';
import type { Match } from '../domain/types';
import { InstallProvider } from '../install/InstallProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ActiveMatchesScreen } from '../screens/ActiveMatchesScreen';
import { NewMatchScreen } from '../screens/NewMatchScreen';
import { createLocalRepository } from '../storage/localRepository';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { GAMES, getGame } from '.';
import { createDefaultMatchInput } from './createDefaultMatchInput';

const repository = createLocalRepository();
function mount(path: string, repo: MatchRepository = repository) {
  return render(
    <InstallProvider>
      <MatchProvider repository={repo}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.home} element={<HomeScreen />} />
            <Route path={ROUTES.newMatch} element={<NewMatchScreen />} />
            <Route path={ROUTES.match} element={<MatchScreen />} />
            <Route path={ROUTES.history} element={<HistoryScreen />} />
            <Route
              path={ROUTES.activeMatches}
              element={<ActiveMatchesScreen />}
            />
          </Routes>
        </MemoryRouter>
      </MatchProvider>
    </InstallProvider>,
  );
}
async function seed(savedToHistory = false) {
  const match = createMatch({
    ...createDefaultMatchInput(getGame('volei')),
    savedToHistory,
  });
  await repository.save(match);
  return match;
}
async function click(name: string | RegExp) {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => {
    const options = screen.queryByRole('button', { name: 'Mais opções' });
    if (options) expect(options).toBeEnabled();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('vôlei match flow', () => {
  it.each([0, 1, 2, 3])(
    'keeps %i-set controls visually stable while blocking actions during a point write',
    async (sets) => {
      const match = await seed();
      await repository.save({
        ...match,
        entries: Array.from({ length: sets }, (_, index) => ({
          id: `set-${index}`,
          teamId: match.teams[0]!.id,
          value: 1,
          note: 'set',
          createdAt: match.createdAt,
        })),
      });
      let release = () => {};
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      const save = vi.fn(async (changed: Match) => {
        await pending;
        await repository.save(changed);
      });
      mount(matchPath(match.id), { ...repository, save });
      const setEntry = await screen.findByRole('button', {
        name: new RegExp(`^${sets} sets? à esquerda`),
      });
      const setBack = screen.getByRole('button', {
        name: 'Voltar set à esquerda',
      });
      const initialDisabled = [
        setEntry.hasAttribute('disabled'),
        setBack.hasAttribute('disabled'),
      ];
      fireEvent.click(
        screen.getByRole('button', { name: 'Adicionar ponto à direita' }),
      );
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      expect(setEntry).toHaveAttribute('aria-disabled', 'true');
      expect(setBack).toHaveAttribute('aria-disabled', 'true');
      expect([
        setEntry.hasAttribute('disabled'),
        setBack.hasAttribute('disabled'),
      ]).toEqual(initialDisabled);
      fireEvent.click(setEntry);
      fireEvent.click(setBack);
      expect(save).toHaveBeenCalledTimes(1);
      await act(async () => release());
      expect(
        await screen.findByRole('img', { name: '1 ponto à direita' }),
      ).toBeInTheDocument();
      expect(setEntry).toHaveAccessibleName(
        new RegExp(`^${sets} sets? à esquerda`),
      );
      expect(setBack).toHaveAttribute('aria-disabled', String(sets === 0));
      expect(setEntry).toHaveAttribute('aria-disabled', String(sets === 3));
    },
  );

  it('starts directly from the hub without setup or names', async () => {
    const app = mount('/');
    await click(/Vôlei/);
    expect(
      await screen.findByRole('img', { name: '0 pontos à esquerda' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Nós')).not.toBeInTheDocument();
    expect(screen.queryByText('Eles')).not.toBeInTheDocument();
    const stored = (await repository.loadAll())[0]!;
    expect(stored.savedToHistory).toBe(false);
    expect(stored.target).toBeNull();
    app.unmount();
  });

  it('records independent points and sets, corrects each side and persists across reloads', async () => {
    const match = await seed();
    const app = mount(matchPath(match.id));
    const confirm = vi.spyOn(window, 'confirm');
    await click('Adicionar ponto à esquerda');
    await click('Adicionar ponto à direita');
    await click('0 sets à esquerda, adicionar set');
    expect(
      screen.getByRole('img', { name: '1 ponto à esquerda' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '1 ponto à direita' }),
    ).toBeInTheDocument();
    await click('Voltar ponto à esquerda');
    expect(
      screen.getByRole('img', { name: '0 pontos à esquerda' }),
    ).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    await click('Zerar pontos à direita');
    expect(
      screen.getByRole('img', { name: '0 pontos à direita' }),
    ).toBeInTheDocument();
    await click('Voltar set à esquerda');
    expect(
      screen.getByRole('button', { name: '0 sets à esquerda, adicionar set' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Voltar set à esquerda' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Voltar ação' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zerar pontos à esquerda' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Voltar ponto à esquerda' }),
    ).toBeDisabled();
    app.unmount();
    const history = mount(ROUTES.history);
    expect(
      await screen.findByText('Nenhuma partida ainda.'),
    ).toBeInTheDocument();
    history.unmount();
    const active = mount(ROUTES.activeMatches);
    expect(
      await screen.findByRole('link', { name: /Vôlei.*0 × 0/ }),
    ).toBeInTheDocument();
    active.unmount();
    mount(matchPath(match.id));
    expect(
      await screen.findByRole('img', { name: '0 pontos à direita' }),
    ).toBeInTheDocument();
    await click('Adicionar ponto à esquerda');
    expect(
      screen.getByRole('img', { name: '1 ponto à esquerda' }),
    ).toBeInTheDocument();
    await click('Voltar ponto à esquerda');
    expect(
      screen.getByRole('img', { name: '0 pontos à esquerda' }),
    ).toBeInTheDocument();
  });

  it('limits each side to three sets and points to fifty', async () => {
    const match = await seed();
    mount(matchPath(match.id));
    await click('0 sets à esquerda, adicionar set');
    await click('1 set à esquerda, adicionar set');
    await click('2 sets à esquerda, adicionar set');
    const capped = screen.getByRole('button', {
      name: '3 sets à esquerda, limite de 3 sets',
    });
    expect(capped).toBeDisabled();
    expect(
      screen.getByRole('img', { name: '0 pontos à esquerda' }),
    ).toBeInTheDocument();
    await click('Voltar set à esquerda');
    expect(
      screen.getByRole('button', { name: '2 sets à esquerda, adicionar set' }),
    ).toBeEnabled();
    for (let point = 0; point < 50; point += 1) {
      await click('Adicionar ponto à esquerda');
    }
    const cappedPoints = screen.getByRole('button', {
      name: '50 pontos à esquerda, limite de 50 pontos',
    });
    expect(cappedPoints).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Voltar ponto à esquerda' }),
    ).toBeEnabled();
  });

  it('saves from options without finishing and never offers to unsave', async () => {
    const match = await seed();
    mount(matchPath(match.id));
    await click('Mais opções');
    await click('Salvar partida');
    expect((await repository.loadAll())[0]).toMatchObject({
      savedToHistory: true,
      finishedAt: null,
    });
    await click('Mais opções');
    expect(
      screen.queryByRole('button', { name: 'Salvar partida' }),
    ).not.toBeInTheDocument();
    await click('Histórico de partidas');
    expect(
      await screen.findByRole('link', { name: /Vôlei.*0 × 0/ }),
    ).toBeInTheDocument();
  });

  it('opening history leaves an unsaved match in storage', async () => {
    const match = await seed();
    mount(matchPath(match.id));
    await click('Mais opções');
    await click('Histórico de partidas');
    expect(
      await screen.findByText('Nenhuma partida ainda.'),
    ).toBeInTheDocument();
    expect((await repository.loadAll())[0]).toMatchObject({
      savedToHistory: false,
      finishedAt: null,
    });
  });

  it.each(['Voltar ao início', 'Encerrar partida'])(
    'saves on %s and preserves the intended finished state',
    async (trigger) => {
      const match = await seed();
      mount(matchPath(match.id));
      await click(trigger);
      expect(
        screen.getByRole('dialog', {
          name: 'Salvar esta partida no histórico?',
        }),
      ).toBeInTheDocument();
      await click('Sim');
      const saved = (await repository.loadAll())[0]!;
      expect(saved.savedToHistory).toBe(true);
      if (trigger === 'Encerrar partida') {
        expect(saved.finishedAt).not.toBeNull();
        expect(screen.getByText('Encerrada')).toBeInTheDocument();
        expect(
          screen.queryByText(/venceu|vencemos|venceram/i),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Adicionar ponto à esquerda' }),
        ).not.toBeInTheDocument();
        await click('Reabrir partida');
        expect((await repository.loadAll())[0]?.finishedAt).toBeNull();
        await click('Encerrar partida');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await click('Voltar ao início');
      } else expect(saved.finishedAt).toBeNull();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        await screen.findByText('Mais jogos em breve'),
      ).toBeInTheDocument();
    },
  );

  it.each(['Voltar ao início', 'Encerrar partida'])(
    'really deletes on declining %s, including after remount',
    async (trigger) => {
      const match = await seed();
      const app = mount(matchPath(match.id));
      const confirm = vi.spyOn(window, 'confirm');
      await click(trigger);
      await click('Não');
      expect(await repository.loadAll()).toEqual([]);
      expect(confirm).not.toHaveBeenCalled();
      app.unmount();
      const reopened = mount(matchPath(match.id));
      expect(
        await screen.findByText('Partida não encontrada.'),
      ).toBeInTheDocument();
      reopened.unmount();
      const active = mount(ROUTES.activeMatches);
      expect(
        screen.queryByRole('link', { name: /Vôlei/ }),
      ).not.toBeInTheDocument();
      active.unmount();
      mount(ROUTES.history);
      expect(
        await screen.findByText('Nenhuma partida ainda.'),
      ).toBeInTheDocument();
    },
  );

  it('can cancel the save prompt and confirms explicit deletion', async () => {
    const match = await seed();
    mount(matchPath(match.id));
    await click('Voltar ao início');
    await click('Cancelar');
    expect((await repository.loadAll())[0]?.savedToHistory).toBe(false);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await click('Mais opções');
    await click('Apagar partida');
    expect(await repository.loadAll()).toHaveLength(1);
    confirm.mockReturnValue(true);
    await click('Mais opções');
    await click('Apagar partida');
    expect(await repository.loadAll()).toHaveLength(0);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('keeps the prompt and data intact after save or discard failures, allowing retry', async () => {
    const match = await seed();
    const save = vi
      .fn(repository.save)
      .mockRejectedValueOnce(new Error('quota'));
    const remove = vi
      .fn(repository.remove)
      .mockRejectedValueOnce(new Error('storage'));
    mount(matchPath(match.id), { ...repository, save, remove });
    await click('Encerrar partida');
    await click('Sim');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tente novamente',
    );
    expect((await repository.loadAll())[0]).toMatchObject({
      savedToHistory: false,
      finishedAt: null,
    });
    await click('Não');
    expect(await repository.loadAll()).toHaveLength(1);
    await click('Sim');
    expect((await repository.loadAll())[0]).toMatchObject({
      savedToHistory: true,
      finishedAt: expect.any(String),
    });
  });

  it('keeps every other game and legacy matches in history, even when their flag is false', async () => {
    const matches: Match[] = GAMES.filter(({ id }) => id !== 'volei').map(
      (game) =>
        createMatch({
          id: game.id,
          gameId: game.id,
          teams: [
            { id: 'a', name: 'Nós' },
            { id: 'b', name: 'Eles' },
          ],
          target: null,
          allowNegativeEntries: false,
          createdAt: '2026-09-09T12:00:00Z',
          savedToHistory: false,
        }),
    );
    const legacy = { ...matches[0]!, id: 'legacy' };
    delete legacy.savedToHistory;
    window.localStorage.setItem(
      'placar:matches',
      JSON.stringify({ version: 2, matches: [...matches, legacy] }),
    );
    await seed();
    mount(ROUTES.history);
    await waitFor(() =>
      expect(screen.getAllByRole('link', { name: /Iniciada em/ })).toHaveLength(
        4,
      ),
    );
    expect(
      (await repository.loadAll()).find(({ id }) => id === 'legacy')
        ?.savedToHistory,
    ).toBe(true);
  });
});
