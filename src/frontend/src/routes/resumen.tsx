import { ResumenPage } from "@/pages/Resumen";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const resumenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resumen",
  component: ResumenPage,
});
