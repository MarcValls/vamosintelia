from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("vehiculo", __name__, url_prefix="/api/v1/vehiculos")
DB_PATH = get_db_path()

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def validar_campos(data, campos):
    faltan = [c for c in campos if c not in data]
    if faltan:
        return jsonify({"status": "error", "message": f"Faltan campos: {', '.join(faltan)}"}), 400
    return None

@bp.route("/", methods=["GET"])
def get_all():
    try:
        with get_connection() as conn:
            cur = conn.execute("SELECT * FROM vehiculos")
            return jsonify([dict(row) for row in cur.fetchall()])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/<int:item_id>", methods=["GET"])
@token_required
def get_one(item_id):
    try:
        with get_connection() as conn:
            cur = conn.execute("SELECT * FROM vehiculos WHERE id = ?", (item_id,))
            row = cur.fetchone()
            if row:
                return jsonify(dict(row))
            return jsonify({"status": "error", "message": "Vehículo no encontrado"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/", methods=["POST"])
@token_required
def create():
    data = request.get_json()
    error = validar_campos(data, ['marca', 'modelo', 'matricula'])
    if error:
        return error

    try:
        with get_connection() as conn:
            cur = conn.cursor()

            # Verificar si ya existe la matrícula
            cur.execute("SELECT 1 FROM vehiculos WHERE matricula = ?", (data["matricula"],))
            if cur.fetchone():
                return jsonify({"status": "error", "message": "Ya existe un vehículo con esa matrícula"}), 409

            cur.execute(
                "INSERT INTO vehiculos (marca, modelo, matricula) VALUES (?, ?, ?)",
                (data["marca"], data["modelo"], data["matricula"])
            )
            conn.commit()
            return jsonify({"status": "success", "id": cur.lastrowid, "message": "Creado correctamente"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update(item_id):
    data = request.get_json()
    error = validar_campos(data, ['marca', 'modelo', 'matricula'])
    if error:
        return error

    try:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE vehiculos SET marca = ?, modelo = ?, matricula = ? WHERE id = ?",
                (data["marca"], data["modelo"], data["matricula"], item_id)
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"status": "error", "message": "Vehículo no encontrado"}), 404
            return jsonify({"status": "success", "message": "Actualizado correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete(item_id):
    try:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM vehiculos WHERE id = ?", (item_id,))
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"status": "error", "message": "Vehículo no encontrado"}), 404
            return jsonify({"status": "success", "message": "Eliminado correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
