
const ITEMS_POR_PAGINA = 9; 
const API_URL = 'https://dummyjson.com/products';

let todosLosProductos = []; 
let productosFiltrados = [];

document.addEventListener('DOMContentLoaded', () => {
    
    const parametros = new URLSearchParams(window.location.search);
    const filtro = parametros.get('filtro');

    // Si hay filtro desde index, marcamos las opciones en el HTML automáticamente
    if (filtro === 'casual') {
        // Marca checkbox de casual si pidio ver el catalogo de ropa casual 
        const check = document.getElementById('ocasion-casual');
        if(check) check.checked = true;
        // variable global para que el filtro funcione
        window.filtroOcasionesSeleccionadas = ['Casual'];
    } 
    else if (filtro === 'formal') {
        // marca el checkbox de Formal
        const check = document.getElementById('ocasion-formal');
        if(check) check.checked = true;
        window.filtroOcasionesSeleccionadas = ['Formal'];
    }
    else if (filtro === 'deportiva') {
        // check ropa deportiva
        const select = document.getElementById('filtro-categoria');
        if(select) select.value = 'deportiva';
    }

    // cargamos los productos con los filtros ya puestos
    cargarProductos();
});
window.aplicarFiltrosLocalesExterno = function() {
    aplicarFiltrosLocales();
    renderizarPagina(1);
}


async function cargarProductos(pagina = 1) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    if(pagina === 1) contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-warning" role="status"></div></div>';

    const generoInput = document.querySelector('input[name="filtro-genero"]:checked');
    const genero = generoInput ? generoInput.value : 'todos'; 
    const categoriaGen = document.getElementById('filtro-categoria').value; 
    const busqueda = document.getElementById('global-search').value;

    let productosCrudos = [];

    try {
        if (busqueda) {
            const res = await fetch(`${API_URL}/search?q=${busqueda}&limit=100`);
            const data = await res.json();
            productosCrudos = data.products;
            if (genero !== 'todos') productosCrudos = filtrarBusquedaPorGenero(productosCrudos, genero);
        } 
        else if (categoriaGen && categoriaGen !== 'deportiva') {
            productosCrudos = await obtenerProductosPorCategoriaYGenero(categoriaGen, genero);
        } 
        else if (categoriaGen === 'deportiva') {
            productosCrudos = await obtenerMixDeportivo();
        }
        else {
            productosCrudos = await obtenerMixPortada(genero);
        }

        
        if (categoriaGen === 'camisas') {
            productosCrudos = productosCrudos.filter(p => !esVestido(p));
        }

        if (categoriaGen === 'deportiva') {
            productosCrudos = productosCrudos.map((p, index) => transformarADeportivo(p, index));
        }

        productosCrudos = productosCrudos.map(p => maquillarTitulos(p));

        // DUPLICACIÓN DE INVENTARIO
        if (productosCrudos.length > 0) {
            productosCrudos = expandirInventario(productosCrudos);
        }

        // ENRIQUECIMIENTO (Colores, Tallas, Ocasión)
        todosLosProductos = productosCrudos.map((p) => {
            const semilla = p.id; 
            return {
                ...p,
                colorLocal: obtenerColorAleatorio(semilla, p.title), // Aquí ya no saldrá verde
                tallaLocal: determinarTallaInteligente(p.category, p.title, semilla),
                ocasionLocal: determinarOcasionInteligente(p.category, p.title, semilla, categoriaGen)
            };
        });

        aplicarFiltrosLocales();
        renderizarPagina(pagina);

    } catch (error) {
        console.error("Error cargando productos:", error);
        contenedor.innerHTML = '<div class="alert alert-danger text-center">Hubo un error cargando el catálogo. Intenta recargar.</div>';
    }
}


function renderizarPagina(pagina) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const productosPagina = productosFiltrados.slice(inicio, fin);

    if (productosPagina.length === 0) {
        contenedor.innerHTML = '<h3 class="text-center w-100 text-muted my-5">No encontramos productos con esos filtros.</h3>';
        actualizarPaginacionVisual(pagina, 0);
        return;
    }

    productosPagina.forEach(p => {
        let badgeTalla = ''; 
        if (p.tallaLocal !== 'Única') {
            badgeTalla = `<span class="badge bg-light text-dark border shadow-sm">${p.tallaLocal}</span>`;
        }

        
        let colorClass = 'bg-light text-dark';
        if(p.colorLocal === 'Negro') colorClass = 'bg-dark text-white';
        if(p.colorLocal === 'Rojo') colorClass = 'bg-danger text-white';
        if(p.colorLocal === 'Azul') colorClass = 'bg-primary text-white';
        if(p.colorLocal === 'Amarillo') colorClass = 'bg-warning text-dark';
        

        const badgesHtml = `
            <div class="product-badges-container">
                <span class="badge ${colorClass} border shadow-sm">${p.colorLocal}</span>
                ${badgeTalla}
                <span class="badge bg-warning text-dark border shadow-sm">${p.ocasionLocal}</span>
            </div>
        `;

        const tarjetaHtml = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="product-card-custom shadow-sm fade-in-up">
                    <div class="product-img-wrapper">
                        <img src="${p.thumbnail}" alt="${p.title}" class="product-img-fit">
                        <span class="badge bg-dark position-absolute top-0 start-0 m-2 text-uppercase small shadow-sm">
                            ${p.category ? p.category.replace('-', ' ') : 'Producto'}
                        </span>
                        ${badgesHtml}
                    </div>
                    <div class="product-info-body">
                        <div>
                            <h6 class="fw-bold text-truncate" title="${p.title}">${p.title}</h6>
                            <p class="product-desc-text">
                                ${p.description}
                            </p>
                        </div>
                        <div class="product-card-footer">
                            <span class="fw-bold text-warning fs-5">$${p.price}</span>
                            <button class="btn btn-sm btn-outline-dark rounded-pill px-3" onclick="agregarAlCarrito(${p.id})">
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjetaHtml;
    });

    actualizarPaginacionVisual(pagina, Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA));
}



function expandirInventario(listaProductos) {
    if (listaProductos.length > 50) return listaProductos;
    
    const clones1 = listaProductos.map(p => ({ ...p, id: p.id + 100001 })); 
    const clones2 = listaProductos.map(p => ({ ...p, id: p.id + 200002 }));

    return [...listaProductos, ...clones1, ...clones2].sort(() => Math.random() - 0.5);
}

function obtenerColorAleatorio(seed, titulo = "") {
    
    const colores = ['Negro', 'Azul', 'Rojo', 'Amarillo', 'Blanco']; 
    

    return colores[Math.abs(seed) % colores.length];
}

function transformarADeportivo(producto, index) {
    const cat = producto.category.toLowerCase();
    const titulo = producto.title.toLowerCase();
    
    let nuevosTitulos = [];
    if (cat.includes('shoe') || cat.includes('sneaker')) {
        nuevosTitulos = ['Runner Pro X', 'Marathon Gel', 'Gym Trainer Z', 'Speed Flow 5', 'Court King'];
    } else if (cat.includes('shirt') || cat.includes('top') || titulo.includes('t-shirt')) {
        nuevosTitulos = ['Dry-Fit Running', 'Training Compression', 'Yoga Flex Top', 'Crossfit Jersey'];
    } else if (cat.includes('glass')) {
        nuevosTitulos = ['Sport Vision UV', 'Cycling Pro Glasses'];
    }

    if (nuevosTitulos.length > 0) {
        const nuevoTitulo = nuevosTitulos[index % nuevosTitulos.length];
        return { 
            ...producto, 
            title: nuevoTitulo,
            description: 'Edición especial diseñada para alto rendimiento deportivo y máxima comodidad.',
            ocasionLocal: 'Deportivo'
        };
    }
    return producto;
}

function determinarOcasionInteligente(categoria, titulo, seed, filtroActual) {
    if (filtroActual === 'deportiva') return 'Deportivo';

    const text = (titulo + categoria).toLowerCase();
    if (text.includes('sneaker') || text.includes('runner') || text.includes('sport')) return 'Deportivo';
    if (text.includes('boot') || text.includes('leather')) return 'Formal';
    
    const opciones = ['Casual', 'Formal', 'Deportivo', 'Casual'];
    return opciones[seed % 4];
}

function determinarTallaInteligente(categoria, titulo, seed) {
    const cat = categoria ? categoria.toLowerCase() : '';
    if (cat.includes('sunglasses') || cat.includes('bag') || cat.includes('jewel')) return 'Única';
    if (cat.includes('shoe') || cat.includes('sneaker') || cat.includes('boot')) {
        const tallas = ['36', '37', '38', '39', '40', '41', '42'];
        return tallas[seed % tallas.length];
    }
    const tallasRopa = ['S', 'M', 'L', 'XL'];
    return tallasRopa[seed % tallasRopa.length];
}



async function obtenerMixDeportivo() {
    const urls = [
        `${API_URL}/category/mens-shoes?limit=10`,
        `${API_URL}/category/womens-shoes?limit=10`,
        `${API_URL}/category/tops?limit=10`
    ];
    return await fetchMultiplesURLs(urls);
}

async function obtenerProductosPorCategoriaYGenero(cat, gen) {
    let urls = [];
    const mapMujer = { 'camisas': 'tops', 'vestidos': 'womens-dresses', 'zapatos': 'womens-shoes', 'accesorios': 'womens-bags' };
    const mapHombre = { 'camisas': 'mens-shirts', 'zapatos': 'mens-shoes', 'accesorios': 'sunglasses' };

    if (gen === 'mujer' || gen === 'todos') {
        if(mapMujer[cat]) urls.push(`${API_URL}/category/${mapMujer[cat]}?limit=30`);
    }
    if (gen === 'hombre' || gen === 'todos') {
        if(mapHombre[cat]) urls.push(`${API_URL}/category/${mapHombre[cat]}?limit=30`);
    }
    return await fetchMultiplesURLs(urls);
}

async function obtenerMixPortada(genero) {
    let urls = [];
    if (genero === 'mujer') {
        urls = [`${API_URL}/category/womens-dresses`, `${API_URL}/category/womens-shoes`, `${API_URL}/category/tops`];
    } else if (genero === 'hombre') {
        urls = [`${API_URL}/category/mens-shirts`, `${API_URL}/category/mens-shoes`];
    } else {
        urls = [
            `${API_URL}/category/womens-dresses?limit=10`,
            `${API_URL}/category/mens-shirts?limit=10`,
            `${API_URL}/category/mens-shoes?limit=10`,
            `${API_URL}/category/womens-shoes?limit=10`
        ];
    }
    return await fetchMultiplesURLs(urls);
}

async function fetchMultiplesURLs(urls) {
    if(urls.length === 0) return [];
    const respuestas = await Promise.all(urls.map(u => fetch(u)));
    const jsons = await Promise.all(respuestas.map(r => r.json()));
    let resultado = [];
    jsons.forEach(d => { if(d.products) resultado = [...resultado, ...d.products]; });
    return Array.from(new Map(resultado.map(item => [item.id, item])).values());
}

function filtrarBusquedaPorGenero(productos, genero) {
    return productos.filter(p => {
        const cat = p.category.toLowerCase();
        const title = p.title.toLowerCase();
        if (genero === 'mujer' && (cat.includes('mens') || title.includes('men '))) return false;
        if (genero === 'hombre' && (cat.includes('womens') || cat.includes('dress'))) return false;
        return true;
    });
}

function esVestido(p) {
    return p.title.toLowerCase().includes('dress') || p.category.toLowerCase().includes('dress');
}

function maquillarTitulos(producto) {
    let titulo = producto.title
        .replace("Men's", "")
        .replace("Women's", "")
        .replace("Mens", "")
        .replace("Womens", "")
        .trim();
    return { ...producto, title: titulo };
}

function aplicarFiltrosLocales() {
    const precioMax = parseFloat(document.getElementById('rango-precio').value) || 500;
    const colorSeleccionado = window.filtroColorSeleccionado || null;
    const tallaSeleccionada = window.filtroTallaSeleccionado || null;
    const ocasionesSeleccionadas = window.filtroOcasionesSeleccionadas || [];

    productosFiltrados = todosLosProductos.filter(p => {
        if (p.price > precioMax) return false;
        if (colorSeleccionado && p.colorLocal !== colorSeleccionado) return false;
        if (tallaSeleccionada && p.tallaLocal !== 'Única' && p.tallaLocal !== tallaSeleccionada) return false;
        if (ocasionesSeleccionadas.length > 0) {
            const ocasionP = p.ocasionLocal.toLowerCase();
            const cumple = ocasionesSeleccionadas.some(o => o.toLowerCase() === ocasionP);
            if (!cumple) return false;
        }
        return true;
    });

    const contador = document.getElementById('total-productos');
    if (contador) contador.textContent = `${productosFiltrados.length} productos encontrados`;
}

function actualizarPaginacionVisual(actual, total) {
    const paginacion = document.getElementById('paginacion');
    if (!paginacion) return;
    let html = '';
    if (total <= 1) { paginacion.innerHTML = ''; return; }
    html += `<li class="page-item ${actual === 1 ? 'disabled' : ''}"><button class="page-link" onclick="cambiarPagina(${actual - 1})"><i class="fa-solid fa-chevron-left"></i></button></li>`;
    for(let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= actual - 1 && i <= actual + 1)) {
            html += `<li class="page-item ${i === actual ? 'active' : ''}"><button class="page-link" onclick="cambiarPagina(${i})">${i}</button></li>`;
        } else if (i === actual - 2 || i === actual + 2) {
             html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    html += `<li class="page-item ${actual === total ? 'disabled' : ''}"><button class="page-link" onclick="cambiarPagina(${actual + 1})"><i class="fa-solid fa-chevron-right"></i></button></li>`;
    paginacion.innerHTML = html;
}

window.cambiarPagina = function(p) {
    if(p < 1) return;
    renderizarPagina(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.buscarProductos = function() { cargarProductos(1); }