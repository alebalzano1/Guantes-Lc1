// Lógica de la Página de Detalle de Producto
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    // Buscar el producto en los datos cargados (products-data.js)
    const product = window.LC1_Data.products.find(p => p.id === productId);

    if (!product) {
        document.body.innerHTML = `<div style="text-align:center; padding:5rem; color:white;"><h1>Producto no encontrado</h1><a href="shop.html" style="color:var(--primary-color);">Volver a la tienda</a></div>`;
        return;
    }

    renderProductDetail(product);
});

function renderProductDetail(product) {
    // 1. Set Title and Metadata
    document.title = `${product.name} | LC1 Goalkeeper`;
    
    // 2. Fill the HTML
    const mainImg = document.getElementById('pd-image');
    const title = document.getElementById('pd-title');
    const price = document.getElementById('pd-price');
    const desc = document.getElementById('pd-desc');
    const badgeContainer = document.getElementById('pd-badges');

    if (mainImg) mainImg.src = product.image;
    if (title) title.textContent = product.name;
    if (price) price.textContent = `$${product.price.toLocaleString('es-AR')}`;
    if (desc) desc.textContent = product.desc || "Experimenta el máximo nivel de control y protección con los guantes LC1. Diseñados para arqueros de alto rendimiento.";

    // Badges dinámicos (Solo categoría para ser 100% honestos)
    if (badgeContainer) {
        badgeContainer.innerHTML = `<span class="pd-badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">${product.category}</span>`;
    }

    // 2.5 Galería de imágenes (Carrusel)
    const thumbnailsContainer = document.getElementById('pd-thumbnails');
    const btnPrev = document.getElementById('pd-prev');
    const btnNext = document.getElementById('pd-next');
    let currentImageIndex = 0;

    if (thumbnailsContainer && product.images && product.images.length > 1) {
        if (btnPrev) btnPrev.style.display = 'block';
        if (btnNext) btnNext.style.display = 'block';

        const updateMainImage = (index) => {
            currentImageIndex = index;
            if (mainImg) mainImg.src = product.images[index];
            Array.from(thumbnailsContainer.children).forEach((c, idx) => {
                c.style.borderColor = idx === index ? 'var(--primary-color)' : 'transparent';
            });
        };

        if (btnPrev) {
            btnPrev.onclick = () => {
                let newIdx = currentImageIndex - 1;
                if (newIdx < 0) newIdx = product.images.length - 1;
                updateMainImage(newIdx);
            };
        }

        if (btnNext) {
            btnNext.onclick = () => {
                let newIdx = currentImageIndex + 1;
                if (newIdx >= product.images.length) newIdx = 0;
                updateMainImage(newIdx);
            };
        }

        thumbnailsContainer.innerHTML = '';
        product.images.forEach((imgSrc, idx) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.style.cssText = 'width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: 0.3s; flex-shrink:0;';
            thumb.onclick = () => updateMainImage(idx);
            thumbnailsContainer.appendChild(thumb);
        });
        // Select first automatically
        if (thumbnailsContainer.firstChild) thumbnailsContainer.firstChild.style.borderColor = 'var(--primary-color)';
    }

    // 2.8 Configurar selector de talle dependiendo de la categoría
    const sizeSelect = document.getElementById('size-select');
    if (sizeSelect && product.category === 'indumentaria') {
        sizeSelect.innerHTML = `
            <option value="" disabled selected>Elegí un talle</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
        `;
    }

    // Validación de Talle Helper
    const validateSize = () => {
        const errorMsg = document.getElementById('size-error');
        if (sizeSelect && !sizeSelect.value) {
            errorMsg.style.display = 'block';
            return null;
        }
        if (errorMsg) errorMsg.style.display = 'none';
        return sizeSelect ? sizeSelect.value : null;
    };

    // 3. Botón Comprar ahora (Carrito)
    const btnCart = document.getElementById('btn-add-cart');
    if (btnCart) {
        btnCart.onclick = () => {
            const size = validateSize();
            if (!size) return;
            addToCart(product, size);
            if (window.openCart) window.openCart();
        };
    }

    // 4. Botón WhatsApp
    const btnWA = document.getElementById('btn-wa-direct');
    if (btnWA) {
        btnWA.onclick = () => {
            const size = validateSize();
            if (!size) return;
            const msg = `Hola LC1! 👋 Quiero comprar el producto: *${product.name}* (Talle: ${size}) que tiene un precio de *$${product.price.toLocaleString('es-AR')}*. ¿Tienen stock?`;
            const settings = JSON.parse(localStorage.getItem('lc1-settings')) || (window.LC1_Data ? window.LC1_Data.settings : { whatsapp: '541140236384' });
            window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }
}

function addToCart(product, size) {
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    const existing = cart.find(item => item.id === product.id && item.size === size);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: 1
        });
    }
    
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    if (window.renderCart) window.renderCart();
    if (window.updateCartCount) window.updateCartCount();
}
