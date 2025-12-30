/**
 * LÓGICA DE PRODUCTOS + FILTROS
 */

const ITEMS_POR_PAGINA = 9;
const BASE_URL = 'https://dummyjson.com/products';

let todosLosProductos = [];
let productosFiltrados = [];

// =================================================================
// 1. INICIALIZACIÓN
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const busquedaURL = params.get('q');
    const filtroURL = params.get('filtro');

    const inputSearch = document.getElementById('global-search');
    if (inputSearch && busquedaURL) inputSearch.value = busquedaURL;

    const inputPrecio = document.getElementById('rango-precio');
    if (inputPrecio) {
        inputPrecio.value = 1000;
        const label = document.getElementById('precio-valor');
        if(label) label.textContent = "$1000";
    }

    if (filtroURL) {
        preseleccionarFiltros(filtroURL);
    } else if (!busquedaURL) {
        aplicarPreferenciasDeUsuario();
    }

    if (inputSearch) {
        inputSearch.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') { e.preventDefault(); cargarInventario(inputSearch.value.trim()); }
        });
    }
    
    const sortSelect = document.getElementById('ordenar-productos');
    if(sortSelect) sortSelect.addEventListener('change', aplicarFiltrosLocales);

    cargarInventario(busquedaURL);
});

function aplicarPreferenciasDeUsuario() {
    const datos = localStorage.getItem('vestia_preferencias');
    if (!datos) return;

    const pref = JSON.parse(datos);
    console.log("Aplicando preferencias:", pref);

    window.filtroOcasionesSeleccionadas = [];

    if (pref.genero === 'mujer') {
        const radio = document.getElementById('sexo-mujer');
        if(radio) radio.checked = true;
    } else if (pref.genero === 'hombre') {
        const radio = document.getElementById('sexo-hombre');
        if(radio) radio.checked = true;
    }

    if (pref.estilo) {
        window.filtroOcasionesSeleccionadas.push(pref.estilo);
        const checkId = 'ocasion-' + pref.estilo.toLowerCase();
        const check = document.getElementById(checkId);
        if(check) check.checked = true;
    }

    if (pref.talla) {
        window.filtroTallaSeleccionado = pref.talla;
    }
}

function preseleccionarFiltros(filtro) {
    window.filtroOcasionesSeleccionadas = [];
    const setCheck = (id) => { const el = document.getElementById(id); if(el) el.checked = true; };
    
    if (filtro === 'casual') { setCheck('ocasion-casual'); window.filtroOcasionesSeleccionadas.push('Casual'); }
    else if (filtro === 'formal') { setCheck('ocasion-formal'); window.filtroOcasionesSeleccionadas.push('Formal'); }
    else if (filtro === 'deportiva') { setCheck('ocasion-deportivo'); window.filtroOcasionesSeleccionadas.push('Deportivo'); }
}

// =================================================================
// 2. CARGAR DATOS 
// =================================================================
async function cargarInventario(busqueda = null) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-gold" role="status"></div><p class="mt-2 text-muted">Personalizando boutique...</p></div>';

    try {
        let listaCruda = [];

        if (busqueda) {
            const res = await fetch(`${BASE_URL}/search?q=${busqueda}&limit=100`);
            const data = await res.json();
            const prohibidos = ['groceries', 'furniture', 'motorcycle', 'automotive', 'lighting'];
            listaCruda = data.products.filter(p => !prohibidos.includes(p.category));
        } else {
            const peticiones = [
                fetch(`${BASE_URL}/category/mens-shirts?limit=0`),
                fetch(`${BASE_URL}/category/womens-dresses?limit=0`),
                fetch(`${BASE_URL}/category/mens-shoes?limit=0`),
                fetch(`${BASE_URL}/category/womens-shoes?limit=0`),
                fetch(`${BASE_URL}/category/tops?limit=0`),
                fetch(`${BASE_URL}/category/womens-bags?limit=0`),
                fetch(`${BASE_URL}/category/sunglasses?limit=0`),
                fetch(`${BASE_URL}/search?q=jeans&limit=100`),
                fetch(`${BASE_URL}/search?q=pants&limit=100`),
                fetch(`${BASE_URL}/search?q=sneaker&limit=100`),
                fetch(`${BASE_URL}/search?q=shorts&limit=100`)
            ];

            const respuestas = await Promise.all(peticiones);
            const resultados = await Promise.all(respuestas.map(r => r.json()));

            const mapa = new Map();
            resultados.forEach(data => {
                if(data.products) data.products.forEach(p => mapa.set(p.id, p));
            });
            listaCruda = Array.from(mapa.values());
        }

        const basura = ['mascara', 'perfume', 'lipstick', 'oil', 'cream', 'serum', 'cricket', 'ball', 'bat'];
        listaCruda = listaCruda.filter(p => {
            const txt = (p.title + ' ' + p.description).toLowerCase();
            return !basura.some(b => txt.includes(b));
        });

        todosLosProductos = listaCruda.map(p => procesarProducto(p));
        aplicarFiltrosLocales();

    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = '<div class="alert alert-danger text-center">Error de conexión.</div>';
    }
}

function procesarProducto(p) {
    const seed = p.id;
    return {
        ...p,
        colorLocal: obtenerColor(seed),
        tallaLocal: obtenerTalla(p.category, p.title, seed),
        ocasionLocal: clasificarOcasion(p.category, p.title)
    };
}

function obtenerTalla(cat, titulo, seed) {
    const texto = (titulo + ' ' + cat).toLowerCase();
    if (texto.includes('shoes') || texto.includes('sneaker') || texto.includes('heel') || texto.includes('boot') || texto.includes('sandal')) {
        const tallas = ['36', '37', '38', '39', '40', '41', '42'];
        return String(tallas[seed % tallas.length]); 
    }
    if (texto.includes('bag') || texto.includes('glass') || texto.includes('watch')) {
        return 'Única';
    }
    const tallasRopa = ['S', 'M', 'L', 'XL'];
    return tallasRopa[seed % tallasRopa.length];
}

function obtenerColor(seed) {
    const c = ['Negro', 'Azul', 'Rojo', 'Amarillo', 'Blanco'];
    return c[seed % c.length];
}

function clasificarOcasion(cat, titulo) {
    const txt = (titulo + ' ' + cat).toLowerCase();
    if (txt.includes('sport') || txt.includes('gym') || txt.includes('run') || txt.includes('sneaker') || txt.includes('jogger')) return 'Deportivo';
    if (txt.includes('dress') || txt.includes('elegant') || txt.includes('heel') || txt.includes('formal') || txt.includes('leather')) return 'Formal';
    return 'Casual';
}

// =================================================================
// 3. MOTOR DE FILTRADO 
// =================================================================
function aplicarFiltrosLocales() {
    const elPrecio = document.getElementById('rango-precio');
    const precioMax = elPrecio ? parseFloat(elPrecio.value) : 10000;

    const elCat = document.getElementById('filtro-categoria');
    const catSelect = elCat ? elCat.value : '';

    const elGen = document.querySelector('input[name="filtro-genero"]:checked');
    const generoSel = elGen ? elGen.value : 'todos';

    const tallaSel = window.filtroTallaSeleccionado || null;
    let ocasionesSel = window.filtroOcasionesSeleccionadas || [];

    const chkCasual = document.getElementById('ocasion-casual');
    if(chkCasual && chkCasual.checked && !ocasionesSel.includes('Casual')) ocasionesSel.push('Casual');
    const chkFormal = document.getElementById('ocasion-formal');
    if(chkFormal && chkFormal.checked && !ocasionesSel.includes('Formal')) ocasionesSel.push('Formal');
    const chkDeport = document.getElementById('ocasion-deportivo');
    if(chkDeport && chkDeport.checked && !ocasionesSel.includes('Deportivo')) ocasionesSel.push('Deportivo');

    const catsMujer = [
        'womens-dresses', 'womens-shoes', 'womens-bags', 
        'womens-jewellery', 'womens-watches', 'tops'
    ];
    const catsHombre = [
        'mens-shirts', 'mens-shoes', 'mens-watches'
    ];

    productosFiltrados = todosLosProductos.filter(p => {
        // 1. Filtro de Precio
        if (p.price > precioMax) return false;

        const cat = p.category.toLowerCase();
        const title = p.title.toLowerCase();

        // 2. Filtro de Género 
        if (generoSel === 'mujer') {
            if (catsHombre.includes(cat)) return false;
            
            if (title.startsWith('men ')) return false;
        }
        
        if (generoSel === 'hombre') {
            if (catsMujer.includes(cat) || cat.includes('womens-')) return false;

            if (cat.includes('dress') || cat.includes('handbag') || cat.includes('heel') || cat.includes('jewel') || cat.includes('tops')) return false;
        }

        // 3. Filtro de Categoría 
        if (catSelect) {
            if (catSelect === 'deportiva' && p.ocasionLocal !== 'Deportivo') return false;
            
            else if (catSelect === 'vestidos' && !cat.includes('dress')) return false;
            
            else if (catSelect === 'zapatos' && (!cat.includes('shoes') && !title.includes('sneaker') && !title.includes('heel') && !title.includes('boot'))) return false;
            
            else if (catSelect === 'accesorios' && (!cat.includes('bag') && !cat.includes('glass') && !cat.includes('watch') && !cat.includes('jewel'))) return false;
            
            else if (catSelect === 'camisas' && ((!cat.includes('shirt') && !cat.includes('top')) || cat.includes('dress'))) return false;
        }

        // 4. Filtro de Talla
        if (tallaSel) {
            if (p.tallaLocal === 'Única') return false; 
            if (p.tallaLocal !== tallaSel) return false;
        }

        // 5. Filtro de Ocasión
        if (ocasionesSel.length > 0) {
            if (!ocasionesSel.includes(p.ocasionLocal)) return false;
        }

        return true;
    });

    renderizarPagina(1);
    const elContador = document.getElementById('total-productos');
    if(elContador) elContador.textContent = `${productosFiltrados.length} productos`;
}
// =================================================================
// 4. RENDERIZADO VISUAL
// =================================================================
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
                <h3 class="text-muted">No encontramos coincidencias para tu perfil.</h3>
                <p>Prueba ajustando los filtros manualmente.</p>
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
                        <img src="${img}" alt="${p.title}" class="product-img-fit">
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
            </div>
        `;
        contenedor.innerHTML += html;
    });

    actualizarPaginacion(Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA));
}

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
window.aplicarFiltrosLocalesExterno = () => aplicarFiltrosLocales();
window.limpiarFiltros = () => { window.location.href = 'products.html'; };