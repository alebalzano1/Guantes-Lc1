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

    // 3. Botón Comprar ahora (Carrito)
    const btnCart = document.getElementById('btn-add-cart');
    if (btnCart) {
        btnCart.onclick = () => {
            addToCart(product);
            if (window.openCart) window.openCart();
        };
    }

    // 4. Botón WhatsApp
    const btnWA = document.getElementById('btn-wa-direct');
    if (btnWA) {
        btnWA.onclick = () => {
            const msg = `Hola LC1! 👋 Quiero comprar el producto: *${product.name}* que tiene un precio de *$${product.price.toLocaleString('es-AR')}*. ¿Tienen stock?`;
            const settings = JSON.parse(localStorage.getItem('lc1-settings')) || (window.LC1_Data ? window.LC1_Data.settings : { whatsapp: '541140236384' });
            window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    if (window.renderCart) window.renderCart();
    if (window.updateCartCount) window.updateCartCount();
}
