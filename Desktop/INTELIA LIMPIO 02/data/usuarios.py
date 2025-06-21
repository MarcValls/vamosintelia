import sqlite3
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import hashlib

def cargar_usuarios(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, usuario, correo, email, password_hash, rol FROM usuarios")
        usuarios = cur.fetchall()
        conn.close()
        return usuarios
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo abrir la base de datos:\n{e}")
        return []

def seleccionar_db():
    file_path = filedialog.askopenfilename(title="Selecciona INTELIA.db", filetypes=[("SQLite DB","*.db")])
    if file_path:
        entry_db.delete(0, tk.END)
        entry_db.insert(0, file_path)
        actualizar_lista()

def actualizar_lista():
    for row in tree.get_children():
        tree.delete(row)
    db_path = entry_db.get()
    usuarios = cargar_usuarios(db_path)
    for u in usuarios:
        tree.insert("", "end", values=u)

def crear_usuario():
    db_path = entry_db.get()
    usuario = entry_usuario.get().strip()
    correo = entry_correo.get().strip()
    email = entry_email.get().strip()
    rol = entry_rol.get().strip()
    clave = entry_clave.get().strip()
    if not (usuario and correo and email and rol and clave):
        messagebox.showwarning("Faltan datos", "Completa todos los campos")
        return

    clave_hash = hashlib.sha256(clave.encode()).hexdigest()
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO usuarios (usuario, correo, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)",
            (usuario, correo, email, clave_hash, rol)
        )
        conn.commit()
        conn.close()
        actualizar_lista()
        messagebox.showinfo("OK", "Usuario creado correctamente")
        limpiar_campos()
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo crear el usuario:\n{e}")

def limpiar_campos():
    entry_id.config(state='normal')
    entry_id.delete(0, tk.END)
    entry_id.config(state='readonly')
    entry_usuario.delete(0, tk.END)
    entry_correo.delete(0, tk.END)
    entry_email.delete(0, tk.END)
    entry_rol.delete(0, tk.END)
    entry_clave.delete(0, tk.END)

def al_seleccionar_usuario(event):
    item = tree.selection()
    if item:
        vals = tree.item(item[0], 'values')
        entry_id.config(state='normal')
        entry_id.delete(0, tk.END)
        entry_id.insert(0, vals[0])
        entry_id.config(state='readonly')
        entry_usuario.delete(0, tk.END)
        entry_usuario.insert(0, vals[1])
        entry_correo.delete(0, tk.END)
        entry_correo.insert(0, vals[2])
        entry_email.delete(0, tk.END)
        entry_email.insert(0, vals[3])
        entry_rol.delete(0, tk.END)
        entry_rol.insert(0, vals[5])
        entry_clave.delete(0, tk.END)

def editar_usuario():
    db_path = entry_db.get()
    entry_id.config(state='normal')
    id_usuario = entry_id.get().strip()
    entry_id.config(state='readonly')
    usuario = entry_usuario.get().strip()
    correo = entry_correo.get().strip()
    email = entry_email.get().strip()
    rol = entry_rol.get().strip()
    clave = entry_clave.get().strip()

    if not id_usuario:
        messagebox.showwarning("Selecciona usuario", "Selecciona un usuario para editar.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        if clave:
            clave_hash = hashlib.sha256(clave.encode()).hexdigest()
            cur.execute(
                "UPDATE usuarios SET usuario=?, correo=?, email=?, password_hash=?, rol=? WHERE id=?",
                (usuario, correo, email, clave_hash, rol, id_usuario)
            )
        else:
            cur.execute(
                "UPDATE usuarios SET usuario=?, correo=?, email=?, rol=? WHERE id=?",
                (usuario, correo, email, rol, id_usuario)
            )
        conn.commit()
        conn.close()
        actualizar_lista()
        messagebox.showinfo("OK", "Usuario actualizado correctamente")
        limpiar_campos()
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo editar el usuario:\n{e}")

def borrar_usuario():
    db_path = entry_db.get()
    entry_id.config(state='normal')
    id_usuario = entry_id.get().strip()
    entry_id.config(state='readonly')
    if not id_usuario:
        messagebox.showwarning("Selecciona usuario", "Selecciona un usuario para eliminar.")
        return

    resp = messagebox.askyesno("Confirmar", "¿Seguro que deseas borrar este usuario?")
    if not resp:
        return
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("DELETE FROM usuarios WHERE id=?", (id_usuario,))
        conn.commit()
        conn.close()
        actualizar_lista()
        messagebox.showinfo("OK", "Usuario eliminado.")
        limpiar_campos()
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo borrar el usuario:\n{e}")

root = tk.Tk()
root.title("Gestión completa de usuarios INTELIA.db")
root.geometry("1020x530")

frame = ttk.Frame(root)
frame.pack(fill="x", padx=10, pady=7)

tk.Label(frame, text="Base de datos:").pack(side="left")
entry_db = tk.Entry(frame, width=60)
entry_db.pack(side="left", padx=5)
btn_db = tk.Button(frame, text="Seleccionar...", command=seleccionar_db)
btn_db.pack(side="left", padx=5)
btn_refresh = tk.Button(frame, text="Actualizar", command=actualizar_lista)
btn_refresh.pack(side="left")

cols = ("ID", "Usuario", "Correo", "Email", "Hash", "Rol")
tree = ttk.Treeview(root, columns=cols, show="headings", selectmode="browse")
for c in cols:
    tree.heading(c, text=c)
    tree.column(c, width=140 if c not in ("Hash",) else 320)
tree.pack(fill="both", expand=True, padx=10, pady=7)
tree.bind('<<TreeviewSelect>>', al_seleccionar_usuario)

frame2 = ttk.Frame(root)
frame2.pack(fill="x", padx=10, pady=7)

tk.Label(frame2, text="ID:").grid(row=0, column=0)
entry_id = tk.Entry(frame2, width=5, state='readonly')
entry_id.grid(row=0, column=1, padx=3)

tk.Label(frame2, text="Usuario:").grid(row=0, column=2)
entry_usuario = tk.Entry(frame2, width=15)
entry_usuario.grid(row=0, column=3, padx=3)

tk.Label(frame2, text="Correo:").grid(row=0, column=4)
entry_correo = tk.Entry(frame2, width=22)
entry_correo.grid(row=0, column=5, padx=3)

tk.Label(frame2, text="Email:").grid(row=0, column=6)
entry_email = tk.Entry(frame2, width=22)
entry_email.grid(row=0, column=7, padx=3)

tk.Label(frame2, text="Rol:").grid(row=0, column=8)
entry_rol = tk.Entry(frame2, width=10)
entry_rol.grid(row=0, column=9, padx=3)

tk.Label(frame2, text="Clave (nueva):").grid(row=0, column=10)
entry_clave = tk.Entry(frame2, width=15, show="*")
entry_clave.grid(row=0, column=11, padx=3)

btn_add = tk.Button(frame2, text="Crear usuario", command=crear_usuario)
btn_add.grid(row=0, column=12, padx=8)
btn_edit = tk.Button(frame2, text="Editar usuario", command=editar_usuario)
btn_edit.grid(row=0, column=13, padx=4)
btn_del = tk.Button(frame2, text="Borrar usuario", command=borrar_usuario)
btn_del.grid(row=0, column=14, padx=4)

root.mainloop()
