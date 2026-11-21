/**
 * Convierte el texto que escribe el usuario en pesos enteros.
 * Caja suele escribir los valores como en el recibo: 1.500.000
 */

/*export function parsePesos(texto: string): number {
  const limpio = texto.trim().replace(/,/g, "");
  const n = parseInt(limpio, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Valor inválido: ${texto}`);
  }
  return n;
}
  */

export function parsePesos(texto: string): number {
  const limpio = texto.trim().replace(/^\$/, "").replace(/\s/g, "");
  if (!/^(\d+|\d{1,3}(\.\d{3})+|\d{1,3}(,\d{3})+)$/.test(limpio)) {
    throw new Error(`Valor inválido: ${texto}`);
  }
  return Number(limpio.replace(/[.,]/g, ""));
}

export function formatoCOP(valor: number): string {
  return "$ " + valor.toLocaleString("es-CO");
}
