// EmailJS se carga ahora directamente en el HTML para mayor confiabilidad.

document.addEventListener('DOMContentLoaded', () => {
    // Inyectar el HTML del Carrito si no existe
    if (!document.getElementById('cart-sidebar')) {
        injectCartHTML();
    }
    
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartToggle) cartToggle.onclick = () => openCart();
    if (closeCart) closeCart.onclick = () => closeCartMenu();
    if (cartOverlay) cartOverlay.onclick = () => closeCartMenu();

    renderCart();
});

function injectCartHTML() {
    const cartHTML = `
        <div id="cart-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1500;"></div>
        <div id="cart-sidebar" style="position:fixed; top:0; right:-400px; width:400px; max-width:100%; height:100%; background:var(--bg-color); z-index:2000; transition: 0.3s ease; display:flex; flex-direction:column; border-left: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
                <h2 class="sport-font" style="margin:0;">Tu Carrito</h2>
                <button id="close-cart" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <!-- CONTENIDO DEL CARRITO -->
            <div id="cart-content" style="display:flex; flex:1; flex-direction:column; overflow:hidden;">
                <div id="cart-items" style="flex:1; overflow-y:auto; padding: 2rem;">
                    <!-- Items here -->
                </div>
                <div id="cart-footer" style="padding: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; font-weight:bold; font-size:1.2rem;">
                        <span>Total:</span>
                        <span id="cart-total">$0</span>
                    </div>
                    <button onclick="checkoutWhatsApp()" class="btn-primary checkout-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding: 1.2rem;">
                        <i class="fab fa-whatsapp"></i> FINALIZAR POR WHATSAPP
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', cartHTML);
}

function openCart() {
    document.getElementById('cart-sidebar').style.right = '0';
    document.getElementById('cart-overlay').style.display = 'block';
    renderCart();
}

function closeCartMenu() {
    document.getElementById('cart-sidebar').style.right = '-400px';
    document.getElementById('cart-overlay').style.display = 'none';
}

window.renderCart = () => {
    const cart = getSafeJSON('lc1-cart', []);
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Tu carrito está vacío</p>';
        totalElement.textContent = '$0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;
        return `
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem; align-items:center;">
                <img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <h4 style="font-size:0.9rem; margin:0;">${item.name}</h4>
                    ${item.size ? `<p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Talle: ${item.size}</p>` : ''}
                    <p style="color:var(--primary-color); font-weight:bold; margin:0;">$${item.price.toLocaleString('es-AR')}</p>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
                        <button onclick="changeQty(${index}, -1)" style="background:#333; border:none; color:white; width:20px; border-radius:3px;">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${index}, 1)" style="background:#333; border:none; color:white; width:20px; border-radius:3px;">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');

    totalElement.textContent = `$${total.toLocaleString('es-AR')}`;
};

window.changeQty = (index, delta) => {
    let cart = getSafeJSON('lc1-cart', []);
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('lc1-cart', JSON.stringify(cart));
        renderCart();
        if (window.updateCartCount) window.updateCartCount();
    }
};

window.removeFromCart = (index) => {
    let cart = getSafeJSON('lc1-cart', []);
    cart.splice(index, 1);
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    renderCart();
    if (window.updateCartCount) window.updateCartCount();
};

window.checkoutWhatsApp = () => {
    const cart = getSafeJSON('lc1-cart', []);
    if (cart.length === 0) {
        showToast("Tu carrito está vacío", "error");
        return;
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = Math.floor(Math.random() * 90000) + 10000;

    let orderDetails = cart.map(item => `• ${item.name} ${item.size ? `(Talle ${item.size})` : ''} × ${item.quantity} — $${(item.price * item.quantity).toLocaleString('es-AR')}`).join('\n');

    const waMessage = `🛒 *Nuevo pedido desde LC1 Goalkeeper*\n\n` +
                      `📋 *N° Pedido:* #${orderId}\n\n` +
                      `*Detalle:*\n${orderDetails}\n\n` +
                      `💵 *Total a abonar: $${total.toLocaleString('es-AR')}*\n\n` +
                      `Por favor, confirmar disponibilidad y medios de pago. ¡Gracias! ✅`;

    // Vaciar carrito
    localStorage.removeItem('lc1-cart');
    if (window.updateCartCount) window.updateCartCount();
    renderCart();
    closeCartMenu();

    // Abrir WhatsApp
    const waUrl = `https://wa.me/541140236384?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, '_blank');
};

window.closeCartMenu = () => {
    document.getElementById('cart-sidebar').style.right = '-400px';
    document.getElementById('cart-overlay').style.display = 'none';
    
    // Resetear vistas luego de la animación
    setTimeout(() => {
        document.getElementById('cart-content').style.display = 'flex';
    }, 300);
};
