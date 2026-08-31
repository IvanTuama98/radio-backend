const API_URL = "https://radio-backend-08we.onrender.com/";

// --- UTILIDADES DE INTERFAZ ---

function mostrarAlerta(mensaje, tipo) {
    const alerta = document.getElementById('alerta');
    if (!alerta) return;
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensaje;
    alerta.classList.remove('d-none');
    
    setTimeout(() => {
        alerta.classList.add('d-none');
    }, 4000);
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// Controla la visibilidad del panel privado con la clase d-none
function verificarSesionUI() {
    const token = localStorage.getItem('admin_token');
    const panelPrivado = document.getElementById('panel-privado');

    if (!panelPrivado) return;

    if (token) {
        panelPrivado.classList.remove('d-none');
    } else {
        panelPrivado.classList.add('d-none');
    }
}

// --- AUTENTICACIÓN (LOGIN & LOGOUT) ---

document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = getInputValue('login-usuario');
    const password = getInputValue('login-password');

    // Preparar el cuerpo como form-urlencoded (estándar OAuth2)
    const formData = new URLSearchParams();
    formData.append('username', usuario);
    formData.append('password', password);

    try {
        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('admin_token', data.access_token);
            mostrarAlerta('¡Sesión iniciada correctamente!', 'success');
            setInputValue('login-password', '');
            
            verificarSesionUI();
            cargarDatos();
            cargarNovedades();
        } else {
            mostrarAlerta('Usuario o contraseña incorrectos', 'danger');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        mostrarAlerta('Error al conectar con el servidor', 'danger');
    }
});

function cerrarSesion() {
    localStorage.removeItem('admin_token');
    mostrarAlerta('Sesión cerrada correctamente', 'info');
    verificarSesionUI();
}


// --- GESTIÓN DE CONFIGURACIÓN DE LA RADIO ---

async function cargarDatos() {
    try {
        const res = await fetch(`${API_URL}/info`);
        if (res.ok) {
            const data = await res.json();
            setInputValue('nombre', data.nombre);
            setInputValue('frecuencia', data.frecuencia);
            setInputValue('eslogan', data.eslogan);
            setInputValue('stream_url', data.stream_url);
            setInputValue('whatsapp', data.whatsapp);
            setInputValue('facebook', data.facebook);
            setInputValue('youtube', data.youtube);
        }
    } catch (e) {
        console.error("Error al cargar la información de la radio:", e);
    }
}

document.getElementById('form-admin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    if (!token) {
        mostrarAlerta('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
        verificarSesionUI();
        return;
    }

    const payload = {
        nombre: getInputValue('nombre'),
        frecuencia: getInputValue('frecuencia'),
        eslogan: getInputValue('eslogan'),
        stream_url: getInputValue('stream_url'),
        whatsapp: getInputValue('whatsapp'),
        facebook: getInputValue('facebook'),
        youtube: getInputValue('youtube')
    };

    try {
        const res = await fetch(`${API_URL}/admin/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            mostrarAlerta('¡Configuración de la radio actualizada!', 'success');
        } else if (res.status === 401) {
            mostrarAlerta('Sesión inválida o expirada', 'danger');
            cerrarSesion();
        } else {
            mostrarAlerta('Error al guardar los cambios', 'danger');
        }
    } catch (e) {
        mostrarAlerta('Error al conectar con el servidor', 'danger');
    }
});


// --- GESTIÓN DE NOVEDADES ---

async function cargarNovedades() {
    try {
        const res = await fetch(`${API_URL}/novedades`);
        if (res.ok) {
            const novedades = await res.json();
            const lista = document.getElementById('lista-novedades');
            if (!lista) return;

            lista.innerHTML = '';
            novedades.forEach(nov => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <div>
                        <strong>${nov.titulo}</strong> (${nov.fecha})
                        <p class="mb-0 text-muted small">${nov.contenido}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarNovedad(${nov.id})">Eliminar</button>
                `;
                lista.appendChild(li);
            });
        }
    } catch (e) {
        console.error("Error al cargar las novedades:", e);
    }
}

document.getElementById('form-novedad')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    if (!token) {
        mostrarAlerta('Inicia sesión para publicar novedades', 'warning');
        verificarSesionUI();
        return;
    }

    const payload = {
        titulo: getInputValue('nov-titulo'),
        contenido: getInputValue('nov-contenido'),
        fecha: getInputValue('nov-fecha')
    };

    try {
        const res = await fetch(`${API_URL}/admin/novedades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            mostrarAlerta('¡Novedad publicada con éxito!', 'success');
            setInputValue('nov-titulo', '');
            setInputValue('nov-contenido', '');
            setInputValue('nov-fecha', '');
            cargarNovedades();
        } else if (res.status === 401) {
            mostrarAlerta('Sesión expirada', 'danger');
            cerrarSesion();
        } else {
            mostrarAlerta('Error al guardar la novedad', 'danger');
        }
    } catch (e) {
        mostrarAlerta('Error al conectar con el servidor', 'danger');
    }
});

async function eliminarNovedad(id) {
    const token = localStorage.getItem('admin_token');

    if (!token) {
        mostrarAlerta('Inicia sesión para eliminar elementos', 'warning');
        verificarSesionUI();
        return;
    }

    if (!confirm('¿Estás seguro de que deseas borrar esta novedad?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/novedades/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            mostrarAlerta('Novedad eliminada', 'info');
            cargarNovedades();
        } else if (res.status === 401) {
            mostrarAlerta('Sesión expirada', 'danger');
            cerrarSesion();
        } else {
            mostrarAlerta('No se pudo borrar la novedad', 'danger');
        }
    } catch (e) {
        mostrarAlerta('Error al conectar con el servidor', 'danger');
    }
}

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    cargarNovedades();
    verificarSesionUI();
});
