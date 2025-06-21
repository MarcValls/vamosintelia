const API_BASE = localStorage.getItem('api_base') || '';

window.addEventListener('load', async function () {
  const contenedor = document.getElementById('listaFacturas');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/api/v1/ordenes`);
    if (!res.ok) throw new Error("No se pudo obtener la lista de órdenes.");

    const ordenes = await res.json();
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      contenedor.textContent = 'No hay órdenes disponibles.';
      return;
    }

    
    ordenes
      .filter(orden => orden.estado_trabajo === 'finalizado')
      .forEach((orden, index) => {
    
      const html = generarHTMLFacturaDesdeOrden(orden, orden.id || index + 1);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const divFactura = document.createElement('div');
      divFactura.style.marginBottom = '10px';

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = `Factura ${orden.id.toString().padStart(3, '0')} – ${orden.cliente}`;
      link.download = `Factura_${orden.id}.html`;

      divFactura.appendChild(link);
      contenedor.appendChild(divFactura);
    });
  } catch (err) {
    console.error("Error cargando órdenes:", err);
    contenedor.textContent = 'Error al cargar facturas desde el servidor.';
  }
});

function generarHTMLFacturaDesdeOrden(orden, id) {
  const fecha = new Date().toLocaleDateString("es-ES");
  const numero = "FAC-ORDEN-" + String(id).padStart(3, "0");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${numero}</title>
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
    <p>Factura N.º: ${numero} — Fecha: ${fecha}</p>
  </div>
  <p><strong>Cliente:</strong> ${orden.cliente}</p>
  <p><strong>NIF:</strong> ${orden.nif || "N/A"}</p>
  <p><strong>Dirección:</strong> ${orden.direccion || "N/A"}</p>
  <p><strong>Email:</strong> ${orden.email || "N/A"}</p>
  <p><strong>Vehículo:</strong> ${orden.modelo || "-"} (${orden.matricula || "-"})</p>
  
  <p><strong>Estado de la orden:</strong> ${orden.estado}</p>
  <p><strong>Fecha Emisión:</strong> ${orden.created_at || "-"}</p>
  <p><strong>Fecha de Pago:</strong> ${orden.estado === "pagada" ? (orden.updated_at || "-") : "Pendiente"}</p>


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
        <td>Revisión general</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">25.00</td>
        <td style="text-align: right;">25.00</td>
      </tr>
    </tbody>
  </table>

  <table class="totales">
    <tr>
      <td><strong>Total a Pagar (€):</strong></td>
      <td style="text-align: right;"><strong>79.65</strong></td>
    </tr>
  </table>

  <div class="firma">
    <p>Firma del Cliente: ____________________________</p>
  </div>
</body>
</html>`;
}