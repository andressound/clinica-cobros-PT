import { test } from "node:test";
import assert from "node:assert/strict";
import { saldoDeFactura, registrarAbono, reversarPago, deudores, recaudo, normalizarMetodo } from "../src/facturacion.ts";
import type { Factura, Paciente, Pago } from "../src/modelo.ts";

const factura: Factura = { id: 1, pacienteId: 1, fecha: "2026-11-02", valorTotal: 200000, estado: "EMITIDA" };
const pago = (id: number, valor: number, estado = "APLICADO"): Pago => ({ id, facturaId: 1, fecha: "2026-11-03", valor, metodo: "EFECTIVO", estado });

test("saldo sin pagos es el total", () => {
  assert.equal(saldoDeFactura(factura, []), 200000);
});
test("saldo descuenta pagos aplicados", () => {
  assert.equal(saldoDeFactura(factura, [pago(1, 50000)]), 150000);
});
test("abono nuevo actualiza el saldo", () => {
  const r = registrarAbono(factura, [pago(1, 50000)], 100000, "Efectivo", "2026-11-04");
  assert.equal(r.saldo, 50000);
});
test("no permite abonar más que el saldo", () => {
  assert.throws(() => registrarAbono(factura, [], 300000, "Efectivo", "2026-11-04"));
});
test("reversar marca el pago como reversado", () => {
  const r = reversarPago([pago(1, 50000)], 1);
  assert.equal(r[0].estado, "REVERSADO");
});
test("saldo no descuenta pagos reversados", () => {
  const pagos = reversarPago([pago(1, 50000)], 1);
  assert.equal(saldoDeFactura(factura, pagos), 200000);
});


const pacientes: Paciente[] = [
  { id: 1, documento: "1", nombre: "Ana", eps: "Sanitas" },
  { id: 2, documento: "2", nombre: "Beto", eps: null },
  { id: 3, documento: "3", nombre: "Carla", eps: "Sura" },
];
const fac = (id: number, pacienteId: number, valorTotal: number, estado: Factura["estado"] = "EMITIDA"): Factura => ({ id, pacienteId, fecha: "2026-11-02", valorTotal, estado });
const pagoDe = (id: number, facturaId: number, valor: number, estado = "APLICADO"): Pago => ({ id, facturaId, fecha: "2026-11-03", valor, metodo: "EFECTIVO", estado });

test("deudores devuelve pacienteId, nombre y saldo", () => {
  assert.deepEqual(deudores(pacientes, [fac(1, 2, 100000)], []), [{ pacienteId: 2, nombre: "Beto", saldo: 100000 }]);
});
test("deudores ordena por mayor deuda primero", () => {
  const r = deudores(pacientes, [fac(1, 1, 100000), fac(2, 2, 300000), fac(3, 3, 200000)], []);
  assert.deepEqual(r.map((d) => d.pacienteId), [2, 3, 1]);
});
test("deudores desempata por pacienteId", () => {
  const r = deudores(pacientes, [fac(1, 3, 100000), fac(2, 1, 100000), fac(3, 2, 100000)], []);
  assert.deepEqual(r.map((d) => d.pacienteId), [1, 2, 3]);
});
test("deudores suma las facturas de un mismo paciente", () => {
  const r = deudores(pacientes, [fac(1, 1, 100000), fac(2, 1, 50000)], [pagoDe(1, 1, 30000)]);
  assert.deepEqual(r, [{ pacienteId: 1, nombre: "Ana", saldo: 120000 }]);
});
test("deudores no incluye pacientes sin deuda", () => {
  const r = deudores(pacientes, [fac(1, 1, 100000), fac(2, 2, 80000)], [pagoDe(1, 1, 100000)]);
  assert.deepEqual(r.map((d) => d.pacienteId), [2]);
});
test("deudores ignora facturas anuladas", () => {
  assert.deepEqual(deudores(pacientes, [fac(1, 1, 100000, "ANULADA")], []), []);
});
test("deudores no descuenta pagos reversados", () => {
  const r = deudores(pacientes, [fac(1, 1, 100000)], [pagoDe(1, 1, 60000, "REVERSADO")]);
  assert.equal(r[0].saldo, 100000);
});
test("deudores no cuenta el sobrepago como deuda ni lo resta de otras facturas", () => {
  const r = deudores(pacientes, [fac(1, 1, 100000), fac(2, 1, 50000)], [pagoDe(1, 1, 130000)]);
  assert.deepEqual(r, [{ pacienteId: 1, nombre: "Ana", saldo: 50000 }]);
});
test("deudores sin facturas devuelve lista vacía", () => {
  assert.deepEqual(deudores(pacientes, [], []), []);
});

const pagoEn = (id: number, fecha: string, valor: number, metodo: string, estado = "APLICADO"): Pago => ({ id, facturaId: 1, fecha, valor, metodo, estado });

test("normalizarMetodo unifica mayúsculas y espacios", () => {
  assert.equal(normalizarMetodo(" efectivo "), "EFECTIVO");
  assert.equal(normalizarMetodo("Tarjeta"), "TARJETA");
  assert.equal(normalizarMetodo("tarjeta   credito"), "TARJETA CREDITO");
});
test("normalizarMetodo reporta el método vacío como SIN METODO", () => {
  assert.equal(normalizarMetodo(""), "SIN METODO");
  assert.equal(normalizarMetodo("   "), "SIN METODO");
});
test("recaudo devuelve metodo y total", () => {
  assert.deepEqual(recaudo([pagoEn(1, "2026-11-10", 50000, "NEQUI")], "2026-11-09", "2026-11-15"), [{ metodo: "NEQUI", total: 50000 }]);
});
test("recaudo agrupa las variantes del mismo método", () => {
  const pagos = [pagoEn(1, "2026-11-10", 10000, "EFECTIVO"), pagoEn(2, "2026-11-10", 20000, " efectivo"), pagoEn(3, "2026-11-11", 30000, "Efectivo ")];
  assert.deepEqual(recaudo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "EFECTIVO", total: 60000 }]);
});
test("recaudo incluye las fechas desde y hasta", () => {
  const pagos = [pagoEn(1, "2026-11-09", 10000, "NEQUI"), pagoEn(2, "2026-11-15", 20000, "NEQUI")];
  assert.deepEqual(recaudo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "NEQUI", total: 30000 }]);
});
test("recaudo excluye pagos fuera del rango", () => {
  const pagos = [pagoEn(1, "2026-11-08", 10000, "NEQUI"), pagoEn(2, "2026-11-12", 20000, "NEQUI"), pagoEn(3, "2026-11-16", 40000, "NEQUI")];
  assert.deepEqual(recaudo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "NEQUI", total: 20000 }]);
});
test("recaudo no cuenta pagos reversados", () => {
  const pagos = [pagoEn(1, "2026-11-10", 10000, "TARJETA"), pagoEn(2, "2026-11-10", 50000, "TARJETA", "REVERSADO")];
  assert.deepEqual(recaudo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "TARJETA", total: 10000 }]);
});
test("recaudo reporta el pago sin método como SIN METODO", () => {
  assert.deepEqual(recaudo([pagoEn(1, "2026-11-10", 10000, "")], "2026-11-09", "2026-11-15"), [{ metodo: "SIN METODO", total: 10000 }]);
});
test("recaudo ordena por mayor total y desempata por método", () => {
  const pagos = [pagoEn(1, "2026-11-10", 10000, "NEQUI"), pagoEn(2, "2026-11-10", 30000, "TARJETA"), pagoEn(3, "2026-11-10", 10000, "EFECTIVO")];
  assert.deepEqual(recaudo(pagos, "2026-11-09", "2026-11-15").map((r) => r.metodo), ["TARJETA", "EFECTIVO", "NEQUI"]);
});
test("recaudo sin pagos en el rango devuelve lista vacía", () => {
  assert.deepEqual(recaudo([pagoEn(1, "2026-11-01", 10000, "NEQUI")], "2026-11-09", "2026-11-15"), []);
});
test("recaudo rechaza desde mayor que hasta", () => {
  assert.throws(() => recaudo([], "2026-11-15", "2026-11-09"));
});
