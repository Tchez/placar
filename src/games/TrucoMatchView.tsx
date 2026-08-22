import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createId } from '../app/createId';
import type { Team } from '../domain/types';
import type { GameMatchViewProps } from '.';
import { getTrucoState } from './truco';
import '../styles/games/truco.css';

const RAISED_VALUES = [
  { label: 'Truco', value: 3 },
  { label: 'Seis', value: 6 },
  { label: 'Nove', value: 9 },
  { label: 'Doze', value: 12 },
] as const;

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-2.78 2.78-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1.08 1.64V21h-3.84v-.08A1.8 1.8 0 0 0 9 19.4a1.8 1.8 0 0 0-1.98.36l-.06.06-2.78-2.78.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.64-1.08H3v-3.84h.08A1.8 1.8 0 0 0 4.6 9a1.8 1.8 0 0 0-.36-1.98l-.06-.06 2.78-2.78.06.06A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1.08-1.64V3h3.84v.08A1.8 1.8 0 0 0 15 4.6a1.8 1.8 0 0 0 1.98-.36l.06-.06 2.78 2.78-.06.06A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.64 1.08H21v3.84h-.08A1.8 1.8 0 0 0 19.4 15Z" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 8 4 12l5 4M5 12h9a6 6 0 1 1 0 12" />
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

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

interface TallyProps {
  animateFrom: number;
  score: number;
}

export function Tally({ animateFrom, score }: TallyProps) {
  const visibleScore = Math.max(0, Math.trunc(score));
  const groupCount = Math.ceil(visibleScore / 5);

  return (
    <span className="truco-tally" aria-hidden="true">
      {Array.from({ length: groupCount }, (_, groupIndex) => {
        const marksInGroup = Math.min(5, visibleScore - groupIndex * 5);
        return (
          <svg
            className="truco-tally__group"
            data-tally-group
            key={groupIndex}
            viewBox="0 0 64 56"
          >
            {Array.from({ length: marksInGroup }, (_, markIndex) => {
              const absoluteIndex = groupIndex * 5 + markIndex;
              const isDiagonal = markIndex === 4;
              const x = 10 + markIndex * 14;
              return (
                <line
                  className={
                    absoluteIndex >= animateFrom
                      ? 'truco-tally__mark truco-tally__mark--new'
                      : 'truco-tally__mark'
                  }
                  data-tally-mark
                  key={markIndex}
                  x1={isDiagonal ? 5 : x}
                  x2={isDiagonal ? 58 : x}
                  y1={isDiagonal ? 48 : 7}
                  y2={isDiagonal ? 9 : 49}
                />
              );
            })}
          </svg>
        );
      })}
    </span>
  );
}

interface TeamScoreProps {
  compact?: boolean;
  index: number;
  interactive: boolean;
  onOpen?(): void;
  score: number;
  team: Team;
  triggerRef?(node: HTMLButtonElement | null): void;
}

function TeamScore({
  compact = false,
  index,
  interactive,
  onOpen,
  score,
  team,
  triggerRef,
}: TeamScoreProps) {
  const [animatedThrough, setAnimatedThrough] = useState(score);
  const pointsLabel = `${score} ${score === 1 ? 'ponto' : 'pontos'}`;

  useEffect(() => {
    if (score <= animatedThrough) {
      if (score === animatedThrough) return;
      const resetTimer = window.setTimeout(() => setAnimatedThrough(score), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const timer = window.setTimeout(() => setAnimatedThrough(score), 280);
    return () => window.clearTimeout(timer);
  }, [animatedThrough, score]);

  const content = (
    <>
      <span className="truco-team-banner">{team.name}</span>
      <Tally animateFrom={animatedThrough} score={score} />
    </>
  );
  const sideClass = index === 0 ? 'truco-side--us' : 'truco-side--them';
  const className = `truco-score-block ${sideClass} ${compact ? 'truco-score-block--compact' : ''}`;

  return interactive ? (
    <button
      aria-label={`Abrir opções de ${team.name}. Placar: ${pointsLabel}`}
      className={className}
      ref={triggerRef}
      type="button"
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div
      aria-label={`${team.name}: ${pointsLabel}`}
      className={className}
      role="group"
    >
      {content}
    </div>
  );
}

interface TrucoHeaderProps {
  onBack(): void;
  onDelete?(): void;
  onFinish?(): void;
  title: string;
}

function TrucoHeader({ onBack, onDelete, onFinish, title }: TrucoHeaderProps) {
  const [showOptions, setShowOptions] = useState(false);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const hasOptions = onDelete !== undefined && onFinish !== undefined;

  useEffect(() => {
    if (!showOptions) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setShowOptions(false);
      optionsButtonRef.current?.focus();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showOptions]);

  return (
    <header className="truco-header">
      <button
        aria-label="Voltar ao início"
        className="truco-icon-button"
        type="button"
        onClick={onBack}
      >
        <ArrowLeftIcon />
      </button>
      <h1>{title}</h1>
      {hasOptions ? (
        <div className="truco-options">
          <button
            aria-expanded={showOptions}
            aria-haspopup="menu"
            aria-label="Opções da partida"
            className="truco-icon-button"
            ref={optionsButtonRef}
            type="button"
            onClick={() => setShowOptions((current) => !current)}
          >
            <SettingsIcon />
          </button>
          {showOptions ? (
            <div className="truco-options__menu" role="menu">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  onFinish();
                }}
              >
                Encerrar partida
              </button>
              <button
                className="truco-options__delete"
                role="menuitem"
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  onDelete();
                }}
              >
                Apagar partida
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <span className="truco-header__spacer" aria-hidden="true" />
      )}
    </header>
  );
}

interface UndoButtonProps {
  disabled: boolean;
  onUndo(): void;
}

function UndoButton({ disabled, onUndo }: UndoButtonProps) {
  return (
    <button
      className="truco-undo"
      disabled={disabled}
      type="button"
      onClick={onUndo}
    >
      <UndoIcon />
      Desfazer último
    </button>
  );
}

export function TrucoMatchView({ actions, game, match }: GameMatchViewProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sheetHistoryActiveRef = useRef(false);
  const scoreButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scoreboard = game.scoreboard(match);
  const state = getTrucoState(match);
  const isFinished = match.finishedAt !== null;
  const scores = match.teams.map(
    (team) =>
      scoreboard.standings.find(({ teamId }) => teamId === team.id)?.score ?? 0,
  );

  useEffect(() => {
    document.body.classList.add('truco-theme');
    return () => document.body.classList.remove('truco-theme');
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) return;
    const openTeamId = selectedTeamId;
    document.body.classList.add('truco-sheet-open');

    function closeFromHistory() {
      sheetHistoryActiveRef.current = false;
      const trigger = scoreButtonRefs.current[openTeamId];
      setSelectedTeamId(null);
      queueMicrotask(() => trigger?.focus());
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || isSaving) return;
      closeSheet();
    }

    window.addEventListener('popstate', closeFromHistory);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('truco-sheet-open');
      window.removeEventListener('popstate', closeFromHistory);
      document.removeEventListener('keydown', closeOnEscape);
    };
  });

  function openSheet(teamId: string) {
    if (state.type === 'mao-de-onze' || state.type === 'mao-de-ferro') return;
    setError('');
    sheetHistoryActiveRef.current = true;
    window.history.pushState({ ...window.history.state, trucoSheet: true }, '');
    setSelectedTeamId(teamId);
  }

  function closeSheet() {
    const trigger =
      selectedTeamId === null ? null : scoreButtonRefs.current[selectedTeamId];
    setSelectedTeamId(null);
    if (sheetHistoryActiveRef.current) {
      sheetHistoryActiveRef.current = false;
      window.history.back();
    }
    queueMicrotask(() => trigger?.focus());
  }

  async function recordEntry(teamId: string, value: number, note = '') {
    setError('');
    setIsSaving(true);
    try {
      await actions.addEntry({
        id: createId('entry'),
        teamId,
        value,
        note,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch {
      setError('Não foi possível lançar os pontos. Tente novamente.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function recordRaisedValue(value: number) {
    if (selectedTeamId === null) return;
    if (await recordEntry(selectedTeamId, value)) closeSheet();
  }

  async function undoLast() {
    const lastEntry = match.entries.at(-1);
    if (!lastEntry) return;
    setError('');
    setIsSaving(true);
    try {
      await actions.removeEntry(lastEntry.id);
    } catch {
      setError('Não foi possível desfazer. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  function dismissSheetFromBackdrop(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSaving) closeSheet();
  }

  if (isFinished) {
    const winnerIndex = match.teams.findIndex(
      ({ id }) => id === scoreboard.winnerTeamId,
    );
    const winnerMessage =
      winnerIndex === 0
        ? 'NÓS VENCEMOS!'
        : winnerIndex === 1
          ? 'ELES VENCERAM!'
          : 'PARTIDA ENCERRADA';

    return (
      <article className="truco-match truco-finished">
        <TrucoHeader title="Fim de partida" onBack={actions.goHome} />
        <section
          className={`truco-finished__hero ${winnerIndex === 0 ? 'truco-finished__hero--us' : ''} ${winnerIndex === 1 ? 'truco-finished__hero--them' : ''}`}
        >
          <span aria-hidden="true">◇</span>
          <h2>{winnerMessage}</h2>
          <span aria-hidden="true">◇</span>
        </section>

        <section className="truco-final-score" aria-label="Placar final">
          {match.teams.map((team, index) => (
            <TeamScore
              compact
              index={index}
              interactive={false}
              key={team.id}
              score={scores[index] ?? 0}
              team={team}
            />
          ))}
        </section>

        <div className="truco-finished__actions">
          <button
            className="truco-paper-button truco-new-match"
            disabled={isSaving}
            type="button"
            onClick={() => {
              setIsSaving(true);
              void actions.createNew().catch(() => {
                setError('Não foi possível começar outra partida.');
                setIsSaving(false);
              });
            }}
          >
            Nova partida
          </button>
          <div className="truco-finished__secondary">
            <button type="button" onClick={() => void actions.reopen()}>
              <UndoIcon />
              Reabrir
            </button>
            <button type="button" onClick={() => void actions.remove()}>
              <TrashIcon />
              Apagar
            </button>
          </div>
        </div>
        {error ? (
          <p className="truco-error" role="alert">
            {error}
          </p>
        ) : null}
      </article>
    );
  }

  if (state.type === 'mao-de-onze') {
    const teamAtEleven = match.teams.find(({ id }) => id === state.teamId);
    const opponent = match.teams.find(({ id }) => id === state.opponentTeamId);
    const teamIndex = match.teams.findIndex(({ id }) => id === state.teamId);

    if (teamAtEleven && opponent) {
      return (
        <article className="truco-match truco-special">
          <TrucoHeader title="Mão de onze" onBack={actions.goHome} />
          <section
            className={`truco-special__hero ${teamIndex === 0 ? 'truco-special__hero--us' : 'truco-special__hero--them'}`}
          >
            <h2>MÃO DE ONZE</h2>
            <p>Equipe {teamAtEleven.name}: 11 pontos</p>
          </section>
          <div className="truco-outcomes">
            <button
              className="truco-paper-button"
              disabled={isSaving}
              type="button"
              onClick={() =>
                void recordEntry(teamAtEleven.id, 3, 'mão de onze')
              }
            >
              Vitória: {teamAtEleven.name}
              <span>+3</span>
            </button>
            <button
              className="truco-paper-button"
              disabled={isSaving}
              type="button"
              onClick={() => void recordEntry(opponent.id, 3, 'mão de onze')}
            >
              Vitória: {opponent.name}
              <span>+3</span>
            </button>
            <button
              className="truco-paper-button"
              disabled={isSaving}
              type="button"
              onClick={() => void recordEntry(opponent.id, 1, 'correu')}
            >
              Correu: {teamAtEleven.name}
              <span>+1 para {opponent.name}</span>
            </button>
          </div>
          <UndoButton
            disabled={isSaving || match.entries.length === 0}
            onUndo={() => void undoLast()}
          />
          {error ? (
            <p className="truco-error" role="alert">
              {error}
            </p>
          ) : null}
        </article>
      );
    }
  }

  if (state.type === 'mao-de-ferro') {
    return (
      <article className="truco-match truco-special">
        <TrucoHeader title="Mão de ferro" onBack={actions.goHome} />
        <section className="truco-special__hero truco-special__hero--iron">
          <h2>MÃO DE FERRO</h2>
          <p>Onze a onze, jogada no escuro.</p>
        </section>
        <div className="truco-outcomes">
          {match.teams.map((team) => (
            <button
              className="truco-paper-button"
              disabled={isSaving}
              key={team.id}
              type="button"
              onClick={() => void recordEntry(team.id, 3, 'mão de ferro')}
            >
              Vitória: {team.name}
              <span>+3</span>
            </button>
          ))}
        </div>
        <UndoButton
          disabled={isSaving || match.entries.length === 0}
          onUndo={() => void undoLast()}
        />
        {error ? (
          <p className="truco-error" role="alert">
            {error}
          </p>
        ) : null}
      </article>
    );
  }

  const winnerIndex = match.teams.findIndex(
    ({ id }) => id === scoreboard.winnerTeamId,
  );
  const liveWinnerMessage =
    winnerIndex === 0
      ? 'Nós vencemos!'
      : winnerIndex === 1
        ? 'Eles venceram!'
        : state.type === 'won'
          ? 'Empate na meta — a mesa decide'
          : '';

  return (
    <article className="truco-match">
      <TrucoHeader
        title={game.label}
        onBack={actions.goHome}
        onDelete={() => void actions.remove()}
        onFinish={() => void actions.finish()}
      />

      {liveWinnerMessage ? (
        <p className="truco-winner-status" role="status">
          {liveWinnerMessage}
        </p>
      ) : null}

      <section className="truco-scoreboard" aria-label="Placar">
        {match.teams.map((team, index) => {
          const score = scores[index] ?? 0;
          return (
            <section
              className={`truco-side ${index === 0 ? 'truco-side--us' : 'truco-side--them'}`}
              key={team.id}
            >
              <TeamScore
                index={index}
                interactive
                score={score}
                team={team}
                triggerRef={(node) => {
                  scoreButtonRefs.current[team.id] = node;
                }}
                onOpen={() => openSheet(team.id)}
              />
              <button
                aria-label={`Adicionar 1 ponto para ${team.name}`}
                className="truco-add-one"
                disabled={isSaving}
                type="button"
                onClick={() => void recordEntry(team.id, 1)}
              >
                +1
              </button>
              <button
                aria-label={`Remover 1 ponto de ${team.name}`}
                className="truco-subtract-one"
                disabled={isSaving || score <= 0}
                type="button"
                onClick={() => void recordEntry(team.id, -1)}
              >
                −1
              </button>
            </section>
          );
        })}
      </section>

      <UndoButton
        disabled={isSaving || match.entries.length === 0}
        onUndo={() => void undoLast()}
      />
      {error ? (
        <p className="truco-error" role="alert">
          {error}
        </p>
      ) : null}

      {selectedTeamId !== null ? (
        <div
          className="truco-sheet-backdrop"
          role="presentation"
          onMouseDown={dismissSheetFromBackdrop}
        >
          <section
            aria-labelledby="truco-sheet-title"
            aria-modal="true"
            className={`truco-sheet ${selectedTeamId === match.teams[0]?.id ? 'truco-sheet--us' : 'truco-sheet--them'}`}
            role="dialog"
          >
            <header className="truco-sheet__header">
              <span aria-hidden="true" />
              <h2 id="truco-sheet-title">
                {match.teams.find(({ id }) => id === selectedTeamId)?.name}
              </h2>
              <button
                aria-label="Fechar opções de pontuação"
                disabled={isSaving}
                type="button"
                onClick={closeSheet}
              >
                <CloseIcon />
              </button>
            </header>
            <div className="truco-sheet__values">
              {RAISED_VALUES.map(({ label, value }, index) => (
                <button
                  autoFocus={index === 0}
                  className="truco-paper-button"
                  disabled={isSaving}
                  key={value}
                  type="button"
                  onClick={() => void recordRaisedValue(value)}
                >
                  {label}
                  <span>+{value}</span>
                </button>
              ))}
            </div>
            <p className="truco-sheet__note">
              <span aria-hidden="true">◇</span>
              Na mão de onze ou de ferro, use apenas as opções daquela mão.
            </p>
            {error ? (
              <p className="truco-error" role="alert">
                {error}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </article>
  );
}
