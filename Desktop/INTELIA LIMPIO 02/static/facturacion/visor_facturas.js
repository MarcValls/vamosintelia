// visor_facturas.js

window.addEventListener('load', function () {
  const contenedor = document.getElementById('listaFacturas');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  // Intentar cargar facturas desde el backend
  fetch("/api/facturas", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al obtener facturas");
      return res.json();
    })
    .then(facturas => {
      if (facturas.length === 0) {
        contenedor.textContent = 'No hay facturas registradas.';
        return;
      }

      facturas.forEach(factura => {
        const divFactura = document.createElement('div');
        divFactura.style.marginBottom = '10px';
        divFactura.textContent = `Factura ${factura.id.toString().padStart(3, '0')} – Total: ${factura.total.toFixed(2)} € – Fecha: ${factura.fecha} – Cliente: ${factura.cliente_nombre}`;
        contenedor.appendChild(divFactura);
      });
    })
    .catch(err => {
      console.error("Fallo en backend, cargando desde localStorage…", err);

      // Recorrer localStorage y buscar claves que empiecen por “facturaHTML_”
      const facturas = [];
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave && clave.startsWith('facturaHTML_')) {
          facturas.push(clave);
        }
      }

      if (facturas.length === 0) {
        contenedor.textContent = 'No hay facturas generadas aún.';
        return;
      }

      facturas.sort(); // Ordenar alfabéticamente
      facturas.forEach(clave => {
        const numeroFactura = clave.replace('facturaHTML_', '');
        const htmlContent = localStorage.getItem(clave);
        if (!htmlContent) return;

        // Crear blob URL para el contenido HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const divFactura = document.createElement('div');
        divFactura.style.marginBottom = '10px';

        const enlace = document.createElement('a');
        enlace.textContent = numeroFactura;
        enlace.href = url;
        enlace.target = '_blank';
        enlace.download = `${numeroFactura}.html`;

        divFactura.appendChild(enlace);
        contenedor.appendChild(divFactura);
      });
    });
});
