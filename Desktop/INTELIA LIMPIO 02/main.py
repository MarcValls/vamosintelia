from flask import Flask, send_from_directory, send_file
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

# ------------------------
# Blueprints principales desde controllers/
# ------------------------
from controllers.api.v1.agenda_controller import bp as agenda_bp
from controllers.api.v1.auth_controller import bp as auth_bp
from controllers.api.v1.cliente_controller import bp as cliente_bp
from controllers.api.v1.diagnostico_controller import bp as diagnostico_bp
from controllers.api.v1.factura_controller import factura_bp
from controllers.api.v1.presupuesto_controller import bp as presupuesto_bp
from controllers.api.v1.orden_trabajo_controller import bp as trabajo_bp
from controllers.api.v1.stock_controller import bp as stock_bp
from controllers.api.v1.usuarios_controller import bp as usuarios_bp
from controllers.api.v1.vehiculo_controller import bp as vehiculo_bp

# ------------------------
# KPIs y extras
# ------------------------
from controllers.api.v1.count_clientes import bp as count_clientes_bp
from controllers.api.v1.count_agendas import bp as count_agendas_bp
from controllers.api.v1.count_ordenes import bp as count_ordenes_bp
from controllers.api.v1.count_facturas import bp as count_facturas_bp
from controllers.api.v1.ordenes_controller import ordenes_bp

# ------------------------
# Registro de blueprints
# ------------------------
app.register_blueprint(agenda_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(cliente_bp)
app.register_blueprint(diagnostico_bp)
app.register_blueprint(factura_bp)
app.register_blueprint(presupuesto_bp)
app.register_blueprint(trabajo_bp)
app.register_blueprint(stock_bp)
app.register_blueprint(usuarios_bp)
app.register_blueprint(vehiculo_bp)

app.register_blueprint(count_clientes_bp)
app.register_blueprint(count_agendas_bp)
app.register_blueprint(count_ordenes_bp)
app.register_blueprint(count_facturas_bp)
app.register_blueprint(ordenes_bp)

# ------------------------
# Rutas públicas
# ------------------------
@app.route("/")
def serve_home():
    return send_from_directory(app.static_folder, "sidebar.html")

@app.route("/docs")
def swagger_docs():
    return send_file("static/documentacion/swagger_intelia_completo_backend.yaml")

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, "sidebar.html")

# ------------------------
# Arranque
# ------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
