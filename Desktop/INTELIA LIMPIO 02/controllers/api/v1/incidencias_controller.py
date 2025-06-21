
from flask import Blueprint, jsonify

incidencias_bp = Blueprint('incidencias', __name__)

# Datos simulados
INCIDENCIAS = [
    {"id": 1, "titulo": "Fallo en sistema eléctrico", "estado": "pendiente", "prioridad": "alta"},
    {"id": 2, "titulo": "Pérdida de conectividad", "estado": "resuelto", "prioridad": "media"},
    {"id": 3, "titulo": "Problema con impresora", "estado": "pendiente", "prioridad": "baja"},
    {"id": 4, "titulo": "Actualización de firmware", "estado": "pendiente", "prioridad": "alta"}
]

@incidencias_bp.route('/api/incidencias', methods=['GET'])
def obtener_incidencias():
    return jsonify(INCIDENCIAS)
