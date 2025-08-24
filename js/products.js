// products.js

// --- Configuración Inicial ---
const container = document.getElementById('products-container');
const formatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2
});

let allProducts = [];
let selectedProduct = null;
let selectedVariant = null;

// --- Carga de Productos ---
async function loadProducts() {
  try {
    const response = await fetch('data/products.json?v=' + Date.now());
    if (!response.ok) throw new Error('HTTP ' + response.status);
    allProducts = await response.json();
    console.log("✅ Productos cargados:", allProducts);
  } catch (error) {
    console.error('⚠️ Error cargando products.json:', error);
    // Fallback a datos locales si es necesario
    // allProducts = [ ... ];
  }
  renderAllSections();
  setupCategoryFilters();
}

// --- Renderizado de Productos ---
function renderAllSections() {
  if (!container) return;
  container.innerHTML = '';

  const grouped = allProducts.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});

  Object.keys(grouped).forEach(category => {
    const products = grouped[category];
    if (products.length === 0) return;

    const section = document.createElement('div');
    section.classList.add('mb-16');
    section.setAttribute('data-category-section', category);
    section.innerHTML = `
            <h3 class="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span class="h-1 w-8 bg-primary mr-3"></span>
                ${categoryNames[category] || category}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"></div>
        `;
    const grid = section.querySelector('div.grid');

    products.forEach(product => {
      const card = createProductCard(product);
      grid.appendChild(card);
    });

    container.appendChild(section);
  });
}

function createProductCard(product) {
  const hasDiscount = product.discount && product.discount > 0;
  const finalPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;
  const mainImage = product.images?.[0] || product.image;
  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const isOutOfStock = totalStock === 0;

  const card = document.createElement('article');
  card.className = 'bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer';

  // Asignar un ID único a la tarjeta para asociar el evento
  const cardId = `product-card-${product.id}`;
  card.id = cardId;

  card.innerHTML = `
        <div class="relative h-64 overflow-hidden">
            <img src="${mainImage}" alt="${product.name}" class="main-image w-full h-full object-cover transition-transform duration-700 hover:scale-110">
            ${isOutOfStock ? '<span class="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">Agotado</span>' : ''}
            ${hasDiscount ? '<span class="absolute top-3 left-3 bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">-' + product.discount + '%</span>' : ''}
        </div>
        <div class="p-5">
            <h3 class="text-xl font-semibold text-gray-900 mb-1">${product.name}</h3>
            <div class="flex items-center gap-2 mb-3">
                ${hasDiscount ? `
                    <span class="text-gray-500 line-through text-sm">${formatter.format(product.price)}</span>
                    <span class="text-primary font-bold">${formatter.format(finalPrice)}</span>
                ` : `
                    <span class="text-primary font-bold">${formatter.format(product.price)}</span>
                `}
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description}</p>
            <button id="view-btn-${product.id}" class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Agotado' : 'Ver producto'}
            </button>
        </div>
    `;

  return card;
}

// --- Manejo de Eventos después del Renderizado ---
document.addEventListener('DOMContentLoaded', () => {
  // Este listener se ejecutará una vez que todo el HTML esté cargado
  // y los elementos creados dinámicamente estén en el DOM.

  // Delegación de eventos para los botones "Ver producto"
  container.addEventListener('click', (e) => {
    // Verificar si el clic fue en un botón "Ver producto"
    if (e.target && e.target.id.startsWith('view-btn-')) {
      const productId = parseInt(e.target.id.replace('view-btn-', ''));
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        console.log("🟢 Abriendo modal para:", product.name);
        openProductModal(product);
      } else {
        console.error("🔴 Producto no encontrado para ID:", productId);
      }
    }
  });
});

// --- Función auxiliar para actualizar la miniatura activa ---
function updateActiveThumbnail(thumbnailsContainer, activeImageSrc) {
  const allThumbs = thumbnailsContainer.querySelectorAll('button');
  allThumbs.forEach(btn => {
    const img = btn.querySelector('img');
    // Comparamos el src de la imagen. Es importante asegurarse de que ambos sean URLs absolutas o relativas.
    // El navegador normaliza el src a una URL absoluta, por lo que comparamos con eso.
    if (img && img.src === activeImageSrc) {
      btn.classList.add('border-primary', 'ring-2', 'ring-primary'); // Añadir clases para destacar
      btn.classList.remove('border-transparent');
    } else {
      btn.classList.remove('border-primary', 'ring-2', 'ring-primary');
      btn.classList.add('border-transparent');
    }
  });
}

// --- Modal de Producto ---
function openProductModal(product) {
  selectedProduct = product;
  selectedVariant = null;
  console.log("📁 Producto seleccionado para modal:", product);

  const modal = document.getElementById('product-modal');
  const elements = {
    image: document.getElementById('modal-product-image'),
    thumbnails: document.getElementById('modal-thumbnails'), // Asegúrate de que este ID exista en tu HTML
    name: document.getElementById('modal-product-name'),
    description: document.getElementById('modal-product-description'),
    price: document.getElementById('modal-product-price'),
    discount: document.getElementById('modal-product-discount'),
    sizes: document.getElementById('modal-sizes'),
    colors: document.getElementById('modal-colors'),
    addToCartBtn: document.getElementById('modal-add-to-cart')
  };

  // Validación de elementos del modal
  for (let key in elements) {
    if (!elements[key]) {
      console.error(`❌ Elemento del modal no encontrado: #modal-product-${key}`);
      return;
    }
  }

  // Reset UI
  elements.thumbnails.innerHTML = ''; // Limpiar miniaturas
  elements.sizes.innerHTML = '';
  elements.colors.innerHTML = '';
  elements.addToCartBtn.disabled = true;
  elements.discount.classList.add('hidden');

  // Datos básicos
  elements.name.textContent = product.name;
  elements.description.textContent = product.description;
  elements.price.textContent = formatter.format(0);

  if (product.discount && product.discount > 0) {
    elements.discount.textContent = `-${product.discount}%`;
    elements.discount.classList.remove('hidden');
  }

  // --- Manejo de Imágenes ---
  const imagesToUse = product.images && product.images.length > 0 ? product.images : [product.image];

  if (imagesToUse.length > 0) {
    // Imagen principal inicial
    elements.image.src = imagesToUse[0];
    elements.image.alt = product.name;

    // Si hay más de una imagen, mostrar miniaturas
    if (imagesToUse.length > 1) {
      imagesToUse.forEach((imgSrc, index) => {
        const thumbButton = document.createElement('button');
        thumbButton.type = 'button';
        thumbButton.className = 'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';
        // Resaltar la primera miniatura como activa
        if (index === 0) {
          thumbButton.classList.add('border-primary', 'ring-2', 'ring-primary');
        } else {
          thumbButton.classList.add('border-transparent');
        }

        const thumbImg = document.createElement('img');
        thumbImg.src = imgSrc;
        thumbImg.alt = `Vista ${index + 1} de ${product.name}`;
        thumbImg.className = 'w-full h-full object-cover';

        thumbButton.appendChild(thumbImg);
        elements.thumbnails.appendChild(thumbButton);

        // Añadir evento para cambiar la imagen principal
        thumbButton.addEventListener('click', () => {
          elements.image.src = imgSrc;
          // Actualizar clases de borde para indicar la imagen activa
          updateActiveThumbnail(elements.thumbnails, imgSrc);
        });
      });
      // Asegurar que el contenedor de miniaturas sea visible
      elements.thumbnails.parentElement?.classList.remove('hidden');
    } else {
      // Si solo hay una imagen, ocultar el contenedor de miniaturas
      elements.thumbnails.parentElement?.classList.add('hidden');
    }
  } else {
    // Manejar caso sin imágenes
    elements.image.src = ''; // O una imagen por defecto
    elements.image.alt = 'Imagen no disponible';
    elements.thumbnails.parentElement?.classList.add('hidden');
  }

  // --- Manejo de Variantes ---
  const variants = product.variants || [];
  if (variants.length === 0) {
    elements.colors.innerHTML = '<p class="text-gray-500">Colores no disponibles</p>';
    elements.sizes.innerHTML = '<p class="text-gray-500">Tallas no disponibles</p>';
    return;
  }

  // Agrupar variantes por color
  const variantsByColor = variants.reduce((acc, v) => {
    acc[v.color] = acc[v.color] || [];
    acc[v.color].push(v);
    return acc;
  }, {});

  // --- Renderizar Colores ---
  Object.keys(variantsByColor).forEach(color => {
    const button = document.createElement('button');
    button.textContent = color;
    button.className = 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary';
    button.dataset.color = color;

    button.addEventListener('click', () => {
      // Actualizar UI de selección de color
      document.querySelectorAll('#modal-colors button').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white', 'border-primary');
        btn.classList.add('border-gray-300');
      });
      button.classList.remove('border-gray-300');
      button.classList.add('bg-primary', 'text-white', 'border-primary');

      // --- Cambiar imagen principal al seleccionar color ---
      // Usar la imagen de la primera variante de ese color, si existe
      const firstVariantOfColor = variantsByColor[color][0];
      if (firstVariantOfColor.image) {
        elements.image.src = firstVariantOfColor.image;
        elements.image.alt = `${product.name} - ${color}`;
        console.log("🖼️ Imagen cambiada al color:", color, firstVariantOfColor.image);
        // También actualizar la miniatura activa si esta imagen está en la lista
        updateActiveThumbnail(elements.thumbnails, firstVariantOfColor.image);
      } else if (product.images && product.images.length > 0) {
        // Si no hay imagen específica en la variante, volver a la primera imagen del producto
        elements.image.src = product.images[0];
        elements.image.alt = product.name;
        updateActiveThumbnail(elements.thumbnails, product.images[0]);
      }

      // Actualizar tallas disponibles
      updateSizeOptions(variantsByColor[color], elements);
    });

    elements.colors.appendChild(button);
  });

  // Mostrar modal
  modal.classList.remove('hidden');
  // Asegurar que el contenedor de miniaturas esté visible si hay más de una imagen
  if (imagesToUse.length > 1) {
    elements.thumbnails.parentElement?.classList.remove('hidden');
  }
}

function updateSizeOptions(colorVariants, elements) {
  elements.sizes.innerHTML = '';
  if (!colorVariants || colorVariants.length === 0) {
    elements.sizes.innerHTML = '<p class="text-gray-500">No hay tallas disponibles para este color.</p>';
    elements.price.textContent = formatter.format(0);
    selectedVariant = null;
    elements.addToCartBtn.disabled = true;
    return;
  }

  colorVariants.forEach(variant => {
    let quantityInCart = 0;
    if (window.cart && Array.isArray(window.cart)) {
      const cartItem = window.cart.find(item => item.id === `${selectedProduct.id}-${variant.color}-${variant.size}`);
      quantityInCart = cartItem ? cartItem.quantity || 0 : 0;
    }
    const availableStock = variant.stock - quantityInCart;

    const button = document.createElement('button');
    button.textContent = `${variant.size} (${availableStock} disp.)`;
    button.className = 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary relative';
    button.dataset.size = variant.size;

    if (availableStock <= 0) {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
      button.textContent = `${variant.size} (Agotado)`;
    }

    button.addEventListener('click', () => {
      if (availableStock <= 0) return;

      // Actualizar UI de selección de talla
      document.querySelectorAll('#modal-sizes button').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white', 'border-primary');
        btn.classList.add('border-gray-300');
      });
      button.classList.remove('border-gray-300');
      button.classList.add('bg-primary', 'text-white', 'border-primary');

      // --- Cambiar imagen principal al seleccionar talla ---
      // Si la variante tiene una imagen específica, usarla
      if (variant.image) {
        const modalImage = document.getElementById('modal-product-image');
        modalImage.src = variant.image;
        modalImage.alt = `${selectedProduct.name} - ${variant.color} - ${variant.size}`;
        console.log("🖼️ Imagen cambiada a talla:", variant.size, variant.image);
        // Actualizar la miniatura activa
        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        updateActiveThumbnail(thumbnailsContainer, variant.image);
      }

      // Actualizar precio y variante seleccionada
      selectedVariant = variant;
      const finalPrice = selectedProduct.price * (1 - (selectedProduct.discount || 0) / 100);
      elements.price.textContent = formatter.format(finalPrice);
      elements.addToCartBtn.disabled = false;
    });

    elements.sizes.appendChild(button);
  });
}

// --- Cerrar Modal ---
document.getElementById('close-product-modal')?.addEventListener('click', () => {
  document.getElementById('product-modal')?.classList.add('hidden');
});
document.getElementById('product-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('product-modal')) {
    document.getElementById('product-modal')?.classList.add('hidden');
  }
});

// --- Agregar al Carrito desde el Modal ---
document.getElementById('modal-add-to-cart')?.addEventListener('click', () => {
  if (!selectedVariant || !selectedProduct) {
    alert("Por favor, selecciona un color y una talla.");
    return;
  }

  // Verificación final de stock
  let quantityInCart = 0;
  if (window.cart && Array.isArray(window.cart)) {
    const cartItem = window.cart.find(item => item.id === `${selectedProduct.id}-${selectedVariant.color}-${selectedVariant.size}`);
    quantityInCart = cartItem ? cartItem.quantity || 0 : 0;
  }
  const availableStock = selectedVariant.stock - quantityInCart;

  if (availableStock <= 0) {
    alert("Este producto está agotado.");
    updateSizeOptions(
      selectedProduct.variants.filter(v => v.color === selectedVariant.color),
      {
        sizes: document.getElementById('modal-sizes'),
        price: document.getElementById('modal-product-price'),
        addToCartBtn: document.getElementById('modal-add-to-cart')
      }
    );
    return;
  }

  const cartItem = {
    id: `${selectedProduct.id}-${selectedVariant.color}-${selectedVariant.size}`,
    productId: selectedProduct.id,
    name: `${selectedProduct.name} (${selectedVariant.color}, ${selectedVariant.size})`,
    price: selectedProduct.price,
    discount: selectedProduct.discount,
    image: selectedVariant.image || selectedProduct.image,
    variant: {
      color: selectedVariant.color,
      size: selectedVariant.size,
      stock: selectedVariant.stock
    },
    quantity: 1
  };

  console.log("🛒 Agregando al carrito:", cartItem);
  if (typeof window.addToCart === 'function') {
    window.addToCart(cartItem);
    if (typeof animateProductToCart === 'function') {
      animateProductToCart({ ...selectedProduct, image: cartItem.image });
    }
    document.getElementById('product-modal').classList.add('hidden');
  } else {
    console.error("❌ window.addToCart no está definida");
    alert("Error al agregar al carrito.");
  }
});

// --- Filtros de Categoría ---
const categoryNames = {
  all: 'Todos los productos',
  calzado: 'Calzado',
  ropa: 'Ropa',
  accesorios: 'Accesorios',
  tecnologia: 'Tecnología',
  deporte: 'Deporte'
};

function setupCategoryFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active', 'text-primary', 'border-b-2'));
      btn.classList.add('active', 'text-primary', 'border-b-2');

      const category = btn.dataset.category;
      document.querySelectorAll('[data-category-section]').forEach(section => {
        section.style.display = (category === 'all' || section.dataset.categorySection === category) ? 'block' : 'none';
      });
    });
  });
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});
