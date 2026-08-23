import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createId } from '../app/createId';
import type { Team } from '../domain/types';
import type { GameMatchViewProps } from '.';
import '../styles/games/truco-gauderio.css';

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

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
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

function FlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 21V4M6 5h11l-2 3 2 3H6" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4.5 8.5A8 8 0 1 1 4 14M4.5 4.5v4h4" />
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

function GauchoHeaderOrnament() {
  return (
    <svg
      aria-hidden="true"
      className="gauderio-header-ornament"
      viewBox="0 0 132 60"
    >
      <g className="gauderio-header-ornament__sprigs">
        <path d="M47 33c-9 1-16 5-22 12M85 33c9 1 16 5 22 12" />
        <path d="m28 46-2-7M35 44v-7M104 46l2-7M97 44v-7" />
      </g>
      <path
        className="gauderio-header-ornament__hat"
        d="M31 32c0-3 6-5 15-6 1-13 7-21 20-21s19 8 20 21c9 1 15 3 15 6 0 5-16 9-35 9s-35-4-35-9Z"
      />
      <path
        className="gauderio-header-ornament__band"
        d="M46 26c13 4 27 4 40 0"
      />
      <path
        className="gauderio-header-ornament__scarf"
        d="M58 41c-3 5-5 10-5 16l7-6 4 7 3-16M74 41c3 5 5 10 5 16l-7-6-4 7-3-16"
      />
    </svg>
  );
}

function HeaderFlourish() {
  return (
    <svg
      aria-hidden="true"
      className="gauderio-header-flourish"
      viewBox="0 0 180 22"
    >
      <path d="M4 12c20 0 19-8 29-8 8 0 4 10-3 8M176 12c-20 0-19-8-29-8-8 0-4 10 3 8M39 12h35c8 0 10-7 16-10 6 3 8 10 16 10h35" />
      <path d="m90 7 5 5-5 5-5-5 5-5Z" />
    </svg>
  );
}

interface MatchstickProps {
  position: 'top' | 'right' | 'bottom' | 'left' | 'diagonal' | 'upright';
}

function Matchstick({ position }: MatchstickProps) {
  return (
    <span
      aria-hidden="true"
      className={`gauderio-stick gauderio-stick--${position}`}
      data-matchstick
    />
  );
}

interface MatchstickScoreProps {
  compact?: boolean;
  score: number;
  team: Team;
}

export function MatchstickScore({
  compact = false,
  score,
  team,
}: MatchstickScoreProps) {
  const visibleScore = Math.max(0, Math.trunc(score));
  const boxCount = Math.floor(visibleScore / 5);
  const looseCount = visibleScore % 5;
  const pointsLabel = `${visibleScore} ${visibleScore === 1 ? 'ponto' : 'pontos'}`;

  return (
    <div
      aria-label={`${team.name}: ${pointsLabel}`}
      className={`gauderio-matchsticks ${compact ? 'gauderio-matchsticks--compact' : ''}`}
      role="group"
    >
      <span className="gauderio-boxes" aria-hidden="true">
        {Array.from({ length: boxCount }, (_, boxIndex) => (
          <span className="gauderio-box" data-matchstick-box key={boxIndex}>
            <Matchstick position="top" />
            <Matchstick position="right" />
            <Matchstick position="bottom" />
            <Matchstick position="left" />
            <Matchstick position="diagonal" />
          </span>
        ))}
      </span>
      <span className="gauderio-loose-sticks" aria-hidden="true">
        {Array.from({ length: looseCount }, (_, looseIndex) => (
          <span data-loose-matchstick key={looseIndex}>
            <Matchstick position="upright" />
          </span>
        ))}
      </span>
    </div>
  );
}

interface HeaderProps {
  onBack(): void;
  onOptions?(event: ReactMouseEvent<HTMLButtonElement>): void;
  title: string;
}

function GauderioHeader({ onBack, onOptions, title }: HeaderProps) {
  return (
    <header className="gauderio-header">
      <button
        aria-label="Voltar ao início"
        className="gauderio-icon-button"
        type="button"
        onClick={onBack}
      >
        <ArrowLeftIcon />
      </button>
      <div className="gauderio-header__title">
        <GauchoHeaderOrnament />
        <h1>{title}</h1>
        <HeaderFlourish />
      </div>
      {onOptions ? (
        <button
          aria-label="Opções da partida"
          className="gauderio-icon-button"
          type="button"
          onClick={onOptions}
        >
          <SettingsIcon />
        </button>
      ) : (
        <span className="gauderio-header__spacer" aria-hidden="true" />
      )}
    </header>
  );
}

interface OptionsSheetProps {
  disabled: boolean;
  onBackdrop(event: ReactMouseEvent<HTMLDivElement>): void;
  onClose(): void;
  onDelete(): void;
  onFinish(): void;
  onReset(): void;
}

function OptionsSheet({
  disabled,
  onBackdrop,
  onClose,
  onDelete,
  onFinish,
  onReset,
}: OptionsSheetProps) {
  return (
    <div
      className="gauderio-options-backdrop"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <section
        aria-labelledby="gauderio-options-title"
        aria-modal="true"
        className="gauderio-options-sheet"
        role="dialog"
      >
        <header>
          <span aria-hidden="true" />
          <h2 id="gauderio-options-title">Opções da partida</h2>
          <button
            autoFocus
            aria-label="Fechar opções da partida"
            className="gauderio-icon-button"
            disabled={disabled}
            type="button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>
        <div className="gauderio-options-sheet__rows">
          <button disabled={disabled} type="button" onClick={onFinish}>
            <FlagIcon />
            <span>
              <strong>Encerrar partida</strong>
              <small>Guarda este placar no histórico</small>
            </span>
          </button>
          <button disabled={disabled} type="button" onClick={onReset}>
            <ResetIcon />
            <span>
              <strong>Resetar pontos</strong>
              <small>Zera o placar desta mesma partida</small>
            </span>
          </button>
          <button disabled={disabled} type="button" onClick={onDelete}>
            <TrashIcon />
            <span>
              <strong>Apagar partida</strong>
              <small>Remove a partida e todo o seu placar</small>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function TrucoGauderioMatchView({
  actions,
  game,
  match,
}: GameMatchViewProps) {
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsHistoryActiveRef = useRef(false);
  const optionsButtonRef = useRef<HTMLButtonElement | null>(null);
  const scoreboard = game.scoreboard(match);
  const isFinished = match.finishedAt !== null;
  const scores = match.teams.map(
    (team) =>
      scoreboard.standings.find(({ teamId }) => teamId === team.id)?.score ?? 0,
  );
  const scoreCeiling = game.scoreCeiling;
  const ceilingReached =
    scoreCeiling !== undefined && scores.some((score) => score >= scoreCeiling);

  useEffect(() => {
    document.body.classList.add('gauderio-theme');
    return () => document.body.classList.remove('gauderio-theme');
  }, []);

  useEffect(() => {
    if (!optionsOpen) return;
    document.body.classList.add('gauderio-options-open');

    function closeFromHistory() {
      optionsHistoryActiveRef.current = false;
      setOptionsOpen(false);
      queueMicrotask(() => optionsButtonRef.current?.focus());
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) closeOptions();
    }

    window.addEventListener('popstate', closeFromHistory);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('gauderio-options-open');
      window.removeEventListener('popstate', closeFromHistory);
      document.removeEventListener('keydown', closeOnEscape);
    };
  });

  function openOptions(event: ReactMouseEvent<HTMLButtonElement>) {
    optionsButtonRef.current = event.currentTarget;
    optionsHistoryActiveRef.current = true;
    window.history.pushState(
      { ...window.history.state, gauderioOptions: true },
      '',
    );
    setOptionsOpen(true);
  }

  function closeOptions() {
    setOptionsOpen(false);
    if (optionsHistoryActiveRef.current) {
      optionsHistoryActiveRef.current = false;
      window.history.back();
    }
    queueMicrotask(() => optionsButtonRef.current?.focus());
  }

  function dismissOptions(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSaving) closeOptions();
  }

  async function recordPoint(teamId: string, value: 1 | -1) {
    setError('');
    setIsSaving(true);
    try {
      await actions.addEntry({
        id: createId('entry'),
        teamId,
        value,
        note: '',
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError('Não foi possível alterar o placar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
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

  async function runOption(action: () => Promise<unknown>, message: string) {
    closeOptions();
    setError('');
    setIsSaving(true);
    try {
      await action();
    } catch {
      setError(message);
    } finally {
      setIsSaving(false);
    }
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
      <article className="gauderio-match gauderio-finished">
        <GauderioHeader title="Fim de partida" onBack={actions.goHome} />
        <section
          className={`gauderio-finished__hero ${winnerIndex === 0 ? 'gauderio-finished__hero--us' : ''} ${winnerIndex === 1 ? 'gauderio-finished__hero--them' : ''}`}
        >
          <span aria-hidden="true">◇</span>
          <h2>{winnerMessage}</h2>
          <span aria-hidden="true">◇</span>
        </section>
        <section aria-label="Placar final" className="gauderio-final-board">
          {match.teams.map((team, index) => (
            <section
              className={`gauderio-final-side ${index === 0 ? 'gauderio-side--us' : 'gauderio-side--them'}`}
              key={team.id}
            >
              <h3 className="gauderio-team-banner">
                <span aria-hidden="true">✦</span>
                {team.name}
                <span aria-hidden="true">✦</span>
              </h3>
              <MatchstickScore compact score={scores[index] ?? 0} team={team} />
            </section>
          ))}
        </section>
        <div className="gauderio-finished__actions">
          <button
            className="gauderio-leather-button gauderio-new-match"
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
          <div className="gauderio-finished__secondary">
            <button
              disabled={isSaving}
              type="button"
              onClick={() =>
                void runOption(
                  actions.reopen,
                  'Não foi possível reabrir a partida.',
                )
              }
            >
              <UndoIcon />
              Reabrir
            </button>
            <button
              disabled={isSaving}
              type="button"
              onClick={() =>
                void runOption(
                  actions.remove,
                  'Não foi possível apagar a partida.',
                )
              }
            >
              <TrashIcon />
              Apagar
            </button>
          </div>
        </div>
        {error ? (
          <p className="gauderio-error" role="alert">
            {error}
          </p>
        ) : null}
      </article>
    );
  }

  return (
    <article className="gauderio-match">
      <GauderioHeader
        title={game.label}
        onBack={actions.goHome}
        onOptions={openOptions}
      />
      <section aria-label="Placar" className="gauderio-scoreboard">
        {match.teams.map((team, index) => {
          const score = scores[index] ?? 0;
          return (
            <section
              className={`gauderio-side ${index === 0 ? 'gauderio-side--us' : 'gauderio-side--them'}`}
              key={team.id}
            >
              <h2 className="gauderio-team-banner">
                <span aria-hidden="true">✦</span>
                {team.name}
                <span aria-hidden="true">✦</span>
              </h2>
              <MatchstickScore score={score} team={team} />
              <button
                aria-label={`Adicionar 1 ponto para ${team.name}`}
                className="gauderio-add-one"
                disabled={isSaving || ceilingReached}
                type="button"
                onClick={() => void recordPoint(team.id, 1)}
              >
                +1
              </button>
              <button
                aria-label={`Remover 1 ponto de ${team.name}`}
                className="gauderio-subtract-one"
                disabled={isSaving || score <= 0}
                type="button"
                onClick={() => void recordPoint(team.id, -1)}
              >
                −1
              </button>
            </section>
          );
        })}
      </section>
      <button
        className="gauderio-undo"
        disabled={isSaving || match.entries.length === 0}
        type="button"
        onClick={() => void undoLast()}
      >
        <UndoIcon />
        Desfazer último
      </button>
      {error ? (
        <p className="gauderio-error" role="alert">
          {error}
        </p>
      ) : null}
      {optionsOpen ? (
        <OptionsSheet
          disabled={isSaving}
          onBackdrop={dismissOptions}
          onClose={closeOptions}
          onDelete={() =>
            void runOption(actions.remove, 'Não foi possível apagar a partida.')
          }
          onFinish={() =>
            void runOption(
              actions.finish,
              'Não foi possível encerrar a partida.',
            )
          }
          onReset={() =>
            void runOption(
              actions.clearEntries,
              'Não foi possível resetar os pontos.',
            )
          }
        />
      ) : null}
    </article>
  );
}
