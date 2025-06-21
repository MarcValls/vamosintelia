const tablaBody = document.querySelector("#tabla-stock tbody");
const btnRecargar = document.getElementById("btn-recargar");
const btnNuevo = document.getElementById("btn-nuevo");
let modal, form, btnCerrar;

const apiUrl = "/api/v1/stock";

function cargarStock() {
  tablaBody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";
  fetch(apiUrl)
    .then(res => res.json())
    .then(datos => {
      tablaBody.innerHTML = "";
      datos.forEach(item => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${item.id}</td>
          <td>${item.nombre}</td>
          <td>${item.cantidad}</td>
          <td>${item.precio.toFixed(2)} €</td>
          <td>
            <button onclick="editar(${item.id})">✏️</button>
            <button onclick="eliminar(${item.id})">🗑️</button>
          </td>
        `;
        tablaBody.appendChild(fila);
      });
    });
}

function mostrarModal(titulo, datos = {}) {
  document.getElementById("modal-titulo").textContent = titulo;
  document.getElementById("producto-id").value = datos.id || "";
  document.getElementById("nombre").value = datos.nombre || "";
  document.getElementById("cantidad").value = datos.cantidad || "";
  document.getElementById("precio").value = datos.precio || "";
  modal.classList.remove("oculto");
}

function ocultarModal() {
  modal.classList.add("oculto");
  form.reset();
}

function editar(id) {
  fetch(`${apiUrl}/${id}`)
    .then(res => res.json())
    .then(data => mostrarModal("Editar Producto", data));
}

function eliminar(id) {
  if (confirm("¿Eliminar este producto?")) {
    fetch(`${apiUrl}/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => cargarStock());
  }
}

function configurarEventosModal() {
  modal = document.getElementById("modal");
  form = document.getElementById("form-stock");
  btnCerrar = document.getElementById("btn-cerrar");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("producto-id").value;
    const producto = {
      nombre: document.getElementById("nombre").value,
      cantidad: Number(document.getElementById("cantidad").value),
      precio: Number(document.getElementById("precio").value)
    };

    const metodo = id ? "PUT" : "POST";
    const url = id ? `${apiUrl}/${id}` : apiUrl;

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto)
    })
      .then(res => res.json())
      .then(() => {
        ocultarModal();
        cargarStock();
      });
  });

  btnCerrar.addEventListener("click", ocultarModal);
}

btnRecargar.addEventListener("click", cargarStock);
btnNuevo.addEventListener("click", () => mostrarModal("Nuevo Producto"));

window.addEventListener("load", () => {
  cargarStock();
  const intervalo = setInterval(() => {
    if (document.getElementById("modal")) {
      configurarEventosModal();
      clearInterval(intervalo);
    }
  }, 300);
});
