/* Variables globales donde guardamos qué talla y qué ocasiones eligió el usuario para usarlas en el filtrado. */
window.filtroTallaSeleccionado = null;
window.filtroOcasionesSeleccionadas = [];

/* Al cargar la página, revisamos si existe la barra lateral de filtros. Si existe, activamos los eventos. */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar-sticky-card');
    if (!sidebar) return; 
    
    inicializarEventosFiltros();
});

/* Esta función configura todos los botones, checkboxes y sliders para que reaccionen cuando el usuario los toca. */
function inicializarEventosFiltros() {
    
    // 1. Filtro de Tallas: Funciona como un interruptor (on/off). Si clicas una talla ya activa, la desmarca.
    const botonesTalla = document.querySelectorAll('.btn-talla'); 
    botonesTalla.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botonesTalla.forEach(t => {
                t.classList.remove('active', 'btn-light');
                t.classList.add('btn-outline-light');
            });

            const tallaClickeada = e.target.textContent.trim();
            
            if (window.filtroTallaSeleccionado === tallaClickeada) {
                window.filtroTallaSeleccionado = null;
            } else {
                e.target.classList.remove('btn-outline-light');
                e.target.classList.add('btn-light', 'active');
                window.filtroTallaSeleccionado = tallaClickeada;
            }
            ejecutarFiltroExterno();
        });
    });

    // 2. Filtro de Ocasión: Revisa todos los checkboxes marcados y crea una lista (array) con ellos.
    const checkboxes = document.querySelectorAll('.form-check-input[id^="ocasion-"]');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', () => {
            window.filtroOcasionesSeleccionadas = [];
            checkboxes.forEach(c => {
                if(c.checked) {
                    const valor = c.id.replace('ocasion-', ''); 
                    const valorCap = valor.charAt(0).toUpperCase() + valor.slice(1);
                    window.filtroOcasionesSeleccionadas.push(valorCap);
                }
            });
            ejecutarFiltroExterno();
        });
    });

    // 3. Rango de Precio: Actualiza el texto del precio visible y lanza el filtro.
    const rangoPrecio = document.getElementById('rango-precio');
    if (rangoPrecio) {
        rangoPrecio.addEventListener('input', (e) => {
            const label = document.getElementById('precio-valor');
            if(label) label.textContent = `$${e.target.value}`;
            ejecutarFiltroExterno();
        });
    }

    // 4. Categoría: Detecta cambios en el menú desplegable.
    const selectCat = document.getElementById('filtro-categoria');
    if (selectCat) {
        selectCat.addEventListener('change', ejecutarFiltroExterno);
    }
    
    // 5. Género: Detecta cambios en los botones de opción (radio buttons).
    const radiosGen = document.querySelectorAll('input[name="filtro-genero"]');
    radiosGen.forEach(r => r.addEventListener('change', ejecutarFiltroExterno));
}

/* Función puente: Llama a la lógica principal (que está en products.js) para repintar la lista de productos con los nuevos filtros. */
function ejecutarFiltroExterno() {
    if (typeof window.aplicarFiltrosLocalesExterno === 'function') {
        window.aplicarFiltrosLocalesExterno();
    }
}

/* Botón de reset: Simplemente recarga la página limpia (products.html) para borrar todas las selecciones. */
window.limpiarFiltros = function() {
    window.location.href = 'products.html'; 
}