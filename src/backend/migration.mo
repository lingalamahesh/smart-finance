import Common "./types/common";
import Types "./types/finanzas";
import Map "mo:core/Map";
import List "mo:core/List";

module {
  // ── Old types (inline copies from .old/src/backend/types/) ──────────────────

  type OldCurrencyCode = {
    #COP;
    #USD;
    #ICP;
  };

  type OldExchangeRates = {
    usdToCop : Float;
    icpToUsd : Float;
    icpToCop : Float;
    lastUpdated : Int;
  };

  type OldFuenteIngreso = {
    id : Text;
    descripcion : Text;
    valor : Float;
    fecha : Text;
    mesReferencia : Text;
    monedaOriginal : OldCurrencyCode;
    imagenUrl : ?Text;
  };

  type OldTransaccion = {
    id : Text;
    descripcion : Text;
    valor : Float;
    fecha : Text;
    categoria : Text;
    metodoPago : Text;
    esEsencial : Bool;
    pagado : Bool;
    esGastoFijo : Bool;
    mesReferencia : Text;
    monedaOriginal : OldCurrencyCode;
    imagenUrl : ?Text;
  };

  type OldMes = {
    anio : Nat;
    mes : Nat;
    notas : Text;
  };

  type OldMetaAhorro = {
    id : Text;
    nombre : Text;
    metaTotal : Float;
    ahorroAcumulado : Float;
    ahorroEsteMes : Float;
  };

  // ── OldActor / NewActor record types ────────────────────────────────────────

  type MesRef = Text;

  type OldActor = {
    allMeses : Map.Map<Principal, Map.Map<MesRef, OldMes>>;
    allFuentesIngreso : Map.Map<Principal, List.List<OldFuenteIngreso>>;
    allTransacciones : Map.Map<Principal, List.List<OldTransaccion>>;
    allMetas : Map.Map<Principal, List.List<OldMetaAhorro>>;
    allCategorias : Map.Map<Principal, List.List<Text>>;
    allMetodosPago : Map.Map<Principal, List.List<Text>>;
    idGen : { var next : Nat };
    defaultRates : OldExchangeRates;
  };

  type NewActor = {
    allMeses : Map.Map<Principal, Map.Map<MesRef, Types.Mes>>;
    allFuentesIngreso : Map.Map<Principal, List.List<Types.FuenteIngreso>>;
    allTransacciones : Map.Map<Principal, List.List<Types.Transaccion>>;
    allMetas : Map.Map<Principal, List.List<Types.MetaAhorro>>;
    allCategorias : Map.Map<Principal, List.List<Text>>;
    allMetodosPago : Map.Map<Principal, List.List<Text>>;
    idGen : { var next : Nat };
    defaultRates : Common.ExchangeRates;
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Map #COP → #INR; keep #USD and #ICP unchanged.
  func migrateCurrency(old : OldCurrencyCode) : Common.CurrencyCode {
    switch old {
      case (#COP) { #INR };
      case (#USD) { #USD };
      case (#ICP) { #ICP };
    };
  };

  func migrateFuente(f : OldFuenteIngreso) : Types.FuenteIngreso {
    { f with monedaOriginal = migrateCurrency(f.monedaOriginal) };
  };

  func migrateTransaccion(t : OldTransaccion) : Types.Transaccion {
    { t with monedaOriginal = migrateCurrency(t.monedaOriginal) };
  };

  // ── Migration entry point ───────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Migrate defaultRates: rename usdToCop→usdToInr, icpToCop→icpToInr
    let newDefaultRates : Common.ExchangeRates = {
      usdToInr = old.defaultRates.usdToCop;  // preserve stored rate value
      icpToUsd = old.defaultRates.icpToUsd;
      icpToInr = old.defaultRates.icpToCop;  // preserve stored rate value
      lastUpdated = old.defaultRates.lastUpdated;
    };

    // Migrate per-user income sources: #COP → #INR in monedaOriginal
    let allFuentesIngreso = old.allFuentesIngreso.map<Principal, List.List<OldFuenteIngreso>, List.List<Types.FuenteIngreso>>(
      func(_p, fuentes) {
        fuentes.map<OldFuenteIngreso, Types.FuenteIngreso>(migrateFuente);
      }
    );

    // Migrate per-user transactions: #COP → #INR in monedaOriginal
    let allTransacciones = old.allTransacciones.map<Principal, List.List<OldTransaccion>, List.List<Types.Transaccion>>(
      func(_p, transacciones) {
        transacciones.map<OldTransaccion, Types.Transaccion>(migrateTransaccion);
      }
    );

    {
      allMeses = old.allMeses;
      allFuentesIngreso;
      allTransacciones;
      allMetas = old.allMetas;
      allCategorias = old.allCategorias;
      allMetodosPago = old.allMetodosPago;
      idGen = old.idGen;
      defaultRates = newDefaultRates;
    };
  };
};
