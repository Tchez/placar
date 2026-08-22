import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { HomeScreen } from '../screens/HomeScreen';
import { ROUTES } from './routes';

export function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <AppHeader />
        <main className="app-content">
          <Routes>
            <Route path={ROUTES.home} element={<HomeScreen />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
