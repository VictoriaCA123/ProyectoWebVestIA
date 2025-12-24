

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos(productos); // Llamamos a la función al cargar la página
});

function cargarProductos(listaProductos) {
    const contenedor = document.getElementById('contenedor-productos');
    
    
    contenedor.innerHTML = '';

    
    listaProductos.forEach(producto => {
        
        
        const etiquetaNuevo = producto.nuevo 
            ? '<span class="badge-new">Nuevo</span>' 
            : '';

        // Crea el HTML de la tarjeta
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

        
        contenedor.innerHTML += tarjetaHTML;
    });
}


function agregarAlCarrito(id) {
    alert(`¡Producto ${id} añadido al carrito!`);
    
}