import Common "../types/common";
module {
  // A calendar month entry (metadata + notes)
  public type Mes = {
    anio : Nat;
    mes : Nat; // 1-12
    notas : Text;
  };

  // An income source for a specific month
  public type FuenteIngreso = {
    id : Text;
    descripcion : Text;
    valor : Float;
    fecha : Text; // dd/mm/aaaa — empty means "first day of month"
    mesReferencia : Text; // "YYYY-MM"
    monedaOriginal : Common.CurrencyCode;
    imagenUrl : ?Text; // optional payment receipt / proof image URL
  };

  // A transaction (daily expense or fixed expense)
  public type Transaccion = {
    id : Text;
    descripcion : Text;
    valor : Float;
    fecha : Text; // dd/mm/aaaa
    categoria : Text;
    metodoPago : Text;
    esEsencial : Bool;
    pagado : Bool;
    esGastoFijo : Bool;
    mesReferencia : Text; // "YYYY-MM"
    monedaOriginal : Common.CurrencyCode;
    imagenUrl : ?Text; // optional payment receipt / proof image URL
  };

  // A savings/investment goal
  public type MetaAhorro = {
    id : Text;
    nombre : Text;
    metaTotal : Float;
    ahorroAcumulado : Float;
    ahorroEsteMes : Float;
  };
};
