import List "mo:core/List";
import Map "mo:core/Map";
import Types "../types/finanzas";
import Common "../types/common";
import Lib "../lib/finanzas";
import Principal "mo:core/Principal";

mixin (
  allMeses : Map.Map<Principal, Map.Map<Common.MesRef, Types.Mes>>,
  allFuentesIngreso : Map.Map<Principal, List.List<Types.FuenteIngreso>>,
  allTransacciones : Map.Map<Principal, List.List<Types.Transaccion>>,
  allMetas : Map.Map<Principal, List.List<Types.MetaAhorro>>,
  allCategorias : Map.Map<Principal, List.List<Text>>,
  allMetodosPago : Map.Map<Principal, List.List<Text>>,
  idGen : { var next : Nat },
) {
  // ─── Auth guard ────────────────────────────────────────────────────────────

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  // ─── Mes ──────────────────────────────────────────────────────────────────

  public shared ({ caller }) func initMes(anio : Nat, mes : Nat) : async () {
    requireAuth(caller);
    let mesesMap = Lib.getUserMeses(allMeses, caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.initMes(mesesMap, fuentesIngreso, transacciones, metas, anio, mes, idGen);
  };

  public shared query ({ caller }) func getMesesDisponibles() : async [Common.MesRef] {
    requireAuth(caller);
    let mesesMap = Lib.getUserMeses(allMeses, caller);
    Lib.getMesesDisponibles(mesesMap);
  };

  public shared ({ caller }) func getTotalesMes(mesRef : Common.MesRef) : async Common.TotalesMes {
    requireAuth(caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.getTotalesMes(fuentesIngreso, transacciones, metas, mesRef);
  };

  // ─── Notas ────────────────────────────────────────────────────────────────

  public shared query ({ caller }) func getNotas(mesRef : Common.MesRef) : async Text {
    requireAuth(caller);
    let mesesMap = Lib.getUserMeses(allMeses, caller);
    Lib.getNotas(mesesMap, mesRef);
  };

  public shared ({ caller }) func setNotas(mesRef : Common.MesRef, notas : Text) : async () {
    requireAuth(caller);
    let mesesMap = Lib.getUserMeses(allMeses, caller);
    Lib.setNotas(mesesMap, mesRef, notas);
  };

  // ─── FuenteIngreso ────────────────────────────────────────────────────────

  public shared ({ caller }) func getFuentesIngreso(mesRef : Common.MesRef) : async [Types.FuenteIngreso] {
    requireAuth(caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.updateSaldoAnterior(fuentesIngreso, transacciones, metas, mesRef);
    Lib.getFuentesIngreso(fuentesIngreso, mesRef);
  };

  public shared ({ caller }) func addFuenteIngreso(item : Types.FuenteIngreso) : async () {
    requireAuth(caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    Lib.addFuenteIngreso(fuentesIngreso, item);
  };

  public shared ({ caller }) func updateFuenteIngreso(item : Types.FuenteIngreso) : async () {
    requireAuth(caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    Lib.updateFuenteIngreso(fuentesIngreso, item);
  };

  public shared ({ caller }) func deleteFuenteIngreso(id : Text) : async () {
    requireAuth(caller);
    let fuentesIngreso = Lib.getUserFuentes(allFuentesIngreso, caller);
    Lib.deleteFuenteIngreso(fuentesIngreso, id);
  };

  // ─── Transaccion ──────────────────────────────────────────────────────────

  public shared ({ caller }) func getTransacciones(mesRef : Common.MesRef) : async [Types.Transaccion] {
    requireAuth(caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    Lib.getTransacciones(transacciones, mesRef);
  };

  public shared ({ caller }) func addTransaccion(item : Types.Transaccion) : async () {
    requireAuth(caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    Lib.addTransaccion(transacciones, item);
  };

  public shared ({ caller }) func updateTransaccion(item : Types.Transaccion) : async () {
    requireAuth(caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    Lib.updateTransaccion(transacciones, item);
  };

  public shared ({ caller }) func deleteTransaccion(id : Text) : async () {
    requireAuth(caller);
    let transacciones = Lib.getUserTransacciones(allTransacciones, caller);
    Lib.deleteTransaccion(transacciones, id);
  };

  // ─── MetaAhorro ───────────────────────────────────────────────────────────

  public shared query ({ caller }) func getMetasAhorro() : async [Types.MetaAhorro] {
    requireAuth(caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.getMetasAhorro(metas);
  };

  public shared ({ caller }) func addMetaAhorro(item : Types.MetaAhorro) : async () {
    requireAuth(caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.addMetaAhorro(metas, item);
  };

  public shared ({ caller }) func updateMetaAhorro(item : Types.MetaAhorro) : async () {
    requireAuth(caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.updateMetaAhorro(metas, item);
  };

  public shared ({ caller }) func deleteMetaAhorro(id : Text) : async () {
    requireAuth(caller);
    let metas = Lib.getUserMetas(allMetas, caller);
    Lib.deleteMetaAhorro(metas, id);
  };

  // ─── Categorias ───────────────────────────────────────────────────────────

  public shared query ({ caller }) func getCategorias() : async [Text] {
    requireAuth(caller);
    let categorias = Lib.getUserCategorias(allCategorias, caller);
    categorias.toArray();
  };

  public shared ({ caller }) func addCategoria(nombre : Text) : async () {
    requireAuth(caller);
    let categorias = Lib.getUserCategorias(allCategorias, caller);
    if (not categorias.any(func(c) { c == nombre })) {
      categorias.add(nombre);
    };
  };

  public shared ({ caller }) func deleteCategoria(nombre : Text) : async () {
    requireAuth(caller);
    let categorias = Lib.getUserCategorias(allCategorias, caller);
    let kept = categorias.filter(func(c) { c != nombre });
    categorias.clear();
    categorias.append(kept);
  };

  // ─── MetodosPago ──────────────────────────────────────────────────────────

  public shared query ({ caller }) func getMetodosPago() : async [Text] {
    requireAuth(caller);
    let metodosPago = Lib.getUserMetodosPago(allMetodosPago, caller);
    metodosPago.toArray();
  };

  public shared ({ caller }) func addMetodoPago(nombre : Text) : async () {
    requireAuth(caller);
    let metodosPago = Lib.getUserMetodosPago(allMetodosPago, caller);
    if (not metodosPago.any(func(m) { m == nombre })) {
      metodosPago.add(nombre);
    };
  };

  public shared ({ caller }) func deleteMetodoPago(nombre : Text) : async () {
    requireAuth(caller);
    let metodosPago = Lib.getUserMetodosPago(allMetodosPago, caller);
    let kept = metodosPago.filter(func(m) { m != nombre });
    metodosPago.clear();
    metodosPago.append(kept);
  };
};
