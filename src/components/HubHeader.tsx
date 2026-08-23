import { Link } from 'react-router-dom';
import { ROUTES } from '../app/routes';
import { ArrowLeftIcon, HistoryIcon } from './HubIcons';

interface HubHeaderProps {
  backLabel?: string;
  title?: string;
  variant?: 'home' | 'back';
}

export function HubHeader({
  backLabel = 'Voltar ao início',
  title,
  variant = 'home',
}: HubHeaderProps) {
  if (variant === 'back') {
    return (
      <header className="hub-topbar hub-topbar--back">
        <Link
          aria-label={backLabel}
          className="hub-icon-button"
          to={ROUTES.home}
        >
          <ArrowLeftIcon />
        </Link>
        <strong>{title}</strong>
        <span className="hub-topbar__spacer" aria-hidden="true" />
      </header>
    );
  }

  return (
    <header className="hub-topbar">
      <span className="hub-wordmark">Placar</span>
      <Link
        aria-label="Abrir histórico"
        className="hub-icon-button hub-icon-button--history"
        to={ROUTES.history}
      >
        <HistoryIcon />
      </Link>
    </header>
  );
}
