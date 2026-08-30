# Importamos create_engine para conectar Python con la Base de Datos
from sqlalchemy import create_engine
# Importamos declarative_base para definir las clases que representarán las tablas
from sqlalchemy.orm import declarative_base, sessionmaker

# Definimos la ubicación y el tipo de base de datos (SQLite guardado en el archivo local 'radio.db')
SQLALCHEMY_DATABASE_URL = "sqlite:///./radio.db"

# Creación del motor de la base de datos
# 'check_same_thread: False' permite que múltiples peticiones HTTP interactúen con la BD SQLite de forma simultánea
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Fábrica de sesiones: creamos la clase SessionLocal para interactuar con la BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredarán todos nuestros modelos de datos (tablas)
Base = declarative_base()

# Función generadora para gestionar el ciclo de vida de la sesión con la BD en cada petición
def get_db():
    db = SessionLocal()  # Abre una conexión con la base de datos
    try:
        yield db         # Entrega la sesión activa a la ruta que la solicitó
    finally:
        db.close()       # Cierra la conexión al finalizar la petición para evitar fugas de memoria