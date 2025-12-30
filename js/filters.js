/**
 * FILTROS 
 */

window.filtroTallaSeleccionado = null;
window.filtroOcasionesSeleccionadas = [];

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar-sticky-card');
    if (!sidebar) return;
    
    inicializarEventosFiltros();
});

function inicializarEventosFiltros() {
    
    // 1. FILTRO DE TALLAS
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

    // 2. FILTRO DE OCASIÓN
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

    // 3. PRECIO
    const rangoPrecio = document.getElementById('rango-precio');
    if (rangoPrecio) {
        rangoPrecio.addEventListener('input', (e) => {
            const label = document.getElementById('precio-valor');
            if(label) label.textContent = `$${e.target.value}`;
            ejecutarFiltroExterno();
        });
    }

    // 4. CATEGORÍA
    const selectCat = document.getElementById('filtro-categoria');
    if (selectCat) {
        selectCat.addEventListener('change', ejecutarFiltroExterno);
    }
    
    // 5. GÉNERO
    const radiosGen = document.querySelectorAll('input[name="filtro-genero"]');
    radiosGen.forEach(r => r.addEventListener('change', ejecutarFiltroExterno));
}

function ejecutarFiltroExterno() {
    if (typeof window.aplicarFiltrosLocalesExterno === 'function') {
        window.aplicarFiltrosLocalesExterno();
    }
}

window.limpiarFiltros = function() {
    window.location.href = 'products.html'; 
}