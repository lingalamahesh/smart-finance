import { ConfiguracionPage } from "@/pages/Configuracion";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const configuracionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/configuracion",
  component: ConfiguracionPage,
});
