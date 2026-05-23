import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FuenteIngreso {
    id: string;
    valor: number;
    imagenUrl?: string;
    descripcion: string;
    mesReferencia: string;
    fecha: string;
    monedaOriginal: CurrencyCode;
}
export interface Transaccion {
    id: string;
    categoria: string;
    metodoPago: string;
    valor: number;
    imagenUrl?: string;
    descripcion: string;
    esGastoFijo: boolean;
    mesReferencia: string;
    esEsencial: boolean;
    pagado: boolean;
    fecha: string;
    monedaOriginal: CurrencyCode;
}
export type MesRef = string;
export interface TotalesMes {
    gastosTotal: number;
    inversionesTotal: number;
    saldo: number;
    ingresosTotal: number;
}
export interface MetaAhorro {
    id: string;
    nombre: string;
    ahorroEsteMes: number;
    metaTotal: number;
    ahorroAcumulado: number;
}
export interface ExchangeRates {
    lastUpdated: bigint;
    usdToCop: number;
    icpToCop: number;
    icpToUsd: number;
}
export enum CurrencyCode {
    COP = "COP",
    ICP = "ICP",
    USD = "USD"
}
export interface backendInterface {
    addCategoria(nombre: string): Promise<void>;
    addFuenteIngreso(item: FuenteIngreso): Promise<void>;
    addMetaAhorro(item: MetaAhorro): Promise<void>;
    addMetodoPago(nombre: string): Promise<void>;
    addTransaccion(item: Transaccion): Promise<void>;
    deleteCategoria(nombre: string): Promise<void>;
    deleteFuenteIngreso(id: string): Promise<void>;
    deleteMetaAhorro(id: string): Promise<void>;
    deleteMetodoPago(nombre: string): Promise<void>;
    deleteTransaccion(id: string): Promise<void>;
    getCategorias(): Promise<Array<string>>;
    getExchangeRates(): Promise<ExchangeRates>;
    getFuentesIngreso(mesRef: MesRef): Promise<Array<FuenteIngreso>>;
    getMesesDisponibles(): Promise<Array<MesRef>>;
    getMetasAhorro(): Promise<Array<MetaAhorro>>;
    getMetodosPago(): Promise<Array<string>>;
    getNotas(mesRef: MesRef): Promise<string>;
    getTotalesMes(mesRef: MesRef): Promise<TotalesMes>;
    getTransacciones(mesRef: MesRef): Promise<Array<Transaccion>>;
    initMes(anio: bigint, mes: bigint): Promise<void>;
    setNotas(mesRef: MesRef, notas: string): Promise<void>;
    updateFuenteIngreso(item: FuenteIngreso): Promise<void>;
    updateMetaAhorro(item: MetaAhorro): Promise<void>;
    updateTransaccion(item: Transaccion): Promise<void>;
}
