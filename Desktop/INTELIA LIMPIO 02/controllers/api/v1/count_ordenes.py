from flask import Blueprint, jsonify
from utils.auth_utils import token_required
import sqlite3
from utils.db_utils import get_db_path

bp = Blueprint("ordenes", __name__, url_prefix="/api/v1/count")

@bp.route("/ordenes", methods=["GET"])
@token_required
def count_ordenes():
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM ordenes_trabajo")
    count = cursor.fetchone()[0]
    conn.close()
    return jsonify({"count": count})
