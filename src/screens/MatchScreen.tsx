import { Link, useNavigate, useParams } from 'react-router-dom';
import { matchPath, ROUTES } from '../app/routes';
import { GAMES } from '../games';
import { createDefaultMatchInput } from '../games/createDefaultMatchInput';
import { useMatches } from '../store/MatchStore';

export function MatchScreen() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const {
    addEntry,
    createMatch,
    finishMatch,
    isLoading,
    matches,
    removeEntry,
    removeMatch,
    reopenMatch,
    updateEntry,
  } = useMatches();
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
  const actions = {
    addEntry: (entry: Parameters<typeof addEntry>[1]) =>
      addEntry(match.id, entry),
    updateEntry: (entry: Parameters<typeof updateEntry>[1]) =>
      updateEntry(match.id, entry),
    removeEntry: (entryId: string) => removeEntry(match.id, entryId),
    finish: () => finishMatch(match.id, new Date().toISOString()),
    reopen: () => reopenMatch(match.id),
    async remove() {
      if (
        !window.confirm('Apagar esta partida? Esta ação não pode ser desfeita.')
      ) {
        return;
      }
      await removeMatch(match.id);
      navigate(ROUTES.home);
    },
    async createNew() {
      const created = await createMatch(createDefaultMatchInput(game));
      navigate(matchPath(created.id));
      return created;
    },
    goHome: () => navigate(ROUTES.home),
  };

  return (
    <div className="game-match" data-game={game.id}>
      <GameMatchView actions={actions} game={game} match={match} />
    </div>
  );
}
