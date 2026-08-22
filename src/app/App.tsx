import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { NewMatchScreen } from '../screens/NewMatchScreen';
import { ROUTES } from './routes';

export function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <AppHeader />
        <main className="app-content">
          <Routes>
            <Route path={ROUTES.home} element={<HomeScreen />} />
            <Route path={ROUTES.newMatch} element={<NewMatchScreen />} />
            <Route path={ROUTES.match} element={<MatchScreen />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
