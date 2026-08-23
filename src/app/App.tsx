import { HashRouter, Route, Routes } from 'react-router-dom';
import { InstallGate } from '../install/InstallGate';
import { ActiveMatchesScreen } from '../screens/ActiveMatchesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InstallScreen } from '../screens/InstallScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { NewMatchScreen } from '../screens/NewMatchScreen';
import { ROUTES } from './routes';

export function App() {
  return (
    <HashRouter>
      <InstallGate>
        <div className="app-shell">
          <main className="app-content">
            <Routes>
              <Route path={ROUTES.home} element={<HomeScreen />} />
              <Route
                path={ROUTES.activeMatches}
                element={<ActiveMatchesScreen />}
              />
              <Route path={ROUTES.history} element={<HistoryScreen />} />
              <Route path={ROUTES.install} element={<InstallScreen />} />
              <Route path={ROUTES.newMatch} element={<NewMatchScreen />} />
              <Route path={ROUTES.match} element={<MatchScreen />} />
            </Routes>
          </main>
        </div>
      </InstallGate>
    </HashRouter>
  );
}
