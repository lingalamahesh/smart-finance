import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  Home,
  PieChart,
  RefreshCw,
  Settings2,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, ocid: "nav.inicio" },
  { to: "/resumen", label: "Ingresos", icon: BarChart3, ocid: "nav.resumen" },
  { to: "/gastos", label: "Gastos", icon: CreditCard, ocid: "nav.gastos" },
  {
    to: "/gastos-fijos",
    label: "Fijos",
    icon: RefreshCw,
    ocid: "nav.gastos-fijos",
  },
  { to: "/analisis", label: "Análisis", icon: PieChart, ocid: "nav.analisis" },
  { to: "/metas", label: "Metas", icon: Target, ocid: "nav.metas" },
  {
    to: "/configuracion",
    label: "Config",
    icon: Settings2,
    ocid: "nav.configuracion",
  },
] as const;

export function BottomNav() {
  const router = useRouterState();
  const pathname = router.location.pathname;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const check = () =>
      setModalOpen(document.body.classList.contains("modal-open"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (modalOpen) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      aria-label="Navegación principal"
    >
      <div className="max-w-lg mx-auto px-4 pb-4">
        <div
          className="pointer-events-auto flex items-center justify-around px-4 py-2"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "28px",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, ocid }) => {
            const isActive = to === "/" ? pathname === "/" : pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className="flex flex-col items-center relative"
                style={{
                  minWidth: 40,
                  minHeight: isActive ? 60 : 44,
                  justifyContent: "center",
                  gap: isActive ? 3 : 0,
                }}
              >
                <span
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: isActive ? "#C8FF00" : "transparent",
                    transition: "background 0.2s ease",
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    aria-hidden="true"
                    style={{
                      color: isActive ? "#0A0A0A" : "#6B6B6B",
                      transition: "color 0.2s ease",
                    }}
                  />
                </span>
                {isActive && (
                  <span
                    className="font-body font-semibold leading-none truncate text-center"
                    style={{
                      fontSize: 10,
                      color: "#0A0A0A",
                      letterSpacing: "0.3px",
                      maxWidth: 48,
                    }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
