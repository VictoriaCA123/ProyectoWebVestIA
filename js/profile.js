/* JS/PROFILE.JS - ADAPTADO A TU NUEVO HTML */

document.addEventListener('DOMContentLoaded', () => {
    // Cuando la página carga, rellenamos los campos con lo que ya sabemos
    cargarDatosPerfil();
});

// Hacemos esta función global (window) para que el onclick del HTML la encuentre
window.guardarPreferencias = function() {
    // 1. Obtenemos los datos de TUS inputs nuevos
    const inputNombre = document.getElementById('nombre');
    const inputGenero = document.getElementById('genero');
    const inputTallaRopa = document.getElementById('talla_ropa');
    const inputTallaCalzado = document.getElementById('talla_calzado');

    const nuevoNombre = inputNombre ? inputNombre.value.trim() : '';
    
    // Validación: Que al menos ponga el nombre
    if (!nuevoNombre) {
        alert("¡Por favor escribe tu nombre! 😅");
        return;
    }

    // 2. Lógica del Chat (Reiniciar si cambia de usuario)
    const datosAntiguos = JSON.parse(localStorage.getItem('vestia_preferencias') || '{}');
    const nombreAntiguo = datosAntiguos.nombre || '';

    // 3. Creamos el objeto con TODOS los datos nuevos
    const nuevoPerfil = {
        nombre: nuevoNombre,
        genero: inputGenero ? inputGenero.value : 'Todos',
        tallaRopa: inputTallaRopa ? inputTallaRopa.value : 'M',
        tallaCalzado: inputTallaCalzado ? inputTallaCalzado.value : '39'
    };

    // 4. Guardamos en la memoria del navegador
    localStorage.setItem('vestia_preferencias', JSON.stringify(nuevoPerfil));

    // 5. Avisamos al usuario
    if (nombreAntiguo && nombreAntiguo !== nuevoNombre) {
        alert(`¡Datos guardados! Hola ${nuevoNombre}, reiniciaré el chat para ti.`);
        localStorage.removeItem('vestia_chat_state'); // Reinicia el chat
    } else {
        alert("¡Tus preferencias han sido actualizadas! ✅");
    }

    // 6. Recargamos la página
    window.location.reload();
};

function cargarDatosPerfil() {
    try {
        const datos = JSON.parse(localStorage.getItem('vestia_preferencias') || '{}');
        
        // Rellenamos el Nombre
        const inputNombre = document.getElementById('nombre');
        if (inputNombre) inputNombre.value = datos.nombre || '';

        // Rellenamos el Género
        const inputGenero = document.getElementById('genero');
        if (inputGenero && datos.genero) inputGenero.value = datos.genero;

        // Rellenamos Talla Ropa
        const inputTallaRopa = document.getElementById('talla_ropa');
        if (inputTallaRopa && datos.tallaRopa) inputTallaRopa.value = datos.tallaRopa;

        // Rellenamos Talla Calzado
        const inputTallaCalzado = document.getElementById('talla_calzado');
        if (inputTallaCalzado && datos.tallaCalzado) inputTallaCalzado.value = datos.tallaCalzado;

    } catch (e) {
        console.error("Error cargando datos visuales");
    }
}