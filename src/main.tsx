import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { MatchProvider } from './store/MatchStore';
import './styles/tokens.css';
import './styles/base.css';

registerSW({ immediate: true });

const root = document.getElementById('root');

if (!root) {
  throw new Error('Não foi possível iniciar o aplicativo.');
}

createRoot(root).render(
  <StrictMode>
    <MatchProvider>
      <App />
    </MatchProvider>
  </StrictMode>,
);
