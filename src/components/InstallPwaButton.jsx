import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

// Wraps the browser's native "add to home screen" flow (where available) and
// falls back to manual instructions on iOS Safari, which has no install API.
export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(true);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const ios = typeof window !== 'undefined' && isIos();

  useEffect(() => {
    setInstalled(isStandalone());

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function handleAppInstalled() {
      setDeferredPrompt(null);
      setInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !ios) return null;

  async function handleClick() {
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline justify-start gap-2"
        onClick={handleClick}
      >
        <Download size={18} />
        Install as App
      </button>

      {showIosHelp && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIosHelp(false);
          }}
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">Install as App</h3>
            <p className="py-2 text-sm opacity-70">
              In Safari, tap the Share icon, then "Add to Home Screen" to
              install Med Tracker as an app on this device.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowIosHelp(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
