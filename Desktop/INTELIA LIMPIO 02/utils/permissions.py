from functools import wraps
from flask import request, jsonify

def role_required(required_role):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    return jsonify({"error": "Token no proporcionado"}), 401

                token = auth_header.replace("Bearer ", "").strip()

                # Simulación de validación de token tipo JWT simple
                if token == "admin:admin" and required_role == "admin":
                    return func(*args, **kwargs)
                else:
                    return jsonify({"error": "Acceso denegado"}), 403
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        return wrapper
    return decorator
