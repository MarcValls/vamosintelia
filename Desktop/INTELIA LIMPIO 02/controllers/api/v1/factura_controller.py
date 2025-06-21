from flask import Blueprint, request, jsonify
from utils.db_utils import get_db_path
from utils.auth_utils import token_required, role_required
from datetime import datetime
import sqlite3

factura_bp = Blueprint("factura", __name__, url_prefix="/api/v1/facturas")
DB_PATH = get_db_path()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def validar_factura(data):
    campos = ["numero", "fecha_emision", "total", "nif", "lineas"]
    faltan = [c for c in campos if c not in data]
    if faltan:
        return f"Faltan campos: {', '.join(faltan)}"
    if not isinstance(data["lineas"], list):
        return "El campo 'lineas' debe ser una lista."
    for idx, linea in enumerate(data["lineas"]):
        for campo in ["descripcion", "cantidad", "precio", "tipoIVA"]:
            if campo not in linea:
                return f"Falta '{campo}' en línea {idx+1}"
    return None

@factura_bp.route("/", methods=["GET"])
@token_required
def get_all_facturas():
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM facturas")
            rows = [dict(row) for row in cur.fetchall()]
            return jsonify(rows)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@factura_bp.route("/<int:id>", methods=["GET"])
@token_required
def get_factura_by_id(id):
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM facturas WHERE id = ?", (id,))
            factura = cur.fetchone()
            if not factura:
                return jsonify({"status": "error", "message": "Factura no encontrada"}), 404

            cur.execute("SELECT * FROM lineas_factura WHERE factura_id = ?", (id,))
            lineas = [dict(l) for l in cur.fetchall()]
            resultado = dict(factura)
            resultado["lineas"] = lineas
            return jsonify(resultado)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@factura_bp.route("/", methods=["POST"])
@token_required
@role_required("admin", "gestor")
def crear_factura():
    data = request.get_json()
    error = validar_factura(data)
    if error:
        return jsonify({"status": "error", "message": error}), 400

    try:
        with get_db() as conn:
            cur = conn.cursor()

            cur.execute("SELECT id FROM clientes WHERE nif = ?", (data["nif"],))
            cliente = cur.fetchone()
            if not cliente:
                return jsonify({"status": "error", "message": "Cliente no encontrado"}), 404
            cliente_id = cliente["id"]

            cur.execute("""
                INSERT INTO facturas (numero, cliente_id, fecha, fecha_operacion, forma_pago, plazo_pago, base, iva, total, id_orden)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data["numero"],
                cliente_id,
                data["fecha_emision"],
                data.get("fecha_operacion", data["fecha_emision"]),
                data.get("forma_pago", ""),
                data.get("plazo_pago", ""),
                data.get("base", 0),
                data.get("iva", 0),
                data["total"],
                data.get("id_orden", None)
            ))
            factura_id = cur.lastrowid

            for linea in data["lineas"]:
                cur.execute("""
                    INSERT INTO lineas_factura (factura_id, descripcion, cantidad, precio_unitario, tipo_iva)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    factura_id,
                    linea["descripcion"],
                    linea["cantidad"],
                    linea["precio"],
                    linea["tipoIVA"]
                ))

            try:
                cur.execute("""
                    INSERT INTO auditoria_logs (evento, fecha, tabla, referencia)
                    VALUES (?, ?, ?, ?)
                """, ("crear_factura", datetime.now(), "facturas", factura_id))
            except sqlite3.OperationalError:
                pass

            conn.commit()

            cur.execute("SELECT * FROM facturas WHERE id = ?", (factura_id,))
            factura = dict(cur.fetchone())

            cur.execute("SELECT * FROM lineas_factura WHERE factura_id = ?", (factura_id,))
            factura["lineas"] = [dict(row) for row in cur.fetchall()]

            return jsonify({"status": "success", "factura": factura}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@factura_bp.route("/<int:id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_factura(id):
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM facturas WHERE id = ?", (id,))
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"status": "error", "message": "Factura no encontrada"}), 404
            return jsonify({"status": "success", "message": "Factura eliminada correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
