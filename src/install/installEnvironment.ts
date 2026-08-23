type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export type InstallPlatform = 'android' | 'ios' | 'desktop' | 'unknown';

export function isAppInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

export function getInstallPlatform(
  userAgent: string = navigator.userAgent,
  maxTouchPoints: number = navigator.maxTouchPoints,
): InstallPlatform {
  const isIPadDisguisedAsMac =
    /Macintosh/i.test(userAgent) && maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/i.test(userAgent) || isIPadDisguisedAsMac) {
    return 'ios';
  }

  if (/Android/i.test(userAgent)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/i.test(userAgent)) return 'desktop';
  return 'unknown';
}
