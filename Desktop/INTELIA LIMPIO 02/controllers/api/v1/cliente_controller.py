from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
from utils.db_utils import get_db_path
import sqlite3

bp = Blueprint("cliente", __name__, url_prefix="/api/v1/clientes")
DB_PATH = get_db_path()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@bp.route("/", methods=["GET"])
@token_required
def get_all():
    q = request.args.get("q", "").strip()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = dict_factory
        if q:
            cur = conn.execute(
                "SELECT * FROM clientes WHERE nombre LIKE ? OR matricula LIKE ? LIMIT 20",
                (f"%{q}%", f"%{q}%")
            )
        else:
            cur = conn.execute("SELECT * FROM clientes LIMIT 50")
        data = cur.fetchall()
    return jsonify({"status": "success", "data": data})

@bp.route("/", methods=["POST"])
@token_required
@role_required("admin", "gestor")
def create():
    data = request.get_json()
    required = ['nombre']
    for f in required:
        if not data.get(f):
            return jsonify({"status": "error", "message": f"Falta campo {f}"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO clientes (nombre, direccion, notas, matricula) VALUES (?, ?, ?, '')",
            (
                data['nombre'],
                data.get('direccion', ''),
                data.get('notas', '')
            )
        )
        cliente_id = cur.lastrowid

        # Insertar teléfonos
        for tel in data.get('telefono', []):
            cur.execute("INSERT INTO cliente_telefonos (cliente_id, telefono) VALUES (?, ?)", (cliente_id, tel))

        # Insertar emails
        for email in data.get('email', []):
            cur.execute("INSERT INTO cliente_emails (cliente_id, email) VALUES (?, ?)", (cliente_id, email))

        # Insertar vehículos
        for veh in data.get('vehiculos', []):
            cur.execute("INSERT INTO cliente_vehiculos (cliente_id, matricula, marca, modelo) VALUES (?, ?, ?, ?)",
                        (cliente_id, veh.get('matricula', ''), veh.get('marca', ''), veh.get('modelo', '')))

        conn.commit()
    return jsonify({"status": "success", "cliente_id": cliente_id, "message": "Cliente creado"}), 201

@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin", "gestor")
def update(item_id):
    data = request.get_json()
    campos = []
    valores = []
    for campo in ['nombre', 'matricula', 'direccion', 'notas']:
        if campo in data:
            campos.append(f"{campo} = ?")
            valores.append(data[campo])

    if campos:
        valores.append(item_id)
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE clientes SET {', '.join(campos)} WHERE id = ?", valores)

            # Borrar y reemplazar teléfonos
            cur.execute("DELETE FROM cliente_telefonos WHERE cliente_id = ?", (item_id,))
            for tel in data.get('telefono', []):
                cur.execute("INSERT INTO cliente_telefonos (cliente_id, telefono) VALUES (?, ?)", (item_id, tel))

            # Borrar y reemplazar emails
            cur.execute("DELETE FROM cliente_emails WHERE cliente_id = ?", (item_id,))
            for email in data.get('email', []):
                cur.execute("INSERT INTO cliente_emails (cliente_id, email) VALUES (?, ?)", (item_id, email))

            # Borrar y reemplazar vehículos
            cur.execute("DELETE FROM cliente_vehiculos WHERE cliente_id = ?", (item_id,))
            for veh in data.get('vehiculos', []):
                cur.execute("INSERT INTO cliente_vehiculos (cliente_id, matricula, marca, modelo) VALUES (?, ?, ?, ?)",
                            (item_id, veh.get('matricula', ''), veh.get('marca', ''), veh.get('modelo', '')))

            conn.commit()

    else:
        return jsonify({"status": "error", "message": "Ningún campo a actualizar"}), 400

    return jsonify({"status": "success", "message": "Cliente actualizado"})

@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin", "gestor")
def delete(item_id):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM cliente_telefonos WHERE cliente_id = ?", (item_id,))
        cur.execute("DELETE FROM cliente_emails WHERE cliente_id = ?", (item_id,))
        cur.execute("DELETE FROM cliente_vehiculos WHERE cliente_id = ?", (item_id,))
        cur.execute("DELETE FROM clientes WHERE id = ?", (item_id,))
        conn.commit()
    return jsonify({"status": "success", "message": "Cliente eliminado"})

@bp.route("/<int:item_id>", methods=["GET"])
@token_required
def get_one(item_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = dict_factory
        cur = conn.execute("SELECT * FROM clientes WHERE id = ?", (item_id,))
        data = cur.fetchone()

        if not data:
            return jsonify({"status": "error", "message": "Cliente no encontrado"}), 404

        # Adjuntar teléfonos, emails y vehículos
        data['telefono'] = [r['telefono'] for r in conn.execute("SELECT telefono FROM cliente_telefonos WHERE cliente_id = ?", (item_id,)).fetchall()]
        data['email'] = [r['email'] for r in conn.execute("SELECT email FROM cliente_emails WHERE cliente_id = ?", (item_id,)).fetchall()]
        data['vehiculos'] = [dict(row) for row in conn.execute("SELECT matricula, marca, modelo FROM cliente_vehiculos WHERE cliente_id = ?", (item_id,)).fetchall()]

    return jsonify({"status": "success", "data": data})

@bp.route("/<int:cliente_id>/historial", methods=["GET"])
@token_required
def historial_cliente(cliente_id):
    with sqlite3.connect(DB_PATH) as conn:
        citas = conn.execute(
            "SELECT fecha, hora, descripcion FROM agenda WHERE cliente_id = ? ORDER BY fecha DESC, hora DESC LIMIT 5", 
            (cliente_id,)
        ).fetchall()
    hist = []
    for c in citas:
        hist.append({
            "tipo": "Cita",
            "fecha": c[0] + ' ' + c[1],
            "descripcion": c[2]
        })
    return jsonify({"status": "success", "data": hist})
