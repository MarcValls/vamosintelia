from flask import request, jsonify, g
import jwt
import os
from functools import wraps

SECRET_KEY = os.environ.get("INTELIA_SECRET_KEY", "INTELIA_SUPER_SECRETO")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            else:
                token = parts[-1]

        if not token:
            return jsonify({"status":"error", "error": "Token requerido"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.usuario = data.get("usuario")
            g.rol = data.get("rol", "usuario")
        except jwt.ExpiredSignatureError:
            return jsonify({"status":"error", "error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status":"error", "error": "Token inválido"}), 401

        return f(*args, **kwargs)
    return decorated

def role_required(*required_roles):
    """
    Uso: @role_required('admin', 'gestor')  (permite uno o varios roles)
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                parts = request.headers['Authorization'].split(" ")
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
                else:
                    token = parts[-1]

            if not token:
                return jsonify({"status":"error", "error": "Token requerido"}), 401

            try:
                data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                g.usuario = data.get("usuario")
                g.rol = data.get("rol", "usuario")
                if g.rol not in required_roles:
                    return jsonify({"status":"error", "error": "No autorizado"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"status":"error", "error": "Token expirado"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"status":"error", "error": "Token inválido"}), 401

            return f(*args, **kwargs)
        return decorated
    return decorator
