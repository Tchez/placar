import { Link } from 'react-router-dom';
import { ROUTES } from '../app/routes';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { HubHeader } from '../components/HubHeader';
import { MatchRow } from '../components/MatchRow';
import { GAMES } from '../games';
import { useMatches } from '../store/MatchStore';

export function HistoryScreen() {
  useDocumentMeta(
    'Histórico — Placar',
    'Partidas salvas neste aparelho, com o placar final de cada uma.',
  );
  const { isLoading, matches } = useMatches();
  const orderedMatches = matches
    .filter(
      (match) =>
        GAMES.find(({ id }) => id === match.gameId)?.defaultSavedToHistory !==
          false || match.savedToHistory !== false,
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );

  return (
    <div className="hub-screen hub-list-screen">
      <HubHeader title="Histórico" variant="back" />
      <section aria-labelledby="history-title">
        <span className="hub-eyebrow">HISTÓRICO</span>
        <h1 id="history-title">Suas partidas</h1>
        <p className="hub-local-note">
          Este histórico reúne as partidas salvas neste aparelho.
        </p>
        {!isLoading && orderedMatches.length === 0 ? (
          <div className="hub-empty-state">
            <p>Nenhuma partida ainda.</p>
            <Link to={ROUTES.home}>Escolher um jogo</Link>
          </div>
        ) : (
          <div className="hub-match-list">
            {orderedMatches.map((match) => {
              const game = GAMES.find(({ id }) => id === match.gameId);
              return game ? (
                <MatchRow
                  game={game}
                  key={match.id}
                  match={match}
                  showOutcome
                />
              ) : null;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
