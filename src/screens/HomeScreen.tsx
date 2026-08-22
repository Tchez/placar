import { GAMES } from '../games';

export function HomeScreen() {
  if (GAMES.length === 0) {
    return (
      <section className="empty-state" aria-labelledby="empty-state-title">
        <h1 id="empty-state-title">Nenhum jogo disponível ainda.</h1>
        <p>Os jogos chegam nas próximas versões.</p>
      </section>
    );
  }

  return null;
}
