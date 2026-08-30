# Importamos FastAPI y las herramientas necesarias para dependencias y excepciones
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import auth

# Importamos el middleware para permitir peticiones desde el frontend (CORS)
from fastapi.middleware.cors import CORSMiddleware

# Importamos la clase Session para interactuar con SQLAlchemy
from sqlalchemy.orm import Session

# Importamos Pydantic para validar los datos que llegan en las peticiones HTTP
from pydantic import BaseModel

# Importamos las configuraciones locales de base de datos y modelos
import models
from database import engine, SessionLocal, get_db

# Crea las tablas en radio.db si no existen al iniciar la aplicación
models.Base.metadata.create_all(bind=engine)

# Bloque de inicialización: Asegura que la emisora tenga al menos un registro inicial en la BD
db = SessionLocal()
if not db.query(models.EmisoraModel).first():
    emisora_inicial = models.EmisoraModel(
        nombre="La Pelota No Se Mancha",
        frecuencia="96.5 FM",
        eslogan="Música las 24 horas",
        stream_url="http://subituradio.com:8042/;",
        whatsapp="+543437000000",
        youtube="https://youtube.com/@lapelotanosemancha7736?si=mEQ2OZIYlKcHispX",
        facebook="https://facebook.com/lapelotanosemancha"
    )
    db.add(emisora_inicial)
    db.commit()
db.close()

# Instancia principal de la aplicación FastAPI
app = FastAPI(title="Radio La Pelota No Se Mancha API")

# Habilitamos CORS para que el cliente HTML/JS pueda hacer peticiones al servidor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# SEGURIDAD Y AUTENTICACIÓN
# ---------------------------------------------------------------------------

ADMIN_USER = "admin"
ADMIN_PASSWORD_HASH = auth.obtener_password_hash("A7PsmL3W1XGwVD")


@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint de autenticación que retorna el token JWT"""
    if form_data.username != ADMIN_USER or not auth.verificar_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.crear_token_acceso(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# ESQUEMAS PYDANTIC (Validación de entrada)
# ---------------------------------------------------------------------------

class EmisoraUpdate(BaseModel):
    nombre: str
    frecuencia: str
    eslogan: str
    stream_url: str
    whatsapp: str
    youtube: str
    facebook: str

class NovedadCreate(BaseModel):
    titulo: str
    contenido: str
    fecha: str

# ---------------------------------------------------------------------------
# ENDPOINTS PÚBLICOS (Lectura / GET)
# ---------------------------------------------------------------------------

@app.get("/api/emisora")
def obtener_emisora(db: Session = Depends(get_db)):
    """Retorna los datos de la emisora. Disponible para todo el público."""
    return db.query(models.EmisoraModel).first()

@app.get("/api/novedades")
def obtener_novedades(db: Session = Depends(get_db)):
    """Retorna la lista de novedades. Disponible para todo el público."""
    return db.query(models.NovedadModel).all()

# ---------------------------------------------------------------------------
# ENDPOINTS PROTEGIDOS (Escritura / PUT, POST, DELETE)
# Requieren enviar el Header: 'Authorization: Bearer <TOKEN>'
# ---------------------------------------------------------------------------

@app.put("/api/emisora", dependencies=[Depends(auth.verificar_token)])
def actualizar_emisora(datos: EmisoraUpdate, db: Session = Depends(get_db)):
    """Actualiza la información de la radio. Requiere Token JWT de administrador."""
    emisora = db.query(models.EmisoraModel).first()
    if not emisora:
        raise HTTPException(status_code=404, detail="Emisora no encontrada")

    emisora.nombre = datos.nombre
    emisora.frecuencia = datos.frecuencia
    emisora.eslogan = datos.eslogan
    emisora.stream_url = datos.stream_url
    emisora.whatsapp = datos.whatsapp
    emisora.youtube = datos.youtube
    emisora.facebook = datos.facebook

    db.commit()
    db.refresh(emisora)
    return {"mensaje": "Datos actualizados correctamente", "emisora": emisora}

@app.post("/api/novedades", dependencies=[Depends(auth.verificar_token)])
def crear_novedad(novedad: NovedadCreate, db: Session = Depends(get_db)):
    """Crea una nueva novedad en la BD. Requiere Token JWT de administrador."""
    nueva_novedad = models.NovedadModel(
        titulo=novedad.titulo,
        contenido=novedad.contenido,
        fecha=novedad.fecha
    )
    db.add(nueva_novedad)
    db.commit()
    db.refresh(nueva_novedad)
    return {"mensaje": "Novedad publicada", "novedad": nueva_novedad}

@app.delete("/api/novedades/{novedad_id}", dependencies=[Depends(auth.verificar_token)])
def eliminar_novedad(novedad_id: int, db: Session = Depends(get_db)):
    """Elimina una novedad por su ID. Requiere Token JWT de administrador."""
    novedad = db.query(models.NovedadModel).filter(models.NovedadModel.id == novedad_id).first()
    if not novedad:
        raise HTTPException(status_code=404, detail="Novedad no encontrada")
    
    db.delete(novedad)
    db.commit()
    return {"mensaje": "Novedad eliminada correctamente"}