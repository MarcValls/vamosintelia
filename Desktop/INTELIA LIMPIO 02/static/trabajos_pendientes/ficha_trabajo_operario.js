// === ficha_trabajo_operario.js ===
document.addEventListener("DOMContentLoaded", function() {
  // Leer parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  // Puedes pasar id, cliente, matricula, tareas (JSON), etc.
  const cliente = urlParams.get("cliente") || "";
  const matricula = urlParams.get("matricula") || "";
  const vehiculo = urlParams.get("vehiculo") || "";
  const idCita = urlParams.get("id") || "";
  let tareas = [];
  try {
    tareas = JSON.parse(decodeURIComponent(urlParams.get("tareas") || "[]"));
  } catch { tareas = []; }

  document.getElementById("trabajoTitulo").textContent = `${cliente} · ${vehiculo ? vehiculo + " · " : ""}${matricula}`;
  document.getElementById("trabajoMeta").textContent = `Fecha: ${formatearFechaLocal(new Date())}`;

  // Pintar las tareas
  const tbody = document.getElementById("tareasBody");
  tareas.forEach((tarea, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="trabajo-check" data-idx="${idx}"></td>
      <td>${tarea.concepto || tarea.descripcion || ""}</td>
      <td>${tarea.cantidad || 1}</td>
    `;
    tbody.appendChild(tr);
  });

  // Deshabilitar botón hasta que todas estén marcadas
  function checkTareas() {
    const checks = document.querySelectorAll(".trabajo-check");
    let allDone = true;
    checks.forEach(chk => { if (!chk.checked) allDone = false; });
    document.getElementById("btnFinalizarTrabajo").disabled = !allDone;
  }
  document.querySelectorAll(".trabajo-check").forEach(chk => {
    chk.addEventListener("change", checkTareas);
  });

  // Botón finalizar
  document.getElementById("btnFinalizarTrabajo").onclick = function() {
    const obs = document.getElementById("observacionesMecanico").value.trim();
    const tareaChecks = [];
    document.querySelectorAll(".trabajo-check").forEach((chk, i) => {
      tareaChecks.push({ ...tareas[i], completado: chk.checked });
    });

    // Envía mensaje al padre (agenda) con nuevos datos
    if (window.parent) {
      window.parent.postMessage({
        tipo: "faseCompletada",
        idCita,
        nuevaFase: "finalizado",
        datosNuevos: {
          tareas: tareaChecks,
          observacionesMecanico: obs,
          finalizadoEn: (new Date()).toISOString()
        }
      }, "*");
    }
    document.getElementById("msg").textContent = "Trabajo finalizado. Puedes cerrar esta ficha.";
    this.disabled = true;
  };

  function formatearFechaLocal(date) {
    return date.toLocaleDateString("es-ES") + " " + date.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" });
  }
});
