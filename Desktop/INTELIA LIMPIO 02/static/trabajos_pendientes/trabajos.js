// ==========================
// TRABAJOS.JS (CORREGIDO)
// ==========================

let trabajos = [];
let clientes = [];

window.onload = async function() {
  await cargarClientes();
  await cargarTrabajos();
  renderTrabajos();
  if (typeof rellenarDatalistsClientes === "function") rellenarDatalistsClientes();
};

async function cargarClientes() {
  try {
    clientes = await getClientes();  // USO CENTRALIZADO vía utils.js
  } catch(e) {
    clientes = [];
    mostrarMensajeError("No se pudo cargar la base de clientes.");
  }
}

async function cargarTrabajos() {
  try {
    const res = await fetch('http://localhost:5001/api/finalizaciones');
    if (!res.ok) throw new Error("Archivo de trabajos no encontrado");
    trabajos = await res.json();
  } catch(e) {
    trabajos = [];
    mostrarMensajeError("No se pudo cargar el listado de trabajos.");
  }
}

function renderTrabajos(filtro = "") {
  const tbody = document.getElementById("trabajosTBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let lista = trabajos;
  if (filtro) {
    const t = filtro.trim().toLowerCase();
    lista = trabajos.filter(trab =>
      (trab.cliente && trab.cliente.toLowerCase().includes(t)) ||
      (trab.matricula && trab.matricula.toLowerCase().includes(t)) ||
      (trab.vehiculo && trab.vehiculo.toLowerCase().includes(t)) ||
      (trab.estado && trab.estado.toLowerCase().includes(t)) ||
      (trab.fecha && trab.fecha.toLowerCase().includes(t))
    );
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#888;">No hay trabajos pendientes para mostrar</td></tr>`;
    return;
  }

  lista.forEach((trab, idx) => {
    let cli = clientes.find(c => c.nombre === trab.cliente);
    let telefonos = cli ? (cli.telefonos || []).join(", ") : "";
    tbody.innerHTML += `
      <tr>
        <td>${trab.codigo || ""}</td>
        <td>${trab.cliente || ""}</td>
        <td>${telefonos}</td>
        <td>${trab.vehiculo || ""}</td>
        <td>${trab.matricula || ""}</td>
        <td>${trab.fecha || ""}</td>
        <td>${trab.estado || "Pendiente"}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="verTrabajo(${idx})">Ver</button>
          <button class="btn btn-sm btn-success" onclick="marcarComoFinalizado(${idx})">Finalizar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarTrabajo(${idx})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function filtrarTrabajos(texto) {
  renderTrabajos(texto);
}

function marcarComoFinalizado(idx) {
  if (!confirm("¿Marcar este trabajo como finalizado?")) return;
  trabajos[idx].estado = "Finalizado";
  trabajos[idx].historial = trabajos[idx].historial || [];
  trabajos[idx].historial.push("Finalizado: " + new Date().toLocaleString());
  guardarTrabajos();
  renderTrabajos();
}

function eliminarTrabajo(idx) {
  if (!confirm("¿Eliminar este trabajo?")) return;
  trabajos.splice(idx, 1);
  guardarTrabajos();
  renderTrabajos();
}

function guardarTrabajos() {
  localStorage.setItem("trabajosPendientes", JSON.stringify(trabajos));
}

function exportarTrabajosJSON() {
  const blob = new Blob([JSON.stringify(trabajos, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "http://localhost:5001/api/finalizaciones";
  a.click();
}

function importarTrabajosJSON(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          trabajos = data;
          guardarTrabajos();
          renderTrabajos();
        }
      } catch (err) {
        mostrarMensajeError("Archivo inválido.");
      }
    };
    reader.readAsText(file);
    input.value = "";
  }
}

function mostrarMensajeError(msg) {
  const div = document.getElementById("msg");
  if (div) div.textContent = msg;
  else alert(msg);
}

// Modal y ficha
let trabajoEnModal = null;

function verTrabajo(idx) {
  const trab = trabajos[idx];
  if (!trab) return;
  trabajoEnModal = trab;

  let fichaHTML = generarHTMLFichaTrabajo(trab);

  document.getElementById('fichaTrabajoContent').innerHTML = fichaHTML;
  document.getElementById('modalTrabajoOverlay').style.display = 'block';
  document.getElementById('modalTrabajo').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('modalTrabajo').focus();
  }, 50);
}

function cerrarModalTrabajo() {
  document.getElementById('modalTrabajoOverlay').style.display = 'none';
  document.getElementById('modalTrabajo').style.display = 'none';
}

document.getElementById('cerrarModalTrabajo').onclick = cerrarModalTrabajo;
document.getElementById('modalTrabajoOverlay').onclick = cerrarModalTrabajo;

function generarHTMLFichaTrabajo(trab) {
  const diag = trab.diagnostico || {};
  return `
    <div class="ficha-box">
      <div class="ficha-titulo">Ficha de Trabajo - ${trab.cliente || ""}</div>
      <div class="ficha-datos ficha-datos-blanco">
        <b>Referencia:</b> ${diag.referencia || trab.codigo || ""}<br>
        <b>Cliente:</b> ${trab.cliente || ""}<br>
        <b>Vehículo:</b> ${trab.vehiculo || ""}<br>
        <b>Matrícula:</b> ${trab.matricula || ""}<br>
        <b>Fecha:</b> ${trab.fecha || ""} &nbsp; <b>Estado:</b> ${trab.estado || ""}
      </div>
      <div class="detalle-label">Detalle del trabajo aprobado:</div>
      <table class="table table-bordered table-sm my-3">
        <thead>
          <tr>
            <th>Concepto</th><th>Cantidad</th><th>PVP/und</th><th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${(diag.conceptos || []).map(c => `
            <tr>
              <td>${c.concepto}</td>
              <td>${c.cantidad}</td>
              <td>${c.pvp}</td>
              <td>${c.subtotal}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="total-aprobado">
        Total aprobado: EUR ${diag.total || ""} (IVA incluido)
      </div>
      <div class="obs-label">Observaciones / Instrucciones para el mecánico:</div>
      <div class="obs-box">${(diag.observaciones || []).join("<br>")}</div>
    </div>
  `;
}

function imprimirFichaTrabajo() {
  const ficha = document.getElementById('fichaTrabajoContent').innerHTML;
  const win = window.open('', '', 'width=900,height=650');
  win.document.write(`
    <html>
    <head>
      <title>Imprimir Ficha de Trabajo</title>
      <link href="../assets/intelia_manager.css" rel="stylesheet">
    </head>
    <body>${ficha}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 200);
}

function descargarFichaTrabajo() {
  if (!trabajoEnModal) return;
  const ficha = document.getElementById('fichaTrabajoContent').innerHTML;
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha de Trabajo - ${trabajoEnModal.cliente}</title>
  <link href="../assets/intelia_manager.css" rel="stylesheet">
</head>
<body>
${ficha}
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ficha_trabajo_${trabajoEnModal.cliente || "trabajo"}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}
