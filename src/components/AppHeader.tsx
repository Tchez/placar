import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../app/routes';

export function AppHeader() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/partida/')) return null;

  return (
    <header className="app-header">
      <Link className="app-header__title" to={ROUTES.home}>
        Placar
      </Link>
    </header>
  );
}
