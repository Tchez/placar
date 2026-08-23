const INSTALL_DISMISSED_KEY = 'placar:install-dismissed';

type InstallPreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isInstallDismissed(
  storage: InstallPreferenceStorage = window.localStorage,
): boolean {
  return storage.getItem(INSTALL_DISMISSED_KEY) === 'true';
}

export function dismissInstall(
  storage: InstallPreferenceStorage = window.localStorage,
): void {
  storage.setItem(INSTALL_DISMISSED_KEY, 'true');
}
