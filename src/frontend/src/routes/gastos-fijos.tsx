import { GastosFijosPage } from "@/pages/GastosFijos";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const gastosFijosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gastos-fijos",
  component: GastosFijosPage,
});
