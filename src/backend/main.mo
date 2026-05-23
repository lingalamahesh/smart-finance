import Types "types/finanzas";
import Common "types/common";
import FinanzasApi "mixins/finanzas-api";
import ExchangeRatesApi "mixins/exchange-rates-api";
import List "mo:core/List";
import Map "mo:core/Map";



// Per-Principal state maps — each user gets their own isolated slice.



persistent actor {
  // Keyed by Principal → per-user month map
  let allMeses = Map.empty<Principal, Map.Map<Common.MesRef, Types.Mes>>();
  // Keyed by Principal → per-user income sources
  let allFuentesIngreso = Map.empty<Principal, List.List<Types.FuenteIngreso>>();
  // Keyed by Principal → per-user transactions
  let allTransacciones = Map.empty<Principal, List.List<Types.Transaccion>>();
  // Keyed by Principal → per-user savings goals
  let allMetas = Map.empty<Principal, List.List<Types.MetaAhorro>>();
  // Keyed by Principal → per-user categories
  let allCategorias = Map.empty<Principal, List.List<Text>>();
  // Keyed by Principal → per-user payment methods
  let allMetodosPago = Map.empty<Principal, List.List<Text>>();
  // Shared ID counter (one per user-session; wraps user principal into IDs via mixin)
  let idGen = { var next = 0 };
  let defaultRates : Common.ExchangeRates = {
    usdToCop = 4200.0;
    icpToUsd = 8.0;
    icpToCop = 33600.0;
    lastUpdated = 0;
  };

  include FinanzasApi(
    allMeses,
    allFuentesIngreso,
    allTransacciones,
    allMetas,
    allCategorias,
    allMetodosPago,
    idGen,
  );

  include ExchangeRatesApi(defaultRates);
};
