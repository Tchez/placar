import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchPath, newMatchPath } from '../app/routes';
import { GAMES, type RegisteredGame } from '../games';
import { createDefaultMatchInput } from '../games/createDefaultMatchInput';
import { useMatches } from '../store/MatchStore';

function formatStartedAt(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { createMatch, isLoading, matches } = useMatches();
  const [creatingGameId, setCreatingGameId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState('');
  const activeMatches = matches.filter((match) => match.finishedAt === null);

  async function startGame(game: RegisteredGame) {
    if (game.needsSetup) {
      navigate(newMatchPath(game.id));
      return;
    }

    setCreationError('');
    setCreatingGameId(game.id);
    try {
      const match = await createMatch(createDefaultMatchInput(game));
      navigate(matchPath(match.id));
    } catch {
      setCreationError('Não foi possível começar a partida. Tente novamente.');
      setCreatingGameId(null);
    }
  }

  return (
    <div className="screen home-screen">
      <section aria-labelledby="games-title">
        <header className="screen-heading">
          <span className="eyebrow">Jogos</span>
          <h1 id="games-title">Novo placar</h1>
        </header>
        <div className="game-grid">
          {GAMES.map((game) => (
            <div key={game.id}>
              {game.needsSetup ? (
                <Link className="game-card" to={newMatchPath(game.id)}>
                  <strong>{game.label}</strong>
                </Link>
              ) : (
                <button
                  className="game-card"
                  disabled={creatingGameId !== null}
                  type="button"
                  onClick={() => void startGame(game)}
                >
                  <strong>
                    {creatingGameId === game.id ? 'Começando…' : game.label}
                  </strong>
                </button>
              )}
            </div>
          ))}
        </div>
        {creationError ? (
          <p className="field-error" role="alert">
            {creationError}
          </p>
        ) : null}
      </section>

      {!isLoading && activeMatches.length > 0 ? (
        <section
          className="active-matches"
          aria-labelledby="active-matches-title"
        >
          <div className="section-heading">
            <h2 id="active-matches-title">Em andamento</h2>
            <span className="section-count">{activeMatches.length}</span>
          </div>
          <div className="match-list">
            {activeMatches.map((match) => {
              const game = GAMES.find(({ id }) => id === match.gameId);
              if (!game) return null;
              const scoreboard = game.scoreboard(match);

              return (
                <Link
                  className="match-row"
                  key={match.id}
                  to={matchPath(match.id)}
                >
                  <span className="match-row__teams">
                    {match.teams.map(({ name }) => name).join(' × ')}
                  </span>
                  <span className="match-row__score">
                    {scoreboard.standings.map(({ score }) => score).join(' × ')}
                  </span>
                  <span className="match-row__meta">
                    Meta: {match.target ?? 'sem meta'} · Iniciada em{' '}
                    {formatStartedAt(match.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <footer className="build-version" aria-label="Versão do aplicativo">
        versão {__BUILD_VERSION__}
      </footer>
    </div>
  );
}
