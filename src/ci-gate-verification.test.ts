import { expect, it } from 'vitest';

it('fails deliberately to verify the deployment gate', () => {
  expect(true).toBe(false);
});
