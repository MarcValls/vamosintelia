// presupuesto_oficial.js

// 1. Leer parámetros de la URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    referencia: params.get('ref') || '',
    cliente: params.get('cliente') || '',
    vehiculo: params.get('vehiculo') || '',
    matricula: params.get('matricula') || '',
    fecha: params.get('fecha') || '',
    hora: params.get('hora') || '',
    iva: parseFloat(params.get('iva')) || 21,
    telefono: params.get('telefono') || '',
    detalles: JSON.parse(params.get('detalles') || '[]')
  };
}

// 2. Formatear número a dos decimales
function formatearNumero(num) {
  return Number(num).toFixed(2);
}

window.addEventListener('load', function() {
  const params = getQueryParams();

  // 3. Rellenar datos generales
  document.getElementById('presu-referencia').textContent = params.referencia;
  document.getElementById('presu-cliente').textContent   = params.cliente;
  document.getElementById('presu-vehiculo').textContent  = params.vehiculo;
  document.getElementById('presu-matricula').textContent = params.matricula;
  document.getElementById('presu-fecha').textContent     = params.fecha;
  document.getElementById('presu-hora').textContent      = params.hora;
  document.getElementById('presu-iva').textContent       = formatearNumero(params.iva);

  // 4. Construir filas de detalle
  const tbody = document.getElementById('presu-tbody');
  let sumaSubtotal = 0;

  params.detalles.forEach(item => {
    const tr = document.createElement('tr');
    const subtotal = item.cantidad * item.precioUnitario;
    sumaSubtotal += subtotal;

    tr.innerHTML = `
      <td>${item.concepto}</td>
      <td>${item.cantidad}</td>
      <td>${formatearNumero(item.precioUnitario)}</td>
      <td>${formatearNumero(subtotal)}</td>
    `;
    tbody.appendChild(tr);
  });

  // 5. Calcular total con IVA
  const totalConIva = sumaSubtotal * (1 + params.iva / 100);
  document.getElementById('presu-total').textContent = formatearNumero(totalConIva);

  // 6. Generar enlaces de WhatsApp para “Aceptar” y “Rechazar”
  const textoAceptar = encodeURIComponent(
    `Confirmo presupuesto ${params.referencia} por un total de EUR ${formatearNumero(totalConIva)}`
  );
  const textoRechazar = encodeURIComponent(
    `No acepto el presupuesto ${params.referencia}`
  );
  const waBase = `https://wa.me/${params.telefono}/?text=`;

  document.getElementById('presu-btn-aceptar').href = waBase + textoAceptar;
  document.getElementById('presu-btn-rechazar').href = waBase + textoRechazar;
});
