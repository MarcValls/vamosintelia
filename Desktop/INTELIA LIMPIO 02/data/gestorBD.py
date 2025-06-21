import sqlite3
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import os
import csv
import re
import shutil
import datetime
from collections import deque

SNIPPETS = [
    ("Crear tabla de roles",
     "CREATE TABLE IF NOT EXISTS roles (\n"
     "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n"
     "  nombre TEXT UNIQUE NOT NULL,\n"
     "  descripcion TEXT\n);"),
    ("Añadir campo dirección a clientes",
     "ALTER TABLE clientes ADD COLUMN direccion TEXT;"),
    ("Insertar rol admin",
     "INSERT INTO roles (nombre, descripcion) VALUES ('admin', 'Acceso total');"),
    ("Alta usuario ejemplo",
     "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES ('Admin','admin@intelia.local','<hash>','admin');"),
    ("Ver usuarios",
     "SELECT * FROM usuarios;"),
    ("Crear tabla logs",
     "CREATE TABLE IF NOT EXISTS logs (\n"
     "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n"
     "  usuario_id INTEGER,\n"
     "  accion TEXT,\n"
     "  descripcion TEXT,\n"
     "  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,\n"
     "  ip TEXT\n);")
]

def validar_email(email):
    return not email or re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validar_permiso(perm):
    return not perm or re.match(r"[a-zA-Z0-9_:]+", perm)

def validar_fecha(fecha):
    try:
        datetime.datetime.strptime(fecha, "%Y-%m-%d")
        return True
    except Exception:
        return not fecha  # vacío se acepta

class ScriptLog:
    def __init__(self, dbpath):
        self.dbpath = dbpath

    def log(self, script, ejecutado_por):
        with sqlite3.connect(self.dbpath) as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS scripts_log (id INTEGER PRIMARY KEY AUTOINCREMENT, script TEXT, ejecutado_por TEXT, fecha DATETIME DEFAULT CURRENT_TIMESTAMP)"
            )
            conn.execute(
                "INSERT INTO scripts_log (script, ejecutado_por) VALUES (?, ?)",
                (script, ejecutado_por)
            )
            conn.commit()

    def obtener_logs(self):
        with sqlite3.connect(self.dbpath) as conn:
            cur = conn.execute("SELECT fecha, ejecutado_por, substr(script,1,60)||'...' FROM scripts_log ORDER BY fecha DESC")
            return cur.fetchall()

    def exportar_html(self, path):
        logs = self.obtener_logs()
        with open(path, "w", encoding="utf8") as f:
            f.write("<html><head><title>Historial de scripts INTELIA</title></head><body><h1>Scripts ejecutados</h1><table border=1>")
            f.write("<tr><th>Fecha</th><th>Usuario</th><th>Script</th></tr>")
            for row in logs:
                f.write("<tr><td>{}</td><td>{}</td><td><pre>{}</pre></td></tr>".format(*row))
            f.write("</table></body></html>")

class InteliaDBExplorer(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("INTELIA DB Explorer Pro")
        self.geometry("1200x780")
        self.db_path = None
        self.conn = None
        self.script_log = None
        self.user = os.getlogin() if hasattr(os, "getlogin") else "usuario"
        self.solo_lectura = tk.BooleanVar(value=False)
        self.open_connections = deque(maxlen=3)  # permite 3 BDs abiertas simultáneamente
        self._init_ui()

    def _init_ui(self):
        frame_top = tk.Frame(self)
        frame_top.pack(fill="x", padx=10, pady=6)
        tk.Button(frame_top, text="Abrir BD...", command=self.open_db).pack(side="left")
        tk.Button(frame_top, text="Exportar tabla a CSV", command=self.export_csv).pack(side="left", padx=8)
        tk.Button(frame_top, text="Gestión Estructura", command=self.struct_manager).pack(side="left", padx=8)
        tk.Button(frame_top, text="Ejecutar script SQL", command=self.run_sql_script).pack(side="left", padx=8)
        tk.Button(frame_top, text="SQL avanzado", command=self.sql_editor).pack(side="left", padx=8)
        tk.Checkbutton(frame_top, text="Solo lectura", variable=self.solo_lectura).pack(side="left", padx=8)
        tk.Button(frame_top, text="Historial scripts", command=self.ver_historial_scripts).pack(side="left", padx=8)
        tk.Button(frame_top, text="Informe HTML", command=self.informe_html).pack(side="left", padx=8)
        tk.Label(frame_top, text="Tabla:").pack(side="left", padx=8)
        self.cmb_tablas = ttk.Combobox(frame_top, state="readonly", width=28)
        self.cmb_tablas.pack(side="left")
        self.cmb_tablas.bind("<<ComboboxSelected>>", lambda e: self.load_table())
        self.lbl_status = tk.Label(frame_top, text="", anchor="w", fg="#2986cc")
        self.lbl_status.pack(side="right", fill="x", expand=True)

        # Treeview (tabla)
        self.tree = ttk.Treeview(self, show="headings")
        self.tree.pack(fill="both", expand=True, padx=10, pady=(0,8))
        self.tree.bind("<Double-1>", self.edit_cell)

        # CRUD buttons
        frame_btns = tk.Frame(self)
        frame_btns.pack(fill="x", padx=10, pady=(0,6))
        tk.Button(frame_btns, text="Añadir fila", command=self.add_row).pack(side="left")
        tk.Button(frame_btns, text="Eliminar fila", command=self.delete_row).pack(side="left", padx=8)
        self.txt_sql = tk.Entry(frame_btns, width=50)
        self.txt_sql.pack(side="left", padx=10)
        tk.Button(frame_btns, text="Ejecutar SQL", command=self.run_sql).pack(side="left")
        tk.Label(frame_btns, text="| Plantillas:").pack(side="left", padx=5)
        self.cmb_snippets = ttk.Combobox(frame_btns, values=[t[0] for t in SNIPPETS], state="readonly", width=24)
        self.cmb_snippets.pack(side="left")
        tk.Button(frame_btns, text="Pegar plantilla", command=self.pegar_snippet).pack(side="left", padx=5)
        
    def open_db(self):
        f = filedialog.askopenfilename(filetypes=[("SQLite DB", "*.db")])
        if f:
            try:
                conn = sqlite3.connect(f)
                self.open_connections.append((f, conn))
                self.conn = conn
                self.db_path = f
                self.script_log = ScriptLog(f)
                self.update_tables()
                self.lbl_status.config(text=f"BD cargada: {os.path.basename(f)}")
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def update_tables(self):
        cur = self.conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tablas = [r[0] for r in cur.fetchall()]
        self.cmb_tablas['values'] = tablas
        if tablas:
            self.cmb_tablas.current(0)
            self.load_table()
        else:
            self.tree.delete(*self.tree.get_children())
            self.tree["columns"] = []

    def load_table(self):
        tabla = self.cmb_tablas.get()
        if not tabla: return
        cur = self.conn.cursor()
        cur.execute(f"PRAGMA table_info({tabla})")
        columnas = [row[1] for row in cur.fetchall()]
        self.tree.delete(*self.tree.get_children())
        self.tree["columns"] = columnas
        for col in columnas:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=140)
        cur.execute(f"SELECT * FROM {tabla}")
        for row in cur.fetchall():
            self.tree.insert("", "end", values=row)

    def add_row(self):
        if self.solo_lectura.get():
            messagebox.showwarning("Solo lectura", "No se permite añadir en modo solo lectura.")
            return
        tabla = self.cmb_tablas.get()
        if not tabla: return
        cols = self.tree["columns"]
        vals = []
        for col in cols:
            v = simple_input(self, f"Valor para {col}:", "")
            if v is None:
                return
            # Validación contextual
            if "email" in col:
                if not validar_email(v):
                    messagebox.showerror("Error", f"Formato de email inválido en {col}")
                    return
            if "permiso" in col or "clave" in col:
                if not validar_permiso(v):
                    messagebox.showerror("Error", "Clave de permiso solo admite letras, números, guión bajo o dos puntos")
                    return
            if "fecha" in col:
                if not validar_fecha(v):
                    messagebox.showerror("Error", "Fecha no válida (YYYY-MM-DD)")
                    return
            vals.append(v)
        q = f"INSERT INTO {tabla} ({', '.join(cols)}) VALUES ({', '.join(['?']*len(cols))})"
        try:
            self.conn.execute(q, vals)
            self.conn.commit()
            self.load_table()
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def delete_row(self):
        if self.solo_lectura.get():
            messagebox.showwarning("Solo lectura", "No se permite eliminar en modo solo lectura.")
            return
        sel = self.tree.selection()
        if not sel: return
        tabla = self.cmb_tablas.get()
        if not tabla: return
        item = self.tree.item(sel[0])
        pk_val = item["values"][0]
        col_pk = self.tree["columns"][0]
        if messagebox.askyesno("Confirmar", f"¿Eliminar fila con {col_pk}={pk_val}?"):
            try:
                self.conn.execute(f"DELETE FROM {tabla} WHERE {col_pk}=?", (pk_val,))
                self.conn.commit()
                self.load_table()
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def edit_cell(self, event):
        if self.solo_lectura.get():
            return
        item_id = self.tree.focus()
        col = self.tree.identify_column(event.x)
        col_idx = int(col.replace("#",""))-1
        old = self.tree.item(item_id)["values"][col_idx]
        nuevo = simple_input(self, f"Nuevo valor para {self.tree['columns'][col_idx]}:", str(old))
        if nuevo is not None:
            col_name = self.tree["columns"][col_idx]
            if "email" in col_name:
                if not validar_email(nuevo):
                    messagebox.showerror("Error", f"Formato de email inválido en {col_name}")
                    return
            if "permiso" in col_name or "clave" in col_name:
                if not validar_permiso(nuevo):
                    messagebox.showerror("Error", "Clave de permiso solo admite letras, números, guión bajo o dos puntos")
                    return
            if "fecha" in col_name:
                if not validar_fecha(nuevo):
                    messagebox.showerror("Error", "Fecha no válida (YYYY-MM-DD)")
                    return
            tabla = self.cmb_tablas.get()
            pk_col = self.tree["columns"][0]
            pk_val = self.tree.item(item_id)["values"][0]
            try:
                self.conn.execute(f"UPDATE {tabla} SET {col_name}=? WHERE {pk_col}=?", (nuevo, pk_val))
                self.conn.commit()
                self.load_table()
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def run_sql(self):
        q = self.txt_sql.get().strip()
        if not q: return
        if self.solo_lectura.get() and not q.lower().startswith("select"):
            messagebox.showwarning("Solo lectura", "No puedes ejecutar cambios en modo solo lectura.")
            return
        try:
            cur = self.conn.cursor()
            cur.execute(q)
            if q.lower().startswith("select"):
                res = cur.fetchall()
                messagebox.showinfo("Resultado", f"{len(res)} filas")
            else:
                self.conn.commit()
                self.load_table()
        except Exception as e:
            messagebox.showerror("Error SQL", str(e))

    def export_csv(self):
        tabla = self.cmb_tablas.get()
        if not tabla: return
        cur = self.conn.cursor()
        cur.execute(f"SELECT * FROM {tabla}")
        rows = cur.fetchall()
        f = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV","*.csv")])
        if not f: return
        with open(f, "w", newline="", encoding="utf8") as csvfile:
            w = csv.writer(csvfile)
            w.writerow([d[0] for d in cur.description])
            w.writerows(rows)
        messagebox.showinfo("Exportación", f"Exportado a {f}")

    # ======= Estructura de tablas =======
    def struct_manager(self):
        top = tk.Toplevel(self)
        top.title("Gestión de estructura de tablas")
        top.geometry("650x380")
        tk.Label(top, text="Selecciona una tabla o crea una nueva:").pack(pady=5)
        cur = self.conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tablas = [r[0] for r in cur.fetchall()]
        tabla_var = tk.StringVar(value=tablas[0] if tablas else "")
        cmb = ttk.Combobox(top, values=tablas, textvariable=tabla_var, width=30, state="readonly")
        cmb.pack(pady=5)
        tk.Button(top, text="Nueva tabla", command=lambda: self.create_table_popup(top)).pack()
        frame_cols = tk.Frame(top)
        frame_cols.pack(pady=10)
        tk.Label(frame_cols, text="Columnas de tabla seleccionada:").pack(anchor="w")
        lst_cols = tk.Listbox(frame_cols, width=62, height=8)
        lst_cols.pack()
        def load_cols(*a):
            tabla = tabla_var.get()
            if not tabla: return
            cur.execute(f"PRAGMA table_info({tabla})")
            lst_cols.delete(0, "end")
            for row in cur.fetchall():
                lst_cols.insert("end", f"{row[1]} ({row[2]})")
        cmb.bind("<<ComboboxSelected>>", load_cols)
        load_cols()
        btns = tk.Frame(top); btns.pack(pady=8)
        tk.Button(btns, text="Añadir columna", command=lambda: self.add_column(tabla_var.get())).pack(side="left")
        tk.Button(btns, text="Eliminar columna", command=lambda: self.del_column(tabla_var.get(), lst_cols)).pack(side="left", padx=8)
        tk.Button(btns, text="Eliminar tabla", fg="red", command=lambda: self.del_table(tabla_var.get(), top)).pack(side="left", padx=12)
        tk.Button(btns, text="Cerrar", command=top.destroy).pack(side="right", padx=16)
    
    def create_table_popup(self, parent):
        def crear():
            tname = ent_nombre.get().strip()
            if not tname: return
            cols = txt_cols.get("1.0","end").strip().splitlines()
            if not cols: return
            sql_cols = ", ".join(cols)
            try:
                self.conn.execute(f"CREATE TABLE {tname} ({sql_cols});")
                self.conn.commit()
                messagebox.showinfo("Éxito", f"Tabla {tname} creada.")
                parent.destroy()
                self.update_tables()
            except Exception as e:
                messagebox.showerror("Error", str(e))
        popup = tk.Toplevel(parent)
        popup.title("Crear nueva tabla")
        tk.Label(popup, text="Nombre de la tabla:").pack()
        ent_nombre = tk.Entry(popup); ent_nombre.pack()
        tk.Label(popup, text="Columnas (una por línea, ej: id INTEGER PRIMARY KEY):").pack()
        txt_cols = tk.Text(popup, height=6, width=42); txt_cols.pack()
        btn = tk.Button(popup, text="Crear tabla", command=crear); btn.pack(pady=6)

    def add_column(self, tabla):
        if not tabla: return
        nombre = simple_input(self, "Nombre de la nueva columna:", "")
        tipo = simple_input(self, "Tipo de dato (ej: TEXT, INTEGER):", "TEXT")
        if not nombre or not tipo: return
        try:
            self.conn.execute(f"ALTER TABLE {tabla} ADD COLUMN {nombre} {tipo};")
            self.conn.commit()
            messagebox.showinfo("Columna añadida", f"Columna {nombre} añadida a {tabla}.")
            self.load_table()
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def del_column(self, tabla, lst_cols):
        if not tabla or not lst_cols.curselection(): return
        col_info = lst_cols.get(lst_cols.curselection()[0])
        col_name = col_info.split(" ")[0]
        if messagebox.askyesno("Atención", f"¿Eliminar columna '{col_name}'? (crea tabla nueva sin esa columna)"):
            try:
                cur = self.conn.cursor()
                cur.execute(f"PRAGMA table_info({tabla})")
                cols = [(r[1], r[2]) for r in cur.fetchall() if r[1]!=col_name]
                newcols_sql = ", ".join([f"{c[0]} {c[1]}" for c in cols])
                tmp = f"{tabla}_tmp"
                self.conn.execute(f"CREATE TABLE {tmp} ({newcols_sql});")
                keep_cols = ", ".join([c[0] for c in cols])
                self.conn.execute(f"INSERT INTO {tmp} ({keep_cols}) SELECT {keep_cols} FROM {tabla};")
                self.conn.execute(f"DROP TABLE {tabla};")
                self.conn.execute(f"ALTER TABLE {tmp} RENAME TO {tabla};")
                self.conn.commit()
                messagebox.showinfo("Columna eliminada", f"Columna {col_name} eliminada de {tabla}.")
                self.load_table()
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def del_table(self, tabla, win):
        if not tabla: return
        if messagebox.askyesno("Eliminar tabla", f"¿Seguro que deseas eliminar la tabla '{tabla}'?"):
            try:
                self.conn.execute(f"DROP TABLE {tabla};")
                self.conn.commit()
                win.destroy()
                self.update_tables()
            except Exception as e:
                messagebox.showerror("Error", str(e))

    # === Script SQL avanzado con previsualización, backup y validación ===
    def run_sql_script(self):
        f = filedialog.askopenfilename(filetypes=[("SQL Scripts", "*.sql"), ("Todos", "*.*")])
        if not f: return
        with open(f, "r", encoding="utf8") as file:
            script = file.read()
        self._script_dialog(script)

    def sql_editor(self):
        top = tk.Toplevel(self)
        top.title("Editor SQL avanzado")
        top.geometry("760x410")
        txt = tk.Text(top, font=("Consolas", 11))
        txt.pack(fill="both", expand=True, padx=8, pady=8)
        def ejecutar():
            script = txt.get("1.0", "end").strip()
            self._script_dialog(script)
        tk.Button(top, text="Ejecutar", command=ejecutar).pack(pady=6)
        tk.Button(top, text="Cerrar", command=top.destroy).pack()

    def _script_dialog(self, script):
        # Previsualización y advertencia si hay comandos peligrosos
        preview = "\n".join(line for line in script.splitlines() if line.strip())
        resumen = ""
        peligro = False
        if re.search(r"\b(DROP|ALTER|DELETE)\b", script, re.IGNORECASE):
            peligro = True
            resumen += "⚠️ Este script contiene comandos peligrosos (DROP/ALTER/DELETE).\n"
        if "CREATE TABLE" in script:
            resumen += "Crea nuevas tablas.\n"
        if "ALTER TABLE" in script:
            resumen += "Modifica estructura de tablas.\n"
        if "INSERT" in script:
            resumen += "Inserta datos.\n"
        if "UPDATE" in script:
            resumen += "Actualiza registros.\n"
        msg = f"Resumen de operaciones detectadas:\n{resumen}\n"
        if peligro:
            msg += "\n¿Deseas hacer una copia de seguridad antes de ejecutar?\n"
        msg += f"\nFragmento a ejecutar (primeras 25 líneas):\n{'-'*40}\n" + "\n".join(preview.splitlines()[:25])
        if messagebox.askyesno("Confirmar ejecución", msg):
            if peligro and self.db_path:
                bck = self.db_path + ".bak_" + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
                shutil.copy2(self.db_path, bck)
                messagebox.showinfo("Backup realizado", f"Backup en {bck}")
            try:
                self.conn.executescript(script)
                self.conn.commit()
                self.load_table()
                self.script_log.log(script, self.user)
                messagebox.showinfo("Éxito", "Script ejecutado y registrado.")
            except Exception as e:
                messagebox.showerror("Error SQL", str(e))

    def pegar_snippet(self):
        idx = self.cmb_snippets.current()
        if idx == -1: return
        self.txt_sql.delete(0, "end")
        self.txt_sql.insert(0, SNIPPETS[idx][1])

    def ver_historial_scripts(self):
        if not self.script_log: return
        logs = self.script_log.obtener_logs()
        win = tk.Toplevel(self)
        win.title("Historial de scripts ejecutados")
        win.geometry("890x400")
        tree = ttk.Treeview(win, columns=("fecha", "usuario", "script"), show="headings")
        tree.heading("fecha", text="Fecha")
        tree.heading("usuario", text="Usuario")
        tree.heading("script", text="Script")
        tree.pack(fill="both", expand=True)
        for row in logs:
            tree.insert("", "end", values=row)
        tk.Button(win, text="Cerrar", command=win.destroy).pack(pady=6)

    def informe_html(self):
        if not self.script_log: return
        f = filedialog.asksaveasfilename(defaultextension=".html", filetypes=[("HTML","*.html")])
        if not f: return
        self.script_log.exportar_html(f)
        messagebox.showinfo("Informe", f"Informe HTML generado en:\n{f}")

def simple_input(parent, prompt, initial):
    top = tk.Toplevel(parent)
    top.title(prompt)
    top.geometry("350x100")
    top.grab_set()
    tk.Label(top, text=prompt).pack(pady=6)
    var = tk.StringVar(value=initial)
    ent = tk.Entry(top, textvariable=var)
    ent.pack()
    ent.focus()
    val = [None]
    def aceptar():
        val[0]=var.get()
        top.destroy()
    def cancelar():
        top.destroy()
    btns = tk.Frame(top); btns.pack(pady=5)
    tk.Button(btns, text="Aceptar", command=aceptar).pack(side="left", padx=4)
    tk.Button(btns, text="Cancelar", command=cancelar).pack(side="left", padx=4)
    top.wait_window()
    return val[0]

if __name__ == "__main__":
    app = InteliaDBExplorer()
    app.mainloop()
