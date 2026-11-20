import { useState, useEffect, useCallback } from 'react';

/**
 * useShareIndicator — tracks whether the host is actively sharing their screen.
 * Syncs with the Electron IPC bridge (window.electronAPI) when available.
 */
export function useShareIndicator() {
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    // Listen for Electron-side events (e.g. user stopped via tray)
    const cleanupStarted = api.onShareStarted(() => {
      setIsSharing(true);
    });
    const cleanupStopped = api.onShareStopped(() => {
      setIsSharing(false);
    });

    return () => {
      cleanupStarted();
      cleanupStopped();
    };
  }, []);

  const startSharing = useCallback(() => {
    setIsSharing(true);
  }, []);

  const stopSharing = useCallback(() => {
    setIsSharing(false);
    window.electronAPI?.stopCapture();
  }, []);

  return { isSharing, startSharing, stopSharing };
}
