// facturacion/facturacion.js

// Formatea un número a 2 decimales
function formatear2Decimales(num) {
  return num.toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {

  // Botón de guardar factura
  const btnGuardar = document.getElementById("btnGuardarFactura");
  btnGuardar.addEventListener("click", (e) => {
    e.preventDefault();

    if (!formFactura.checkValidity()) {
      formFactura.classList.add("was-validated");
      return;
    }

    const htmlFactura = contenidoFactura.innerHTML.trim();
    if (!htmlFactura) {
      alert("Primero debes generar la factura antes de guardarla.");
      return;
    }

    const numeroFactura = document.getElementById("facturaNumero").value.trim();
    const clave = "facturaHTML_" + numeroFactura;

    localStorage.setItem(clave, htmlFactura);
    alert("✅ Factura guardada correctamente en el historial.");
  });

  const tablaBody = document.querySelector("#tablaLineas tbody");
  const btnAgregar = document.getElementById("btnAgregarLinea");
  const baseImponibleEl = document.getElementById("baseImponible");
  const ivaTotalEl = document.getElementById("ivaTotal");
  const totalFacturaEl = document.getElementById("totalFactura");
  const btnGenerar = document.getElementById("btnGenerarFactura");
  const vistaPrevia = document.getElementById("vistaPrevia");
  const contenidoFactura = document.getElementById("contenidoFactura");
  const formFactura = document.getElementById("formFactura");

  // Activar validación de Bootstrap para el formulario
  formFactura.addEventListener("submit", function(event) {
    if (!formFactura.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    formFactura.classList.add("was-validated");
  }, false);

  let contadorLineas = 0;

  // Función para agregar una nueva fila a la tabla de líneas
  btnAgregar.addEventListener("click", (e) => {
    e.preventDefault();
    contadorLineas++;
    const fila = document.createElement("tr");
    fila.setAttribute("data-linea", contadorLineas);

    fila.innerHTML = `
      <td><input type="text" class="form-control descripcion" placeholder="Descripción" required></td>
      <td><input type="number" class="form-control cantidad" min="1" value="1" required></td>
      <td><input type="number" class="form-control precio" min="0" step="0.01" value="0.00" required></td>
      <td>
        <select class="form-select iva" required>
          <option value="21">21%</option>
          <option value="10">10%</option>
          <option value="4">4%</option>
          <option value="0">0%</option>
        </select>
      </td>
      <td class="importe">0.00</td>
      <td class="text-center">
        <button class="btn btn-sm btn-danger btnEliminar">✖</button>
      </td>
    `;

    tablaBody.appendChild(fila);
    actualizarEventosLinea(fila);
    recalcularTotales();
  });

  // Asigna eventos de recálculo/eliminación a una fila específica
  function actualizarEventosLinea(fila) {
    const inpCantidad = fila.querySelector(".cantidad");
    const inpPrecio = fila.querySelector(".precio");
    const selIVA = fila.querySelector(".iva");
    const btnEliminar = fila.querySelector(".btnEliminar");

    // Cuando cambie cantidad, precio o IVA, recalcula el importe de la fila y totales
    [inpCantidad, inpPrecio, selIVA].forEach((el) => {
      el.addEventListener("input", () => {
        const cantidad = parseFloat(inpCantidad.value) || 0;
        const precio = parseFloat(inpPrecio.value) || 0;
        const ivaPct = parseFloat(selIVA.value) || 0;
        const base = cantidad * precio;
        const importe = base + (base * ivaPct / 100);
        fila.querySelector(".importe").textContent = formatear2Decimales(importe);
        recalcularTotales();
      });
    });

    // Botón de eliminar fila
    btnEliminar.addEventListener("click", (e) => {
      e.preventDefault();
      fila.remove();
      recalcularTotales();
    });
  }

  // Recalcula Base Imponible, IVA Total y Total de la factura
  function recalcularTotales() {
    let sumaBase = 0;
    let sumaIVA = 0;
    let sumaTotal = 0;

    document.querySelectorAll("#tablaLineas tbody tr").forEach((fila) => {
      const cantidad = parseFloat(fila.querySelector(".cantidad").value) || 0;
      const precio = parseFloat(fila.querySelector(".precio").value) || 0;
      const ivaPct = parseFloat(fila.querySelector(".iva").value) || 0;

      const base = cantidad * precio;
      const ivaLinea = base * (ivaPct / 100);
      const totalLinea = base + ivaLinea;

      sumaBase += base;
      sumaIVA += ivaLinea;
      sumaTotal += totalLinea;
    });

    baseImponibleEl.textContent = formatear2Decimales(sumaBase);
    ivaTotalEl.textContent = formatear2Decimales(sumaIVA);
    totalFacturaEl.textContent = formatear2Decimales(sumaTotal);
  }

  // Genera el HTML completo de la factura y lo inyecta en la vista previa
  btnGenerar.addEventListener("click", (e) => {
    e.preventDefault();

    // Verificar validación del formulario
    if (!formFactura.checkValidity()) {
      return;
    }

    // Recoger datos del cliente
    const nombreCliente = document.getElementById("clienteNombre").value.trim();
    const nifCliente = document.getElementById("clienteNIF").value.trim();
    const domicilioCliente = document.getElementById("clienteDomicilio").value.trim();
    const emailCliente = document.getElementById("clienteEmail").value.trim();

    // Datos de la factura
    const numFactura = document.getElementById("facturaNumero").value.trim();
    const fechaEmision = document.getElementById("facturaFechaEmision").value;
    const fechaOperacion = document.getElementById("facturaFechaOperacion").value || fechaEmision;

    // Forma de pago y plazo
    const formaPago = document.getElementById("formaPago").value;
    const plazoPago = document.getElementById("plazoPago").value.trim() || "Sin especificar";

    // Construir cabecera HTML de la factura
    let html = `
      <div class="mb-4">
        <h3>Factura Nº ${numFactura}</h3>
        <p>
          <strong>Fecha de Emisión:</strong> ${fechaEmision}<br>
          <strong>Fecha de Operación:</strong> ${fechaOperacion}
        </p>
      </div>
      <div class="row mb-4">
        <div class="col-md-6">
          <h5>Emisor:</h5>
          <p>
            Empresa Ejemplo S.L.<br>
            C/ Falsa 123, 28080 Madrid<br>
            NIF: B12345678<br>
            IBAN: ES00 0000 0000 0000 0000 0000
          </p>
        </div>
        <div class="col-md-6">
          <h5>Receptor:</h5>
          <p>
            ${nombreCliente}<br>
            ${domicilioCliente}<br>
            NIF: ${nifCliente}<br>
            ${emailCliente ? `Email: ${emailCliente}<br>` : ""}
          </p>
        </div>
      </div>
      <table class="table table-bordered mb-4">
        <thead class="table-light">
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio Unitario (€)</th>
            <th>Tipo IVA (%)</th>
            <th>Importe (€)</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Añadir cada fila de la tabla al HTML
    document.querySelectorAll("#tablaLineas tbody tr").forEach((fila) => {
      const desc = fila.querySelector(".descripcion").value.trim();
      const cantidad = parseFloat(fila.querySelector(".cantidad").value) || 0;
      const precio = parseFloat(fila.querySelector(".precio").value) || 0;
      const ivaPct = parseFloat(fila.querySelector(".iva").value) || 0;
      const base = cantidad * precio;
      const ivaLinea = base * (ivaPct / 100);
      const totalLinea = base + ivaLinea;

      html += `
        <tr>
          <td>${desc}</td>
          <td>${cantidad}</td>
          <td>${formatear2Decimales(precio)}</td>
          <td>${ivaPct}</td>
          <td>${formatear2Decimales(totalLinea)}</td>
        </tr>
      `;
    });

    // Pie de totales
    html += `
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-end"><strong>Base Imponible (€):</strong></td>
            <td>${baseImponibleEl.textContent}</td>
          </tr>
          <tr>
            <td colspan="4" class="text-end"><strong>IVA (€):</strong></td>
            <td>${ivaTotalEl.textContent}</td>
          </tr>
          <tr>
            <td colspan="4" class="text-end"><strong>Total (€):</strong></td>
            <td>${totalFacturaEl.textContent}</td>
          </tr>
        </tfoot>
      </table>

      <div class="mb-4">
        <h5>Forma de Pago:</h5>
        <p>${formaPago.charAt(0).toUpperCase() + formaPago.slice(1)}</p>
        <h5>Plazo de Pago:</h5>
        <p>${plazoPago}</p>
      </div>
      <p><em>Factura emitida conforme a la normativa vigente. El receptor está obligado a conservar esta factura.</em></p>
    `;

    contenidoFactura.innerHTML = html;
    vistaPrevia.style.display = "block";
    vistaPrevia.scrollIntoView({ behavior: "smooth" });
  });
});
