// recepcion.js

// 1. Función para leer parámetros de la URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    cliente: params.get('cliente') || '',
    vehiculo: params.get('vehiculo') || '',
    matricula: params.get('matricula') || '',
    semana: params.get('semana') || '',
    fechaCita: params.get('fechaCita') || '',
    horaCita: params.get('horaCita') || ''
  };
}

window.addEventListener('load', function() {
  const { cliente, vehiculo, matricula, semana, fechaCita, horaCita } = getQueryParams();

  // 2. Rellenar campos de solo lectura
  document.getElementById('cliente').value = cliente;
  document.getElementById('vehiculo').value = vehiculo;
  document.getElementById('matricula').value = matricula;
  document.getElementById('fechaCita').value = fechaCita;
  document.getElementById('horaCita').value = horaCita;

  // 3. Fecha y hora de recepción = “ahora”
  const ahora = new Date();
  // yyyy-mm-dd
  document.getElementById('fechaRecepcion').value = ahora.toISOString().split('T')[0];
  // HH:MM
  document.getElementById('horaRecepcion').value = ahora.toTimeString().substring(0, 5);

  // 4. Registrar listener para el submit del formulario
  const form = document.getElementById('formRecepcion');
  if (form) {
    form.addEventListener('submit', guardarRecepcion);
  }
});

function mostrarMensaje(msg) {
  const contMsg = document.getElementById('msgRecepcion');
  if (!contMsg) return;
  contMsg.textContent = msg;
  setTimeout(() => {
    contMsg.textContent = '';
  }, 5000);
}

function guardarRecepcion(event) {
  event.preventDefault();

  // 5. Recoger datos del formulario
  const cliente = document.getElementById('cliente').value.trim();
  const vehiculo = document.getElementById('vehiculo').value.trim();
  const matricula = document.getElementById('matricula').value.trim();
  const fechaCita = document.getElementById('fechaCita').value;
  const horaCita = document.getElementById('horaCita').value;
  const fechaRecepcion = document.getElementById('fechaRecepcion').value;
  const horaRecepcion = document.getElementById('horaRecepcion').value;
  const kilometrajeInicial = document.getElementById('kilometrajeInicial').value.trim();
  const nivelCombustible = document.getElementById('nivelCombustible').value;
  const estadoExterior = document.getElementById('estadoExterior').value.trim();
  const observacionesRecepcion = document.getElementById('observacionesRecepcion').value.trim();
  const firmaCliente = document.getElementById('firmaCliente').value.trim();

  // 6. Volver a obtener 'semana' de la URL
  const semana = getQueryParams().semana;

  // 7. Validación de campos obligatorios
  if (
    !cliente ||
    !vehiculo ||
    !matricula ||
    !kilometrajeInicial ||
    !nivelCombustible ||
    !firmaCliente
  ) {
    mostrarMensaje('Complete todos los campos obligatorios.');
    return;
  }

  // 8. Construir objeto con los datos de recepción
  const data = {
    cliente,
    vehiculo,
    matricula,
    fechaCita,
    horaCita,
    fechaRecepcion,
    horaRecepcion,
    kilometrajeInicial,
    nivelCombustible,
    estadoExterior,
    observacionesRecepcion,
    firmaCliente,
    semana
  };

  // 9. Guardar objeto de recepción en localStorage
  const claveRecepcion = `recepcion_semana${semana}_${fechaCita}_${horaCita}_${matricula}`;
  localStorage.setItem(claveRecepcion, JSON.stringify(data, null, 2));

  // 10. Marcar cita como recepcionada
  const claveCitaReceptada = `cita_receptada_semana${semana}_${fechaCita}_${horaCita}_${matricula}`;
  localStorage.setItem(claveCitaReceptada, 'true');

  // 11. Redirigir de nuevo a la Agenda
  window.location.href = '../agendas/visor_agendas.html';
}


function guardarRecepcion() {
  const params = new URLSearchParams(window.location.search);
  const semana    = params.get('semana');
  const fecha     = params.get('fecha');
  const hora      = params.get('hora');
  const matricula = params.get('matricula');
  const claveBase = `semana${semana}_${fecha}_${hora}_${matricula}`;

  localStorage.setItem(`cita_receptada_${claveBase}`, 'true');
  window.location.href = `../agendas/visor_agendas.html?semana=${semana}`;
}

const btnGuardarRecepcion = document.getElementById('btnGuardarRecepcion');
if (btnGuardarRecepcion) btnGuardarRecepcion.addEventListener('click', guardarRecepcion);
