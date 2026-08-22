import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../app/routes';
import { GAMES } from '../games';
import { useMatches } from '../store/MatchStore';

export function MatchScreen() {
  const { matchId } = useParams();
  const { isLoading, matches } = useMatches();
  const match = matches.find(({ id }) => id === matchId);
  const game = GAMES.find(({ id }) => id === match?.gameId);

  if (isLoading) {
    return <p>Carregando partida…</p>;
  }

  if (!match || !game) {
    return (
      <section className="message-screen">
        <h1>Partida não encontrada.</h1>
        <Link to={ROUTES.home}>Voltar ao início</Link>
      </section>
    );
  }

  const GameMatchView = game.MatchView;
  return <GameMatchView game={game} match={match} />;
}
