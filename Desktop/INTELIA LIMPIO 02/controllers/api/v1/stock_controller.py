from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("stock", __name__, url_prefix="/api/v1/stock")
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
        cur = conn.execute("SELECT * FROM stock")
        return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/<int:item_id>", methods=["GET"])
@token_required
def get_one(item_id):
    with get_db() as conn:
        cur = conn.execute("SELECT * FROM stock WHERE id = ?", (item_id,))
        row = cur.fetchone()
        if row:
            return jsonify(dict(row))
        return jsonify({"error": "Elemento no encontrado"}), 404

@bp.route("/", methods=["POST"])
@token_required
def create():
    data = request.get_json()
    required = ['nombre', 'cantidad', 'precio']
    error = validar_campos(data, required)
    if error: return error

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO stock (nombre, cantidad, precio) VALUES (?, ?, ?)",
            tuple(data[f] for f in required)
        )
        conn.commit()
        return jsonify({"id": cur.lastrowid, "message": "Producto creado correctamente"}), 201

@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update(item_id):
    data = request.get_json()
    required = ['nombre', 'cantidad', 'precio']
    error = validar_campos(data, required)
    if error: return error

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE stock SET nombre = ?, cantidad = ?, precio = ? WHERE id = ?",
            tuple(data[f] for f in required) + (item_id,)
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "Producto no encontrado"}), 404
        return jsonify({"message": "Producto actualizado"})

@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete(item_id):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM stock WHERE id = ?", (item_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "Producto no encontrado"}), 404
        return jsonify({"message": "Producto eliminado"})
