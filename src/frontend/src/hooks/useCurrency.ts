import type { CurrencyCode } from "@/types/finanzas";
import type { ExchangeRates } from "@/types/finanzas";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Static exchange rates — always available, no backend calls needed
const STATIC_RATES: ExchangeRates = {
  usdToInr: 83,
  icpToUsd: 10,
  icpToInr: 830,
  lastUpdated: BigInt(0),
};

interface CurrencyStore {
  selectedCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
  setSelectedCurrency: (c: CurrencyCode) => void;
  setExchangeRates: (r: ExchangeRates) => void;
}

export const useCurrency = create<CurrencyStore>()(
  persist(
    (set) => ({
      selectedCurrency: "INR",
      exchangeRates: STATIC_RATES,
      setSelectedCurrency: (c) => set({ selectedCurrency: c }),
      setExchangeRates: (r) => set({ exchangeRates: r }),
    }),
    {
      name: "finanzas-currency",
      partialize: (state) => ({ selectedCurrency: state.selectedCurrency }),
    },
  ),
);
