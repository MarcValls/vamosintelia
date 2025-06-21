// static/agenda/visor_agenda.js

let calendar;
document.addEventListener("DOMContentLoaded", () => {
    initCalendar();
    document.getElementById("btnNuevaCita").onclick = () => abrirModalCita();
    document.getElementById("formCita").onsubmit = guardarCita;

    // Autocompletado clientes
    document.getElementById("clienteAutocomplete").addEventListener("input", buscarCliente);
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".autocomplete-items") && e.target.id !== "clienteAutocomplete") {
            document.getElementById("autocomplete-list").innerHTML = "";
        }
    });
});

function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        height: 600,
        events: fetchEventosAgenda,
        dateClick: info => abrirModalCita({ fecha: info.dateStr }),
        eventClick: info => editarCita(info.event)
    });
    calendar.render();
}

function fetchEventosAgenda(fetchInfo, successCallback, failureCallback) {
    fetch("/api/v1/agenda/")
        .then(r => r.json())
        .then(data => {
            // Convierte datos a formato FullCalendar
            const eventos = data.data.map(item => ({
                id: item.id,
                title: item.cliente_nombre || "Sin cliente",
                start: item.fecha + "T" + item.hora,
                extendedProps: { ...item }
            }));
            successCallback(eventos);
        }).catch(failureCallback);
}

function abrirModalCita(cita = {}) {
    // Limpia formulario
    document.getElementById("formCita").reset();
    document.getElementById("citaId").value = cita.id || "";
    document.getElementById("fechaCita").value = cita.fecha || (cita.fecha ? cita.fecha : "");
    document.getElementById("horaCita").value = cita.hora || "";
    document.getElementById("clienteAutocomplete").value = cita.cliente_nombre || "";
    document.getElementById("clienteId").value = cita.cliente_id || "";
    document.getElementById("descripcionCita").value = cita.descripcion || "";
    document.getElementById("autocomplete-list").innerHTML = "";

    document.getElementById("modal-title").textContent = cita.id ? "Editar cita" : "Nueva cita";
    document.getElementById("modalCita").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modalCita").style.display = "none";
}

// Editar cita desde FullCalendar
function editarCita(event) {
    const c = event.extendedProps;
    abrirModalCita({
        id: event.id,
        fecha: event.startStr.slice(0, 10),
        hora: event.startStr.slice(11, 16),
        cliente_nombre: c.cliente_nombre,
        cliente_id: c.cliente_id,
        descripcion: c.descripcion
    });
}

// VALIDACIÓN + ENVÍO (AJAX)
function guardarCita(e) {
    e.preventDefault();
    // Validación básica
    const fecha = document.getElementById("fechaCita").value;
    const hora = document.getElementById("horaCita").value;
    const cliente_id = document.getElementById("clienteId").value;
    if (!fecha || !hora || !cliente_id) {
        alert("Todos los campos obligatorios deben estar completos.");
        return;
    }

    // Construir objeto
    const data = {
        fecha,
        hora,
        cliente_id,
        descripcion: document.getElementById("descripcionCita").value
    };
    const id = document.getElementById("citaId").value;
    const url = id ? `/api/v1/agenda/${id}` : "/api/v1/agenda/";
    const method = id ? "PUT" : "POST";

    fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(resp => {
        if (resp.status === "success") {
            cerrarModal();
            calendar.refetchEvents();
        } else {
            alert("Error: " + resp.message);
        }
    });
}

// AUTOCOMPLETADO CLIENTE (AJAX)
function buscarCliente(e) {
    const val = e.target.value.trim();
    if (val.length < 2) {
        document.getElementById("autocomplete-list").innerHTML = "";
        return;
    }
    fetch(`/api/v1/clientes/?q=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(resp => {
            const list = document.getElementById("autocomplete-list");
            list.innerHTML = "";
            (resp.data || []).forEach(cliente => {
                const div = document.createElement("div");
                div.classList.add("autocomplete-item");
                div.textContent = cliente.nombre + " [" + (cliente.matricula || "s/matrícula") + "]";
                div.onclick = () => {
                    document.getElementById("clienteAutocomplete").value = cliente.nombre;
                    document.getElementById("clienteId").value = cliente.id;
                    list.innerHTML = "";
                };
                list.appendChild(div);
            });
        });
}
