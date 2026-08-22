import { Link } from 'react-router-dom';
import { matchPath, newMatchPath } from '../app/routes';
import { GAMES } from '../games';
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
  const { isLoading, matches } = useMatches();
  const activeMatches = matches.filter((match) => match.finishedAt === null);

  return (
    <div className="screen home-screen">
      <section aria-labelledby="games-title">
        <header className="screen-heading">
          <span className="eyebrow">Jogos</span>
          <h1 id="games-title">Novo placar</h1>
        </header>
        <div className="game-grid">
          {GAMES.map((game) => (
            <Link
              className="game-card"
              key={game.id}
              to={newMatchPath(game.id)}
            >
              <strong>{game.label}</strong>
            </Link>
          ))}
        </div>
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
    </div>
  );
}
