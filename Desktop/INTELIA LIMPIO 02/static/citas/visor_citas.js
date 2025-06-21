document.addEventListener('DOMContentLoaded', initVisorCitas);

let citas = [];

function initVisorCitas() {
  const btnNueva = document.getElementById('btnNuevaRecepcion');
  if (btnNueva) {
    btnNueva.addEventListener('click', () => {
      window.location.href = '../recepcion/recepcion.html';
    });
  }

  document.getElementById('filtroCitas').addEventListener('input', e => {
    renderCitas(filtrarCitas(e.target.value));
  });

  loadCitas();
}

async function loadCitas() {
  const msg = document.getElementById('mensajeCitas');
  msg.textContent = 'Cargando citas...';

  try {
    const response = await fetch('/api/v1/agenda/');
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const result = await response.json();
    citas = result.data || [];
    renderCitas(citas);
    msg.textContent = `${citas.length} cita(s) cargadas.`;
  } catch (err) {
    console.error('No se pudieron cargar las citas:', err);
    msg.textContent = 'Error al cargar las citas.';
  }
}

function renderCitas(lista) {
  const tbody = document.querySelector('#citasTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5">No hay citas para mostrar.</td></tr>`;
    return;
  }

  lista.forEach(cita => {
    const tr = document.createElement('tr');
    const fecha = cita.fecha ? new Date(cita.fecha).toLocaleString('es-ES') : '—';
    tr.innerHTML = `
      <td>${cita.id}</td>
      <td>${fecha}</td>
      <td>${cita.cliente || '—'}</td>
      <td>${cita.servicio || '—'}</td>
      <td><button class="btn-action btn-recepcion" data-id="${cita.id}" aria-label="Abrir recepción">Recepción</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-recepcion').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (typeof recepcion?.abrirFicha === 'function') {
        recepcion.abrirFicha(id);
      } else {
        alert('Módulo de recepción no disponible');
      }
    });
  });
}

function filtrarCitas(texto) {
  const t = texto.toLowerCase();
  return citas.filter(c =>
    (c.cliente || '').toLowerCase().includes(t) ||
    (c.servicio || '').toLowerCase().includes(t)
  );
}
