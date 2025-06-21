from flask import Blueprint, jsonify
from utils.auth_utils import token_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("clientes", __name__, url_prefix="/api/v1/count")

@bp.route("/clientes", methods=["GET"])
@token_required
def count_clientes():
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM clientes")
    count = cursor.fetchone()[0]
    conn.close()
    return jsonify({"count": count})
