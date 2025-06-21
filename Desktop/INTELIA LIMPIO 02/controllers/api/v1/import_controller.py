
from models.cliente import Cliente

import_bp = Blueprint('import_bp', __name__, url_prefix='/api/v1/import')
from flask import Blueprint

@import_bp.route('/clientes', methods=['POST'])
def import_clientes():
    payload = request.get_json() or {}
    code = payload.get('code')
    data = payload.get('data')

    # Validación de código de seguridad
    expected = current_app.config.get('IMPORT_CODE', 'admin')
    if code != expected:
        return jsonify(error='Código de seguridad inválido'), 403

    # Validación de formato
    if not isinstance(data, list):
        return jsonify(error='El campo data debe ser una lista'), 400

    inserted = 0
    errors = []
    for idx, row in enumerate(data, start=1):
        try:
            nombre   = row.get('nombre') or row.get('Nombre')
            telefono = row.get('telefono') or row.get('Teléfono')
            email    = row.get('email') or row.get('Email')
            cliente = Cliente(nombre=nombre, telefono=telefono, email=email)
            db.session.add(cliente)
            inserted += 1
        except Exception as e:
            errors.append(f'Fila {idx}: {str(e)}')

    # Commit de todos los inserts
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify(error='Error al guardar en base de datos', detail=str(e)), 500

    return jsonify(
        message=f'{inserted} clientes importados correctamente',
        errors=errors
    ), 200