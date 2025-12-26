// 1. ESTADO GLOBAL DE FILTROS
// window para que estas variables sean accesibles desde otros archivos JS.
// Guardan temporalmente qué opciones ha elegido el usuario.
window.filtroColorSeleccionado = null;
window.filtroTallaSeleccionado = null;
window.filtroOcasionesSeleccionadas = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    inicializarEventosFiltros();
});

function cargarCategorias() {
    const select = document.getElementById('filtro-categoria');
    
    
    const categoriasBoutique = [
        { nombre: 'Camisas / Blusas', valorInternal: 'camisas' },
        { nombre: 'Vestidos', valorInternal: 'vestidos' },
        { nombre: 'Zapatos', valorInternal: 'zapatos' },
        { nombre: 'Accesorios', valorInternal: 'accesorios' }
    ];

    select.innerHTML = '<option value="">Todas</option>';
    categoriasBoutique.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.valorInternal; 
        option.textContent = cat.nombre; 
        select.appendChild(option);
    });
}

function inicializarEventosFiltros() {
    
    //  FILTRO DE COLORES (Selección Única)
    const colores = document.querySelectorAll('.color-option');
    colores.forEach(circulo => {
        circulo.addEventListener('click', (e) => {
            colores.forEach(c => c.classList.remove('active'));
            if (window.filtroColorSeleccionado === e.target.title) {
                window.filtroColorSeleccionado = null; 
            } else {
                e.target.classList.add('active');
                window.filtroColorSeleccionado = e.target.title; 
            }

            //  Llamamos a la función principal que filtra los productos (está en products.js)
            if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
        });
    });

    // B. FILTRO DE TALLAS (Botones)
    const botonesTalla = document.querySelectorAll('.btn-talla'); 
    botonesTalla.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botonesTalla.forEach(t => {
                t.classList.remove('active', 'btn-light');
                t.classList.add('btn-outline-light');
            });

            if (window.filtroTallaSeleccionado === e.target.textContent) {
                window.filtroTallaSeleccionado = null;
            } else {
                e.target.classList.remove('btn-outline-light');
                e.target.classList.add('btn-light', 'active');
                window.filtroTallaSeleccionado = e.target.textContent;
            }
            
            if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
        });
    });

    // C. FILTRO DE OCASIÓN (Multi-selección con Checkbox)
    const checkboxes = document.querySelectorAll('.form-check-input[id^="ocasion-"]');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', () => {
            window.filtroOcasionesSeleccionadas = [];
            checkboxes.forEach(c => {
                if(c.checked) window.filtroOcasionesSeleccionadas.push(c.id.replace('ocasion-', '')); 
            });
            if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
        });
    });

    // D. FILTRO DE PRECIO (Slider / Range)
    document.getElementById('rango-precio').addEventListener('input', (e) => {
        document.getElementById('precio-valor').textContent = `$${e.target.value}`;
        if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
    });

    // E. FILTROS QUE REQUIEREN RECARGA (API)
    // Estos filtros cambian los datos de origen, así que llamamos a cargarProductos
    document.querySelectorAll('input[name="filtro-genero"]').forEach(r => r.addEventListener('change', () => cargarProductos(1)));
    document.getElementById('filtro-categoria').addEventListener('change', () => cargarProductos(1));
}


window.limpiarFiltros = function() {
    // Resetear inputs HTML (Selects, Inputs, Checkboxes)
    document.getElementById('filtro-categoria').value = "";
    document.getElementById('global-search').value = "";
    document.getElementById('sexo-todos').checked = true;
    document.getElementById('rango-precio').value = 500;
    document.getElementById('precio-valor').textContent = "$500";
    // Resetear variables de Estado Global
    window.filtroColorSeleccionado = null;
    window.filtroTallaSeleccionado = null;
    window.filtroOcasionesSeleccionadas = [];
    
    // Resetear Clases Visuales 
    document.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.btn-talla').forEach(b => {
        b.classList.remove('active', 'btn-light');
        b.classList.add('btn-outline-light');
    });
    document.querySelectorAll('.form-check-input[id^="ocasion-"]').forEach(c => c.checked = false);
    // Recargar productos originales
    cargarProductos(1);
}