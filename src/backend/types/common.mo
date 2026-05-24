module {
  // Mes reference in format "YYYY-MM" (e.g. "2026-03")
  public type MesRef = Text;

  // Summary totals for a month
  public type TotalesMes = {
    ingresosTotal : Float;
    gastosTotal : Float;
    inversionesTotal : Float;
    saldo : Float;
  };

  // Supported currency codes
  public type CurrencyCode = {
    #INR;
    #USD;
    #ICP;
  };

  // Cached exchange rates
  // usdToInr: how many INR = 1 USD (e.g. 83.0)
  // icpToUsd: how many USD = 1 ICP
  // icpToInr: how many INR = 1 ICP
  public type ExchangeRates = {
    usdToInr : Float;
    icpToUsd : Float;
    icpToInr : Float;
    lastUpdated : Int; // nanoseconds
  };
};
