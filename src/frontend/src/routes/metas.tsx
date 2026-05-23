import { MetasPage } from "@/pages/Metas";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const metasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/metas",
  component: MetasPage,
});
