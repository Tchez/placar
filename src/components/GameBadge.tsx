import type { RegisteredGame } from '../games';
import { gameAccentStyle } from './gameAccent';

interface GameBadgeProps {
  game: RegisteredGame;
  size?: 'small' | 'large';
}

export function GameBadge({ game, size = 'small' }: GameBadgeProps) {
  const Icon = game.hub.Icon;
  return (
    <span
      aria-hidden="true"
      className={`game-badge game-badge--${size}`}
      style={gameAccentStyle(game)}
    >
      <Icon />
    </span>
  );
}
