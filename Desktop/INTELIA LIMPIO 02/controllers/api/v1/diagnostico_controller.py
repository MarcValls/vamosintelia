# controllers/diagnostico_controller.py
from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required, role_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("diagnostico", __name__, url_prefix="/api/v1/diagnosticos")
DB_PATH = get_db_path()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def validate_fields(data, required):
    missing = [f for f in required if f not in data]
    if missing:
        return False, f"Faltan campos obligatorios: {', '.join(missing)}"
    return True, ""

def orden_exists(orden_id):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM ordenes_trabajo WHERE id = ?", (orden_id,)).fetchone()
    conn.close()
    return bool(row)

def log_accion(user_id, accion, tabla, registro_id):
    # Descomenta si tienes tabla logs
    # conn = get_db_connection()
    # conn.execute("INSERT INTO logs (user_id, accion, tabla, registro_id, timestamp) VALUES (?, ?, ?, ?, datetime('now'))", (user_id, accion, tabla, registro_id))
    # conn.commit()
    # conn.close()
    pass

# === GET TODOS LOS DIAGNÓSTICOS (paginado y filtros) ===
@bp.route("/", methods=["GET"])
@token_required
@role_required("admin", "gestor", "operario", "auditor")
def get_all():
    try:
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 25))
        offset = (page - 1) * size

        filtro_cliente = request.args.get("cliente")
        filtro_estado = request.args.get("estado")
        filtro_fecha = request.args.get("fecha")

        query = "SELECT * FROM diagnosticos WHERE 1=1"
        params = []
        if filtro_cliente:
            query += " AND cliente LIKE ?"
            params.append(f"%{filtro_cliente}%")
        if filtro_estado:
            query += " AND estado = ?"
            params.append(filtro_estado)
        if filtro_fecha:
            query += " AND fecha = ?"
            params.append(filtro_fecha)

        count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
        query += " ORDER BY fecha DESC LIMIT ? OFFSET ?"
        params_pagination = params + [size, offset]

        conn = get_db_connection()
        rows = conn.execute(query, params_pagination).fetchall()
        total = conn.execute(count_query, params).fetchone()["total"]
        conn.close()

        return jsonify({
            "status": "success",
            "message": f"{len(rows)} diagnósticos encontrados",
            "data": [dict(row) for row in rows],
            "total": total,
            "page": page,
            "size": size
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "data": None}), 500

# === GET DIAGNÓSTICO POR ID ===
@bp.route("/<int:item_id>", methods=["GET"])
@token_required
@role_required("admin", "gestor", "operario", "auditor")
def get_one(item_id):
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM diagnosticos WHERE id = ?", (item_id,)).fetchone()
        conn.close()
        if not row:
            return jsonify({"status": "error", "message": "Diagnóstico no encontrado", "data": None}), 404
        return jsonify({"status": "success", "message": "Diagnóstico encontrado", "data": dict(row)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "data": None}), 500

# === CREAR DIAGNÓSTICO (validación orden_id) ===
@bp.route("/", methods=["POST"])
@token_required
@role_required("admin", "gestor", "operario")
def create():
    data = request.get_json() or {}
    required = ['orden_id', 'detalle', 'estado']
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"status": "error", "message": msg, "data": None}), 400

    if not orden_exists(data['orden_id']):
        return jsonify({"status": "error", "message": "orden_id no existe en órdenes de trabajo", "data": None}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO diagnosticos (orden_id, detalle, estado) VALUES (?, ?, ?)",
            (data['orden_id'], data['detalle'], data['estado'])
        )
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute("SELECT * FROM diagnosticos WHERE id = ?", (new_id,)).fetchone()
        conn.close()
        # log_accion(user_id, "crear", "diagnosticos", new_id) # Si quieres logs
        return jsonify({
            "status": "success",
            "message": "Diagnóstico creado correctamente",
            "data": dict(row)
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "data": None}), 500

# === ACTUALIZAR DIAGNÓSTICO (validación orden_id) ===
@bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required("admin", "gestor")
def update(item_id):
    data = request.get_json() or {}
    required = ['orden_id', 'detalle', 'estado']
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"status": "error", "message": msg, "data": None}), 400

    if not orden_exists(data['orden_id']):
        return jsonify({"status": "error", "message": "orden_id no existe en órdenes de trabajo", "data": None}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM diagnosticos WHERE id = ?", (item_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Diagnóstico no encontrado", "data": None}), 404

        cur.execute(
            "UPDATE diagnosticos SET orden_id = ?, detalle = ?, estado = ? WHERE id = ?",
            (data['orden_id'], data['detalle'], data['estado'], item_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM diagnosticos WHERE id = ?", (item_id,)).fetchone()
        conn.close()
        # log_accion(user_id, "actualizar", "diagnosticos", item_id) # Si quieres logs
        return jsonify({
            "status": "success",
            "message": "Diagnóstico actualizado correctamente",
            "data": dict(row)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "data": None}), 500

# === ELIMINAR DIAGNÓSTICO ===
@bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete(item_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM diagnosticos WHERE id = ?", (item_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Diagnóstico no encontrado", "data": None}), 404

        cur.execute("DELETE FROM diagnosticos WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        # log_accion(user_id, "eliminar", "diagnosticos", item_id) # Si quieres logs
        return jsonify({
            "status": "success",
            "message": "Diagnóstico eliminado correctamente",
            "data": None
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "data": None}), 500
