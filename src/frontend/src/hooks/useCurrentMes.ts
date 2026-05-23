import {
  getMesRef,
  getMesRefAnterior,
  getMesRefSiguiente,
  parseMesRef,
} from "@/utils/mes";
import { create } from "zustand";

interface CurrentMesStore {
  year: number;
  month: number;
  mesRef: string;
  setMes: (year: number, month: number) => void;
  irMesSiguiente: () => void;
  irMesAnterior: () => void;
}

const now = new Date();
const initialYear = now.getFullYear();
const initialMonth = now.getMonth() + 1;

export const useCurrentMes = create<CurrentMesStore>((set, get) => ({
  year: initialYear,
  month: initialMonth,
  mesRef: getMesRef(initialYear, initialMonth),
  setMes: (year, month) => set({ year, month, mesRef: getMesRef(year, month) }),
  irMesSiguiente: () => {
    const { year, month } = get();
    const siguiente = getMesRefSiguiente(year, month);
    const { year: ny, month: nm } = parseMesRef(siguiente);
    set({ year: ny, month: nm, mesRef: siguiente });
  },
  irMesAnterior: () => {
    const { year, month } = get();
    const anterior = getMesRefAnterior(year, month);
    const { year: ny, month: nm } = parseMesRef(anterior);
    set({ year: ny, month: nm, mesRef: anterior });
  },
}));
