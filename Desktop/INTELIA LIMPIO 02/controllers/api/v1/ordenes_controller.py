from flask import Blueprint, jsonify
import sqlite3
from controllers.utils.db_utils import get_db_path

ordenes_bp = Blueprint('ordenes_bp', __name__)
DB_PATH = get_db_path()

# Obtener lista completa de órdenes
@ordenes_bp.route('/api/v1/ordenes', methods=['GET'])
def get_ordenes():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = '''
        SELECT 
            o.id,
            o.estado,
            o.created_at,
            o.updated_at,
            c.nombre AS cliente,
            c.nif,
            c.direccion,
            c.email,
            v.matricula,
            v.modelo
        FROM ordenes_trabajo o
        LEFT JOIN clientes c ON o.id_cliente = c.id
        LEFT JOIN vehiculos v ON o.id_vehiculo = v.matricula
        ORDER BY o.id ASC
    '''
    cur.execute(query)
    ordenes = cur.fetchall()
    conn.close()

    return jsonify([dict(row) for row in ordenes])

# Obtener una sola orden por ID
@ordenes_bp.route('/api/v1/ordenes/<int:id>', methods=['GET'])
def get_orden(id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = '''
        SELECT 
            o.id,
            o.estado,
            o.created_at,
            o.updated_at,
            c.nombre AS cliente,
            c.nif,
            c.direccion,
            c.email,
            v.matricula,
            v.modelo
        FROM ordenes_trabajo o
        LEFT JOIN clientes c ON o.id_cliente = c.id
        LEFT JOIN vehiculos v ON o.id_vehiculo = v.matricula
        WHERE o.id = ?
    '''
    cur.execute(query, (id,))
    row = cur.fetchone()
    conn.close()

    if row:
        return jsonify(dict(row))
    else:
        return jsonify({'error': 'Orden no encontrada'}), 404
