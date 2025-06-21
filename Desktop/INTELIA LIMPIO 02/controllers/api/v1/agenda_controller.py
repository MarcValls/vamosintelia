from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("agenda", __name__, url_prefix="/api/v1/agenda")
DB_PATH = get_db_path()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# GET: eventos agenda (opcional: filtrado por fecha, para FullCalendar)
@bp.route("/", methods=["GET"])
@token_required
def get_all():
    fecha_inicio = request.args.get("start")
    fecha_fin = request.args.get("end")
    query = """
        SELECT agenda.*, clientes.nombre AS cliente_nombre, clientes.id AS cliente_id, clientes.matricula
        FROM agenda
        LEFT JOIN clientes ON agenda.cliente_id = clientes.id
        WHERE 1=1
    """
    params = []
    if fecha_inicio and fecha_fin:
        query += " AND agenda.fecha BETWEEN ? AND ?"
        params.extend([fecha_inicio, fecha_fin])
    query += " ORDER BY agenda.fecha, agenda.hora"

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = dict_factory
        cur = conn.execute(query, params)
        data = cur.fetchall()
    return jsonify({"status": "success", "data": data})

# POST: crear evento
@bp.route("/", methods=["POST"])
@token_required
@role_required("admin", "gestor")
def create():
    data = request.get_json()
    required = ['cliente_id', 'fecha', 'hora']
    for f in required:
        if not data.get(f):
            return jsonify({"status": "error", "message": f"Falta campo {f}"}), 400
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO agenda (cliente_id, fecha, hora, descripcion) VALUES (?, ?, ?, ?)",
            (
                data['cliente_id'],
                data['fecha'],
                data['hora'],
                data.get('descripcion', '')
            )
        )
        conn.commit()
        return jsonify({"status": "success", "agenda_id": cur.lastrowid, "message": "Cita creada"}), 201

# PUT: actualizar evento
@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin", "gestor")
def update(item_id):
    data = request.get_json()
    campos = []
    valores = []
    for campo in ['cliente_id', 'fecha', 'hora', 'descripcion']:
        if campo in data:
            campos.append(f"{campo} = ?")
            valores.append(data[campo])
    if not campos:
        return jsonify({"status": "error", "message": "Ningún campo a actualizar"}), 400
    valores.append(item_id)
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE agenda SET {', '.join(campos)} WHERE id = ?",
            valores
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Cita actualizada"})

# DELETE: eliminar evento
@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin", "gestor")
def delete(item_id):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM agenda WHERE id = ?", (item_id,))
        conn.commit()
        return jsonify({"status": "success", "message": "Cita eliminada"})

# GET: evento único por ID (opcional)
@bp.route("/<int:item_id>", methods=["GET"])
@token_required
def get_one(item_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = dict_factory
        cur = conn.execute("""
            SELECT agenda.*, clientes.nombre AS cliente_nombre, clientes.id AS cliente_id, clientes.matricula
            FROM agenda
            LEFT JOIN clientes ON agenda.cliente_id = clientes.id
            WHERE agenda.id = ?
        """, (item_id,))
        data = cur.fetchone()
    if not data:
        return jsonify({"status": "error", "message": "Cita no encontrada"}), 404
    return jsonify({"status": "success", "data": data})
