import { THEMES, applyTheme, useTheme } from "@/hooks/useTheme";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { rootRoute } from "./routes/__root";
import { analisisRoute } from "./routes/analisis";
import { configuracionRoute } from "./routes/configuracion";
import { gastosRoute } from "./routes/gastos";
import { gastosFijosRoute } from "./routes/gastos-fijos";
import { indexRoute } from "./routes/index";
import { metasRoute } from "./routes/metas";
import { resumenRoute } from "./routes/resumen";

const routeTree = rootRoute.addChildren([
  indexRoute,
  resumenRoute,
  gastosRoute,
  gastosFijosRoute,
  analisisRoute,
  metasRoute,
  configuracionRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { selectedTheme } = useTheme();

  useEffect(() => {
    const theme = THEMES.find((t) => t.id === selectedTheme);
    applyTheme(selectedTheme, theme?.isDark ?? false);
  }, [selectedTheme]);

  return <RouterProvider router={router} />;
}
