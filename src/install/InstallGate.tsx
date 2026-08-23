import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../app/routes';
import { useInstall } from './InstallProvider';
import { isInstallDismissed } from './installPreferences';

export function InstallGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isInstalled } = useInstall();
  const shouldIntroduceInstall =
    !isInstalled && !isInstallDismissed() && pathname !== ROUTES.install;

  if (shouldIntroduceInstall) {
    return <Navigate replace to={ROUTES.install} />;
  }

  return children;
}
