import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useCurrentMes } from "./useCurrentMes";

/**
 * Initializes the current month on first load.
 * Also exposes the actor and isFetching state.
 */
export function useBackend() {
  const { actor, isFetching } = useActor(createActor);
  const { year, month } = useCurrentMes();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  const initMesMutation = useMutation({
    mutationFn: async ({ anio, mes }: { anio: number; mes: number }) => {
      if (!actor) throw new Error("Actor no disponible");
      await actor.initMes(BigInt(anio), BigInt(mes));
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const mutateRef = useRef(initMesMutation.mutate);
  mutateRef.current = initMesMutation.mutate;

  useEffect(() => {
    if (!actor || isFetching || initialized.current) return;
    initialized.current = true;
    mutateRef.current({ anio: year, mes: month });
  }, [actor, isFetching, year, month]);

  return { actor, isFetching, initMesMutation };
}
