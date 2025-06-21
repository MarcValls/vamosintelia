// ==========================
// PRESUPUESTOS.JS (ACTUALIZADO)
// ==========================

let presupuestos = [];
let clientes = [];

window.onload = async function () {
    await cargarClientes();
    await cargarPresupuestos();
    renderPresupuestos();
    rellenarDatalistsClientes?.(); // Autocompletado si existe
};

async function cargarClientes() {
    try {
        clientes = await getClientes(); // Función del utils.js
    } catch (e) {
        clientes = [];
        mostrarMensajeError("No se pudo cargar la base de clientes.");
    }
}

async function cargarPresupuestos() {
    try {
        const res = await fetch('presupuestos.json');
        if (!res.ok) throw new Error("Archivo de presupuestos no encontrado");
        presupuestos = await res.json();
    } catch (e) {
        presupuestos = [];
        mostrarMensajeError("No se pudo cargar el listado de presupuestos.");
    }
}

function renderPresupuestos(filtro = "") {
    const tbody = document.getElementById("presupuestosTBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let lista = presupuestos;

    // Filtro de texto por cliente, matrícula o referencia
    if (filtro) {
        const normalizado = filtro.toLowerCase();
        lista = lista.filter(p =>
            (p.cliente || "").toLowerCase().includes(normalizado) ||
            (p.matricula || "").toLowerCase().includes(normalizado) ||
            (p.referencia || "").toLowerCase().includes(normalizado)
        );
    }

    for (const p of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${p.referencia || ""}</td>
      <td>${p.cliente || ""}</td>
      <td>${p.vehiculo || ""}</td>
      <td>${p.matricula || ""}</td>
      <td>${p.fecha || ""}</td>
      <td>${p.estado || ""}</td>
    `;

        tbody.appendChild(tr);
    }
}

// Buscador en vivo
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("buscador");
    if (input) {
        input.addEventListener("input", () => {
            renderPresupuestos(input.value);
        });
    }

});
