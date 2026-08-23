import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../app/routes';
import { InstallScreen } from '../screens/InstallScreen';
import { HomeScreen } from '../screens/HomeScreen';
import type { MatchRepository } from '../storage/repository';
import { MatchProvider } from '../store/MatchStore';
import { getInstallPlatform } from './installEnvironment';
import { InstallGate } from './InstallGate';
import {
  type BeforeInstallPromptEvent,
  InstallProvider,
} from './InstallProvider';
import { isInstallDismissed } from './installPreferences';

const defaultUserAgent = navigator.userAgent;

const emptyRepository: MatchRepository = {
  async loadAll() {
    return [];
  },
  async save() {},
  async remove() {},
};

function setDisplayModeStandalone(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });
}

function setNavigatorStandalone(value: boolean) {
  Object.defineProperty(navigator, 'standalone', {
    configurable: true,
    value,
  });
}

function setUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value,
  });
}

function renderFlow(path: string) {
  return render(
    <InstallProvider>
      <MatchProvider repository={emptyRepository}>
        <MemoryRouter initialEntries={[path]}>
          <InstallGate>
            <Routes>
              <Route path={ROUTES.home} element={<HomeScreen />} />
              <Route path={ROUTES.install} element={<InstallScreen />} />
            </Routes>
          </InstallGate>
        </MemoryRouter>
      </MatchProvider>
    </InstallProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  setDisplayModeStandalone(false);
  setNavigatorStandalone(false);
  setUserAgent(defaultUserAgent);
  vi.restoreAllMocks();
});

describe('install flow', () => {
  it('opens automatically on the first browser visit and remembers continuation', async () => {
    const firstVisit = renderFlow(ROUTES.home);

    expect(
      await screen.findByRole('heading', {
        name: 'Instale antes da primeira partida',
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Continuar sem instalar' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Novo placar' }),
    ).toBeInTheDocument();
    expect(isInstallDismissed()).toBe(true);
    expect(
      screen.getByRole('link', { name: 'Instale o Placar neste aparelho' }),
    ).toHaveAttribute('href', '/instalar');

    firstVisit.unmount();
    renderFlow(ROUTES.home);
    expect(
      await screen.findByRole('heading', { name: 'Novo placar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Instale antes da primeira partida',
      }),
    ).not.toBeInTheDocument();
  });

  it('never shows the install screen or footer in display-mode standalone', async () => {
    setDisplayModeStandalone(true);
    renderFlow(ROUTES.install);

    expect(
      await screen.findByRole('heading', { name: 'Novo placar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Instale o Placar neste aparelho' }),
    ).not.toBeInTheDocument();
  });

  it('never shows the install screen or footer with iOS navigator standalone', async () => {
    setNavigatorStandalone(true);
    renderFlow(ROUTES.install);

    expect(
      await screen.findByRole('heading', { name: 'Novo placar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Instale o Placar neste aparelho' }),
    ).not.toBeInTheDocument();
  });

  it('shows the native button only after capturing beforeinstallprompt', async () => {
    renderFlow(ROUTES.install);
    expect(
      screen.queryByRole('button', { name: 'Instalar app' }),
    ).not.toBeInTheDocument();

    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    Object.defineProperties(event, {
      prompt: { value: prompt },
      userChoice: {
        value: Promise.resolve({
          outcome: 'dismissed',
          platform: 'web',
        }),
      },
    });
    window.dispatchEvent(event);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Instalar app' }),
    );
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Instalar app' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('provides complete iOS text instructions and detects touch iPads', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Safari',
    );
    renderFlow(ROUTES.install);

    expect(
      screen.getByText(/Abra este endereço no Safari/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Toque em Compartilhar/)).toBeInTheDocument();
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument();
    expect(
      screen.getByText(/Confirme tocando em Adicionar/),
    ).toBeInTheDocument();
    expect(
      getInstallPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5),
    ).toBe('ios');
  });

  it('gives an unrecognised browser a usable text fallback', () => {
    setUserAgent('ExampleBrowser/1.0');
    renderFlow(ROUTES.install);

    expect(
      screen.getByText(
        'Use a opção Instalar ou Adicionar à tela inicial do seu navegador.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
