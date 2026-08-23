import { Link } from 'react-router-dom';
import { formatNumber, formatStartedAt } from '../app/format';
import { matchPath } from '../app/routes';
import type { Match } from '../domain/types';
import type { RegisteredGame } from '../games';
import { gameAccentStyle } from './gameAccent';
import { ChevronRightIcon } from './HubIcons';
import { GameBadge } from './GameBadge';

interface MatchRowProps {
  game: RegisteredGame;
  match: Match;
  showOutcome?: boolean;
}

function getFinishedOutcome(game: RegisteredGame, match: Match): string {
  const scoreboard = game.scoreboard(match);
  if (scoreboard.winnerTeamId !== null) return scoreboard.detail ?? '';
  if (scoreboard.detail?.startsWith('Empate na meta')) {
    return scoreboard.detail;
  }
  return 'Partida encerrada';
}

export function MatchRow({ game, match, showOutcome = false }: MatchRowProps) {
  const scoreboard = game.scoreboard(match);
  const outcome =
    showOutcome && match.finishedAt !== null
      ? getFinishedOutcome(game, match)
      : null;

  return (
    <Link
      className="hub-match-row"
      style={gameAccentStyle(game)}
      to={matchPath(match.id)}
    >
      <span className="hub-match-row__dot" aria-hidden="true" />
      <GameBadge game={game} />
      <span className="hub-match-row__copy">
        <strong>{match.teams.map(({ name }) => name).join(' × ')}</strong>
        <span>
          {game.label}
          {match.target === null
            ? null
            : ` · Meta: ${formatNumber(match.target)}`}
        </span>
        <small>Iniciada em {formatStartedAt(match.createdAt)}</small>
        {outcome ? <em>{outcome}</em> : null}
      </span>
      <strong className="hub-match-row__score">
        {scoreboard.standings
          .map(({ score }) => formatNumber(score))
          .join(' × ')}
      </strong>
      <ChevronRightIcon className="hub-match-row__chevron" />
    </Link>
  );
}
