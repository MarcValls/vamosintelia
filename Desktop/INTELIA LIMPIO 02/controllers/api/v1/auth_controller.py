from flask import Blueprint, request, jsonify
import sqlite3
import jwt
import os 
import datetime
from utils.db_utils import get_db_path
import hashlib

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
DB_PATH = get_db_path()
# Fail fast if the environment variable is missing
SECRET_KEY = os.environ["INTELIA_SECRET_KEY"]

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    usuario_input = data.get("usuario") or data.get("correo")
    clave = data.get("clave")

    if not usuario_input or not clave:
        return jsonify({"error": "Usuario/correo y clave requeridos"}), 400

    # Cifrado SHA-256 para la clave
    clave_hash = hashlib.sha256(clave.encode()).hexdigest()

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            "SELECT id, nombre, correo, usuario, rol FROM usuarios WHERE (correo = ? OR usuario = ?) AND password_hash = ?",
            (usuario_input, usuario_input, clave_hash)
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "Credenciales inválidas"}), 401

        payload = {
            "usuario": {
                "id": user["id"],
                "nombre": user["nombre"],
                "correo": user["correo"],
                "usuario": user["usuario"]
            },
            "rol": user["rol"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "status": "success",
            "token": token,
            "usuario": {
                "id": user["id"],
                "nombre": user["nombre"],
                "correo": user["correo"],
                "usuario": user["usuario"],
                "rol": user["rol"]
            }
        })
