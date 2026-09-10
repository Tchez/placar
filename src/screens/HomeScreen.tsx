import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatNumber } from '../app/format';
import { matchPath, newMatchPath, ROUTES } from '../app/routes';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { gameAccentStyle } from '../components/gameAccent';
import { GameBadge } from '../components/GameBadge';
import { HubHeader } from '../components/HubHeader';
import { ChevronRightIcon, FlagIcon } from '../components/HubIcons';
import { MatchRow } from '../components/MatchRow';
import { GAMES, type RegisteredGame } from '../games';
import { createDefaultMatchInput } from '../games/createDefaultMatchInput';
import { useInstall } from '../install/InstallProvider';
import { useMatches } from '../store/MatchStore';

function GameCard({
  disabled,
  game,
  isCreating,
  onStart,
}: {
  disabled: boolean;
  game: RegisteredGame;
  isCreating: boolean;
  onStart(game: RegisteredGame): void;
}) {
  const content = (
    <>
      <GameBadge game={game} size="large" />
      <span className="hub-game-card__copy">
        <strong>{isCreating ? 'Começando…' : game.label}</strong>
        <span>{game.hub.description}</span>
      </span>
      <ChevronRightIcon className="hub-game-card__chevron" />
    </>
  );
  const className = 'hub-game-card';
  const style = gameAccentStyle(game);

  return game.needsSetup ? (
    <Link className={className} style={style} to={newMatchPath(game.id)}>
      {content}
    </Link>
  ) : (
    <button
      className={className}
      disabled={disabled}
      style={style}
      type="button"
      onClick={() => onStart(game)}
    >
      {content}
    </button>
  );
}

export function HomeScreen() {
  useDocumentMeta(
    'Placar',
    'Placar para os jogos da família: canastra, truco mineiro, truco gaudério e vôlei. Instalável, funciona offline, sem cadastro.',
  );
  const navigate = useNavigate();
  const { isInstalled } = useInstall();
  const { createMatch, isLoading, matches } = useMatches();
  const [creatingGameId, setCreatingGameId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState('');
  const activeMatches = matches
    .filter((match) => match.finishedAt === null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );

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
    <div className="hub-screen home-screen">
      <HubHeader />

      <section className="hub-games" aria-labelledby="games-title">
        <header className="hub-section-intro">
          <span className="hub-eyebrow">JOGOS</span>
          <h1 id="games-title">Novo placar</h1>
          <p>Escolha um jogo para começar</p>
        </header>
        <div className="hub-game-list">
          {GAMES.map((game) => (
            <GameCard
              disabled={creatingGameId !== null}
              game={game}
              isCreating={creatingGameId === game.id}
              key={game.id}
              onStart={(selectedGame) => void startGame(selectedGame)}
            />
          ))}
        </div>
        {creationError ? (
          <p className="field-error" role="alert">
            {creationError}
          </p>
        ) : null}
        <div className="hub-coming-ornament" aria-hidden="true">
          <span />
          <small>Mais jogos em breve</small>
          <span />
        </div>
      </section>

      {!isLoading && activeMatches.length > 0 ? (
        <section
          className="hub-active-matches"
          aria-labelledby="active-matches-title"
        >
          <div className="hub-section-heading">
            <h2 id="active-matches-title">Em andamento</h2>
            <div>
              <span className="hub-section-count">
                {formatNumber(activeMatches.length)}
              </span>
              <Link to={ROUTES.activeMatches}>Ver todos ›</Link>
            </div>
          </div>
          <div className="hub-match-list">
            {activeMatches.slice(0, 3).map((match) => {
              const game = GAMES.find(({ id }) => id === match.gameId);
              return game ? (
                <MatchRow game={game} key={match.id} match={match} />
              ) : null;
            })}
          </div>
        </section>
      ) : null}

      <footer className="hub-footer">
        {!isInstalled ? (
          <Link className="hub-install-strip" to={ROUTES.install}>
            <FlagIcon />
            <span>Instale o Placar neste aparelho</span>
            <ChevronRightIcon />
          </Link>
        ) : null}
        <span className="build-version" aria-label="Versão do aplicativo">
          versão {__BUILD_VERSION__}
        </span>
      </footer>
    </div>
  );
}
