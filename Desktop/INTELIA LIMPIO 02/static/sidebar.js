function cerrarTodosLosModales() {
  const idsModales = [
    'modalClienteOverlay',
    'modalCliente',
    'modalIncidenciaOverlay',
    'modalIncidencia'
  ];
  idsModales.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
}

function marcarActivo(elemento) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('activo');
    btn.removeAttribute('aria-current');
  });
  elemento.classList.add('activo');
  elemento.setAttribute('aria-current', 'page');
}

function mostrarError(main, htmlPath) {
  main.innerHTML = `<p style="color: red;">Error al cargar el módulo <strong>${htmlPath}</strong>.</p>`;
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    cerrarTodosLosModales();
    marcarActivo(btn);

    const htmlPath = btn.dataset.html;
    const jsPath = btn.dataset.js;
    const main = document.getElementById('main-content');

    main.innerHTML = '<p>Cargando módulo…</p>';

    try {
      const res = await fetch(htmlPath);
      if (!res.ok) throw new Error(`No se encontró ${htmlPath}`);
      const html = await res.text();
      main.innerHTML = html;

      if (jsPath) {
        const existing = document.querySelector(`script[src="${jsPath}"]`);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.src = jsPath;
        script.defer = true;
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error(err);
      mostrarError(main, htmlPath);
    }
  });
});
