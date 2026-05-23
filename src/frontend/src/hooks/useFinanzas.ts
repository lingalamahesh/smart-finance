import { createActor } from "@/backend";
import type { CurrencyCode as BackendCurrencyCode } from "@/backend";
import type { FuenteIngreso, MetaAhorro, Transaccion } from "@/types/finanzas";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type BackendFuenteIngreso = import("@/backend").FuenteIngreso;
type BackendTransaccion = import("@/backend").Transaccion;

function toBackendCurrency(c: string): BackendCurrencyCode {
  return c as BackendCurrencyCode;
}

function mapFuente(item: FuenteIngreso): BackendFuenteIngreso {
  return {
    id: item.id,
    descripcion: item.descripcion,
    valor: item.valor,
    fecha: item.fecha ?? "",
    mesReferencia: item.mesReferencia,
    monedaOriginal: toBackendCurrency(item.monedaOriginal),
    ...(item.imagenUrl != null ? { imagenUrl: item.imagenUrl } : {}),
  };
}

function mapTransaccion(item: Transaccion): BackendTransaccion {
  const { imagenUrl, ...rest } = item;
  const result: BackendTransaccion = {
    ...rest,
    monedaOriginal: toBackendCurrency(item.monedaOriginal),
  };
  if (imagenUrl != null) {
    result.imagenUrl = imagenUrl;
  }
  return result;
}

// ─── Totales ────────────────────────────────────────────────────────────────
export function useTotalesMes(mesRef: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["totales", mesRef],
    queryFn: async () => {
      if (!actor)
        return {
          ingresosTotal: 0,
          gastosTotal: 0,
          inversionesTotal: 0,
          saldo: 0,
        };
      return actor.getTotalesMes(mesRef);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// ─── Notas ──────────────────────────────────────────────────────────────────
export function useNotas(mesRef: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["notas", mesRef],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getNotas(mesRef);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useSetNotas() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mesRef,
      notas,
    }: { mesRef: string; notas: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.setNotas(mesRef, notas);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["notas", vars.mesRef] });
    },
  });
}

// ─── Fuentes de Ingreso ──────────────────────────────────────────────────────
export function useFuentesIngreso(mesRef: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<FuenteIngreso[]>({
    queryKey: ["fuentes", mesRef],
    queryFn: async () => {
      if (!actor) return [] as FuenteIngreso[];
      const result = await actor.getFuentesIngreso(mesRef);
      // Cast backend type to frontend type (fecha field is optional/client-only)
      return result as unknown as FuenteIngreso[];
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useAddFuenteIngreso() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: FuenteIngreso) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.addFuenteIngreso(mapFuente(item));
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["fuentes", vars.mesReferencia],
      });
      queryClient.invalidateQueries({
        queryKey: ["totales", vars.mesReferencia],
      });
    },
  });
}

export function useUpdateFuenteIngreso() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: FuenteIngreso) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateFuenteIngreso(mapFuente(item));
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["fuentes", vars.mesReferencia],
      });
      queryClient.invalidateQueries({
        queryKey: ["totales", vars.mesReferencia],
      });
    },
  });
}

export function useDeleteFuenteIngreso() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      mesRef: _mesRef,
    }: { id: string; mesRef: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteFuenteIngreso(id);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["fuentes", vars.mesRef] });
      queryClient.invalidateQueries({ queryKey: ["totales", vars.mesRef] });
    },
  });
}

// ─── Transacciones ──────────────────────────────────────────────────────────
export function useTransacciones(mesRef: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["transacciones", mesRef],
    queryFn: async () => {
      if (!actor) return [] as Transaccion[];
      return actor.getTransacciones(mesRef);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useAddTransaccion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Transaccion) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.addTransaccion(mapTransaccion(item));
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["transacciones", vars.mesReferencia],
      });
      queryClient.invalidateQueries({
        queryKey: ["totales", vars.mesReferencia],
      });
    },
  });
}

export function useUpdateTransaccion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Transaccion) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateTransaccion(mapTransaccion(item));
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["transacciones", vars.mesReferencia],
      });
      queryClient.invalidateQueries({
        queryKey: ["totales", vars.mesReferencia],
      });
    },
  });
}

export function useDeleteTransaccion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      mesRef: _mesRef,
    }: { id: string; mesRef: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteTransaccion(id);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["transacciones", vars.mesRef],
      });
      queryClient.invalidateQueries({ queryKey: ["totales", vars.mesRef] });
    },
  });
}

// ─── Categorías ──────────────────────────────────────────────────────────────
export function useCategorias() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      if (!actor) return [] as string[];
      return actor.getCategorias();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  });
}

export function useAddCategoria() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.addCategoria(nombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
  });
}

export function useDeleteCategoria() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteCategoria(nombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
  });
}

// ─── Métodos de Pago ─────────────────────────────────────────────────────────
export function useMetodosPago() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["metodosPago"],
    queryFn: async () => {
      if (!actor) return [] as string[];
      return actor.getMetodosPago();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  });
}

export function useAddMetodoPago() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.addMetodoPago(nombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metodosPago"] });
    },
  });
}

export function useDeleteMetodoPago() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteMetodoPago(nombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metodosPago"] });
    },
  });
}

// ─── Metas de Ahorro ─────────────────────────────────────────────────────────
export function useMetasAhorro() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["metas"],
    queryFn: async () => {
      if (!actor) return [] as MetaAhorro[];
      return actor.getMetasAhorro();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export function useAddMetaAhorro() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: MetaAhorro) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.addMetaAhorro(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
    },
  });
}

export function useUpdateMetaAhorro() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: MetaAhorro) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateMetaAhorro(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
    },
  });
}

export function useDeleteMetaAhorro() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteMetaAhorro(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
    },
  });
}

// ─── Meses Disponibles ───────────────────────────────────────────────────────
export function useMesesDisponibles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["meses"],
    queryFn: async () => {
      if (!actor) return [] as string[];
      return actor.getMesesDisponibles();
    },
    enabled: !!actor && !isFetching,
  });
}
