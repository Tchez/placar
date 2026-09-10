import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '../app/routes';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { FlagIcon } from '../components/HubIcons';
import { getInstallPlatform } from '../install/installEnvironment';
import { useInstall } from '../install/InstallProvider';
import { dismissInstall } from '../install/installPreferences';

function WrittenInstructions() {
  const platform = getInstallPlatform();

  if (platform === 'ios') {
    return (
      <div className="install-instructions">
        <p>Abra este endereço no Safari para instalar corretamente.</p>
        <ol>
          <li>Toque em Compartilhar na barra do navegador.</li>
          <li>Role a lista e escolha Adicionar à Tela de Início.</li>
          <li>Confirme tocando em Adicionar.</li>
        </ol>
      </div>
    );
  }

  if (platform === 'android') {
    return (
      <p className="install-instructions">
        Abra o menu do navegador e escolha Instalar app ou Adicionar à tela
        inicial.
      </p>
    );
  }

  if (platform === 'desktop') {
    return (
      <p className="install-instructions">
        Instale pelo ícone de instalação na barra de endereço.
      </p>
    );
  }

  return (
    <p className="install-instructions">
      Use a opção Instalar ou Adicionar à tela inicial do seu navegador.
    </p>
  );
}

export function InstallScreen() {
  useDocumentMeta(
    'Instalar — Placar',
    'Instale o Placar na tela inicial do celular para abrir mais rápido e usar offline, sem cadastro.',
  );
  const navigate = useNavigate();
  const { canPromptInstall, isInstalled, promptInstall } = useInstall();

  if (isInstalled) return <Navigate replace to={ROUTES.home} />;

  async function install() {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      dismissInstall();
      navigate(ROUTES.home, { replace: true });
    }
  }

  function continueWithoutInstalling() {
    dismissInstall();
    navigate(ROUTES.home, { replace: true });
  }

  return (
    <div className="hub-screen install-screen">
      <header className="install-header">
        <span className="install-header__icon" aria-hidden="true">
          <FlagIcon />
        </span>
        <span className="hub-eyebrow">LEVE O PLACAR COM VOCÊ</span>
        <h1>Instale antes da primeira partida</h1>
        <p>
          Assim, seu histórico fica no app que você abre pela tela inicial e
          continua disponível sem internet.
        </p>
      </header>

      <section className="install-card" aria-label="Como instalar">
        {canPromptInstall ? (
          <button
            className="hub-primary-button"
            type="button"
            onClick={() => void install()}
          >
            Instalar app
          </button>
        ) : (
          <WrittenInstructions />
        )}
        <button
          className="hub-text-button"
          type="button"
          onClick={continueWithoutInstalling}
        >
          Continuar sem instalar
        </button>
      </section>
    </div>
  );
}
