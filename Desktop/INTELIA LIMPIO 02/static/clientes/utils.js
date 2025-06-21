let _clientesCache = null;

async function getClientes() {
  if (!_clientesCache) {
    const res = await fetch('../clientes/clientes.json');
    _clientesCache = await res.json();
    normalizarClientes(_clientesCache);
  }
  return _clientesCache;
}

function normalizarClientes(clientes) {
  clientes.forEach(c => {
    if(typeof c.email === "string") c.email = [c.email];
    if(!Array.isArray(c.email)) c.email = [];
    if(!Array.isArray(c.telefonos)) c.telefonos = [];
    if(!Array.isArray(c.vehiculos)) c.vehiculos = [];
  });
}

async function buscarClientePorNombre(nombre) {
  const clientes = await getClientes();
  return clientes.find(c => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
}

async function buscarClientePorMatricula(matricula) {
  const clientes = await getClientes();
  return clientes.find(c => (c.vehiculos||[]).some(v => v.matricula.trim().toLowerCase() === matricula.trim().toLowerCase()));
}

async function buscarClientePorTelefono(telefono) {
  const clientes = await getClientes();
  return clientes.find(c => (c.telefonos||[]).map(t => t.replace(/\s/g, "")).includes(telefono.replace(/\s/g, "")));
}

async function rellenarDatalistsClientes() {
  const clientes = await getClientes();
  let listNombres = document.getElementById("clientesList");
  let listMatriculas = document.getElementById("matriculasList");
  let listTelefonos = document.getElementById("telefonosList");
  if(listNombres) {
    listNombres.innerHTML = clientes.map(c=>`<option value="${c.nombre}">`).join("");
  }
  if(listMatriculas) {
    listMatriculas.innerHTML = clientes.flatMap(
      c => c.vehiculos.map(v=>`<option value="${v.matricula}">`)
    ).join("");
  }
  if(listTelefonos) {
    listTelefonos.innerHTML = clientes.flatMap(
      c => c.telefonos.map(t=>`<option value="${t}">`)
    ).join("");
  }
}
