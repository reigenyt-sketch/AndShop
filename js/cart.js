// cart.js

// ================================
// Inicializar el carrito desde localStorage
// ================================
window.cart = JSON.parse(localStorage.getItem('cart')) || [];
console.log("Carrito inicializado:", window.cart); // Para depurar

// Hacer que window.cart esté disponible globalmente
// (Tu código Object.defineProperty está bien, lo dejamos)
Object.defineProperty(window, 'cart', {
    value: window.cart,
    writable: true,
    enumerable: true,
    configurable: false
});

// ================================
// Función: Actualizar UI del carrito
// ================================
function updateCart() {
    console.log('🛒 Actualizando carrito:', window.cart);

    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    if (!countEl || !itemsEl || !totalEl) {
        console.warn('⚠️ No se encontraron elementos del carrito en el DOM');
        return;
    }

    // Actualizar contador
    const totalCount = window.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    countEl.textContent = totalCount;

    // Limpiar lista
    itemsEl.innerHTML = '';
    let total = 0;

    // Renderizar productos
    if (window.cart.length === 0) {
        itemsEl.innerHTML = '<p class="text-gray-500 text-center py-4">Tu carrito está vacío.</p>';
        totalEl.textContent = formatter.format(0);
        return;
    }

    window.cart.forEach(item => {
        // Asegurar valores por defecto
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const discount = item.discount || 0;
        const finalPricePerItem = price * (1 - discount / 100);
        const itemTotal = finalPricePerItem * quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'flex justify-between mb-4 border-b pb-2';
        div.innerHTML = `
            <div>
                <p class="font-medium">${item.name}</p>
                <p class="text-sm text-gray-500">
                    ${formatter.format(finalPricePerItem)} x ${quantity}
                </p>
            </div>
            <div class="flex items-center">
                <button 
                    class="text-red-500 text-sm ml-2 remove-item hover:scale-125 transition-transform" 
                    data-id="${item.id}" 
                    aria-label="Eliminar ${item.name} del carrito"
                >×</button>
            </div>
        `;
        itemsEl.appendChild(div);
    });

    // Actualizar total con formatter (S/)
    totalEl.textContent = formatter.format(total);

    // Persistir en localStorage
    localStorage.setItem('cart', JSON.stringify(window.cart));

    // Asegurar que el sidebar se actualice si está abierto
    // (Este paso puede no ser necesario si updateCart se llama después de cualquier cambio)
}

// ================================
// Función: Agregar producto al carrito
// ================================
function addToCart(product) {
    if (!product || !product.id) {
        console.error('❌ Producto inválido para agregar al carrito:', product);
        return;
    }

    const existingItemIndex = window.cart.findIndex(item => item.id === product.id);

    if (existingItemIndex !== -1) {
        // Si ya existe, aumentar cantidad
        window.cart[existingItemIndex].quantity = (window.cart[existingItemIndex].quantity || 1) + 1;
        console.log(`Cantidad aumentada para ${product.name}. Nueva cantidad: ${window.cart[existingItemIndex].quantity}`);
    } else {
        // Si no existe, agregar nuevo item
        // Asegurarse de que tenga al menos quantity = 1
        const newItem = { ...product, quantity: product.quantity || 1 };
        window.cart.push(newItem);
        console.log(`Producto agregado al carrito: ${product.name}`);
    }

    updateCart(); // Actualizar UI
}

// Hacer disponible globalmente
window.addToCart = addToCart;

// ================================
// Animación: producto volando al carrito
// ================================
function animateProductToCart(product) {
    const imgSrc = product.image; // Usar la imagen directamente
    const cartIcon = document.getElementById('cart-icon');
    if (!cartIcon || !imgSrc) {
        console.warn("No se puede animar, falta imagen o icono del carrito");
        return;
    }

    const flyImg = document.createElement('img');
    flyImg.src = imgSrc;
    flyImg.alt = 'Agregando al carrito';
    flyImg.setAttribute('aria-hidden', 'true');
    flyImg.style.cssText = `
        position: fixed;
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 0.5rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        pointer-events: none;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(flyImg);

    const rect = cartIcon.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - window.innerWidth / 2;
    const y = rect.top + rect.height / 2 - window.innerHeight / 2;

    // Usar GSAP para la animación
    if (typeof gsap !== 'undefined') {
        gsap.to(flyImg, {
            duration: 0.8,
            x: x,
            y: y,
            scale: 0.1,
            opacity: 0,
            ease: 'power2.out',
            onComplete: () => {
                document.body.removeChild(flyImg);
            }
        });
    } else {
        // Fallback si GSAP no está disponible
        console.warn("GSAP no disponible, animación omitida.");
        document.body.removeChild(flyImg);
    }
}


// ================================
// Eventos del carrito: abrir, cerrar, overlay
// ================================
document.getElementById('cart-icon')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.remove('translate-x-full');
    document.getElementById('overlay')?.classList.remove('hidden');
});

document.getElementById('close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.add('translate-x-full');
    document.getElementById('overlay')?.classList.add('hidden');
});

document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.add('translate-x-full');
    document.getElementById('overlay')?.classList.add('hidden');
});

// ================================
// Eliminar producto
// ================================
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('remove-item')) {
        const id = e.target.dataset.id;
        console.log("Intentando eliminar producto con ID:", id); // Para depurar
        if (!id) {
            console.error("Botón de eliminar sin ID");
            return;
        }
        // Filtrar el carrito para excluir el item con ese ID
        const newCart = window.cart.filter(item => {
            console.log(`Comparando item.id: ${item.id} con id a eliminar: ${id}`); // Para depurar
            return item.id != id; // Usar != para comparar string/number
        });
        console.log("Carrito después de filtrar:", newCart); // Para depurar
        window.cart = newCart; // Actualizar el carrito global
        updateCart(); // Volver a renderizar
    }
});

// ================================
// Inicializar al cargar
// ================================
document.addEventListener('DOMContentLoaded', () => {
    updateCart(); // Cargar el carrito desde localStorage y actualizar la UI
});
