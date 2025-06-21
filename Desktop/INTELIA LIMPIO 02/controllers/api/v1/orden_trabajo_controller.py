from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("orden_trabajo", __name__, url_prefix="/api/v1/trabajos")
DB_PATH = get_db_path()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def validar_campos(data, campos):
    faltan = [f for f in campos if f not in data]
    if faltan:
        return jsonify({"error": f"Faltan campos: {', '.join(faltan)}"}), 400
    return None

@bp.route("/", methods=["GET"])
@token_required
def get_all():
    with get_db() as conn:
        cur = conn.execute("SELECT * FROM orden_trabajo")
        return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/", methods=["POST"])
@token_required
def create():
    data = request.get_json()
    required = ['cliente_id', 'vehiculo_id', 'descripcion', 'estado']
    error = validar_campos(data, required)
    if error: return error

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO orden_trabajo (cliente_id, vehiculo_id, descripcion, estado) VALUES (?, ?, ?, ?)",
            tuple(data[f] for f in required)
        )
        conn.commit()
        return jsonify({"id": cur.lastrowid, "message": "Orden de trabajo creada"}), 201

@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update(item_id):
    data = request.get_json()
    required = ['cliente_id', 'vehiculo_id', 'descripcion', 'estado']
    error = validar_campos(data, required)
    if error: return error

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE orden_trabajo SET cliente_id = ?, vehiculo_id = ?, descripcion = ?, estado = ? WHERE id = ?",
            tuple(data[f] for f in required) + (item_id,)
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "Orden no encontrada"}), 404
        return jsonify({"message": "Actualizado correctamente"})

@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete(item_id):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM orden_trabajo WHERE id = ?", (item_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "Orden no encontrada"}), 404
        return jsonify({"message": "Eliminado correctamente"})
