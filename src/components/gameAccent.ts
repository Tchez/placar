import type { CSSProperties } from 'react';
import type { RegisteredGame } from '../games';

type AccentStyle = CSSProperties & { '--game-accent': string };

export function gameAccentStyle(game: RegisteredGame): AccentStyle {
  return { '--game-accent': game.hub.accent };
}
