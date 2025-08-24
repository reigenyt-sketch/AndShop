// js/whatsapp.js

(function () {
    'use strict';

    console.log("🟢 whatsapp.js: Script iniciado.");

    // ================================
    // Configuración
    // ================================
    const WA_CONFIG = {
        phone: '56978736507', // <-- Asegúrate de que este sea TU número correcto (solo números, incluyendo código país)
        businessName: 'AndShop',
        defaultMessage: 'Hola, me interesan estos productos:',
        orderSuccessMessage: '¡Pedido enviado! Te responderemos pronto.',
        // domain: 'https://tudominio.com' // Opcional
    };

    // ================================
    // Crear formatter de forma segura
    // ================================
    let formatter;
    try {
        formatter = new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        });
        console.log("✅ whatsapp.js: formatter creado exitosamente.");
    } catch (error) {
        console.error("❌ whatsapp.js: Error al crear formatter:", error);
        // Fallback básico
        formatter = {
            format: (value) => {
                if (typeof value === 'number') {
                    return `S/ ${value.toFixed(2)}`;
                }
                return `S/ 0.00`;
            }
        };
        console.log("⚠️ whatsapp.js: Usando formatter de fallback.");
    }

    // ================================
    // Función principal: Enviar carrito a WhatsApp
    // ================================
    function sendToWhatsApp(cart, customerName = '') {
        console.log("🚀 whatsapp.js: Iniciando sendToWhatsApp con cart:", cart, "y nombre:", customerName);

        // Validar carrito vacío
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            console.warn("⚠️ whatsapp.js: Carrito vacío o inválido.");
            showToast('Tu carrito está vacío. Agrega productos antes de finalizar.', 'error');
            return;
        }

        // Generar y enviar mensaje
        const message = generateWhatsAppMessage(cart, customerName);
        console.log("📄 whatsapp.js: Mensaje generado:", message);
        openWhatsApp(message);
        showToast(WA_CONFIG.orderSuccessMessage, 'success');

        // Opcional: Cerrar el carrito y el modal de confirmación
        document.getElementById('cart-sidebar')?.classList.add('translate-x-full');
        document.getElementById('overlay')?.classList.add('hidden');
        hideOrderConfirmationModal();
    }

    // ================================
    // Generar mensaje formateado
    // ================================
    function generateWhatsAppMessage(cart, customerName) {
        console.log("🧮 whatsapp.js: Generando mensaje para el carrito:", cart);
        let message = '';

        if (customerName && customerName.trim() !== '') {
            message += `Hola, soy *${customerName.trim()}* y me interesan estos productos:\n\n`;
        } else {
            message += `${WA_CONFIG.defaultMessage}\n\n`;
        }

        let total = 0;
        cart.forEach((item, index) => {
            console.log(`📦 whatsapp.js: Procesando item ${index + 1}:`, item);
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const discount = item.discount || 0;
            const unitPrice = price * (1 - discount / 100);
            const subtotal = unitPrice * quantity;
            total += subtotal;

            let itemDescription = item.name || 'Producto sin nombre';
            // Ajustar según la estructura de tu item en el carrito
            if (item.variant) {
                itemDescription += ` (${item.variant.color}, ${item.variant.size})`;
            }
            message += `• ${itemDescription} x${quantity} = ${formatter.format(subtotal)}\n`;
        });

        message += `\n*Total:* ${formatter.format(total)}\n`;
        message += `\n¿Están disponibles?`;

        console.log("✅ whatsapp.js: Mensaje final generado:", message);
        return message;
    }

    // ================================
    // Abrir WhatsApp (móvil o escritorio) - CORREGIDO
    // ================================
    function openWhatsApp(message) {
        console.log("📲 whatsapp.js: Intentando abrir WhatsApp...");
        const encoded = encodeURIComponent(message);
        // Limpiar el número: solo números, incluyendo código de país
        const phone = WA_CONFIG.phone.replace(/\D/g, '');
        console.log("📞 whatsapp.js: Número procesado:", phone);

        // Detectar si es móvil para usar la URL correcta
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log("📱 whatsapp.js: ¿Es móvil?", isMobile);

        let url;
        if (isMobile) {
            // URL correcta para móviles: https://wa.me/NÚMERO?text=MENSAJE
            url = `https://wa.me/${phone}?text=${encoded}`;
        } else {
            // URL correcta para web: https://web.whatsapp.com/send?phone=NÚMERO&text=MENSAJE
            url = `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
        }

        console.log("🔗 whatsapp.js: URL de WhatsApp generada:", url);
        // Abrir en nueva pestaña/ventana
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // ================================
    // Toast elegante (notificación emergente)
    // ================================
    function showToast(text, type = 'info') {
        console.log(`🍞 whatsapp.js: Mostrando toast (${type}):`, text);
        // Evitar toasts duplicados
        const existingToast = document.querySelector('#whatsapp-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'whatsapp-toast'; // Para identificar y remover
        let bgColor, icon;

        switch (type) {
            case 'success':
                bgColor = 'bg-green-500';
                icon = '<i class="fas fa-check-circle mr-2"></i>';
                break;
            case 'error':
                bgColor = 'bg-red-600';
                icon = '<i class="fas fa-times-circle mr-2"></i>';
                break;
            case 'warn':
                bgColor = 'bg-yellow-500';
                icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
                break;
            default:
                bgColor = 'bg-gray-800';
                icon = '';
        }

        toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium z-[100] min-w-48 text-center transition-all duration-300 ease-in-out`;
        toast.style.maxWidth = '90%';
        toast.innerHTML = `
        <div class="flex items-center justify-center">
            ${icon}
            <span>${text}</span>
        </div>
    `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.classList.add('opacity-100', 'translate-y-0'), 10);

        // Desaparecer después de 4 segundos
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300); // Tiempo de la animación de salida
        }, 4000);
    }

    // ================================
    // Mostrar Modal de Confirmación de Pedido
    // ================================
    function showOrderConfirmationModal(cart) {
        console.log("🧾 whatsapp.js: Mostrando modal de confirmación con cart:", cart);

        // Verificar si el modal ya existe y eliminarlo
        const existingModal = document.getElementById('order-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'order-confirmation-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4';
        modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate__animated animate__fadeInUp">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-900">Confirmar Pedido</h3>
                <button id="close-order-modal" class="text-gray-500 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="mb-4">
                <label for="customer-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" id="customer-name-input" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ingresa tu nombre">
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto">
                <h4 class="font-medium text-gray-900 mb-2">Productos:</h4>
                <ul id="order-summary-list" class="text-sm text-gray-700 space-y-1">
                    <!-- Los items se insertan aquí dinámicamente -->
                </ul>
                <div class="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span id="order-total-amount">S/ 0.00</span>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="cancel-order-btn" class="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    Cancelar
                </button>
                <button id="confirm-order-btn" class="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Confirmar
                </button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        // Calcular y mostrar el resumen del pedido
        let total = 0;
        const orderList = modal.querySelector('#order-summary-list');
        const totalAmountElement = modal.querySelector('#order-total-amount');

        cart.forEach(item => {
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const discount = item.discount || 0;
            const unitPrice = price * (1 - discount / 100);
            const subtotal = unitPrice * quantity;
            total += subtotal;

            const listItem = document.createElement('li');
            listItem.textContent = `${item.name} x${quantity} = ${formatter.format(subtotal)}`;
            if (item.variant) {
                const variantInfo = document.createElement('span');
                variantInfo.className = "text-xs text-gray-500 block";
                variantInfo.textContent = `(${item.variant.color}, ${item.variant.size})`;
                listItem.appendChild(variantInfo);
            }
            orderList.appendChild(listItem);
        });

        totalAmountElement.textContent = formatter.format(total);

        // Añadir eventos a los botones del modal
        modal.querySelector('#close-order-modal').addEventListener('click', hideOrderConfirmationModal);
        modal.querySelector('#cancel-order-btn').addEventListener('click', hideOrderConfirmationModal);

        modal.querySelector('#confirm-order-btn').addEventListener('click', () => {
            const customerName = modal.querySelector('#customer-name-input').value.trim();
            sendToWhatsApp(cart, customerName);
        });

        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideOrderConfirmationModal();
            }
        });
    }

    // ================================
    // Ocultar Modal de Confirmación de Pedido
    // ================================
    function hideOrderConfirmationModal() {
        const modal = document.getElementById('order-confirmation-modal');
        if (modal) {
            modal.remove();
        }
    }

    // ================================
    // Inicializar evento del botón principal
    // ================================
    function initWhatsAppCheckout() {
        console.log("🔧 whatsapp.js: Inicializando el evento para el botón #checkout-btn...");
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            console.log("✅ whatsapp.js: Botón #checkout-btn encontrado. Añadiendo event listener.");
            checkoutBtn.addEventListener('click', function (event) {
                console.log("🟢 whatsapp.js: ¡Botón 'Finalizar compra por WhatsApp' clickeado!");
                event.preventDefault();

                // Obtener carrito
                const cartToSend = (window.cart && Array.isArray(window.cart)) ? window.cart : [];
                console.log("🛒 whatsapp.js: Carrito a enviar (desde window.cart):", cartToSend);

                if (cartToSend.length === 0) {
                    showToast('Tu carrito está vacío. Agrega productos antes de finalizar.', 'error');
                    return;
                }

                // Mostrar modal de confirmación
                showOrderConfirmationModal(cartToSend);
            });
        } else {
            console.error("❌ whatsapp.js: Botón 'checkout-btn' NO encontrado en el DOM.");
        }
    }

    // Hacer disponible globalmente
    window.sendToWhatsApp = sendToWhatsApp;
    console.log("✅ whatsapp.js: Función sendToWhatsApp asignada a window.");

    window.initWhatsAppCheckout = initWhatsAppCheckout;
    console.log("✅ whatsapp.js: Función initWhatsAppCheckout asignada a window.");

    // Inicialización automática
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhatsAppCheckout);
        console.log("🟡 whatsapp.js: Programando initWhatsAppCheckout para cuando el DOM esté listo.");
    } else {
        console.log("🟢 whatsapp.js: DOM ya cargado, llamando initWhatsAppCheckout inmediatamente.");
        initWhatsAppCheckout();
    }

    console.log("✅ whatsapp.js: Script finalizado.");
})();
