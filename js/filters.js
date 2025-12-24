

window.filtroColorSeleccionado = null;
window.filtroTallaSeleccionado = null;
window.filtroOcasionesSeleccionadas = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    inicializarEventosFiltros();
});

function cargarCategorias() {
    const select = document.getElementById('filtro-categoria');
    
    // categorias disponibles
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
    
    // COLORES
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
            if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
        });
    });

    // TALLAS
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

    // OCASIÓN
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

    // PRECIO
    document.getElementById('rango-precio').addEventListener('input', (e) => {
        document.getElementById('precio-valor').textContent = `$${e.target.value}`;
        if(window.aplicarFiltrosLocalesExterno) window.aplicarFiltrosLocalesExterno();
    });

    // RECARGA API
    document.querySelectorAll('input[name="filtro-genero"]').forEach(r => r.addEventListener('change', () => cargarProductos(1)));
    document.getElementById('filtro-categoria').addEventListener('change', () => cargarProductos(1));
}

window.limpiarFiltros = function() {
    document.getElementById('filtro-categoria').value = "";
    document.getElementById('global-search').value = "";
    document.getElementById('sexo-todos').checked = true;
    document.getElementById('rango-precio').value = 500;
    document.getElementById('precio-valor').textContent = "$500";
    
    window.filtroColorSeleccionado = null;
    window.filtroTallaSeleccionado = null;
    window.filtroOcasionesSeleccionadas = [];
    
    document.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.btn-talla').forEach(b => {
        b.classList.remove('active', 'btn-light');
        b.classList.add('btn-outline-light');
    });
    document.querySelectorAll('.form-check-input[id^="ocasion-"]').forEach(c => c.checked = false);

    cargarProductos(1);
}