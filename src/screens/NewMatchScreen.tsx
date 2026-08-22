import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createId } from '../app/createId';
import { matchPath, ROUTES } from '../app/routes';
import { validateTarget } from '../domain/match';
import { GAMES } from '../games';
import { useMatches } from '../store/MatchStore';

export function NewMatchScreen() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { createMatch } = useMatches();
  const game = GAMES.find(({ id }) => id === gameId);
  const [targetInput, setTargetInput] = useState('');
  const [targetTouched, setTargetTouched] = useState(false);
  const [allowNegativeEntries, setAllowNegativeEntries] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!game) {
    return (
      <section className="message-screen">
        <h1>Jogo não encontrado.</h1>
        <Link to={ROUTES.home}>Voltar ao início</Link>
      </section>
    );
  }

  const selectedGame = game;
  const targetValidation = validateTarget(
    targetInput,
    selectedGame.targetRequired,
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
    <section className="screen setup-screen" aria-labelledby="new-match-title">
      <header className="screen-heading">
        <span className="eyebrow">{game.label}</span>
        <h1 id="new-match-title">Nova partida</h1>
      </header>

      <form className="setup-card" noValidate onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="target">Pontos para vencer</label>
          <input
            aria-describedby={targetTouched ? 'target-error' : undefined}
            aria-invalid={targetTouched && !targetValidation.valid}
            id="target"
            inputMode="numeric"
            onBlur={() => setTargetTouched(true)}
            onChange={(event) => setTargetInput(event.target.value)}
            className="target-input"
            type="text"
            value={targetInput}
          />
          <div className="suggestions" aria-label="Sugestões de pontuação">
            {game.targetSuggestions.map((suggestion) => (
              <button
                aria-pressed={targetInput === String(suggestion)}
                className="suggestion-button"
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
            <span className="field-error" id="target-error">
              {targetValidation.message}
            </span>
          ) : null}
        </div>

        {game.supportsNegativeEntries ? (
          <label className="toggle-field" htmlFor="allow-negatives">
            <span>Permitir pontos negativos</span>
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

        {creationError ? (
          <span className="field-error" role="alert">
            {creationError}
          </span>
        ) : null}
        <button
          className="primary-button"
          disabled={!targetValidation.valid || isCreating}
          type="submit"
        >
          {isCreating ? 'Começando…' : 'Começar partida'}
        </button>
      </form>
    </section>
  );
}
