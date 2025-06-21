# -*- coding: utf-8 -*-
import configparser
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Ruta del script
CONFIG_PATH = os.path.join(BASE_DIR, 'config.ini')

config = configparser.ConfigParser()
config.read(CONFIG_PATH)

# Obtener ruta del INI o usar "intelia.db", y convertirla a ruta absoluta
raw_db_path = config.get('DEFAULT', 'DB_PATH', fallback='intelia.db')
DB_PATH = raw_db_path if os.path.isabs(raw_db_path) else os.path.join(BASE_DIR, raw_db_path)

# Para depuración
print(f"[INFO] Usando base de datos en: {DB_PATH}")
