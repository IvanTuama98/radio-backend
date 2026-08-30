# Importamos los tipos de columnas que utilizaremos en la base de datos
from sqlalchemy import Column, Integer, String, Text
# Importamos la clase Base creada en database.py para heredar de ella
from database import Base

# Definimos el modelo ORM para la tabla de la Emisora
class EmisoraModel(Base):
    __tablename__ = "emisora"  # Nombre exacto de la tabla dentro de SQLite

    # Identificador único autoincremental de la emisora (Clave primaria)
    id = Column(Integer, primary_key=True, index=True)
    
    # Atributos de la radio con sus valores por defecto si no se ingresa nada
    nombre = Column(String, default="La Pelota No Se Mancha")
    frecuencia = Column(String, default="96.5 FM")
    eslogan = Column(String, default="Música las 24 horas")
    stream_url = Column(String, default="http://subituradio.com:8042/;")
    whatsapp = Column(String, default="+543437000000")
    youtube = Column(String, default="https://youtube.com/@lapelotanosemancha7736?si=mEQ2OZIYlKcHispX")
    facebook = Column(String, default="https://facebook.com/lapelotanosemancha")

# Definimos el modelo ORM para la tabla de Novedades/Noticias
class NovedadModel(Base):
    __tablename__ = "novedades"  # Nombre de la tabla en la BD

    id = Column(Integer, primary_key=True, index=True) # ID único
    titulo = Column(String, index=True)               # Título del aviso
    contenido = Column(Text)                           # Texto completo del aviso
    fecha = Column(String)                             # Fecha de publicación