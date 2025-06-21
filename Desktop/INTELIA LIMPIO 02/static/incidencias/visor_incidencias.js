document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = localStorage.getItem('api_base') || '';
  const contenedor = document.getElementById('contenedorIncidencias');
  const filtro = document.getElementById('filtroEstado');

  function render(incidencias) {
    contenedor.innerHTML = '';
    if (!incidencias.length) {
      contenedor.innerHTML = '<p>No hay incidencias para mostrar.</p>';
      return;
    }
    incidencias.forEach(inc => {
      const div = document.createElement('div');
      div.className = 'incidencia ' + inc.estado;
      div.innerHTML = `
        <h3>#${inc.id} - ${inc.titulo}</h3>
        <p>Estado: <strong>${inc.estado}</strong></p>
        <p>Prioridad: <span class="prioridad ${inc.prioridad}">${inc.prioridad}</span></p>
      `;
      contenedor.appendChild(div);
    });
  }

  function cargarYFiltrar() {
    fetch(`${API_BASE}/api/incidencias`)
      .then(res => res.json())
      .then(data => {
        const estado = filtro.value;
        const filtradas = estado === 'todos' ? data : data.filter(i => i.estado === estado);
        render(filtradas);
      });
  }

  filtro.addEventListener('change', cargarYFiltrar);
  cargarYFiltrar();
});
