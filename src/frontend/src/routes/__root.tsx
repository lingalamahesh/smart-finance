import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  Outlet,
  createRootRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

const PROTECTED_PATHS = [
  "/resumen",
  "/gastos",
  "/gastos-fijos",
  "/analisis",
  "/metas",
  "/configuracion",
];

const SESSION_TAB_KEY = "myfinance_active_tab";
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMESTAMP_KEY = "myfinance_last_active_ts";

function RootLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const hasRestoredTab = useRef(false);
  const authHandledRef = useRef(false);

  // Save current tab and timestamp on every route change
  useEffect(() => {
    const path = location.pathname;
    const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
    if (isProtected) {
      sessionStorage.setItem(SESSION_TAB_KEY, path);
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(Date.now()));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isInitializing) return;

    const isProtected = PROTECTED_PATHS.some((p) =>
      location.pathname.startsWith(p),
    );

    // Redirect unauthenticated users away from protected pages
    if (!isAuthenticated && isProtected) {
      navigate({ to: "/" });
      return;
    }

    if (isAuthenticated) {
      // On first auth resolution, try to restore last tab (within 5 min window)
      if (!hasRestoredTab.current && !authHandledRef.current) {
        authHandledRef.current = true;
        const savedTab = sessionStorage.getItem(SESSION_TAB_KEY);
        const savedTs = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
        const elapsed = savedTs
          ? Date.now() - Number(savedTs)
          : Number.POSITIVE_INFINITY;
        const tabIsProtected = savedTab
          ? PROTECTED_PATHS.some((p) => savedTab.startsWith(p))
          : false;

        if (
          savedTab &&
          tabIsProtected &&
          elapsed < SESSION_TIMEOUT_MS &&
          location.pathname === "/"
        ) {
          hasRestoredTab.current = true;
          navigate({ to: savedTab as "/resumen" });
          return;
        }
        hasRestoredTab.current = true;
      }

      // Authenticated users on "/" stay on home dashboard — no redirect needed
    }
  }, [isAuthenticated, isInitializing, location.pathname, navigate]);

  // Update timestamp while the user is active (every 30s)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const savedTab = sessionStorage.getItem(SESSION_TAB_KEY);
      if (savedTab) {
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(Date.now()));
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
