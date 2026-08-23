const numberFormatter = new Intl.NumberFormat('pt-BR');
const startedAtFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatStartedAt(value: string): string {
  return startedAtFormatter.format(new Date(value));
}
