import { AnalisisPage } from "@/pages/Analisis";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const analisisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analisis",
  component: AnalisisPage,
});
