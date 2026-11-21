# Caja
el problema ocurria por que el sistema no aceptaba el separador de punto "." solo el de la coma ",".
ahora ya se puede usar ambos pero solo separando valores de 3 ejemplo "200.000.000" o "200,000,000" tambien se puede usar el numero sin separadores "200000000", no combines el punto y la coma el sistema no lo aceptara.

# Recepción
Ya pueden consultar qué pacientes tienen cuentas pendientes antes de darles una nueva cita. La lista muestra el nombre del paciente y cuánto debe en total sumando todas sus facturas, empezando por el que más debe. Si un paciente no aparece en la lista, está al día.
Para verla se usa el comando "deudores" en el sistema de caja.

Algunas cosas a tener en cuenta:
Las facturas anuladas no cuentan como deuda, Si un pago fue reversado, ya no se toma como pagado. Antes el sistema sí lo contaba y por eso algunos pacientes aparecían debiendo menos de lo real; eso ya quedó corregido.

Supuse que si un paciente pagó de más en una factura, eso no es una deuda, pero tampoco se le descuenta de lo que debe en otras facturas. Por ejemplo, Carlos Castro pagó $30.000 de más en la factura 89, y aun así aparece debiendo lo de sus otras facturas.


# Facturación
Ya puedes sacar el recaudo de cualquier semana separado por método de pago, con el comando "recaudo" indicando la fecha de inicio y la de fin (las dos se incluyen). Para la reunión del lunes tomé la semana pasada, del lunes 9 al domingo 15 de noviembre:

- Tarjeta: $1.345.000
- Efectivo: $910.000
- Sin método: $200.000
- Transferencia: $165.000
- Nequi: $130.000
- Total: $2.750.000

Algunas cosas a tener en cuenta:
Solo se cuenta el dinero que realmente entró; los pagos que fueron reversados no se suman (esa semana hubo 2). El método de pago se escribe a mano y aparecía de muchas formas ("EFECTIVO", "Efectivo ", "efectivo"...), así que el sistema ahora las junta en un solo grupo para que el reporte no salga partido.

Hay un pago de $200.000 del 11 de noviembre (factura 88, Luis Ortiz) que no tiene método de pago registrado, por eso aparece como "Sin método". Si alguien de Caja recuerda cómo se pagó, se puede corregir y el reporte quedaría completo.