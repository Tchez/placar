let sequence = 0;

export function createId(prefix: string): string {
  sequence += 1;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${timestamp}-${sequence.toString(36)}-${random}`;
}
