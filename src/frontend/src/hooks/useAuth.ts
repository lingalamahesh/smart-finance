import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect } from "react";

const SESSION_KEY = "myfinance_last_active";
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useAuth() {
  const {
    identity,
    isAuthenticated,
    isInitializing,
    login,
    clear,
    loginStatus,
  } = useInternetIdentity();

  useEffect(() => {
    const recordLeave = () => {
      if (isAuthenticated) {
        localStorage.setItem(SESSION_KEY, Date.now().toString());
      }
    };

    const checkSessionTimeout = () => {
      const lastActive = localStorage.getItem(SESSION_KEY);
      if (lastActive) {
        const elapsed = Date.now() - Number.parseInt(lastActive, 10);
        if (elapsed > SESSION_TIMEOUT) {
          localStorage.removeItem(SESSION_KEY);
          clear();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordLeave();
      } else if (document.visibilityState === "visible" && isAuthenticated) {
        checkSessionTimeout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", recordLeave);

    // Check on mount (app opened from background)
    if (isAuthenticated) {
      checkSessionTimeout();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", recordLeave);
    };
  }, [isAuthenticated, clear]);

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    clear();
  }, [clear]);

  return {
    identity,
    isAuthenticated,
    isInitializing,
    login,
    logout,
    loginStatus,
  };
}
