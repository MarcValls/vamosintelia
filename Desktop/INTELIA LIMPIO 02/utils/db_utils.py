import os

# Centraliza la ruta de la base de datos para todos los controladores
def get_db_path():
    # Si la base está en 'data/', cambiar aquí
    return os.path.join("data", "INTELIA.db")