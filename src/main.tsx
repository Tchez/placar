import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { InstallProvider } from './install/InstallProvider';
import { MatchProvider } from './store/MatchStore';
import './styles/tokens.css';
import './styles/hub-tokens.css';
import './styles/base.css';
import './styles/hub.css';
import './styles/games/canastra-setup.css';

registerSW({ immediate: true });

const root = document.getElementById('root');

if (!root) {
  throw new Error('Não foi possível iniciar o aplicativo.');
}

createRoot(root).render(
  <StrictMode>
    <InstallProvider>
      <MatchProvider>
        <App />
      </MatchProvider>
    </InstallProvider>
  </StrictMode>,
);
