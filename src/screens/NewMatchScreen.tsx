import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createId } from '../app/createId';
import { matchPath, ROUTES } from '../app/routes';
import {
  ArrowLeftIcon,
  DiamondIcon,
  PlayingCardsIcon,
  TrophyIcon,
} from '../components/HubIcons';
import { validateTarget } from '../domain/match';
import { GAMES } from '../games';
import { createDefaultMatchInput } from '../games/createDefaultMatchInput';
import { useMatches } from '../store/MatchStore';

export function NewMatchScreen() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { createMatch } = useMatches();
  const game = GAMES.find(({ id }) => id === gameId);
  const [targetInput, setTargetInput] = useState(
    game?.needsSetup ? String(game.targetSuggestions?.[0] ?? '') : '',
  );
  const [targetTouched, setTargetTouched] = useState(false);
  const [allowNegativeEntries, setAllowNegativeEntries] = useState(
    game?.supportsNegativeEntries ?? false,
  );
  const [creationError, setCreationError] = useState('');
  const [isCreating, setIsCreating] = useState(game?.needsSetup === false);
  const directStartAttempted = useRef(false);

  useEffect(() => {
    if (game?.id !== 'canastra') return;
    document.body.classList.add('canastra-setup-theme');
    return () => document.body.classList.remove('canastra-setup-theme');
  }, [game?.id]);

  useEffect(() => {
    if (!game || game.needsSetup || directStartAttempted.current) return;
    directStartAttempted.current = true;
    void createMatch(createDefaultMatchInput(game))
      .then((match) => navigate(matchPath(match.id), { replace: true }))
      .catch(() => {
        setCreationError(
          'Não foi possível começar a partida. Tente novamente.',
        );
        setIsCreating(false);
      });
  }, [createMatch, game, navigate]);

  if (!game) {
    return (
      <section className="message-screen">
        <h1>Jogo não encontrado.</h1>
        <Link to={ROUTES.home}>Voltar ao início</Link>
      </section>
    );
  }

  if (!game.needsSetup) {
    return (
      <section className="message-screen">
        {creationError ? (
          <>
            <h1>Não foi possível começar a partida.</h1>
            <p className="field-error" role="alert">
              Tente novamente pelo início.
            </p>
            <Link to={ROUTES.home}>Voltar ao início</Link>
          </>
        ) : (
          <h1>{isCreating ? 'Começando partida…' : 'Preparando partida…'}</h1>
        )}
      </section>
    );
  }

  const selectedGame = game;
  const targetValidation = validateTarget(
    targetInput,
    selectedGame.targetRequired ?? false,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTargetTouched(true);
    if (!targetValidation.valid) return;

    setCreationError('');
    setIsCreating(true);
    try {
      const match = await createMatch({
        id: createId('match'),
        gameId: selectedGame.id,
        teams: selectedGame.defaultTeamNames.map((name) => ({
          id: createId('team'),
          name,
        })),
        target: targetValidation.value,
        allowNegativeEntries:
          selectedGame.supportsNegativeEntries && allowNegativeEntries,
        createdAt: new Date().toISOString(),
      });
      navigate(matchPath(match.id));
    } catch {
      setCreationError('Não foi possível começar a partida. Tente novamente.');
      setIsCreating(false);
    }
  }

  return (
    <section
      className="game-match canastra-setup"
      data-game={selectedGame.id}
      aria-labelledby="new-match-title"
    >
      <Link
        aria-label="Voltar ao início"
        className="canastra-setup__back"
        to={ROUTES.home}
      >
        <ArrowLeftIcon />
      </Link>

      <header className="canastra-setup__header">
        <TrophyIcon className="canastra-setup__trophy" />
        <div className="canastra-setup__game-name">
          <span aria-hidden="true" />
          <p>{selectedGame.label}</p>
          <span aria-hidden="true" />
        </div>
        <h1 id="new-match-title">Nova partida</h1>
      </header>

      <form
        className="canastra-setup__panel"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="canastra-setup__field-group">
          <label className="canastra-setup__label" htmlFor="target">
            <span aria-hidden="true" />
            PONTOS PARA VENCER
          </label>
          <div className="canastra-setup__input-wrap">
            <input
              aria-describedby={targetTouched ? 'target-error' : undefined}
              aria-invalid={targetTouched && !targetValidation.valid}
              id="target"
              inputMode="numeric"
              onBlur={() => setTargetTouched(true)}
              onChange={(event) => setTargetInput(event.target.value)}
              type="text"
              value={targetInput}
            />
            <DiamondIcon />
          </div>
          <div
            className="canastra-setup__suggestions"
            aria-label="Sugestões de pontuação"
          >
            {(selectedGame.targetSuggestions ?? []).map((suggestion) => (
              <button
                aria-pressed={targetInput === String(suggestion)}
                key={suggestion}
                onClick={() => {
                  setTargetInput(String(suggestion));
                  setTargetTouched(true);
                }}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {targetTouched && !targetValidation.valid ? (
            <span className="canastra-setup__error" id="target-error">
              {targetValidation.message}
            </span>
          ) : null}
        </div>

        <div className="canastra-setup__divider" />

        {selectedGame.supportsNegativeEntries ? (
          <label className="canastra-setup__toggle" htmlFor="allow-negatives">
            <span className="canastra-setup__label">
              <span aria-hidden="true" />
              PERMITIR PONTOS NEGATIVOS
            </span>
            <input
              aria-label="Permitir pontos negativos"
              checked={allowNegativeEntries}
              id="allow-negatives"
              onChange={(event) =>
                setAllowNegativeEntries(event.target.checked)
              }
              role="switch"
              type="checkbox"
            />
          </label>
        ) : null}

        <div className="canastra-setup__divider" />

        {creationError ? (
          <span className="canastra-setup__error" role="alert">
            {creationError}
          </span>
        ) : null}
        <button
          className="canastra-setup__submit"
          disabled={!targetValidation.valid || isCreating}
          type="submit"
        >
          <PlayingCardsIcon />
          {isCreating ? 'COMEÇANDO…' : 'COMEÇAR PARTIDA'}
        </button>
      </form>
    </section>
  );
}
