import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  | "white-minimal"
  | "dark-vibrant"
  | "corporate"
  | "ocean-sunset"
  | "midnight-purple"
  | "lemon";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  /** CSS hex colors just for the preview swatches */
  previewColors: [string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: "white-minimal",
    name: "Blanco Minimalista",
    description: "Limpio, aéreo y moderno",
    isDark: false,
    previewColors: ["#f8fafc", "#6366f1", "#e2e8f0"],
  },
  {
    id: "dark-vibrant",
    name: "Dark Vibrante",
    description: "Neon de alto contraste",
    isDark: true,
    previewColors: ["#0a0a0a", "#00ff88", "#ff3b3b"],
  },
  {
    id: "corporate",
    name: "Profesional Corporativo",
    description: "Serio, confiable y elegante",
    isDark: false,
    previewColors: ["#1e3a5f", "#f59e0b", "#f0f4f8"],
  },
  {
    id: "ocean-sunset",
    name: "Ocean Sunset",
    description: "Premium tropical y cálido",
    isDark: false,
    previewColors: ["#0d7377", "#ff6b35", "#f5f0e8"],
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Elegante para uso nocturno",
    isDark: true,
    previewColors: ["#1a0a2e", "#a78bfa", "#10b981"],
  },
  {
    id: "lemon",
    name: "Lemon",
    description: "Fresco, moderno y vibrante",
    isDark: false,
    previewColors: ["#f0f0f0", "#aaff00", "#1a1a1a"],
  },
];

interface ThemeStore {
  selectedTheme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      selectedTheme: "white-minimal",
      setTheme: (id) => set({ selectedTheme: id }),
    }),
    { name: "myfinance-theme" },
  ),
);

export function applyTheme(id: ThemeId, isDark: boolean): void {
  const html = document.documentElement;
  // Remove all theme data attributes and dark class
  html.removeAttribute("data-theme");
  html.classList.remove("dark");
  if (id !== "white-minimal") {
    html.setAttribute("data-theme", id);
  }
  if (isDark) {
    html.classList.add("dark");
  }
}
