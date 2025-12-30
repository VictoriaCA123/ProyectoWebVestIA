/**
 * LÓGICA GENERAL DE LA INTERFAZ (GLOBAL)
 */

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

window.actualizarContadorCarrito = actualizarContadorCarrito;