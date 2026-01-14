/* Lógica de arranque: Apenas carga la página, actualizamos el numerito del carrito, ponemos la foto del usuario en el header y activamos el botón de cerrar del chat. */
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
    cargarFotoPerfilHeader();

    const chatWindow = document.getElementById('asistente-estilo');
    const btnClose = chatWindow?.querySelector('.btn-close');
    
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            chatWindow.style.display = 'none';
        });
    }
});

/* Busca si hay una foto guardada en el navegador. Si no hay (o falla al cargar), pone un avatar 3D genérico para que se vea bien. */
function cargarFotoPerfilHeader() {
    const imgElement = document.getElementById('header-profile-img');
    if (!imgElement) return; 

    const avatarPorDefecto = 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';
    const fotoGuardada = localStorage.getItem('vestia_user_photo');

    if (fotoGuardada) {
        imgElement.src = fotoGuardada;
    } else {
        imgElement.src = avatarPorDefecto;
    }

    imgElement.onerror = function() {
        this.src = avatarPorDefecto;
    };
}

/* Suma todos los productos que hay guardados en el carrito y actualiza la burbuja roja del icono. Si es 0, la esconde para que se vea más limpio. */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('vestia_carrito')) || [];
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contadores = document.querySelectorAll('#cart-count');
    contadores.forEach(badge => {
        badge.textContent = totalItems;
        
        if (totalItems === 0) {
            badge.classList.add('d-none');
        } else {
            badge.classList.remove('d-none');
        }
    });
}

/* Exportamos esto para que otros scripts (como el de agregar productos) puedan actualizar el contador en tiempo real sin recargar la página. */
window.actualizarContadorCarrito = actualizarContadorCarrito;