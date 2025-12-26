// Intentamos obtener el carrito guardado en el navegador (LocalStorage).
// Si no existe, iniciamos un array vacío [].
let carrito = JSON.parse(localStorage.getItem('vestia_carrito')) || [];


//  EVENTO DE CARGA INICIAL
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
    if (document.getElementById('lista-carrito-body')) {
        renderizarPaginaCarrito();
    }
});

// Función llamada desde el botón "Agregar al Carrito" en los productos
function agregarAlCarrito(id, titulo, precio, imagen) {
    const productoExistente = carrito.find(item => item.id === id);
    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({ id, titulo, precio, imagen, cantidad: 1 });
    }
    guardarCarrito();
    actualizarContadorCarrito();
    alert(`¡${titulo} añadido al carrito!`);
}


// Función encargada de dibujar la tabla HTML en cart.html
function renderizarPaginaCarrito() {
    const contenedorVacio = document.getElementById('carrito-vacio');
    const contenedorLleno = document.getElementById('carrito-lleno');
    const tbody = document.getElementById('lista-carrito-body');

    if (!contenedorVacio || !contenedorLleno || !tbody) return;

    if (carrito.length === 0) {
        contenedorVacio.classList.remove('d-none');
        contenedorLleno.classList.add('d-none');
        return;
    }

    contenedorVacio.classList.add('d-none');
    contenedorLleno.classList.remove('d-none');
    
    tbody.innerHTML = '';
    let subtotalGeneral = 0;

    carrito.forEach(producto => {
        const totalProducto = producto.precio * producto.cantidad;
        subtotalGeneral += totalProducto;

        const row = document.createElement('tr');
        
       
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-3">
                    <img src="${producto.imagen}" alt="${producto.titulo}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
                    <div>
                        <h6 class="mb-0 small fw-bold text-dark">${producto.titulo}</h6>
                    </div>
                </div>
            </td>
            
            <td class="fw-bold">$${producto.precio}</td>
            
            <td>
                <div class="d-flex align-items-center border rounded w-auto p-1" style="width: fit-content;">
                    <button class="btn btn-sm btn-light px-2 py-0" onclick="cambiarCantidad(${producto.id}, -1)">-</button>
                    <span class="px-2 small">${producto.cantidad}</span>
                    <button class="btn btn-sm btn-light px-2 py-0" onclick="cambiarCantidad(${producto.id}, 1)">+</button>
                </div>
            </td>
            
            <td class="fw-bold text-gold">$${totalProducto.toFixed(2)}</td>
            
            <td>
                <button class="btn btn-sm text-secondary hover-danger" onclick="eliminarProducto(${producto.id})">
                    <i class="fa-solid fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    actualizarResumen(subtotalGeneral);
}

// Controla los botones de "+" y "-" para agrgar o disminuir la cantidad de pedido de un producto
function cambiarCantidad(id, delta) {
    const item = carrito.find(p => p.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            eliminarProducto(id);
            return;
        }
        guardarCarrito();
        renderizarPaginaCarrito();
        actualizarContadorCarrito();
    }
}

// Elimina un producto específico (Botón X/Papelera)
function eliminarProducto(id) {
    if(confirm('¿Seguro que quieres eliminar este producto?')) {
        carrito = carrito.filter(p => p.id !== id);
        guardarCarrito();
        renderizarPaginaCarrito();
        actualizarContadorCarrito();
    }
}


// Botón "Vaciar Carrito"
function vaciarCarrito() {
    if(confirm('¿Vaciar todo el carrito?')) {
        carrito = [];
        guardarCarrito();
        renderizarPaginaCarrito();
        actualizarContadorCarrito();
    }
}

// Actualiza el texto del precio total
function actualizarResumen(subtotal) {
    const total = subtotal;
    const elemTotal = document.getElementById('resumen-total');
    if (elemTotal) {
        elemTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Guarda el estado actual en el navegador del usuario
function guardarCarrito() {
    localStorage.setItem('vestia_carrito', JSON.stringify(carrito));
}

// Actualiza la burbujita roja con el número de items en el header
function actualizarContadorCarrito() {
    const contador = document.getElementById('cart-count');
    if (contador) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contador.textContent = totalItems;
    }
}