/* CONFIGURACIÓN BÁSICA:
   Aquí defino cuántos productos se ven por página y la dirección de la API falsa (DummyJSON) que usamos como base de datos. */
const ITEMS_POR_PAGINA = 9;
const BASE_URL = 'https://dummyjson.com/products';

/* DICCIONARIO DE TRADUCCIÓN:
   Esto es súper importante. Conecta lo que el Chatbot (Vestie) entiende con las categorías reales de la API.
   Si el chat dice 'mens-shoes', aquí sabemos que hay que pedirle a la API la categoría 'mens-shoes'. */
const CATALOGO_OFICIAL = {
    'mens-shoes': 'mens-shoes',
    'mens-shirts': 'mens-shirts',
    'mens-watches': 'mens-watches',
    'womens-shoes': 'womens-shoes',
    'womens-dresses': 'womens-dresses',
    'womens-bags': 'womens-bags',
    'womens-jewellery': 'womens-jewellery',
    'womens-watches': 'womens-watches',
    'tops': 'tops',
    'sunglasses': 'sunglasses',
    'automotive': 'automotive',
    'motorcycle': 'motorcycle',
    'lighting': 'lighting'
};

/* Variables "estado" para guardar los productos que descargamos y los que estamos mostrando actualmente. */
let todosLosProductos = [];
let productosFiltrados = [];

/* INICIALIZACIÓN:
   Apenas carga la página, reviso la URL por si el chat nos mandó aquí con una búsqueda (?q=zapatos).
   También recupero las preferencias del usuario (si es hombre/mujer) para pre-filtrar la tienda. */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const busquedaURL = params.get('q');
    const filtroURL = params.get('filtro');

    const inputSearch = document.getElementById('global-search');
    if (inputSearch && busquedaURL) {
        inputSearch.value = busquedaURL.replace(/-/g, ' '); 
    }

    // Pongo el slider de precio en un valor por defecto
    const inputPrecio = document.getElementById('rango-precio');
    if (inputPrecio) {
        inputPrecio.value = 1000;
        const label = document.getElementById('precio-valor');
        if(label) label.textContent = "$1000";
    }

    // Si hay filtros en la URL o preferencias guardadas, las aplico
    if (filtroURL) {
        preseleccionarFiltros(filtroURL);
    } else if (!busquedaURL) {
        aplicarPreferenciasDeUsuario();
    }

    // Configuro el buscador para que funcione con la tecla Enter
    if (inputSearch) {
        inputSearch.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') { e.preventDefault(); cargarInventario(inputSearch.value.trim()); }
        });
    }
    
    const sortSelect = document.getElementById('ordenar-productos');
    if(sortSelect) sortSelect.addEventListener('change', aplicarFiltrosLocales);

    // ¡Arrancamos la carga de datos!
    cargarInventario(busquedaURL);
});

/* Lee el LocalStorage. Si el usuario ya nos dijo "Soy Hombre", marcamos el filtro de hombre automáticamente. */
function aplicarPreferenciasDeUsuario() {
    const datos = localStorage.getItem('vestia_preferencias');
    if (!datos) return;
    try {
        const pref = JSON.parse(datos);
        window.filtroOcasionesSeleccionadas = []; // Reset

        // Mapeo estricto de género
        if (pref.genero === 'Dama' || pref.genero === 'mujer') {
            const radio = document.getElementById('sexo-mujer');
            if(radio) radio.checked = true;
        } else if (pref.genero === 'Caballero' || pref.genero === 'hombre') {
            const radio = document.getElementById('sexo-hombre');
            if(radio) radio.checked = true;
        }

        // Recuperar Talla del perfil si existe
        if (pref.talla) {
            window.filtroTallaSeleccionado = pref.talla;
            
        }
    } catch(e) {}
}

/* Ayuda a activar los checkboxes de ocasión (Casual, Formal, etc.) desde la URL. */
function preseleccionarFiltros(filtro) {
    window.filtroOcasionesSeleccionadas = [];
    const setCheck = (id) => { const el = document.getElementById(id); if(el) el.checked = true; };
    if (filtro === 'casual') { setCheck('ocasion-casual'); window.filtroOcasionesSeleccionadas.push('Casual'); }
    else if (filtro === 'formal') { setCheck('ocasion-formal'); window.filtroOcasionesSeleccionadas.push('Formal'); }
    else if (filtro === 'deportiva') { setCheck('ocasion-deportivo'); window.filtroOcasionesSeleccionadas.push('Deportivo'); }
}

/* EL CEREBRO DE LA CARGA DE DATOS (Híbrido):
   Esta función es inteligente. Decide de dónde sacar los productos:
   1. Si viene del CHAT (usa una clave exacta del catálogo).
   2. Si es una búsqueda normal (usa el buscador de la API).
   3. Si es la portada (hace varias peticiones a la vez para tener variedad). */
async function cargarInventario(busqueda = null) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-gold" role="status"></div><p class="mt-2 text-muted">Consultando catálogo...</p></div>';

    try {
        let listaCruda = [];

        if (busqueda) {
            const clave = busqueda.toLowerCase().trim();

            // CASO A: Viene del Chatbot (Categoría Exacta)
            if (CATALOGO_OFICIAL[clave]) {
                console.log(`📂 Catálogo: Sección [${clave}]`);
                const res = await fetch(`${BASE_URL}/category/${CATALOGO_OFICIAL[clave]}?limit=100`);
                const data = await res.json();
                listaCruda = data.products;
            } else {
                // CASO B: Búsqueda de texto libre del usuario
                console.log(`🔍 Catálogo: Búsqueda [${clave}]`);
                const res = await fetch(`${BASE_URL}/search?q=${clave}&limit=100`);
                const data = await res.json();
                listaCruda = data.products;
            }
        } else {
            // CASO C: Carga inicial (Mix de categorías para que la tienda se vea llena)
            const peticiones = [
                fetch(`${BASE_URL}/category/mens-shirts?limit=0`),
                fetch(`${BASE_URL}/category/womens-dresses?limit=0`),
                fetch(`${BASE_URL}/category/mens-shoes?limit=0`),
                fetch(`${BASE_URL}/category/womens-shoes?limit=0`),
                fetch(`${BASE_URL}/category/tops?limit=0`),
                fetch(`${BASE_URL}/category/womens-bags?limit=0`),
                fetch(`${BASE_URL}/category/sunglasses?limit=0`),
                fetch(`${BASE_URL}/search?q=jeans&limit=100`)
            ];
            const respuestas = await Promise.all(peticiones);
            const resultados = await Promise.all(respuestas.map(r => r.json()));
            
            // Uso un Map para eliminar duplicados si alguna categoría se repite
            const mapa = new Map();
            resultados.forEach(data => {
                if(data.products) data.products.forEach(p => mapa.set(p.id, p));
            });
            listaCruda = Array.from(mapa.values());
        }

        // Limpio productos que no tienen nada que ver con ropa (la API trae de todo)
        const basura = ['mascara', 'perfume', 'lipstick', 'oil', 'cream', 'serum', 'groceries', 'furniture'];
        listaCruda = listaCruda.filter(p => {
            const txt = (p.title + ' ' + p.category).toLowerCase();
            return !basura.some(b => txt.includes(b));
        });

        // Proceso cada producto para agregarle talla y ocasión
        todosLosProductos = listaCruda.map(p => procesarProducto(p));
        aplicarFiltrosLocales();

    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = '<div class="alert alert-danger text-center">Error de conexión.</div>';
    }
}

/* Como la API no tiene Talla, Color ni Ocasión, se los agrego aquí.
   Uso el ID del producto para que siempre le toque la misma talla "random" (determinista). */
function procesarProducto(p) {
    const seed = p.id;
    return {
        ...p,
        colorLocal: obtenerColor(seed),
        tallaLocal: obtenerTalla(p.category, p.title, seed),
        ocasionLocal: clasificarOcasion(p.category, p.title)
    };
}

/* Lógica matemática para asignar tallas.
   Si es zapato -> Talla numérica (38, 39, 40...)
   Si es accesorio -> Talla Única
   Si es ropa -> S, M, L... */
function obtenerTalla(cat, titulo, seed) {
    const texto = (titulo + ' ' + cat).toLowerCase();
    
    // Zapatos
    if (texto.includes('shoes') || texto.includes('sneaker') || texto.includes('heel') || texto.includes('boot') || texto.includes('sandal')) {
        const tallas = ['36', '37', '38', '39', '40', '41', '42'];
        return String(tallas[seed % tallas.length]); 
    }
    // Accesorios
    if (texto.includes('bag') || texto.includes('glass') || texto.includes('watch') || texto.includes('jewel')) {
        return 'Única';
    }
    // Ropa
    const tallasRopa = ['S', 'M', 'L', 'XL'];
    return tallasRopa[seed % tallasRopa.length];
}

function obtenerColor(seed) {
    const c = ['Negro', 'Azul', 'Rojo', 'Amarillo', 'Blanco'];
    return c[seed % c.length];
}

function clasificarOcasion(cat, titulo) {
    const txt = (titulo + ' ' + cat).toLowerCase();
    if (txt.includes('sport') || txt.includes('gym') || txt.includes('sneaker')) return 'Deportivo';
    if (txt.includes('dress') || txt.includes('elegant') || txt.includes('heel') || txt.includes('formal')) return 'Formal';
    return 'Casual';
}

/* EL MOTOR DE FILTRADO (ESTRICTO):
   Aquí ocurre la magia de ocultar cosas. Recorre todos los productos y decide cuál mostrar
   basándose en precio, género, categoría, talla y ocasión. */
function aplicarFiltrosLocales() {
    const elPrecio = document.getElementById('rango-precio');
    const precioMax = elPrecio ? parseFloat(elPrecio.value) : 10000;

    const elCat = document.getElementById('filtro-categoria');
    const catSelect = elCat ? elCat.value : '';

    const elGen = document.querySelector('input[name="filtro-genero"]:checked');
    const generoSel = elGen ? elGen.value : 'todos';

    // Recupero las variables globales que pusimos en filters.js
    const tallaSel = window.filtroTallaSeleccionado || null; 
    let ocasionesSel = window.filtroOcasionesSeleccionadas || [];

    // Sincronizar checkboxes visuales con la lógica
    const chkCasual = document.getElementById('ocasion-casual');
    if(chkCasual && chkCasual.checked && !ocasionesSel.includes('Casual')) ocasionesSel.push('Casual');
    const chkFormal = document.getElementById('ocasion-formal');
    if(chkFormal && chkFormal.checked && !ocasionesSel.includes('Formal')) ocasionesSel.push('Formal');
    const chkDeport = document.getElementById('ocasion-deportivo');
    if(chkDeport && chkDeport.checked && !ocasionesSel.includes('Deportivo')) ocasionesSel.push('Deportivo');

    // Listas negras: qué categorías NO mostrar a cada género
    const catsMujer = ['womens-dresses', 'womens-shoes', 'womens-bags', 'womens-jewellery', 'womens-watches', 'tops'];
    const catsHombre = ['mens-shirts', 'mens-shoes', 'mens-watches'];

    productosFiltrados = todosLosProductos.filter(p => {
        // 1. Filtro Precio
        if (p.price > precioMax) return false;

        const cat = p.category.toLowerCase();
        const title = p.title.toLowerCase();

        // 2. Filtro Género (Lógica Estricta)
        // Si eligió Mujer, ocultamos todo lo de Hombre
        if (generoSel === 'mujer') {
            if (catsHombre.includes(cat)) return false;
            if (title.startsWith('men ')) return false;
        }
        // Si eligió Hombre, ocultamos vestidos, tacones, etc.
        if (generoSel === 'hombre') {
            if (catsMujer.includes(cat) || cat.includes('womens-')) return false;
            if (cat.includes('dress') || cat.includes('handbag') || cat.includes('heel') || cat.includes('jewel') || cat.includes('tops')) return false;
        }

        // 3. Filtro Categoría (Menú desplegable)
        if (catSelect) {
            if (catSelect === 'deportiva' && p.ocasionLocal !== 'Deportivo') return false;
            else if (catSelect === 'vestidos' && !cat.includes('dress')) return false;
            else if (catSelect === 'zapatos' && (!cat.includes('shoes') && !title.includes('sneaker') && !title.includes('boot'))) return false;
            else if (catSelect === 'accesorios' && (!cat.includes('bag') && !cat.includes('glass') && !cat.includes('watch'))) return false;
            else if (catSelect === 'camisas' && ((!cat.includes('shirt') && !cat.includes('top')) || cat.includes('dress'))) return false;
        }

        // 4. Filtro Talla (Coincidencia exacta)
        if (tallaSel) {
            // Si buscamos una talla específica, ocultamos los de talla Única
            if (p.tallaLocal === 'Única') return false;
            if (p.tallaLocal !== tallaSel) return false;
        }

        // 5. Filtro Ocasión
        if (ocasionesSel.length > 0) {
            if (!ocasionesSel.includes(p.ocasionLocal)) return false;
        }

        return true;
    });

    renderizarPagina(1);
    const elContador = document.getElementById('total-productos');
    if(elContador) elContador.textContent = `${productosFiltrados.length} productos`;
}

/* RENDERIZADO VISUAL:
   Toma la lista de productos filtrados y genera el HTML de las tarjetas (imágenes, precios, badges).
   También maneja la paginación si hay muchos productos. */
function renderizarPagina(pagina) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const productosPagina = productosFiltrados.slice(inicio, fin);

    if (productosPagina.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3 class="text-muted">No encontramos coincidencias.</h3>
                <p>Intenta cambiar los filtros.</p>
                <button class="btn btn-primary mt-2" onclick="window.limpiarFiltros()">Ver Todo</button>
            </div>`;
        actualizarPaginacion(0);
        return;
    }

    productosPagina.forEach(p => {
        const img = p.thumbnail || 'https://via.placeholder.com/300';
        let badgeClass = 'bg-info text-dark';
        if(p.ocasionLocal === 'Deportivo') badgeClass = 'bg-success text-white';
        if(p.ocasionLocal === 'Formal') badgeClass = 'bg-dark text-white';

        const html = `
            <div class="col-md-6 col-lg-4 mb-4 fade-in-up">
                <div class="product-card-custom shadow-sm h-100">
                    <div class="product-img-wrapper position-relative">
                        <img src="${img}" alt="${p.title}" class="product-img-fit" style="cursor: pointer;" onclick="window.abrirModalDetalle(${p.id})">
                        <div class="product-badges-container">
                            <span class="badge ${badgeClass}">${p.ocasionLocal}</span>
                            <span class="badge bg-light text-dark border">${p.tallaLocal}</span>
                        </div>
                    </div>
                    <div class="product-info-body d-flex flex-column">
                        <div class="mb-auto">
                            <h6 class="fw-bold text-truncate" title="${p.title}">${p.title}</h6>
                            <p class="small text-muted mb-2 text-capitalize">${p.category.replace('-', ' ')}</p>
                        </div>
                        <div class="product-card-footer mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-primary fs-5">$${p.price.toFixed(2)}</span>
                            <button class="btn btn-sm btn-outline-primary rounded-pill px-3" 
                                onclick="agregarAlCarrito(${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.price}, '${img}')">
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        contenedor.innerHTML += html;
    });
    actualizarPaginacion(Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA));
}

/* UTILIDADES:
   Funciones auxiliares para abrir el modal de detalle, manejar los botones de página 1, 2, 3...
   y hooks globales para que los otros scripts puedan llamar a estas funciones. */
window.abrirModalDetalle = (id) => {
    const producto = todosLosProductos.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('modal-img').src = producto.thumbnail;
    document.getElementById('modal-titulo').textContent = producto.title;
    document.getElementById('modal-precio').textContent = `$${producto.price.toFixed(2)}`;
    document.getElementById('modal-descripcion').textContent = producto.description; 
    document.getElementById('modal-cat').textContent = producto.category.replace('-', ' ');
    document.getElementById('modal-talla').textContent = `Talla: ${producto.tallaLocal}`;

    const btnAgregar = document.getElementById('modal-btn-agregar');
    const nuevoBtn = btnAgregar.cloneNode(true);
    btnAgregar.parentNode.replaceChild(nuevoBtn, btnAgregar);
    
    nuevoBtn.addEventListener('click', () => {
        if (window.agregarAlCarrito) window.agregarAlCarrito(producto.id, producto.title, producto.price, producto.thumbnail);
        bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
    });

    new bootstrap.Modal(document.getElementById('modalProducto')).show();
};

function actualizarPaginacion(total) {
    const pag = document.getElementById('paginacion');
    if(!pag) return;
    if(total <= 1) { pag.innerHTML = ''; return; }
    let html = '';
    for(let i=1; i<=total; i++) {
        html += `<li class="page-item"><button class="page-link" onclick="window.cambiarPagina(${i})">${i}</button></li>`;
    }
    pag.innerHTML = html;
}

window.cambiarPagina = (p) => { renderizarPagina(p); window.scrollTo({top:0, behavior:'smooth'}); };
window.buscarProductos = () => { const i = document.getElementById('global-search'); if(i) cargarInventario(i.value); };
// Hooks para que los filtros externos funcionen
window.aplicarFiltrosLocalesExterno = () => aplicarFiltrosLocales();
window.limpiarFiltros = () => { window.location.href = 'products.html'; };