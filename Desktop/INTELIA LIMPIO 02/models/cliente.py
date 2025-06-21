from . import db


class Cliente(db.Model):
    __tablename__ = "clientes"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(50))
    email = db.Column(db.String(255))

    def __repr__(self):
        return f"<Cliente {self.nombre}>"
