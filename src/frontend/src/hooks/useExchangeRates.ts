import { useCurrency } from "./useCurrency";

// Static exchange rates live in useCurrency store — always initialized, never null
export function useExchangeRates() {
  const exchangeRates = useCurrency((s) => s.exchangeRates);

  return { lastUpdated: null, exchangeRates };
}
