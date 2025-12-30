/**
 * LÓGICA DE PERFIL DE USUARIO
 */

document.addEventListener('DOMContentLoaded', () => {
    cargarPreferencias();

    const form = document.getElementById('form-perfil');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarPreferencias();
        });
    }
});

function guardarPreferencias() {
    const nombre = document.getElementById('pref-nombre').value;
    const genero = document.getElementById('pref-genero').value;
    const talla = document.getElementById('pref-talla').value;
    const estiloRadio = document.querySelector('input[name="pref-estilo"]:checked');
    const estilo = estiloRadio ? estiloRadio.value : 'Casual';
    const preferencias = {
        nombre: nombre,
        genero: genero,
        estilo: estilo,
        talla: talla
    };

    localStorage.setItem('vestia_preferencias', JSON.stringify(preferencias));

    mostrarNotificacion("¡Preferencias guardadas! El catálogo se adaptará a ti.");

    setTimeout(() => {
        window.location.href = 'products.html';
    }, 1500);
}

function cargarPreferencias() {
    const datos = localStorage.getItem('vestia_preferencias');
    if (!datos) return;

    const pref = JSON.parse(datos);

    if(document.getElementById('pref-nombre')) document.getElementById('pref-nombre').value = pref.nombre || '';
    if(document.getElementById('pref-genero')) document.getElementById('pref-genero').value = pref.genero || 'todos';
    if(document.getElementById('pref-talla')) document.getElementById('pref-talla').value = pref.talla || '';

    if (pref.estilo) {
        const radio = document.querySelector(`input[name="pref-estilo"][value="${pref.estilo}"]`);
        if(radio) radio.checked = true;
    }
}

function mostrarNotificacion(mensaje) {
    let toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}