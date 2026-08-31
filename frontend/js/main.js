// Base de la API en Render (sin barra al final)
const API_URL = 'https://radio-backend-08we.onrender.com';

async function cargarEmisora() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Carga de audio
        const audio = document.getElementById('audio-player');
        if (audio && data.stream_url) {
            audio.src = data.stream_url;
        }

        // Carga de datos de la radio
        const elNombre = document.getElementById('radio-nombre');
        const elEslogan = document.getElementById('radio-eslogan');
        
        if (elNombre) elNombre.textContent = `${data.nombre || ''} ${data.frecuencia || ''}`;
        if (elEslogan) elEslogan.textContent = data.eslogan || '';

        // Botones de redes sociales
        const btnWa = document.getElementById('btn-whatsapp');
        const btnYt = document.getElementById('btn-youtube');
        const btnFb = document.getElementById('btn-facebook');

        if (btnWa && data.whatsapp) btnWa.href = `https://wa.me/${data.whatsapp}`;
        if (btnYt && data.youtube) btnYt.href = `${data.youtube}`;
        if (btnFb && data.facebook) btnFb.href = data.facebook;

        // Control del estado ON AIR / OFF AIR
        const liveIndicator = document.getElementById('live-indicator');

        if (audio && liveIndicator) {
            audio.addEventListener('play', () => {
                liveIndicator.textContent = '● EN VIVO';
                liveIndicator.classList.remove('bg-danger', 'bg-secondary', 'badge-off');
                liveIndicator.classList.add('bg-success');
                liveIndicator.classList.replace('opacity-50', 'opacity-100');
            });

            audio.addEventListener('pause', () => {
                liveIndicator.textContent = '● OFF AIR';
                liveIndicator.classList.remove('bg-success');
                liveIndicator.classList.add('bg-danger');
                liveIndicator.classList.replace('opacity-100', 'opacity-50');
            });
        }

    } catch (error) {
        console.error("Error al cargar la emisora:", error);
    }
}

async function cargarNovedadesPublicas() {
    try {
        // Concatenación dinámica con la URL de Render
        const response = await fetch(`${API_URL}/api/novedades`);
        if (!response.ok) throw new Error('Error al obtener noticias');

        const novedades = await response.json();
        const contenedor = document.getElementById('contenedor-novedades');
        
        if (!contenedor) return;
        contenedor.innerHTML = '';

        novedades.forEach(nov => {
            contenedor.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="card bg-dark text-white h-100 border-secondary">
                        <div class="card-body">
                            <h5 class="card-title text-primary">${nov.titulo}</h5>
                            <h6 class="card-subtitle mb-2 text-secondary">${nov.fecha || ''}</h6>
                            <p class="card-text">${nov.contenido}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error al cargar novedades:', error);
    }
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarEmisora();
    cargarNovedadesPublicas();
});
