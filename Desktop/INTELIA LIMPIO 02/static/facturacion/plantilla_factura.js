document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const idOrden = params.get("id_orden");
  if (!idOrden) return;

  try {
    const response = await fetch(`/api/v1/ordenes/${idOrden}`);
    if (!response.ok) throw new Error("Orden no encontrada");

    const orden = await response.json();

    document.getElementById("clienteNombre").value = orden.cliente || "";
    document.getElementById("clienteDomicilio").value = orden.direccion || "";
    document.getElementById("clienteEmail").value = orden.email || "";
    document.getElementById("clienteNIF").value = orden.nif || "";

    const hoy = new Date().toISOString().split("T")[0];
    const facturaId = "FAC-ORDEN-" + String(idOrden).padStart(3, "0");
    document.getElementById("facturaNumero").value = facturaId;
    document.getElementById("facturaFechaEmision").value = hoy;
    document.getElementById("facturaFechaOperacion").value = orden.fecha_entrada || hoy;

    const tabla = document.getElementById("tablaLineas").querySelector("tbody");
    tabla.innerHTML = generarLineaHTML("Mano de Obra", 1, 40.00, 21);

    actualizarTotales();

    tabla.addEventListener("input", actualizarTotales);
    tabla.addEventListener("click", (e) => {
      if (e.target.matches("button.btn-danger")) {
        e.target.closest("tr").remove();
        actualizarTotales();
      }
    });

    document.getElementById("btnAgregarLinea").addEventListener("click", () => {
      tabla.insertAdjacentHTML("beforeend", generarLineaHTML("", 1, 0.00, 21));
      actualizarTotales();
    });

    document.getElementById("btnGenerarFactura").addEventListener("click", () => {
      const datosFactura = leerDatosFactura(facturaId, idOrden);
      guardarEnLocalStorage(facturaId, datosFactura);
      guardarEnBackend(datosFactura);
    });

  } catch (error) {
    console.error("Error al cargar datos de la orden:", error);
    alert("No se pudo cargar la información de la orden.");
  }
});

function generarLineaHTML(desc, cantidad, precio, iva) {
  return `
    <tr>
      <td><input type="text" class="form-control" value="${desc}"></td>
      <td><input type="number" class="form-control cantidad" value="${cantidad}"></td>
      <td><input type="number" class="form-control precio" value="${precio}"></td>
      <td><input type="number" class="form-control iva" value="${iva}"></td>
      <td class="importe-linea text-end">0.00</td>
      <td><button type="button" class="btn btn-danger btn-sm">✖</button></td>
    </tr>
  `;
}

function actualizarTotales() {
  let base = 0;
  let ivaTotal = 0;

  document.querySelectorAll("#tablaLineas tbody tr").forEach(row => {
    const cantidad = parseFloat(row.querySelector(".cantidad").value) || 0;
    const precio = parseFloat(row.querySelector(".precio").value) || 0;
    const iva = parseFloat(row.querySelector(".iva").value) || 0;
    const subtotal = cantidad * precio;
    const ivaImporte = subtotal * (iva / 100);

    row.querySelector(".importe-linea").textContent = subtotal.toFixed(2);
    base += subtotal;
    ivaTotal += ivaImporte;
  });

  document.getElementById("baseImponible").textContent = base.toFixed(2);
  document.getElementById("ivaTotal").textContent = ivaTotal.toFixed(2);
  document.getElementById("totalFactura").textContent = (base + ivaTotal).toFixed(2);
}

function leerDatosFactura(facturaNumero, idOrden) {
  const lineas = [];
  document.querySelectorAll("#tablaLineas tbody tr").forEach(row => {
    const descripcion = row.querySelector("td:nth-child(1) input").value;
    const cantidad = parseFloat(row.querySelector("td:nth-child(2) input").value);
    const precio = parseFloat(row.querySelector("td:nth-child(3) input").value);
    const tipoIVA = parseFloat(row.querySelector("td:nth-child(4) input").value);
    lineas.push({ descripcion, cantidad, precio, tipoIVA });
  });

  return {
    numero: facturaNumero,
    fecha_emision: document.getElementById("facturaFechaEmision").value,
    fecha_operacion: document.getElementById("facturaFechaOperacion").value,
    cliente: document.getElementById("clienteNombre").value,
    nif: document.getElementById("clienteNIF").value,
    domicilio: document.getElementById("clienteDomicilio").value,
    email: document.getElementById("clienteEmail").value,
    forma_pago: document.getElementById("formaPago").value,
    plazo_pago: document.getElementById("plazoPago").value,
    base: parseFloat(document.getElementById("baseImponible").textContent),
    iva: parseFloat(document.getElementById("ivaTotal").textContent),
    total: parseFloat(document.getElementById("totalFactura").textContent),
    lineas: lineas,
    id_orden: parseInt(idOrden)
  };
}

function guardarEnLocalStorage(clave, datosFactura) {
  localStorage.setItem("factura_" + clave, JSON.stringify(datosFactura));
  alert("Factura guardada en localStorage.");
}

function guardarEnBackend(datos) {
  fetch("/api/v1/facturas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al guardar en el backend");
    return res.json();
  })
  .then(res => {
    console.log("Guardado en BD:", res);
    alert("Factura registrada en la base de datos.");
  })
  .catch(err => {
    console.error(err);
    alert("No se pudo guardar la factura en la base de datos.");
  });
}