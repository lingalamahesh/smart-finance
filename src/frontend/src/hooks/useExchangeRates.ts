import { useCurrency } from "./useCurrency";

// Static exchange rates live in useCurrency store — always initialized, never null
// Rates: 1 USD = 83 INR, 1 ICP = ~$10 = ~830 INR
export function useExchangeRates() {
  const exchangeRates = useCurrency((s) => s.exchangeRates);

  return { lastUpdated: null, exchangeRates };
}
