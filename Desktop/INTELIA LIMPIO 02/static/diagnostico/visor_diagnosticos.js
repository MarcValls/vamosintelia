const API_BASE = localStorage.getItem('api_base') || '';
const API_URL = `${API_BASE}/api/v1/diagnosticos/`;

let paginaActual = 1;
let totalPaginas = 1;
let modoNuevo = false;
let clientesLista = [];
let vehiculosCliente = [];
let ordenesVehiculo = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarDiagnosticos();
    document.getElementById("filtrosForm").addEventListener("submit", (e) => {
        e.preventDefault();
        paginaActual = 1;
        cargarDiagnosticos();
    });
    document.getElementById("btnNuevoDiagnostico").addEventListener("click", () => {
        abrirModalNuevoDiagnostico();
    });
    cargarClientesDatalist();
    asignarEventosModal();
});

// -------------- Autocompletados --------------
async function cargarClientesDatalist() {
    // Suponiendo endpoint GET /api/v1/clientes/?all=1 devuelve [{id, nombre, telefono, vehiculos:[{matricula, modelo, ...}]}]
    const res = await fetch(`${API_BASE}/api/v1/clientes/?all=1`, { headers: { "Authorization": "Bearer " + (window.token || "") } });
    const data = await res.json();
    clientesLista = data.data || [];
    const dl = document.getElementById("clientesDatalist");
    dl.innerHTML = "";
    clientesLista.forEach(c =>
        dl.innerHTML += `<option value="${c.nombre}"></option>`
    );
}

// Cuando selecciono cliente, cargo teléfonos y matrículas:
function asignarEventosModal() {
    document.getElementById("clienteInputModal").addEventListener("input", () => {
        const nombre = document.getElementById("clienteInputModal").value;
        const cliente = clientesLista.find(c => c.nombre === nombre);
        if (!cliente) return;
        document.getElementById("telefonoInputModal").value = cliente.telefono || "";
        vehiculosCliente = cliente.vehiculos || [];
        const dl = document.getElementById("matriculasDatalist");
        dl.innerHTML = "";
        vehiculosCliente.forEach(v =>
            dl.innerHTML += `<option value="${v.matricula}"></option>`
        );
    });
    document.getElementById("matriculaInputModal").addEventListener("input", async () => {
        const matricula = document.getElementById("matriculaInputModal").value;
        const vehiculo = vehiculosCliente.find(v => v.matricula === matricula);
        if (!vehiculo) return;
        document.getElementById("vehiculoInputModal").value = vehiculo.modelo || "";
        // Suponiendo que el endpoint es GET /api/v1/ordenes_trabajo/?matricula=XXX
        const res = await fetch(`${API_BASE}/api/v1/ordenes_trabajo/?matricula=${encodeURIComponent(matricula)}`, { headers: { "Authorization": "Bearer " + (window.token || "") } });
        const data = await res.json();
        ordenesVehiculo = data.data || [];
        const dl = document.getElementById("ordenesDatalist");
        dl.innerHTML = "";
        ordenesVehiculo.forEach(o =>
            dl.innerHTML += `<option value="${o.id}"></option>`
        );
    });
}

// -------------- Tabla principal --------------
async function cargarDiagnosticos() {
    const cliente = document.getElementById("filtroCliente").value.trim();
    const estado = document.getElementById("filtroEstado").value;
    const fecha = document.getElementById("filtroFecha").value;
    const page = paginaActual;
    const size = 10;

    let params = new URLSearchParams({ page, size });
    if (cliente) params.append("cliente", cliente);
    if (estado) params.append("estado", estado);
    if (fecha) params.append("fecha", fecha);

    try {
        const res = await fetch(`${API_URL}?${params}`, {
            headers: { "Authorization": "Bearer " + (window.token || "") }
        });
        const data = await res.json();

        const tbody = document.getElementById("diagnosticosTBody");
        tbody.innerHTML = "";

        if (data.status !== "success" || !data.data || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron diagnósticos</td></tr>`;
            document.getElementById("paginacion").innerHTML = "";
            return;
        }

        data.data.forEach(d => {
            tbody.innerHTML += `
                <tr>
                    <td>${d.id}</td>
                    <td>${d.orden_id}</td>
                    <td>${d.cliente || ""}</td>
                    <td>${d.matricula || ""}</td>
                    <td>${d.detalle || ""}</td>
                    <td>${d.estado || ""}</td>
                    <td>${d.fecha || ""}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="abrirModalDiagnostico(${d.id}, '${d.estado}')">Ver</button>
                    </td>
                </tr>
            `;
        });

        totalPaginas = Math.ceil(data.total / data.size);
        pintarPaginacion();

    } catch (err) {
        alert("Error al cargar diagnósticos: " + err);
    }
}

function pintarPaginacion() {
    const pagNav = document.getElementById("paginacion");
    pagNav.innerHTML = "";

    if (totalPaginas < 2) return;

    for (let p = 1; p <= totalPaginas; p++) {
        pagNav.innerHTML += `
            <li class="page-item ${p === paginaActual ? "active" : ""}">
                <a class="page-link" href="#" onclick="cambiarPagina(${p});return false;">${p}</a>
            </li>
        `;
    }
}

function cambiarPagina(pag) {
    if (pag < 1 || pag > totalPaginas) return;
    paginaActual = pag;
    cargarDiagnosticos();
}
window.cambiarPagina = cambiarPagina;

// -------- Modal ver/editar EXISTENTE --------
async function abrirModalDiagnostico(id, estado) {
    modoNuevo = false;
    limpiarFormularioDiagnostico();
    setFormularioEditable(estado === "pendiente");

    // GET diagnóstico
    const res = await fetch(`${API_URL}${id}`, {
        headers: { "Authorization": "Bearer " + (window.token || "") }
    });
    const data = await res.json();
    if (data.status !== "success" || !data.data) {
        alert("No se pudo cargar el diagnóstico.");
        return;
    }
    const diag = data.data;

    document.getElementById("clienteInputModal").value = diag.cliente || "";
    document.getElementById("telefonoInputModal").value = diag.telefono || "";
    document.getElementById("matriculaInputModal").value = diag.matricula || "";
    document.getElementById("vehiculoInputModal").value = diag.vehiculo || "";
    document.getElementById("ordenInputModal").value = diag.orden_id || "";
    document.getElementById("referenciaInputModal").value = diag.referencia || "";
    document.getElementById("fechaInputModal").value = diag.fecha || "";
    document.getElementById("estadoInputModal").value = diag.estado || "";
    document.getElementById("problemasInputModal").value = diag.detalle || "";
    document.getElementById("observacionesInputModal").value = diag.observaciones || "";

    document.getElementById("finalizarDiagnosticoBtnModal").onclick = async function() {
        if (estado !== "pendiente") return;
        const payload = {
            orden_id: diag.orden_id,
            detalle: document.getElementById("problemasInputModal").value,
            estado: "completado"
        };
        const resPut = await fetch(`${API_URL}${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + (window.token || ""),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const result = await resPut.json();
        if (result.status === "success") {
            alert("Diagnóstico actualizado correctamente.");
            var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDiagnostico'));
            modal.hide();
            cargarDiagnosticos();
        } else {
            alert("Error al actualizar: " + result.message);
        }
    };

    var modal = new bootstrap.Modal(document.getElementById('modalDiagnostico'));
    modal.show();
}
window.abrirModalDiagnostico = abrirModalDiagnostico;

// -------- Modal NUEVO --------
function abrirModalNuevoDiagnostico() {
    modoNuevo = true;
    limpiarFormularioDiagnostico();
    setFormularioEditable(true);

    document.getElementById("finalizarDiagnosticoBtnModal").onclick = async function() {
        // Busca orden seleccionada
        const orden_id = document.getElementById("ordenInputModal").value;
        if (!orden_id) return alert("Selecciona una orden de trabajo válida.");
        const detalle = document.getElementById("problemasInputModal").value;
        const payload = {
            orden_id: orden_id,
            detalle: detalle,
            estado: "pendiente"
        };
        const resPost = await fetch(`${API_URL}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + (window.token || ""),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const result = await resPost.json();
        if (result.status === "success") {
            alert("Diagnóstico creado correctamente.");
            var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDiagnostico'));
            modal.hide();
            cargarDiagnosticos();
        } else {
            alert("Error al crear: " + result.message);
        }
    };

    var modal = new bootstrap.Modal(document.getElementById('modalDiagnostico'));
    modal.show();
}
window.abrirModalNuevoDiagnostico = abrirModalNuevoDiagnostico;

// --------- Helpers ---------
function limpiarFormularioDiagnostico() {
    ["clienteInputModal", "telefonoInputModal", "matriculaInputModal", "vehiculoInputModal", "ordenInputModal",
    "referenciaInputModal", "fechaInputModal", "estadoInputModal", "problemasInputModal", "observacionesInputModal"
    ].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.value = "";
    });
}
function setFormularioEditable(editable) {
    [
        "clienteInputModal", "matriculaInputModal", "ordenInputModal",
        "problemasInputModal", "observacionesInputModal"
    ].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.readOnly = !editable;
    });
}
