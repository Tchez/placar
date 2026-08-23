import { describe, expect, it, vi } from 'vitest';
import { dismissInstall, isInstallDismissed } from './installPreferences';

describe('install preferences', () => {
  it('reads and writes the namespaced dismissal through its own module', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value);
      }),
    };

    expect(isInstallDismissed(storage)).toBe(false);
    dismissInstall(storage);
    expect(storage.setItem).toHaveBeenCalledWith(
      'placar:install-dismissed',
      'true',
    );
    expect(isInstallDismissed(storage)).toBe(true);
  });
});
