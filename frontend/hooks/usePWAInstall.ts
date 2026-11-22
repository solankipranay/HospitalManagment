import { useState, useEffect } from "react";
import { Platform } from "react-native";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Check if already in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn("PWA install error:", err);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // General prompt or alert when browser hasn't fired prompt yet
      alert(
        "To install CarePulse on your device:\n\n1. In Chrome/Edge: Click the install icon (📥) in the address bar, or open the browser menu (⋮) and tap 'Install App' or 'Add to Home Screen'."
      );
    }
  };

  return {
    isInstallable: isInstallable || (!isInstalled && (isIOS || Platform.OS === "web")),
    isInstalled,
    isIOS,
    showIOSInstructions,
    setShowIOSInstructions,
    installApp,
  };
}
