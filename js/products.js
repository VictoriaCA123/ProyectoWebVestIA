const ITEMS_POR_PAGINA = 9; 
const API_URL = 'https://dummyjson.com/products';


// Variables de Estado Global (Almacenan los datos en memoria del navegador)
let todosLosProductos = []; 
let productosFiltrados = [];

document.addEventListener('DOMContentLoaded', () => {
    //  LECTURA DE URL: Verifica si ya hay filtros aplicados de la pagina de inicio
    const parametros = new URLSearchParams(window.location.search);
    const filtro = parametros.get('filtro');
    
    
    const busquedaURL = parametros.get('q');
    if (busquedaURL) {
        const inputGlobal = document.getElementById('global-search');
        if(inputGlobal) inputGlobal.value = busquedaURL;
    }
    
    // Si hay filtro desde index, marcamos las opciones en el HTML automáticamente
    if (filtro === 'casual') {
        const check = document.getElementById('ocasion-casual');
        if(check) check.checked = true;
        window.filtroOcasionesSeleccionadas = ['Casual'];
    } 
    else if (filtro === 'formal') {
        const check = document.getElementById('ocasion-formal');
        if(check) check.checked = true;
        window.filtroOcasionesSeleccionadas = ['Formal'];
    }
    else if (filtro === 'deportiva') {
        const select = document.getElementById('filtro-categoria');
        if(select) select.value = 'deportiva';
    }

    //EVENTOS PARA LA BARRA DE BÚSQUEDA POR EL NOMBRE DEL PRODUCTO
    const inputBusqueda = document.getElementById('global-search');
    if (inputBusqueda) {
        
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                cargarProductos(1);
            }
        });
        
        // Buscar mientras se escribe
        let debounceTimer;
        inputBusqueda.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                cargarProductos(1);
            }, 500); 
        });
    }

    
    const selectOrden = document.getElementById('ordenar-productos');
    if (selectOrden) {
        selectOrden.addEventListener('change', () => {
          
            aplicarFiltrosLocales();
        });
    }
    cargarProductos();
});
// Se llama desde filtros.js cuando el usuario cambia un color o talla
window.aplicarFiltrosLocalesExterno = function() {
    aplicarFiltrosLocales();
    renderizarPagina(1);
}
// Se llama desde el botón de la lupa
window.buscarProductos = function() {
    cargarProductos(1);
}
/* NÚCLEO: PETICIÓN A LA API (ASÍNCRONA)     */
async function cargarProductos(pagina = 1) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    if(pagina === 1) contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-warning" role="status"></div></div>';

    const generoInput = document.querySelector('input[name="filtro-genero"]:checked');
    const genero = generoInput ? generoInput.value : 'todos'; 
    const categoriaGen = document.getElementById('filtro-categoria').value; 
    
    // Obtenemos el valor actual del buscador
    const busqueda = document.getElementById('global-search').value.trim();

    let productosCrudos = [];

    try {
        if (busqueda) {
            // Si hay búsqueda, usamos el endpoint de búsqueda de la API
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

        // La API no trae colores ni tallas reales, así que los generamos algorítmicamente
        // para que la tienda sea funcional.
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
                            <button class="btn btn-sm btn-outline-dark rounded-pill px-3" 
                                onclick="agregarAlCarrito(${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.price}, '${p.thumbnail}')">
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

// Duplica los productos para simular un inventario más grande
function expandirInventario(listaProductos) {
    if (listaProductos.length > 50) return listaProductos;
    
    const clones1 = listaProductos.map(p => ({ ...p, id: p.id + 100001 })); 
    const clones2 = listaProductos.map(p => ({ ...p, id: p.id + 200002 }));

    return [...listaProductos, ...clones1, ...clones2].sort(() => Math.random() - 0.5);
}
// Algoritmo determinista para asignar colores (siempre el mismo color para el mismo ID)
function obtenerColorAleatorio(seed, titulo = "") {
    const colores = ['Negro', 'Azul', 'Rojo', 'Amarillo', 'Blanco']; 
    return colores[Math.abs(seed) % colores.length];
}
// se coloca la etiqueta de productos deportivos a algunos productos
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
// Asigna tallas numéricas a zapatos y letras a ropa
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

// Aplica filtros sobre el array 'todosLosProductos' en memoria (sin recargar API)
function aplicarFiltrosLocales() {
    const precioMax = parseFloat(document.getElementById('rango-precio').value) || 500;
    const colorSeleccionado = window.filtroColorSeleccionado || null;
    const tallaSeleccionada = window.filtroTallaSeleccionado || null;
    const ocasionesSeleccionadas = window.filtroOcasionesSeleccionadas || [];
    
    
    const criterioOrden = document.getElementById('ordenar-productos') ? document.getElementById('ordenar-productos').value : 'default';

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

    
    if (criterioOrden === 'precio-asc') {
        productosFiltrados.sort((a, b) => a.price - b.price);
    } else if (criterioOrden === 'precio-desc') {
        productosFiltrados.sort((b, a) => b.price - a.price);
    }
   

    const contador = document.getElementById('total-productos');
    if (contador) contador.textContent = `${productosFiltrados.length} productos encontrados`;
}
// Genera los botones de paginación (Anterior, 1, 2, 3... Siguiente)
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

// Placeholder simple para agregar al carrito (Debe conectar con cart.js)
window.agregarAlCarrito = function(id) {
    console.log(`Producto ${id} agregado.`);
}