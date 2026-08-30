import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Configuración de seguridad
SECRET_KEY = "A7PsmL3W1XGwVD"  # Reemplázala por una clave larga aleatoria
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Contexto para encriptar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema para extraer el Token del header Authorization: Bearer <TOKEN>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


# --- Funciones Utilitarias ---

def verificar_password(plain_password, hashed_password):
    """Compara la contraseña ingresada con el hash guardado"""
    return pwd_context.verify(plain_password, hashed_password)

def obtener_password_hash(password):
    """Genera el hash bcrypt de una contraseña"""
    return pwd_context.hash(password)

def crear_token_acceso(data: dict):
    """Genera un nuevo token JWT con tiempo de expiración"""
    to_encode = data.copy()
    expiracion = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expiracion})
    token_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt


# --- Dependencia para proteger rutas ---

def verificar_token(token: str = Depends(oauth2_scheme)):
    """Validación que se ejecutará en cada endpoint protegido"""
    exception_unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario: str = payload.get("sub")
        if usuario is None:
            raise exception_unauthorized
        return usuario
    except JWTError:
        raise exception_unauthorized