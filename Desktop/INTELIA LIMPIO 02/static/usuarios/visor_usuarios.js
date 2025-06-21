document.addEventListener("DOMContentLoaded", () => {
  validarToken();
  cargarUsuarios();
  document.getElementById("btnNuevoUsuario").addEventListener("click", abrirModalNuevoUsuario);
  document.getElementById("formUsuario").addEventListener("submit", guardarUsuario);
});

function validarToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Acceso denegado");
    window.location.href = "/login.html";
  }
}

function cargarUsuarios() {
  fetch("/api/v1/usuarios/", {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  })
    .then(res => res.json())
    .then(data => renderizarTabla(data.data));
}

function renderizarTabla(usuarios) {
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = "";
  usuarios.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.usuario}</td>
      <td>${u.rol}</td>
      <td>${u.email}</td>
      <td>
        <button onclick="editarUsuario(${u.id})">✏️</button>
        <button onclick="eliminarUsuario(${u.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalNuevoUsuario() {
  document.getElementById("formUsuario").reset();
  document.getElementById("modalUsuario").style.display = "block";
}

function cerrarModal() {
  document.getElementById("modalUsuario").style.display = "none";
}

function guardarUsuario(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  fetch("/api/v1/usuarios/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(data)
  }).then(() => {
    cerrarModal();
    cargarUsuarios();
  });
}
