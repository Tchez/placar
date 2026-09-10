import { useDocumentMeta } from '../app/useDocumentMeta';
import { HubHeader } from '../components/HubHeader';
import { MatchRow } from '../components/MatchRow';
import { GAMES } from '../games';
import { useMatches } from '../store/MatchStore';

function newestFirst<T extends { createdAt: string }>(values: readonly T[]) {
  return [...values].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function ActiveMatchesScreen() {
  useDocumentMeta(
    'Em andamento — Placar',
    'Partidas em andamento neste aparelho, com o placar sempre à mão.',
  );
  const { isLoading, matches } = useMatches();
  const activeMatches = newestFirst(
    matches.filter((match) => match.finishedAt === null),
  );

  return (
    <div className="hub-screen hub-list-screen">
      <HubHeader title="Em andamento" variant="back" />
      <section aria-labelledby="all-active-title">
        <span className="hub-eyebrow">PARTIDAS</span>
        <h1 id="all-active-title">Todas em andamento</h1>
        {!isLoading && activeMatches.length === 0 ? (
          <p className="hub-empty-state">Nenhuma partida em andamento.</p>
        ) : (
          <div className="hub-match-list">
            {activeMatches.map((match) => {
              const game = GAMES.find(({ id }) => id === match.gameId);
              return game ? (
                <MatchRow game={game} key={match.id} match={match} />
              ) : null;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
