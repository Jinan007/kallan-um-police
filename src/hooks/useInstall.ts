import { useCallback, useEffect, useState } from "react";

/** Chrome's "install this app" event (not in the standard TypeScript DOM types). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPads report as Macs; a Mac with a touch screen is an iPad
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Everything the setup screen needs to offer installing the game:
 *  - `canPrompt`: Chrome/Edge/Android has an install prompt ready; call `install()` from a tap.
 *  - `showIosHint`: iPhones have no prompt, so we explain Share > Add to Home Screen instead.
 *  - `offlineReady`: the service worker is in control, so the game now works with no internet.
 * All are false once the game is already running as an installed app.
 */
export function useInstall() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [offlineReady, setOfflineReady] = useState(() => !!navigator.serviceWorker?.controller);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so our own button can use it
      setEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    const onController = () => setOfflineReady(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    navigator.serviceWorker?.addEventListener("controllerchange", onController);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      navigator.serviceWorker?.removeEventListener("controllerchange", onController);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    setEvent(null); // a prompt can only be used once
  }, [event]);

  return {
    canPrompt: !!event && !installed,
    showIosHint: isIos() && !installed,
    offlineReady,
    install,
  };
}
