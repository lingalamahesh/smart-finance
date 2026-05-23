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
    #COP;
    #USD;
    #ICP;
  };

  // Cached exchange rates
  // usdToCop: how many COP = 1 USD (e.g. 4200)
  // icpToUsd: how many USD = 1 ICP
  // icpToCop: how many COP = 1 ICP
  public type ExchangeRates = {
    usdToCop : Float;
    icpToUsd : Float;
    icpToCop : Float;
    lastUpdated : Int; // nanoseconds
  };
};
