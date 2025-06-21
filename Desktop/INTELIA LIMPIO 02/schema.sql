-- === CLIENTES Y CONTACTO ===
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    idioma TEXT DEFAULT 'es',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cliente_telefonos (
    id_cliente TEXT,
    telefono TEXT,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS cliente_emails (
    id_cliente TEXT,
    email TEXT,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS cliente_vehiculos (
    id_cliente TEXT,
    modelo TEXT,
    matricula TEXT UNIQUE,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
);

DROP VIEW IF EXISTS clientes_ext;

CREATE VIEW clientes_ext AS
SELECT
    c.id,
    c.nombre,
    (
      SELECT GROUP_CONCAT(telefono, ';') 
      FROM (
        SELECT DISTINCT telefono 
        FROM cliente_telefonos 
        WHERE id_cliente = c.id
      )
    ) AS telefonos,
    (
      SELECT GROUP_CONCAT(email, ';') 
      FROM (
        SELECT DISTINCT email 
        FROM cliente_emails 
        WHERE id_cliente = c.id
      )
    ) AS emails,
    (
      SELECT GROUP_CONCAT(modelo || ' - ' || matricula, ';') 
      FROM cliente_vehiculos 
      WHERE id_cliente = c.id
    ) AS vehiculos
FROM clientes c;

-- === USUARIOS Y ROLES ===
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    idioma TEXT DEFAULT 'es'
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    id_usuario INTEGER,
    id_rol TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY(id_rol) REFERENCES roles(id)
);

-- === OPERARIOS Y PROVEEDORES ===
CREATE TABLE IF NOT EXISTS operarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT
);

-- === ACTIVOS Y VEHÍCULOS ===
CREATE TABLE IF NOT EXISTS activos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    descripcion TEXT,
    matricula TEXT UNIQUE,
    datos_extra TEXT
);

CREATE TABLE IF NOT EXISTS vehiculos (
    matricula TEXT PRIMARY KEY,
    modelo TEXT,
    id_cliente TEXT,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
);

-- === CITAS Y DIAGNÓSTICO ===
CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente TEXT,
    id_activo INTEGER,
    fecha TEXT NOT NULL,
    estado TEXT CHECK(estado IN ('entrada','diagnóstico','reparación','control calidad','entregado')) NOT NULL,
    firma_entrada TEXT,
    firma_salida TEXT,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id),
    FOREIGN KEY(id_activo) REFERENCES activos(id)
);

CREATE TABLE IF NOT EXISTS diagnosticos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cita INTEGER,
    informe TEXT,
    adjuntos TEXT,
    FOREIGN KEY(id_cita) REFERENCES citas(id)
);

-- === PRESUPUESTOS Y ÓRDENES ===
CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente TEXT,
    fecha TEXT NOT NULL,
    estado TEXT CHECK(estado IN ('enviado','aceptado','rechazado')) NOT NULL,
    fecha_respuesta TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_presupuesto INTEGER,
    descripcion TEXT,
    cantidad INTEGER,
    precio_unitario REAL,
    id_articulo INTEGER,
    FOREIGN KEY(id_presupuesto) REFERENCES presupuestos(id),
    FOREIGN KEY(id_articulo) REFERENCES articulos(id)
);

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_presupuesto INTEGER,
    id_operario INTEGER,
    estado TEXT CHECK(estado IN ('pendiente','en_progreso','terminado')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_presupuesto) REFERENCES presupuestos(id),
    FOREIGN KEY(id_operario) REFERENCES usuarios(id)
);

-- === FACTURAS Y PAGOS ===
CREATE TABLE IF NOT EXISTS facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden INTEGER,
    fecha TEXT NOT NULL,
    total REAL NOT NULL,
    estado TEXT CHECK(estado IN ('pendiente','pagada')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_orden) REFERENCES ordenes_trabajo(id)
);

CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_factura INTEGER,
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY(id_factura) REFERENCES facturas(id)
);

-- === STOCK Y ARTÍCULOS ===
CREATE TABLE IF NOT EXISTS articulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('pieza','servicio')) NOT NULL,
    precio REAL NOT NULL,
    stock INTEGER NOT NULL
);

-- === AUDITORÍA Y METADATOS ===
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    accion TEXT,
    entidad TEXT,
    id_entidad TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT
);

CREATE TABLE IF NOT EXISTS versiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT,
    id_entidad TEXT,
    snapshot TEXT,
    version INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT,
    id_entidad TEXT,
    usuario TEXT,
    comentario TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adjuntos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT,
    id_entidad TEXT,
    nombre_archivo TEXT,
    ruta TEXT,
    tipo TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- === FASES DE CITA ===
CREATE TABLE IF NOT EXISTS cita_fases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cita INTEGER NOT NULL,
    fase TEXT CHECK(fase IN ('entrada','diagnóstico','reparación','control calidad','entregado')) NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT,
    usuario TEXT,
    FOREIGN KEY(id_cita) REFERENCES citas(id)
);

-- === SESIONES Y EMPRESAS ===
CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER,
    token TEXT UNIQUE,
    ip TEXT,
    inicio TEXT DEFAULT CURRENT_TIMESTAMP,
    fin TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    direccion TEXT
);

-- === DISPONIBILIDAD ===
CREATE TABLE IF NOT EXISTS disponibilidad (
    id_operario INTEGER,
    fecha TEXT,
    hora_inicio TEXT,
    hora_fin TEXT,
    tipo TEXT CHECK(tipo IN ('disponible','bloqueado')),
    FOREIGN KEY(id_operario) REFERENCES operarios(id)
);

-- === EVENTOS DEL SISTEMA ===
CREATE TABLE IF NOT EXISTS eventos_sistema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    entidad TEXT,
    valor TEXT,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

-- === INTEGRACIONES ===
CREATE TABLE IF NOT EXISTS integraciones (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    tipo TEXT,
    config TEXT
);
