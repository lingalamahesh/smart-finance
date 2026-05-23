import { GastosPage } from "@/pages/Gastos";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const gastosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gastos",
  component: GastosPage,
});
