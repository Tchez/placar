import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createId } from '../app/createId';
import { validateEntryValue } from '../domain/match';
import type { Entry, Team } from '../domain/types';
import type { GameMatchViewProps } from '.';
import '../styles/games/canastra.css';

interface EntryRowProps {
  allowNegativeEntries: boolean;
  entry: Entry;
  isFinished: boolean;
  team: Team | undefined;
  onRemove(entryId: string): Promise<unknown>;
  onUpdate(entry: Entry): Promise<unknown>;
}

const scoreFormatter = new Intl.NumberFormat('pt-BR');
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatScore(value: number): string {
  return scoreFormatter.format(value);
}

function formatTarget(value: number | null): string {
  if (value === null) return 'Livre';
  return value >= 1000 && value % 1000 === 0
    ? `${value / 1000}K`
    : formatScore(value);
}

function getScoreSize(value: number): string {
  const length = formatScore(value).length;
  if (length >= 9) return 'canastra-score__value--tiny';
  if (length >= 7) return 'canastra-score__value--dense';
  if (length >= 4) return 'canastra-score__value--compact';
  return '';
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function LogIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8.5 20h7M10 17h4" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 21V4M6 5h11l-2 3 2 3H6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

function EntryRow({
  allowNegativeEntries,
  entry,
  isFinished,
  team,
  onRemove,
  onUpdate,
}: EntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [valueInput, setValueInput] = useState(String(entry.value));
  const [error, setError] = useState('');
  const teamName = team?.name ?? 'Time';

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEntryValue(valueInput, allowNegativeEntries);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    void onUpdate({ ...entry, value: validation.value }).then(() => {
      setError('');
      setIsEditing(false);
    });
  }

  function remove() {
    if (!window.confirm(`Excluir o lançamento de ${teamName}?`)) return;
    void onRemove(entry.id);
  }

  if (isEditing) {
    return (
      <li className="canastra-log__row canastra-log__row--editing">
        <form className="canastra-log__editor" onSubmit={submitEdit}>
          <label htmlFor={`entry-${entry.id}`}>Valor do lançamento</label>
          <input
            id={`entry-${entry.id}`}
            inputMode="numeric"
            value={valueInput}
            onChange={(event) => setValueInput(event.target.value)}
            autoFocus
          />
          {error ? <p className="canastra-field-error">{error}</p> : null}
          <button
            className="canastra-log__secondary"
            type="button"
            onClick={() => {
              setValueInput(String(entry.value));
              setError('');
              setIsEditing(false);
            }}
          >
            Cancelar
          </button>
          <button className="canastra-log__save" type="submit">
            Salvar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="canastra-log__row">
      <span className="canastra-log__team">{teamName}</span>
      <time dateTime={entry.createdAt}>
        {timeFormatter.format(new Date(entry.createdAt))}
      </time>
      {isFinished ? (
        <strong className="canastra-log__value">
          {formatScore(entry.value)}
        </strong>
      ) : (
        <>
          <button
            className="canastra-log__value canastra-log__edit"
            type="button"
            aria-label={`Editar ${entry.value} pontos de ${teamName}`}
            onClick={() => setIsEditing(true)}
          >
            {formatScore(entry.value)}
          </button>
          <button
            className="canastra-log__delete"
            type="button"
            aria-label={`Excluir lançamento de ${teamName}`}
            onClick={remove}
          >
            <TrashIcon />
          </button>
        </>
      )}
    </li>
  );
}

export function CanastraMatchView({
  actions,
  game,
  match,
}: GameMatchViewProps) {
  const {
    addEntry,
    finish,
    goHome,
    removeEntry,
    remove: removeMatch,
    reopen,
    updateEntry,
  } = actions;
  const [selectedTeamId, setSelectedTeamId] = useState(
    match.teams[0]?.id ?? '',
  );
  const [valueInput, setValueInput] = useState('');
  const [error, setError] = useState('');
  const [entryAction, setEntryAction] = useState<'add' | 'subtract' | null>(
    null,
  );
  const [showLog, setShowLog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const subtractButtonRef = useRef<HTMLButtonElement>(null);
  const scoreboard = game.scoreboard(match);
  const teamScores = match.teams.map(
    (team) =>
      scoreboard.standings.find(({ teamId }) => teamId === team.id)?.score ?? 0,
  );
  const scoreDifference = Math.abs((teamScores[0] ?? 0) - (teamScores[1] ?? 0));
  const isFinished = match.finishedAt !== null;

  useEffect(() => {
    document.body.classList.add('canastra-theme');
    return () => document.body.classList.remove('canastra-theme');
  }, []);

  useEffect(() => {
    if (entryAction === null) return;

    document.body.classList.add('canastra-modal-open');

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || isSaving) return;
      const trigger =
        entryAction === 'add'
          ? addButtonRef.current
          : subtractButtonRef.current;
      setEntryAction(null);
      setValueInput('');
      setError('');
      trigger?.focus();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('canastra-modal-open');
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [entryAction, isSaving]);

  function openEntryModal(action: 'add' | 'subtract') {
    setValueInput('');
    setError('');
    setEntryAction(action);
  }

  function closeEntryModal() {
    if (isSaving) return;
    const trigger =
      entryAction === 'add' ? addButtonRef.current : subtractButtonRef.current;
    setEntryAction(null);
    setValueInput('');
    setError('');
    trigger?.focus();
  }

  async function submitEntry(direction: 1 | -1) {
    const magnitude = valueInput.trim().replace(/^[+-]/, '');
    const signedValue = direction === -1 ? `-${magnitude}` : magnitude;
    const validation = validateEntryValue(
      signedValue,
      match.allowNegativeEntries,
    );
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsSaving(true);
    try {
      await addEntry({
        id: createId('entry'),
        teamId: selectedTeamId,
        value: validation.value,
        note: '',
        createdAt: new Date().toISOString(),
      });
      const selectedIndex = match.teams.findIndex(
        ({ id }) => id === selectedTeamId,
      );
      const nextTeam = match.teams[(selectedIndex + 1) % match.teams.length];
      if (nextTeam) setSelectedTeamId(nextTeam.id);
      const trigger =
        direction === 1 ? addButtonRef.current : subtractButtonRef.current;
      setEntryAction(null);
      setValueInput('');
      setError('');
      trigger?.focus();
    } catch {
      setError('Não foi possível lançar os pontos. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  function submitModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (entryAction === null) return;
    void submitEntry(entryAction === 'add' ? 1 : -1);
  }

  async function toggleFinished() {
    if (isFinished) {
      await reopen();
    } else {
      await finish();
    }
  }

  async function deleteMatch() {
    await removeMatch();
  }

  return (
    <article className="canastra-match">
      <header className="canastra-header">
        <button
          className="canastra-icon-button"
          type="button"
          aria-label="Voltar ao início"
          onClick={goHome}
        >
          <ArrowLeftIcon />
        </button>

        <div className="canastra-title">
          <span className="canastra-title__trophy" aria-hidden="true">
            <TrophyIcon />
          </span>
          <h1>{game.label}</h1>
          <span className="canastra-title__target">
            Meta: {formatTarget(match.target)}
          </span>
          {isFinished ? (
            <span className="canastra-title__finished">Encerrada</span>
          ) : null}
        </div>

        <button
          className="canastra-icon-button"
          type="button"
          aria-label={showLog ? 'Ocultar lançamentos' : 'Mostrar lançamentos'}
          aria-controls="canastra-entry-log"
          aria-expanded={showLog}
          onClick={() => setShowLog((current) => !current)}
        >
          <LogIcon />
        </button>
      </header>

      <section className="canastra-scoreboard" aria-label="Placar">
        <div className="canastra-scoreboard__scores">
          {match.teams.map((team, index) => {
            const score = teamScores[index] ?? 0;
            const isOnObrigada =
              match.target !== null && score >= match.target / 2;
            return (
              <div
                className={`canastra-score canastra-score--${index === 0 ? 'us' : 'them'}`}
                key={team.id}
              >
                <h2>{team.name}</h2>
                <strong
                  className={`canastra-score__value ${getScoreSize(score)} ${isOnObrigada ? 'canastra-score__value--obrigada' : ''}`}
                >
                  {formatScore(score)}
                </strong>
                {match.target !== null ? (
                  <span
                    className="canastra-score__remaining"
                    aria-label={`Faltam ${formatScore(Math.max(match.target - score, 0))} pontos para ${team.name}`}
                  >
                    {formatScore(Math.max(match.target - score, 0))}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="canastra-scoreboard__difference">
          <strong
            aria-label={`Diferença de pontos: ${formatScore(scoreDifference)}`}
          >
            {formatScore(scoreDifference)}
          </strong>
        </div>
        <p className="sr-only" role="status">
          {scoreboard.detail}
        </p>
      </section>

      {!isFinished ? (
        <section className="canastra-launcher">
          <h2 className="canastra-section-title">Lançar pontos</h2>
          <div className="canastra-launcher__content">
            <fieldset className="canastra-team-picker">
              <legend className="sr-only">Time</legend>
              {match.teams.map((team, index) => (
                <button
                  className={
                    index === 0 ? 'canastra-team--us' : 'canastra-team--them'
                  }
                  type="button"
                  key={team.id}
                  aria-pressed={selectedTeamId === team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  {team.name}
                </button>
              ))}
            </fieldset>

            <div className="canastra-entry-actions">
              <button
                className="canastra-entry-button canastra-entry-button--add"
                type="button"
                aria-label="Adicionar pontos"
                disabled={isSaving}
                ref={addButtonRef}
                onClick={() => openEntryModal('add')}
              >
                <span
                  className="canastra-entry-button__icon"
                  aria-hidden="true"
                >
                  +
                </span>
                <span>Adicionar</span>
              </button>
              <button
                className="canastra-entry-button canastra-entry-button--subtract"
                type="button"
                aria-label="Remover pontos"
                disabled={isSaving || !match.allowNegativeEntries}
                ref={subtractButtonRef}
                onClick={() => openEntryModal('subtract')}
              >
                <span
                  className="canastra-entry-button__icon"
                  aria-hidden="true"
                >
                  −
                </span>
                <span>Remover</span>
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {entryAction !== null ? (
        <div
          className="canastra-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEntryModal();
          }}
        >
          <section
            className={`canastra-entry-modal canastra-entry-modal--${entryAction}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="canastra-entry-modal-action canastra-entry-modal-title"
          >
            <div className="canastra-entry-modal__symbol" aria-hidden="true">
              {entryAction === 'add' ? '+' : '−'}
            </div>
            <div className="canastra-entry-modal__heading">
              <p id="canastra-entry-modal-action">
                {entryAction === 'add' ? 'Adicionar para' : 'Remover de'}
              </p>
              <h2 id="canastra-entry-modal-title">
                {match.teams.find(({ id }) => id === selectedTeamId)?.name}
              </h2>
            </div>
            <form onSubmit={submitModal}>
              <label htmlFor="canastra-entry-value">Quantidade de pontos</label>
              <input
                id="canastra-entry-value"
                inputMode="numeric"
                autoComplete="off"
                value={valueInput}
                onChange={(event) => {
                  setValueInput(event.target.value);
                  setError('');
                }}
                placeholder="0"
                autoFocus
              />
              {error ? (
                <p className="canastra-field-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="canastra-entry-modal__actions">
                <button
                  className="canastra-entry-modal__cancel"
                  type="button"
                  disabled={isSaving}
                  onClick={closeEntryModal}
                >
                  Cancelar
                </button>
                <button
                  className="canastra-entry-modal__confirm"
                  type="submit"
                  disabled={isSaving}
                >
                  {entryAction === 'add'
                    ? 'Adicionar pontos'
                    : 'Remover pontos'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showLog ? (
        <section
          className="canastra-log"
          id="canastra-entry-log"
          aria-labelledby="canastra-log-title"
        >
          <div className="canastra-log__heading">
            <h2 id="canastra-log-title">Lançamentos</h2>
            <span>{match.entries.length}</span>
          </div>
          {match.entries.length === 0 ? (
            <p className="canastra-log__empty">Nenhum ponto lançado ainda.</p>
          ) : (
            <ol className="canastra-log__list">
              {[...match.entries].reverse().map((entry) => (
                <EntryRow
                  allowNegativeEntries={match.allowNegativeEntries}
                  entry={entry}
                  isFinished={isFinished}
                  key={entry.id}
                  team={match.teams.find(({ id }) => id === entry.teamId)}
                  onRemove={removeEntry}
                  onUpdate={updateEntry}
                />
              ))}
            </ol>
          )}
        </section>
      ) : null}

      <footer className="canastra-actions">
        <button
          className="canastra-finish-button"
          type="button"
          onClick={() => void toggleFinished()}
        >
          <FlagIcon />
          {isFinished ? 'Reabrir partida' : 'Encerrar partida'}
        </button>
        <button
          className="canastra-delete-match"
          type="button"
          onClick={() => void deleteMatch()}
        >
          Apagar partida
        </button>
      </footer>
    </article>
  );
}
