import type { Factura, Pago, Deudor, Paciente, Recaudo } from "./modelo.ts";

/** Total pagado de una factura (dinero que realmente entró). */
/*export function pagadoDeFactura(facturaId: number, pagos: Pago[]): number {
  return pagos
    .filter((p) => p.facturaId === facturaId && p.estado !== "REVERTIDO")
    .reduce((suma, p) => suma + p.valor, 0);
}
*/

export function pagadoDeFactura(facturaId: number, pagos: Pago[]): number {
  return pagos
    .filter((p) => p.facturaId === facturaId && p.estado.trim().toUpperCase() === "APLICADO")
    .reduce((suma, p) => suma + p.valor, 0);
}

export function deudores(pacientes: Paciente[], facturas: Factura[], pagos: Pago[]): Deudor[] {
  const deuda = new Map<number, number>();
  for (const f of facturas) {
    if (f.estado !== "EMITIDA") continue;
    const saldo = saldoDeFactura(f, pagos);
    if (saldo <= 0) continue;
    deuda.set(f.pacienteId, (deuda.get(f.pacienteId) ?? 0) + saldo);
  }
  return [...deuda]
    .map(([pacienteId, saldo]) => ({
      pacienteId,
      nombre: pacientes.find((p) => p.id === pacienteId)?.nombre ?? "",
      saldo,
    }))
    .sort((a, b) => b.saldo - a.saldo || a.pacienteId - b.pacienteId);
}

export function saldoDeFactura(factura: Factura, pagos: Pago[]): number {
  return factura.valorTotal - pagadoDeFactura(factura.id, pagos);
}

export interface ResultadoAbono {
  pago: Pago;
  saldo: number;
}

/** Registra un abono sobre una factura y devuelve el nuevo saldo. */
export function registrarAbono(
  factura: Factura,
  pagos: Pago[],
  valor: number,
  metodo: string,
  fecha: string,
): ResultadoAbono {
  if (factura.estado !== "EMITIDA") {
    throw new Error("La factura no está emitida");
  }
  if (!Number.isInteger(valor) || valor <= 0) {
    throw new Error("El valor del abono debe ser un entero positivo");
  }
  if (valor > saldoDeFactura(factura, pagos)) {
    throw new Error("El abono supera el saldo de la factura");
  }
  const id = pagos.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const pago: Pago = { id, facturaId: factura.id, fecha, valor, metodo, estado: "APLICADO" };
  const nuevos = [...pagos, pago];
  return { pago, saldo: saldoDeFactura(factura, nuevos) };
}

/** Reversa un pago: queda en el historial pero deja de contar. */
export function reversarPago(pagos: Pago[], pagoId: number): Pago[] {
  const pago = pagos.find((p) => p.id === pagoId);
  if (!pago) throw new Error(`No existe el pago ${pagoId}`);
  if (pago.estado === "REVERSADO") throw new Error("El pago ya estaba reversado");
  return pagos.map((p) => (p.id === pagoId ? { ...p, estado: "REVERSADO" } : p));
}

//Unifica el método de pago escrito a mano: " efectivo " -> "EFECTIVO".
export function normalizarMetodo(metodo: string): string {
  const m = (metodo ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  return m === "" ? "SIN METODO" : m;
}

//Total recaudado por método de pago entre dos fechas (inclusivas), mayor total primero.
 // Solo cuenta el dinero que realmente entró: pagos aplicados
export function recaudo(pagos: Pago[], desde: string, hasta: string): Recaudo[] {
  if (desde > hasta) throw new Error("La fecha desde no puede ser mayor que la fecha hasta");
  const totales = new Map<string, number>();
  for (const p of pagos) {
    if (p.estado.trim().toUpperCase() !== "APLICADO") continue;
    const fecha = p.fecha.slice(0, 10);
    if (fecha < desde || fecha > hasta) continue;
    const metodo = normalizarMetodo(p.metodo);
    totales.set(metodo, (totales.get(metodo) ?? 0) + p.valor);
  }
  return [...totales]
    .map(([metodo, total]) => ({ metodo, total }))
    .sort((a, b) => b.total - a.total || a.metodo.localeCompare(b.metodo));
}