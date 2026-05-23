import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useCurrentMes } from "@/hooks/useCurrentMes";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { SUPPORTED_LANGUAGES, useLanguage } from "@/hooks/useLanguage";
import { getDiaNombre, getMesNombre } from "@/utils/mes";
import { ChevronLeft, ChevronRight, Globe, Key } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  /** Override header content. Default shows month/year selector. */
  headerContent?: ReactNode;
  /** Whether to show the month selector in header */
  showMonthSelector?: boolean;
}

export function Layout({
  children,
  headerContent,
  showMonthSelector = true,
}: LayoutProps) {
  // Initialize backend on mount
  useBackend();
  // Fetch/refresh exchange rates once at app root (single source of truth)
  useExchangeRates();

  const { isAuthenticated, isInitializing, login } = useAuth();
  const { year, month, irMesAnterior, irMesSiguiente } = useCurrentMes();
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const currentLang = SUPPORTED_LANGUAGES.find(
    (l) => l.code === currentLanguage,
  );

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // Date string for display
  const todayStr = isCurrentMonth
    ? (() => {
        const d = now;
        const diaNombre = getDiaNombre(d.getDay());
        const dia = d.getDate();
        const mesNombre = getMesNombre(d.getMonth() + 1).toLowerCase();
        const anio = d.getFullYear();
        return `${diaNombre}, ${dia} de ${mesNombre} de ${anio}`;
      })()
    : "";

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#F2F2F7" }}
    >
      {/* Header — flex-shrink-0 so it never gets squished */}
      <header
        className="flex-shrink-0 z-50"
        style={{
          background: "rgba(255,255,255,0.90)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E5EA",
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3">
          {headerContent ?? (
            <>
              {/* App title row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-body text-[#8E8E93] tracking-widest uppercase font-medium">
                  Smart Finance
                </span>

                {/* Language switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: "#8E8E93", background: "#F2F2F7" }}
                      aria-label={t("nav.language", "Language")}
                      data-ocid="header.language_switcher"
                    >
                      <Globe size={12} strokeWidth={2} />
                      <span className="max-w-[48px] truncate">
                        {currentLang?.name ?? "EN"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 max-h-72 overflow-y-auto"
                    style={{
                      background: "rgba(255,255,255,0.97)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid #E5E5EA",
                      borderRadius: 14,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onSelect={() => setLanguage(lang.code)}
                        data-ocid={`language.option.${lang.code}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg"
                        style={{
                          background:
                            currentLanguage === lang.code
                              ? "#F2F2F7"
                              : "transparent",
                        }}
                      >
                        <span
                          className="text-[14px] font-medium"
                          style={{ color: "#1C1C1E" }}
                        >
                          {lang.name}
                        </span>
                        <span
                          className="text-[11px] truncate"
                          style={{ color: "#8E8E93" }}
                        >
                          {lang.englishName}
                        </span>
                        {currentLanguage === lang.code && (
                          <span
                            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: "#C8FF00",
                              border: "1px solid #0A0A0A",
                            }}
                          />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {showMonthSelector && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={irMesAnterior}
                    className="p-1.5 rounded-full transition-colors"
                    style={{ color: "#3A3A3C" }}
                    aria-label="Mes anterior"
                    data-ocid="header.mes_anterior"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>

                  <div
                    className="text-center px-5 py-1 rounded-full"
                    style={{ background: "#F2F2F7" }}
                  >
                    <h1
                      className="text-base font-display font-bold tracking-tight"
                      style={{ color: "#1C1C1E" }}
                    >
                      {getMesNombre(month).toUpperCase()} {year}
                    </h1>
                    {todayStr && (
                      <p
                        className="text-[10px] font-body capitalize leading-none mt-0.5"
                        style={{ color: "#8E8E93" }}
                      >
                        {todayStr}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={irMesSiguiente}
                    className="p-1.5 rounded-full transition-colors"
                    style={{ color: "#3A3A3C" }}
                    aria-label="Mes siguiente"
                    data-ocid="header.mes_siguiente"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main scroll area — only this scrolls, not the whole page */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto w-full px-4 py-4 pb-28">
          {children}
        </div>
        {/* Footer — minimal, hidden on small screens */}
        <footer className="hidden sm:block">
          <div
            className="max-w-lg mx-auto text-center text-[11px] font-body py-2 pb-4"
            style={{ color: "#8E8E93" }}
          >
            © {new Date().getFullYear()}. Hecho con amor usando{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors"
              style={{ color: "#6B6B6B" }}
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </main>

      {/* Fixed bottom nav — never moves, always visible */}
      {isAuthenticated && <BottomNav />}

      {/* Login overlay — minimalist Lemon theme */}
      {!isInitializing && !isAuthenticated && (
        <>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            .icon-float { animation: float 3.5s ease-in-out infinite; }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .fade-in-up { animation: fadeInUp 0.5s ease-out both; }
            .fade-in-up-1 { animation-delay: 0ms; }
            .fade-in-up-2 { animation-delay: 80ms; }
            .fade-in-up-3 { animation-delay: 160ms; }
            .fade-in-up-4 { animation-delay: 260ms; }
          `}</style>
          <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-between"
            style={{ background: "#F2F2F7", padding: "48px 24px 40px" }}
            aria-labelledby="login-overlay-title"
            data-ocid="auth.login_overlay"
          >
            {/* Top section */}
            <div className="flex flex-col items-center gap-3 fade-in-up fade-in-up-1">
              <img
                src="/assets/smart-finance-logo.png"
                alt="Smart Finance"
                className="h-16 max-h-16 w-auto rounded-2xl shadow-lg icon-float object-contain"
              />
              <h1
                id="login-overlay-title"
                className="text-3xl font-bold tracking-tight"
                style={{ color: "#1C1C1E" }}
              >
                Smart Finance
              </h1>
              <p className="text-sm font-medium" style={{ color: "#8E8E93" }}>
                Tu dinero, bajo control
              </p>
            </div>

            {/* Middle section — decorative preview cards */}
            <div
              className="w-full fade-in-up fade-in-up-2"
              style={{ maxWidth: 300, position: "relative", height: 160 }}
            >
              {/* Card behind */}
              <div
                className="absolute bg-white rounded-2xl shadow-md p-4"
                style={{
                  transform: "rotate(-2.5deg) translateY(4px)",
                  inset: "0 12px",
                }}
              >
                <p className="text-xs font-medium" style={{ color: "#8E8E93" }}>
                  Saldo disponible
                </p>
                <p
                  className="text-lg font-bold mt-1"
                  style={{ color: "#1C1C1E" }}
                >
                  $2,450,000
                </p>
                <span
                  className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 mt-1"
                  style={{ background: "#C8FF00", color: "#1C1C1E" }}
                >
                  +12.4%
                </span>
              </div>
              {/* Card front */}
              <div
                className="absolute bg-white rounded-2xl shadow-lg p-4"
                style={{ bottom: 0, left: 20, right: 20 }}
              >
                <p className="text-xs font-medium" style={{ color: "#8E8E93" }}>
                  Este mes
                </p>
                <div className="flex items-end gap-1 mt-2">
                  {[16, 24, 12, 32, 20].map((h, _idx) => (
                    <div
                      key={h}
                      className="flex-1 rounded-sm"
                      style={{ height: h, background: "#C8FF00" }}
                    />
                  ))}
                </div>
                <p className="text-[11px] mt-1" style={{ color: "#8E8E93" }}>
                  Gastos del mes
                </p>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col items-center gap-2 fade-in-up fade-in-up-4">
              <button
                type="button"
                onClick={login}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.96] shadow-sm"
                style={{
                  background: "#1C1C1E",
                  color: "#FFFFFF",
                  transition: "transform 0.15s ease, opacity 0.15s ease",
                }}
                data-ocid="auth.login_button"
              >
                <Key size={13} />
                Acceder con Internet Identity
              </button>
              <p className="text-[11px]" style={{ color: "#AEAEB2" }}>
                Tus datos son solo tuyos
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
