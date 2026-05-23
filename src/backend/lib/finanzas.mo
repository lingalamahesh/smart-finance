import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/finanzas";
import Common "../types/common";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

module {
  // ─── ID generation ─────────────────────────────────────────────────────
  // ─── Per-user slice helpers ─────────────────────────────────────────────

  /// Returns (or creates) the per-user month map for a given principal.
  public func getUserMeses(
    allMeses : Map.Map<Principal, Map.Map<Common.MesRef, Types.Mes>>,
    user : Principal,
  ) : Map.Map<Common.MesRef, Types.Mes> {
    switch (allMeses.get(user)) {
      case (?m) m;
      case null {
        let m = Map.empty<Common.MesRef, Types.Mes>();
        allMeses.add(user, m);
        m;
      };
    };
  };

  /// Returns (or creates) the per-user FuenteIngreso list.
  public func getUserFuentes(
    allFuentes : Map.Map<Principal, List.List<Types.FuenteIngreso>>,
    user : Principal,
  ) : List.List<Types.FuenteIngreso> {
    switch (allFuentes.get(user)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.FuenteIngreso>();
        allFuentes.add(user, l);
        l;
      };
    };
  };

  /// Returns (or creates) the per-user Transaccion list.
  public func getUserTransacciones(
    allTx : Map.Map<Principal, List.List<Types.Transaccion>>,
    user : Principal,
  ) : List.List<Types.Transaccion> {
    switch (allTx.get(user)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.Transaccion>();
        allTx.add(user, l);
        l;
      };
    };
  };

  /// Returns (or creates) the per-user MetaAhorro list.
  public func getUserMetas(
    allMetas : Map.Map<Principal, List.List<Types.MetaAhorro>>,
    user : Principal,
  ) : List.List<Types.MetaAhorro> {
    switch (allMetas.get(user)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.MetaAhorro>();
        allMetas.add(user, l);
        l;
      };
    };
  };

  /// Returns (or creates) the per-user categories list with defaults.
  public func getUserCategorias(
    allCategorias : Map.Map<Principal, List.List<Text>>,
    user : Principal,
  ) : List.List<Text> {
    switch (allCategorias.get(user)) {
      case (?l) l;
      case null {
        let l = List.fromArray([
          "Comida/Alimentación",
          "Transporte",
          "Supermercado",
          "Vivienda",
          "Servicios del hogar",
          "Membresías",
          "Suscripciones",
        ]);
        allCategorias.add(user, l);
        l;
      };
    };
  };

  /// Returns (or creates) the per-user payment methods list with defaults.
  public func getUserMetodosPago(
    allMetodosPago : Map.Map<Principal, List.List<Text>>,
    user : Principal,
  ) : List.List<Text> {
    switch (allMetodosPago.get(user)) {
      case (?l) l;
      case null {
        let l = List.fromArray([
          "Efectivo",
          "Tarjeta de crédito",
          "Tarjeta de débito",
          "Transferencia bancaria",
          "Factura/Recibo",
          "Pago móvil",
        ]);
        allMetodosPago.add(user, l);
        l;
      };
    };
  };


  public func genId(idGen : { var next : Nat }) : Text {
    let n = idGen.next;
    idGen.next += 1;
    let t = Time.now();
    t.toText() # "-" # n.toText();
  };

  // ─── Mes ──────────────────────────────────────────────────────────────────────────

  /// Returns a zero-padded "YYYY-MM" ref for the given year+month
  public func mesRefKey(anio : Nat, mes : Nat) : Common.MesRef {
    let anioStr = anio.toText();
    let mesStr = if (mes < 10) { "0" # mes.toText() } else { mes.toText() };
    anioStr # "-" # mesStr;
  };

  /// Returns the ref for the previous month
  public func prevMesRef(mesRef : Common.MesRef) : Common.MesRef {
    let parts = mesRef.split(#char '-');
    let partsArr = parts.toArray();
    if (partsArr.size() < 2) { return mesRef };
    let anio = switch (Nat.fromText(partsArr[0])) { case (?n) n; case null 2026 };
    let mes = switch (Nat.fromText(partsArr[1])) { case (?n) n; case null 1 };
    if (mes == 1) { mesRefKey(anio - 1, 12) } else { mesRefKey(anio, mes - 1) };
  };

  // ─── FuenteIngreso ──────────────────────────────────────────────────────────

  // ─── Date sorting helpers ────────────────────────────────────────────────

  /// Parses a dd/mm/aaaa date string into a comparable integer YYYYMMDD.
  /// Returns 0 (i.e. treated as start-of-month) if empty or malformed.
  func parseFecha(fecha : Text) : Nat {
    if (fecha == "") { return 0 };
    let parts = fecha.split(#char '/');
    let arr = parts.toArray();
    if (arr.size() < 3) { return 0 };
    let d = switch (Nat.fromText(arr[0])) { case (?n) n; case null 0 };
    let m = switch (Nat.fromText(arr[1])) { case (?n) n; case null 0 };
    let y = switch (Nat.fromText(arr[2])) { case (?n) n; case null 0 };
    y * 10000 + m * 100 + d
  };

  func compareFuenteByFecha(a : Types.FuenteIngreso, b : Types.FuenteIngreso) : Order.Order {
    Nat.compare(parseFecha(a.fecha), parseFecha(b.fecha))
  };

  func compareTransaccionByFecha(a : Types.Transaccion, b : Types.Transaccion) : Order.Order {
    Nat.compare(parseFecha(a.fecha), parseFecha(b.fecha))
  };

  // ─── FuenteIngreso ──────────────────────────────────────────────────────────

  public func getFuentesIngreso(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    mesRef : Common.MesRef,
  ) : [Types.FuenteIngreso] {
    let filtered = fuentesIngreso.filter(func(f) { f.mesReferencia == mesRef });
    let arr = filtered.toArray();
    arr.sort<Types.FuenteIngreso>(compareFuenteByFecha);
  };

  public func addFuenteIngreso(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    item : Types.FuenteIngreso,
  ) : () {
    fuentesIngreso.add(item);
  };

  public func updateFuenteIngreso(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    updated : Types.FuenteIngreso,
  ) : () {
    fuentesIngreso.mapInPlace(func(f) {
      if (f.id == updated.id) { updated } else { f }
    });
  };

  public func deleteFuenteIngreso(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    id : Text,
  ) : () {
    let kept = fuentesIngreso.filter(func(f) { f.id != id });
    fuentesIngreso.clear();
    fuentesIngreso.append(kept);
  };

  // ─── Transaccion ────────────────────────────────────────────────────────────

  public func getTransacciones(
    transacciones : List.List<Types.Transaccion>,
    mesRef : Common.MesRef,
  ) : [Types.Transaccion] {
    let filtered = transacciones.filter(func(t) { t.mesReferencia == mesRef });
    let arr = filtered.toArray();
    arr.sort<Types.Transaccion>(compareTransaccionByFecha);
  };

  public func addTransaccion(
    transacciones : List.List<Types.Transaccion>,
    item : Types.Transaccion,
  ) : () {
    transacciones.add(item);
  };

  public func updateTransaccion(
    transacciones : List.List<Types.Transaccion>,
    updated : Types.Transaccion,
  ) : () {
    transacciones.mapInPlace(func(t) {
      if (t.id == updated.id) { updated } else { t }
    });
  };

  public func deleteTransaccion(
    transacciones : List.List<Types.Transaccion>,
    id : Text,
  ) : () {
    let kept = transacciones.filter(func(t) { t.id != id });
    transacciones.clear();
    transacciones.append(kept);
  };

  // ─── MetaAhorro ──────────────────────────────────────────────────────────────

  public func getMetasAhorro(
    metas : List.List<Types.MetaAhorro>
  ) : [Types.MetaAhorro] {
    metas.toArray();
  };

  public func addMetaAhorro(
    metas : List.List<Types.MetaAhorro>,
    item : Types.MetaAhorro,
  ) : () {
    metas.add(item);
  };

  public func updateMetaAhorro(
    metas : List.List<Types.MetaAhorro>,
    updated : Types.MetaAhorro,
  ) : () {
    metas.mapInPlace(func(m) {
      if (m.id == updated.id) { updated } else { m }
    });
  };

  public func deleteMetaAhorro(
    metas : List.List<Types.MetaAhorro>,
    id : Text,
  ) : () {
    let kept = metas.filter(func(m) { m.id != id });
    metas.clear();
    metas.append(kept);
  };

  // ─── Totales ──────────────────────────────────────────────────────────────────

  // ─── Update saldo anterior ────────────────────────────────────────────────

  /// Recalculates the 'Saldo del mes anterior' FuenteIngreso for mesRef
  /// using the CURRENT actual saldo of the previous month.
  /// Called at the start of getTotalesMes and getFuentesIngreso to keep it fresh.
  public func updateSaldoAnterior(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    transacciones : List.List<Types.Transaccion>,
    metas : List.List<Types.MetaAhorro>,
    mesRef : Common.MesRef,
  ) : () {
    let prevRef = prevMesRef(mesRef);
    // Compute current real saldo of prev month (without its own saldo-anterior propagation)
    let ingresosPrev = fuentesIngreso.foldLeft(
      0.0,
      func(acc, f) {
        if (f.mesReferencia == prevRef) { acc + f.valor } else { acc }
      },
    );
    if (ingresosPrev == 0.0 and not fuentesIngreso.any(func(f) { f.mesReferencia == prevRef })) {
      // Previous month has no data at all — nothing to propagate
      return;
    };
    let gastosPrev = transacciones.foldLeft(
      0.0,
      func(acc, t) {
        if (t.mesReferencia == prevRef and t.pagado) { acc + t.valor } else { acc }
      },
    );
    let inversionesPrev = metas.foldLeft(
      0.0,
      func(acc, m) { acc + m.ahorroEsteMes },
    );
    let saldoPrev = ingresosPrev - gastosPrev - inversionesPrev;
    // Find and update existing 'Saldo del mes anterior' entry for mesRef
    let hasSaldoEntry = fuentesIngreso.any(func(f) {
      f.mesReferencia == mesRef and f.descripcion == "Saldo del mes anterior"
    });
    if (hasSaldoEntry) {
      fuentesIngreso.mapInPlace(func(f) {
        if (f.mesReferencia == mesRef and f.descripcion == "Saldo del mes anterior") {
          { f with valor = saldoPrev }
        } else { f }
      });
    }
    // If entry doesn't exist yet but prev month has data, we skip — initMes handles creation
  };

  // ─── Totales ──────────────────────────────────────────────────────────────────

  public func getTotalesMes(
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    transacciones : List.List<Types.Transaccion>,
    metas : List.List<Types.MetaAhorro>,
    mesRef : Common.MesRef,
  ) : Common.TotalesMes {
    // Always refresh the carried-over saldo from the previous month
    updateSaldoAnterior(fuentesIngreso, transacciones, metas, mesRef);
    let ingresosTotal = fuentesIngreso.foldLeft(
      0.0,
      func(acc, f) {
        if (f.mesReferencia == mesRef) { acc + f.valor } else { acc }
      },
    );
    let gastosTotal = transacciones.foldLeft(
      0.0,
      func(acc, t) {
        if (t.mesReferencia == mesRef and t.pagado) { acc + t.valor } else { acc }
      },
    );
    let inversionesTotal = metas.foldLeft(
      0.0,
      func(acc, m) { acc + m.ahorroEsteMes },
    );
    let saldo = ingresosTotal - gastosTotal - inversionesTotal;
    { ingresosTotal; gastosTotal; inversionesTotal; saldo };
  };

  // ─── Mes init ─────────────────────────────────────────────────────────────────

  /// Creates a new Mes entry. Copies fixed expenses from previous month.
  /// Adds FuenteIngreso 'Saldo del mes anterior'. Idempotent.
  public func initMes(
    mesesMap : Map.Map<Common.MesRef, Types.Mes>,
    fuentesIngreso : List.List<Types.FuenteIngreso>,
    transacciones : List.List<Types.Transaccion>,
    metas : List.List<Types.MetaAhorro>,
    anio : Nat,
    mes : Nat,
    idGen : { var next : Nat },
  ) : () {
    let ref = mesRefKey(anio, mes);
    // Idempotent: do nothing if already exists
    if (mesesMap.containsKey(ref)) { return };
    mesesMap.add(ref, { anio; mes; notas = "" });
    let prevRef = prevMesRef(ref);
    if (mesesMap.containsKey(prevRef)) {
      // Rule 3: Close previous month — accumulate savings and reset monthly amount
      metas.mapInPlace(func(m) {
        { m with
          ahorroAcumulado = m.ahorroAcumulado + m.ahorroEsteMes;
          ahorroEsteMes = 0.0;
        }
      });
      // Compute previous month saldo (ahorroEsteMes is now 0) and add as income source
      let totalesPrev = getTotalesMes(fuentesIngreso, transacciones, metas, prevRef);
      if (totalesPrev.saldo != 0.0) {
        let saldoId = genId(idGen);
        fuentesIngreso.add({
          id = saldoId;
          descripcion = "Saldo del mes anterior";
          valor = totalesPrev.saldo;
          fecha = "";
          mesReferencia = ref;
          monedaOriginal = #COP;
          imagenUrl = null;
        });
      };
      // Copy fixed transactions with pagado=false and without the image attachment
      let fixedPrev = transacciones.filter(func(t) {
        t.mesReferencia == prevRef and t.esGastoFijo
      });
      fixedPrev.forEach(func(t) {
        let newId = genId(idGen);
        transacciones.add({ t with id = newId; pagado = false; mesReferencia = ref; imagenUrl = null });
      });
    };
  };

  // ─── Notas ──────────────────────────────────────────────────────────────────────

  public func getNotas(
    mesesMap : Map.Map<Common.MesRef, Types.Mes>,
    mesRef : Common.MesRef,
  ) : Text {
    switch (mesesMap.get(mesRef)) {
      case (?m) { m.notas };
      case null { "" };
    };
  };

  public func setNotas(
    mesesMap : Map.Map<Common.MesRef, Types.Mes>,
    mesRef : Common.MesRef,
    notas : Text,
  ) : () {
    switch (mesesMap.get(mesRef)) {
      case (?m) { mesesMap.add(mesRef, { m with notas }) };
      case null { mesesMap.add(mesRef, { anio = 0; mes = 0; notas }) };
    };
  };

  // ─── Meses disponibles ──────────────────────────────────────────────────────

  public func getMesesDisponibles(
    mesesMap : Map.Map<Common.MesRef, Types.Mes>
  ) : [Common.MesRef] {
    let keys = mesesMap.keys();
    let arr = keys.toArray();
    arr.sort<Text>();
  };
};
