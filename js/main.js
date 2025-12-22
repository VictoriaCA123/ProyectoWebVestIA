// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos(productos); // Llamamos a la función al cargar la página
});

function cargarProductos(listaProductos) {
    const contenedor = document.getElementById('contenedor-productos');
    
    // 1. Limpiamos el mensaje de "Cargando catálogo..."
    contenedor.innerHTML = '';

    // 2. Recorremos la lista de productos y creamos el HTML para cada uno
    listaProductos.forEach(producto => {
        
        // Verificamos si es nuevo para ponerle la etiqueta
        const etiquetaNuevo = producto.nuevo 
            ? '<span class="badge-new">Nuevo</span>' 
            : '';

        // Creamos el HTML de la tarjeta
        const tarjetaHTML = `
            <div class="col">
                <div class="product-card-clean">
                    <div class="img-wrapper">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                        ${etiquetaNuevo}
                        <button class="btn-add-cart" onclick="agregarAlCarrito(${producto.id})">
                            <i class="fa-solid fa-plus"></i> Añadir
                        </button>
                    </div>
                    <div class="info">
                        <h4>${producto.nombre}</h4>
                        <p class="category-tag">${producto.categoria}</p>
                        <p class="price">$${producto.precio.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `;

        // 3. Insertamos la tarjeta en el contenedor
        contenedor.innerHTML += tarjetaHTML;
    });
}

// Función temporal para probar (luego irá en cart.js)
function agregarAlCarrito(id) {
    alert(`¡Producto ${id} añadido al carrito!`);
    // Aquí luego conectaremos con la lógica real del carrito
}