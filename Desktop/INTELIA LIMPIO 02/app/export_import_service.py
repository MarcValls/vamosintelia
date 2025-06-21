from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import csv
import json
import io

# --- Configuración de la aplicación y CORS ---
app = FastAPI(
    title="Export/Import Service",
    description="Servicio para exportar e importar tablas de INTELIA.db en CSV/JSON",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Ajustar según origenes de frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/INTELIA.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Endpoints ---
@app.get("/export/{table_name}")
def export_table(table_name: str, format: str = "csv"):
    """
    Exporta la tabla indicada a CSV o JSON.
    GET /export/{table_name}?format=csv|json
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT * FROM {table_name}")
    except sqlite3.OperationalError:
        raise HTTPException(status_code=404, detail="Tabla no encontrada")
    rows = cur.fetchall()
    columns = rows[0].keys() if rows else []

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        for row in rows:
            writer.writerow([row[col] for col in columns])
        return Response(content=output.getvalue(), media_type="text/csv")
    elif format.lower() == "json":
        data = [dict(row) for row in rows]
        return Response(content=json.dumps(data), media_type="application/json")
    else:
        raise HTTPException(status_code=400, detail="Formato inválido. Use 'csv' o 'json'.")

@app.post("/import/{table_name}")
def import_table(table_name: str, file: UploadFile = File(...), format: str = "csv"):
    """
    Importa datos a la tabla indicada desde CSV o JSON.
    POST /import/{table_name}?format=csv|json
    """
    contents = file.file.read().decode('utf-8')
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(f"PRAGMA table_info({table_name})")
        cols = [info[1] for info in cur.fetchall()]
        if not cols:
            raise sqlite3.OperationalError
    except sqlite3.OperationalError:
        raise HTTPException(status_code=404, detail="Tabla no encontrada")

    if format.lower() == "csv":
        reader = csv.DictReader(io.StringIO(contents))
        rows = [tuple(row[col] for col in cols) for row in reader]
    elif format.lower() == "json":
        data = json.loads(contents)
        rows = [tuple(item.get(col) for col in cols) for item in data]
    else:
        raise HTTPException(status_code=400, detail="Formato inválido. Use 'csv' o 'json'.")

    placeholders = ",".join("?" for _ in cols)
    insert_sql = f"INSERT INTO {table_name} ({','.join(cols)}) VALUES ({placeholders})"
    try:
        cur.executemany(insert_sql, rows)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"inserted": len(rows)}


# --- Configuración de Rutas y Despliegue ---
# 1. Correr localmente con Uvicorn:
#    uvicorn export_import_service:app --host 0.0.0.0 --port 8000 --reload

# 2. Dockerfile sugerido:
#    FROM python:3.11-slim
#    WORKDIR /app
#    COPY requirements.txt .
#    RUN pip install --no-cache-dir -r requirements.txt
#    COPY . .
#    CMD ["uvicorn", "export_import_service:app", "--host", "0.0.0.0", "--port", "8000"]

# 3. docker-compose.yml básico:
#    version: '3.8'
#    services:
#      api:
#        build: .
#        ports:
#          - "8000:8000"
#        volumes:
#          - ./data:/app/data

# 4. Prefijo de ruta (por ejemplo, /api):
#    from fastapi import FastAPI
#    app = FastAPI(root_path="/api")
#    # arrancar con: uvicorn export_import_service:app --root-path /api ...

# 5. Integración en Frontend:
#    fetch(`http://<host>:8000/export/users?format=json`)
#    fetch(`http://<host>:8000/import/users?format=csv`, { method: 'POST', body: formData })
