import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { createId } from '../app/createId';
import { formatNumber } from '../app/format';
import { HistoryIcon } from '../components/HubIcons';
import type { GameMatchViewProps } from '.';
import { getVoleiTallies, MAX_VOLEI_POINTS, MAX_VOLEI_SETS } from './volei';
import '../styles/games/volei.css';

function CounterIcon({
  kind,
}: {
  kind: 'back' | 'settings' | 'minus' | 'reset' | 'save' | 'trash';
}) {
  const paths = {
    back: 'm15 4-8 8 8 8',
    settings:
      'm9 3-.5 3-2 1-2.8-1-2 3.5 2.3 2v2L1.7 16l2 3.5 2.8-1 2 1 .5 3h4l.5-3 2-1 2.8 1 2-3.5-2.3-2v-2l2.3-2.5-2-3.5-2.8 1-2-1L13 3Z',
    minus: 'M3 12h8m5-4 3-2v12m-3 0h6',
    reset: 'M3 10a9 9 0 1 1 1 7M3 4v6h6m3-3c-3 0-3 10 0 10s3-10 0-10Z',
    save: 'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',
    trash: 'M4 7h16M9 7V3h6v4M6 7l1 14h10l1-14M10 10v7M14 10v7',
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[kind]} />
      {kind === 'settings' ? <circle cx="11" cy="13" r="3" /> : null}
    </svg>
  );
}

function Rings() {
  return (
    <span className="volei-rings" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function CounterNumber({
  value: number,
  kind,
}: {
  value: number;
  kind: 'points' | 'sets';
}) {
  const value = formatNumber(number);
  if (kind === 'sets') return <span>{value}</span>;
  return (
    <svg className="volei-points" viewBox="0 0 300 320" aria-hidden="true">
      <text
        x="150"
        y="273"
        textAnchor="middle"
        textLength={value.length > 1 ? 260 : 135}
        lengthAdjust="spacingAndGlyphs"
      >
        {value}
      </text>
    </svg>
  );
}

const CounterPaper = memo(function CounterPaper({
  value,
  side,
  kind = 'points',
}: {
  value: number;
  side: string;
  kind?: 'points' | 'sets';
}) {
  const [turn, setTurn] = useState({
    current: value,
    previous: value,
    revision: 0,
    active: false,
  });

  // Retain only the previous persisted value; a new score replaces an unfinished turn.
  if (turn.current !== value) {
    setTurn({
      current: value,
      previous: turn.current,
      revision: turn.revision + 1,
      active: true,
    });
  }

  const reverse = turn.current < turn.previous;
  return (
    <span
      className={`volei-paper-stack volei-paper-stack--${kind}${turn.active ? ' volei-paper-stack--turning' : ''}`}
      role={kind === 'points' ? 'img' : undefined}
      aria-hidden={kind === 'sets' ? true : undefined}
      aria-label={`${formatNumber(value)} ${value === 1 ? 'ponto' : 'pontos'} à ${side}`}
    >
      <span className="volei-paper" aria-hidden="true">
        <CounterNumber
          kind={kind}
          value={turn.active && reverse ? turn.previous : value}
        />
      </span>
      {turn.active ? (
        <span
          key={turn.revision}
          className={`volei-paper volei-paper--turn${reverse ? ' volei-paper--reverse' : ''}`}
          aria-hidden="true"
          onAnimationEnd={() =>
            setTurn((current) => ({ ...current, active: false }))
          }
        >
          <CounterNumber kind={kind} value={reverse ? value : turn.previous} />
        </span>
      ) : null}
      <span className="volei-paper-current" aria-hidden="true">
        <CounterNumber kind={kind} value={value} />
      </span>
    </span>
  );
});

function Overlay({
  children,
  label,
  kind,
  busy,
  onClose,
}: {
  children: ReactNode;
  label: string;
  kind: 'options' | 'prompt';
  busy: boolean;
  onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() => {
        if (trigger instanceof HTMLElement && trigger.isConnected)
          trigger.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`volei-dialog volei-dialog--${kind}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}

export function VoleiMatchView({ actions, match }: GameMatchViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [prompt, setPrompt] = useState<'back' | 'finish' | null>(null);
  const tallies = getVoleiTallies(match);
  const isFinished = match.finishedAt !== null;
  const isSaved = match.savedToHistory !== false;

  useEffect(() => {
    document.body.classList.add('volei-theme');
    return () => document.body.classList.remove('volei-theme');
  }, []);

  async function perform(action: () => Promise<unknown>, after?: () => void) {
    if (busy.current) return;
    busy.current = true;
    setIsSaving(true);
    setError('');
    try {
      await action();
      after?.();
    } catch {
      setError('Não foi possível salvar a alteração. Tente novamente.');
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }

  function record(teamId: string, note: '' | 'set' | 'zerar') {
    if (isFinished) return;
    if (
      note === '' &&
      (tallies.find((tally) => tally.teamId === teamId)?.points ?? 0) >=
        MAX_VOLEI_POINTS
    )
      return;
    if (
      note === 'set' &&
      (tallies.find((tally) => tally.teamId === teamId)?.sets ?? 0) >=
        MAX_VOLEI_SETS
    )
      return;
    void perform(() =>
      actions.addEntry({
        id: createId('entry'),
        teamId,
        note,
        value: note === 'zerar' ? 0 : 1,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  function removeLatestPoint(teamId: string) {
    if (isFinished) return;
    let latestResetIndex = -1;
    for (let index = 0; index < match.entries.length; index += 1) {
      const entry = match.entries[index];
      if (entry?.teamId === teamId && entry.note === 'zerar') {
        latestResetIndex = index;
      }
    }
    let pointId: string | null = null;
    for (
      let index = match.entries.length - 1;
      index > latestResetIndex;
      index -= 1
    ) {
      const entry = match.entries[index];
      if (entry?.teamId === teamId && entry.note === '') {
        pointId = entry.id;
        break;
      }
    }
    if (pointId) void perform(() => actions.removeEntry(pointId));
  }

  function removeLatestSet(teamId: string) {
    if (isFinished) return;
    let setId: string | null = null;
    for (let index = match.entries.length - 1; index >= 0; index -= 1) {
      const entry = match.entries[index];
      if (entry?.teamId === teamId && entry.note === 'set') {
        setId = entry.id;
        break;
      }
    }
    if (setId) void perform(() => actions.removeEntry(setId));
  }

  function leave(trigger: 'back' | 'finish') {
    if (!isSaved) {
      setError('');
      setPrompt(trigger);
      return;
    }
    if (trigger === 'back') actions.goHome();
    else void perform(actions.finish);
  }

  function saveAnswer() {
    void perform(
      () => actions.saveToHistory(prompt === 'finish'),
      () => {
        setPrompt(null);
        if (prompt === 'back') actions.goHome();
      },
    );
  }

  return (
    <article className="volei-match" aria-label="Placar de vôlei">
      <header className="volei-header">
        <button
          className="volei-icon-button"
          aria-label="Voltar ao início"
          disabled={isSaving}
          onClick={() => leave('back')}
        >
          <CounterIcon kind="back" />
        </button>
        <button
          className="volei-icon-button"
          aria-label="Mais opções"
          aria-haspopup="dialog"
          aria-expanded={optionsOpen}
          disabled={isSaving}
          onClick={() => {
            setError('');
            setOptionsOpen(true);
          }}
        >
          <CounterIcon kind="settings" />
        </button>
      </header>
      <div className="volei-board">
        {tallies.map(({ teamId, points }, index) => {
          const side = index === 0 ? 'esquerda' : 'direita';
          const value = formatNumber(points);
          return (
            <section
              className={`volei-side volei-side--${side}`}
              key={teamId}
              aria-label={`Pontos à ${side}`}
            >
              <div className="volei-plate">
                {!isFinished ? (
                  <button
                    className="volei-point-entry"
                    aria-label={
                      points >= MAX_VOLEI_POINTS
                        ? `${value} pontos à ${side}, limite de ${MAX_VOLEI_POINTS} pontos`
                        : `Adicionar ponto à ${side}`
                    }
                    disabled={isSaving || points >= MAX_VOLEI_POINTS}
                    onClick={() => record(teamId, '')}
                  />
                ) : null}
                <Rings />
                <CounterPaper value={points} side={side} />
                {!isFinished ? (
                  <div className="volei-point-actions">
                    <button
                      className="volei-point-action"
                      aria-label={`Voltar ponto à ${side}`}
                      title="Voltar ponto"
                      disabled={isSaving || points === 0}
                      onClick={() => removeLatestPoint(teamId)}
                    >
                      <CounterIcon kind="minus" />
                    </button>
                    <button
                      className="volei-point-action volei-point-action--reset"
                      aria-label={`Zerar pontos à ${side}`}
                      title="Zerar pontos"
                      disabled={isSaving || points === 0}
                      onClick={() => record(teamId, 'zerar')}
                    >
                      <CounterIcon kind="reset" />
                      <span aria-hidden="true">Zerar</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
        <section className="volei-center" aria-label="Sets">
          <span className="volei-sets-label">SETS</span>
          <div className="volei-sets">
            {tallies.map(({ teamId, sets }, index) => (
              <div className="volei-set-control" key={teamId}>
                <div className="volei-set">
                  <button
                    className="volei-point-entry volei-set-entry"
                    aria-label={`${formatNumber(sets)} ${sets === 1 ? 'set' : 'sets'} à ${index === 0 ? 'esquerda' : 'direita'}${isFinished ? '' : sets >= MAX_VOLEI_SETS ? ', limite de 3 sets' : ', adicionar set'}`}
                    disabled={isFinished || sets >= MAX_VOLEI_SETS}
                    aria-disabled={
                      isSaving || isFinished || sets >= MAX_VOLEI_SETS
                    }
                    onClick={() => record(teamId, 'set')}
                  />
                  <Rings />
                  <span className="volei-set-size" aria-hidden="true">
                    {formatNumber(sets)}
                  </span>
                  <CounterPaper
                    value={sets}
                    side={index === 0 ? 'esquerda' : 'direita'}
                    kind="sets"
                  />
                </div>
                <button
                  className="volei-set-back"
                  aria-label={`Voltar set à ${index === 0 ? 'esquerda' : 'direita'}`}
                  title="Voltar set"
                  disabled={isFinished || sets === 0}
                  aria-disabled={isSaving || isFinished || sets === 0}
                  onClick={() => removeLatestSet(teamId)}
                >
                  <CounterIcon kind="minus" />
                </button>
              </div>
            ))}
          </div>
          {isFinished ? (
            <span className="volei-finished" role="status">
              Encerrada
            </span>
          ) : null}
          <button
            className="volei-finish"
            disabled={isSaving}
            onClick={() =>
              isFinished ? void perform(actions.reopen) : leave('finish')
            }
          >
            {isFinished ? 'Reabrir partida' : 'Encerrar partida'}
          </button>
        </section>
      </div>
      {error && !optionsOpen && !prompt ? (
        <p role="alert" className="volei-error">
          {error}
        </p>
      ) : null}
      {optionsOpen ? (
        <Overlay
          label="Mais opções"
          kind="options"
          busy={isSaving}
          onClose={() => setOptionsOpen(false)}
        >
          <button disabled={isSaving} onClick={actions.goHistory}>
            <HistoryIcon />
            Histórico de partidas
          </button>
          {!isSaved ? (
            <button
              disabled={isSaving}
              onClick={() =>
                void perform(
                  () => actions.saveToHistory(),
                  () => setOptionsOpen(false),
                )
              }
            >
              <CounterIcon kind="save" />
              Salvar partida
            </button>
          ) : null}
          <button
            disabled={isSaving}
            onClick={() =>
              void perform(actions.remove, () => setOptionsOpen(false))
            }
          >
            <CounterIcon kind="trash" />
            Apagar partida
          </button>
          {error ? (
            <p role="alert" className="volei-error">
              {error}
            </p>
          ) : null}
          <button
            className="sr-only"
            disabled={isSaving}
            onClick={() => setOptionsOpen(false)}
          >
            Fechar opções
          </button>
        </Overlay>
      ) : null}
      {prompt ? (
        <Overlay
          label="Salvar esta partida no histórico?"
          kind="prompt"
          busy={isSaving}
          onClose={() => setPrompt(null)}
        >
          <h2>Salvar esta partida no histórico?</h2>
          <p>Se escolher não, a partida será apagada.</p>
          <div className="volei-prompt-actions">
            <button disabled={isSaving} onClick={saveAnswer}>
              Sim
            </button>
            <button
              disabled={isSaving}
              onClick={() => void perform(actions.discard)}
            >
              Não
            </button>
            <button disabled={isSaving} onClick={() => setPrompt(null)}>
              Cancelar
            </button>
          </div>
          {error ? (
            <p role="alert" className="volei-error">
              {error}
            </p>
          ) : null}
        </Overlay>
      ) : null}
    </article>
  );
}
