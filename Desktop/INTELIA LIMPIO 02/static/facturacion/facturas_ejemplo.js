// facturacion/facturas_ejemplo.js

(function generarFacturasEjemplo() {
  for (let i = 1; i <= 10; i++) {
    const numeroFactura = `FAC-EJEMPLO-${i.toString().padStart(2, '0')}`;
    const htmlFactura = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Factura ${numeroFactura}</title>
        <link rel="stylesheet" href="../assets/intelia_manager.css">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .encabezado { text-align: center; margin-bottom: 20px; }
          .detalle, .totales { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .detalle th, .detalle td { border: 1px solid #ccc; padding: 8px; }
          .totales td { padding: 8px; }
          .firma { margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="encabezado">
          <h1>Factura de Reparación</h1>
          <p>Factura N.º: ${numeroFactura} — Fecha: ${(new Date()).toLocaleDateString('es-ES')}</p>
        </div>
        <p><strong>Cliente:</strong> Cliente Ejemplo ${i}</p>
        <p><strong>Vehículo:</strong> Modelo Ejemplo ${i} (EJ${i}${i * 11})</p>
        <p><strong>Fecha Trabajo:</strong> 2025-06-${String(i).padStart(2,'0')} 09:00</p>
        <table class="detalle">
          <thead>
            <tr>
              <th>#</th>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Precio Unitario (€)</th>
              <th>Subtotal (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Mano de obra</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">40.00</td>
              <td style="text-align: right;">40.00</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Repuesto Ejemplo</td>
              <td style="text-align: center;">2</td>
              <td style="text-align: right;">20.00</td>
              <td style="text-align: right;">40.00</td>
            </tr>
          </tbody>
        </table>
        <table class="totales">
          <tr>
            <td><strong>Total a Pagar (€):</strong></td>
            <td style="text-align: right;"><strong>96.40</strong></td>
          </tr>
        </table>
        <div class="firma">
          <p>Firma del Cliente: ____________________________</p>
        </div>
      </body>
      </html>
    `;
    localStorage.setItem(`facturaHTML_${numeroFactura}`, htmlFactura);
  }
  alert('Se han agregado 10 facturas de ejemplo a localStorage.');
})();