/**
 * LÓGICA DEL CARRITO 
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-carrito-body')) {
        renderizarCarrito();
    }
});

// === 1. AGREGAR  ===
window.agregarAlCarrito = function(id, titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem('vestia_carrito')) || [];
    const productoExistente = carrito.find(item => item.id === id);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            id: id,
            titulo: titulo,
            precio: parseFloat(precio),
            imagen: imagen,
            cantidad: 1
        });
    }

    localStorage.setItem('vestia_carrito', JSON.stringify(carrito));

    if (window.actualizarContadorCarrito) {
        window.actualizarContadorCarrito();
    }

    mostrarNotificacion(`¡${titulo} añadido al carrito!`);
};

// === 2. RENDERIZAR TABLA  ===
function renderizarCarrito() {
    const tbody = document.getElementById('lista-carrito-body');
    if (!tbody) return; 

    const carrito = JSON.parse(localStorage.getItem('vestia_carrito')) || [];
    const divVacio = document.getElementById('carrito-vacio');
    const divLleno = document.getElementById('carrito-lleno');
    const totalElement = document.getElementById('resumen-total');

    if (carrito.length === 0) {
        divVacio.classList.remove('d-none');
        divLleno.classList.add('d-none');
        return;
    } else {
        divVacio.classList.add('d-none');
        divLleno.classList.remove('d-none');
    }

    tbody.innerHTML = '';
    let totalGlobal = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        totalGlobal += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.imagen}" class="rounded me-3 border" style="width: 60px; height: 60px; object-fit: cover;">
                    <div>
                        <p class="m-0 fw-bold small text-truncate" style="max-width: 180px;" title="${item.titulo}">${item.titulo}</p>
                    </div>
                </div>
            </td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
                <div class="input-group input-group-sm" style="width: 100px;">
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span class="form-control text-center px-0 bg-white">${item.cantidad}</span>
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
            </td>
            <td class="fw-bold">$${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm text-danger" onclick="eliminarItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (totalElement) totalElement.textContent = `$${totalGlobal.toFixed(2)}`;
}

// === 3. FUNCIONES DE CONTROL  ===
window.cambiarCantidad = function(index, delta) {
    let carrito = JSON.parse(localStorage.getItem('vestia_carrito'));
    carrito[index].cantidad += delta;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    localStorage.setItem('vestia_carrito', JSON.stringify(carrito));
    renderizarCarrito();
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
};

window.eliminarItem = function(index) {
    let carrito = JSON.parse(localStorage.getItem('vestia_carrito'));
    carrito.splice(index, 1);
    localStorage.setItem('vestia_carrito', JSON.stringify(carrito));
    renderizarCarrito();
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
};

window.vaciarCarrito = function() {
    localStorage.removeItem('vestia_carrito');
    renderizarCarrito();
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
};

// === 4. NOTIFICACIÓN TOAST ===
function mostrarNotificacion(mensaje) {
    let toast = document.getElementById('toast-notification');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.textContent = mensaje;
    toast.className = 'show';

    setTimeout(() => { 
        toast.className = toast.className.replace('show', ''); 
    }, 3000);
}