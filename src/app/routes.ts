export const ROUTES = {
  home: '/',
  install: '/instalar',
  activeMatches: '/em-andamento',
  history: '/historico',
  newMatch: '/nova/:gameId',
  match: '/partida/:matchId',
} as const;

export function newMatchPath(gameId: string): string {
  return ROUTES.newMatch.replace(':gameId', encodeURIComponent(gameId));
}

export function matchPath(matchId: string): string {
  return ROUTES.match.replace(':matchId', encodeURIComponent(matchId));
}
