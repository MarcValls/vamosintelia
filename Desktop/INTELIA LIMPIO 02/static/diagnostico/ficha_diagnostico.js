// JS principal para la ficha de diagnóstico INTELIA:
// Usa funciones auxiliares centralizadas de utils.js (buscarClientePorNombre, etc.)

window.onload = async function() {
  await rellenarDatalistsClientes(); // desde utils.js

  const clienteInput = document.getElementById("clienteInput");
  const matriculaInput = document.getElementById("matriculaInput");
  const telefonoInput = document.getElementById("telefonoInput");
  const vehiculoInput = document.getElementById("vehiculoInput");

  if (clienteInput) {
    clienteInput.addEventListener("change", async function() {
      const cliente = await buscarClientePorNombre(this.value);
      if (cliente) {
        telefonoInput.value = cliente.telefonos[0] || "";
        if (cliente.vehiculos[0]) {
          matriculaInput.value = cliente.vehiculos[0].matricula || "";
          if (vehiculoInput) vehiculoInput.value = cliente.vehiculos[0].modelo || "";
        }
      }
    });
  }

  if (matriculaInput) {
    matriculaInput.addEventListener("change", async function() {
      const cliente = await buscarClientePorMatricula(this.value);
      if (cliente) {
        clienteInput.value = cliente.nombre || "";
        telefonoInput.value = cliente.telefonos[0] || "";
        const veh = cliente.vehiculos.find(v => v.matricula === matriculaInput.value);
        if (veh && vehiculoInput) vehiculoInput.value = veh.modelo || "";
      }
    });
  }

  if (telefonoInput) {
    telefonoInput.addEventListener("change", async function() {
      const cliente = await buscarClientePorTelefono(this.value);
      if (cliente) {
        clienteInput.value = cliente.nombre || "";
        if (cliente.vehiculos[0]) {
          matriculaInput.value = cliente.vehiculos[0].matricula || "";
          if (vehiculoInput) vehiculoInput.value = cliente.vehiculos[0].modelo || "";
        }
      }
    });
  }

  const buscarBtn = document.getElementById("buscarClienteBtn");
  if (buscarBtn) {
    buscarBtn.onclick = async function() {
      if (clienteInput.value) {
        const cliente = await buscarClientePorNombre(clienteInput.value);
        if (cliente) {
          telefonoInput.value = cliente.telefonos[0] || "";
          if (cliente.vehiculos[0]) {
            matriculaInput.value = cliente.vehiculos[0].matricula || "";
            if (vehiculoInput) vehiculoInput.value = cliente.vehiculos[0].modelo || "";
          }
        }
      } else if (matriculaInput.value) {
        const cliente = await buscarClientePorMatricula(matriculaInput.value);
        if (cliente) {
          clienteInput.value = cliente.nombre || "";
          telefonoInput.value = cliente.telefonos[0] || "";
          const veh = cliente.vehiculos.find(v => v.matricula === matriculaInput.value);
          if (veh && vehiculoInput) vehiculoInput.value = veh.modelo || "";
        }
      } else if (telefonoInput.value) {
        const cliente = await buscarClientePorTelefono(telefonoInput.value);
        if (cliente) {
          clienteInput.value = cliente.nombre || "";
          if (cliente.vehiculos[0]) {
            matriculaInput.value = cliente.vehiculos[0].matricula || "";
            if (vehiculoInput) vehiculoInput.value = cliente.vehiculos[0].modelo || "";
          }
        }
      }
    };
  }
};


function guardarDiagnostico() {
  const params = new URLSearchParams(window.location.search);
  const semana    = params.get('semana');
  const fecha     = params.get('fecha');
  const hora      = params.get('hora');
  const matricula = params.get('matricula');
  const claveBase = `semana${semana}_${fecha}_${hora}_${matricula}`;

  // Recoger datos del formulario
  const datosDiag = {
    descripcion: document.getElementById('inputDescripcion').value,
    estadoFrenos: document.getElementById('selectEstadoFrenos').value,
    // … otros campos …
  };

  localStorage.setItem(`cita_diagnosticada_${claveBase}`, 'true');
  localStorage.setItem(`datosDiagnostico_${claveBase}`, JSON.stringify(datosDiag));

  window.location.href = `../presupuestos/presupuesto_oficial.html?semana=${semana}&fecha=${fecha}&hora=${hora}&matricula=${matricula}`;
}

const btnGuardarDiagnostico = document.getElementById('btnGuardarDiagnostico');
if (btnGuardarDiagnostico) btnGuardarDiagnostico.addEventListener('click', guardarDiagnostico);
