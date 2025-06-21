document.addEventListener("DOMContentLoaded", () => {
    const tablaBody = document.querySelector("#tablaOrdenes tbody");

    fetch("/api/v1/ordenes")
        .then(response => response.json())
        .then(data => {
            tablaBody.innerHTML = "";
            data.forEach(orden => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${orden.id}</td>
                    <td>${orden.cliente}</td>
                    <td>${orden.vehiculo}</td>
                    <td>${orden.fecha_entrada}</td>
                    <td>${orden.estado}</td>
                    <td><button onclick="generarFactura(${orden.id})">Generar Factura</button></td>
                `;
                tablaBody.appendChild(fila);
            });
        })
        .catch(error => console.error("Error cargando órdenes:", error));
});

function generarFactura(idOrden) {
    window.location.href = `/facturacion/plantilla_factura.html?id_orden=${idOrden}`;
}
