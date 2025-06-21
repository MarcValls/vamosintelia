// visor_clientes.js – UNIFICADO Y ACCESIBLE

let clientes = [];
let clienteActivo = null;
let telefonos = [];
let emails = [];
let vehiculos = [];

const $ = sel => document.querySelector(sel);

// ----------- INICIALIZACIÓN -----------
document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();
  $('#btnNuevoCliente').addEventListener('click', () => abrirModalCliente(null));
  $('#cerrarModalCliente').addEventListener('click', cerrarModal);
  $('#cancelarModalCliente').addEventListener('click', cerrarModal);
  $('#modalClienteOverlay').addEventListener('click', cerrarModal);
  $('#filtroClientes').addEventListener('input', e => filtrarClientes(e.target.value));
  $('#btnAddTelefono').addEventListener('click', () => { telefonos.push(''); renderTelefonos(); });
  $('#btnAddEmail').addEventListener('click', () => { emails.push(''); renderEmails(); });
  $('#btnAddVehiculo').addEventListener('click', () => { vehiculos.push({marca:'',modelo:''}); renderVehiculos(); });
  $('#formFichaCliente').addEventListener('submit', guardarCliente);
});

// ----------- TABLA -----------
async function cargarClientes() {
  const res = await fetch('/api/v1/clientes/');
  const data = await res.json();
  clientes = data.data || [];
  renderTablaClientes(clientes);
}

function renderTablaClientes(lista) {
  const tbody = $('#clientesTBody');
  tbody.innerHTML = '';
  lista.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nombre}</td>
      <td>${c.direccion || ''}</td>
      <td>${(c.telefonos || c.telefono || []).join ? (c.telefonos || [c.telefono]).join(', ') : ''}</td>
      <td>${(c.vehiculos || []).map(v => [v.marca, v.modelo].filter(Boolean).join(' ')).join(', ')}</td>
      <td>${(c.email || []).join ? c.email.join(', ') : c.email || ''}</td>
      <td>
        <button class="btn-action" aria-label="Editar cliente" onclick="abrirModalCliente(${c.id})">Editar</button>
        <button class="btn-cancel" aria-label="Eliminar cliente" onclick="eliminarCliente(${c.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------- MODAL -----------
function abrirModalCliente(id) {
  clienteActivo = clientes.find(c => c.id === id) || null;
  $('#formFichaCliente').reset();
  $('#numCliente').value = clienteActivo ? clienteActivo.id : 'Nuevo';
  $('#nombreCliente').value = clienteActivo?.nombre || '';
  $('#direccionCliente').value = clienteActivo?.direccion || '';
  $('#notasCliente').value = clienteActivo?.notas || '';
  telefonos = clienteActivo?.telefonos || clienteActivo?.telefono ? [...(clienteActivo.telefonos || [clienteActivo.telefono]).filter(Boolean)] : [];
  emails = clienteActivo?.email ? (Array.isArray(clienteActivo.email) ? [...clienteActivo.email] : [clienteActivo.email]) : [];
  vehiculos = clienteActivo?.vehiculos ? [...clienteActivo.vehiculos] : [];

  renderTelefonos();
  renderEmails();
  renderVehiculos();
  cargarHistorialCliente(clienteActivo?.id);

  mostrarModal();
}

function mostrarModal() {
  $('#modalClienteOverlay').hidden = false;
  $('#modalCliente').hidden = false;
  setTimeout(() => $('#nombreCliente').focus(), 100); // Accesibilidad
}

function cerrarModal() {
  $('#modalClienteOverlay').hidden = true;
  $('#modalCliente').hidden = true;
}

// ----------- FORMULARIOS DINÁMICOS -----------
function renderTelefonos() {
  const cont = $('#telefonosContainer');
  cont.innerHTML = '';
  telefonos.forEach((t, i) => {
    cont.innerHTML += `
      <div class="mini-row">
        <input type="text" class="form-control" value="${t}" aria-label="Teléfono ${i+1}" oninput="telefonos[${i}]=this.value">
        <button type="button" class="btn-action" aria-label="Eliminar teléfono" onclick="telefonos.splice(${i},1);renderTelefonos();">Eliminar</button>
      </div>`;
  });
}

function renderEmails() {
  const cont = $('#emailsContainer');
  cont.innerHTML = '';
  emails.forEach((e, i) => {
    cont.innerHTML += `
      <div class="mini-row">
        <input type="email" class="form-control" value="${e}" aria-label="Email ${i+1}" oninput="emails[${i}]=this.value">
        <button type="button" class="btn-action" aria-label="Eliminar email" onclick="emails.splice(${i},1);renderEmails();">Eliminar</button>
      </div>`;
  });
}

function renderVehiculos() {
  const cont = $('#vehiculosContainer');
  cont.innerHTML = '';
  vehiculos.forEach((v, i) => {
    cont.innerHTML += `
      <div class="mini-row">
        <input type="text" class="form-control" value="${v.marca || ''}" placeholder="Marca" aria-label="Marca vehículo ${i+1}" oninput="vehiculos[${i}].marca=this.value">
        <input type="text" class="form-control" value="${v.modelo || ''}" placeholder="Modelo" aria-label="Modelo vehículo ${i+1}" oninput="vehiculos[${i}].modelo=this.value">
        <button type="button" class="btn-action" aria-label="Eliminar vehículo" onclick="vehiculos.splice(${i},1);renderVehiculos();">Eliminar</button>
      </div>`;
  });
}

// ----------- CRUD -----------

async function guardarCliente(e) {
  e.preventDefault();
  const payload = {
    nombre: $('#nombreCliente').value.trim(),
    direccion: $('#direccionCliente').value.trim(),
    notas: $('#notasCliente').value.trim(),
    telefono: telefonos.filter(Boolean),
    email: emails.filter(Boolean),
    vehiculos: vehiculos.filter(v => v.marca || v.modelo)
  };

  const url = clienteActivo?.id ? `/api/v1/clientes/${clienteActivo.id}` : '/api/v1/clientes/';
  const method = clienteActivo?.id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.status === 'success') {
    cerrarModal();
    cargarClientes();
  } else {
    alert(data.message || 'Error al guardar');
  }
}

async function eliminarCliente(id) {
  if (!confirm('¿Eliminar cliente?')) return;
  const res = await fetch(`/api/v1/clientes/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.status === 'success') cargarClientes();
  else alert(data.message || 'Error al eliminar');
}

// ----------- FILTRO -----------

function filtrarClientes(texto) {
  const val = texto.toLowerCase();
  renderTablaClientes(clientes.filter(c => c.nombre.toLowerCase().includes(val)));
}

// ----------- HISTORIAL -----------

async function cargarHistorialCliente(id) {
  const cont = $('#historialCliente');
  if (!id) {
    cont.innerHTML = '<li>Cliente nuevo, sin historial.</li>';
    return;
  }

  cont.innerHTML = '<li>Cargando historial...</li>';
  try {
    const res = await fetch(`/api/v1/clientes/${id}/historial`);
    const data = await res.json();
    if (data.status === 'success' && data.data.length) {
      cont.innerHTML = data.data.map(h =>
        `<li><b>${h.tipo}</b> [${h.fecha}]: ${h.descripcion || ''}</li>`
      ).join('');
    } else {
      cont.innerHTML = '<li>Sin historial aún.</li>';
    }
  } catch {
    cont.innerHTML = '<li>Error al cargar historial.</li>';
  }
}
