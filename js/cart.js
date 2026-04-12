// Lógica del Carrito y Sidebar
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
        <div id="cart-sidebar" style="position:fixed; top:0; right:-400px; width:400px; height:100%; background:var(--bg-color); z-index:2000; transition: 0.3s ease; display:flex; flex-direction:column; border-left: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
                <h2 class="sport-font" style="margin:0;">Tu Carrito</h2>
                <button id="close-cart" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            <div id="cart-items" style="flex:1; overflow-y:auto; padding: 2rem;">
                <!-- Items here -->
            </div>
            <div id="cart-footer" style="padding: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; font-weight:bold; font-size:1.2rem;">
                    <span>Total:</span>
                    <span id="cart-total">$0</span>
                </div>
                <button onclick="checkout()" class="btn-primary" style="width:100%;">Finalizar por WhatsApp</button>
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
    const cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Tu carrito está vacío</p>';
        totalElement.textContent = '$0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem; align-items:center;">
                <img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <h4 style="font-size:0.9rem; margin:0;">${item.name}</h4>
                    <p style="color:var(--primary-color); font-weight:bold; margin:0;">$${item.price.toLocaleString('es-AR')}</p>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
                        <button onclick="changeQty(${item.id}, -1)" style="background:#333; border:none; color:white; width:20px; border-radius:3px;">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)" style="background:#333; border:none; color:white; width:20px; border-radius:3px;">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');

    totalElement.textContent = `$${total.toLocaleString('es-AR')}`;
};

window.changeQty = (id, delta) => {
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        localStorage.setItem('lc1-cart', JSON.stringify(cart));
        renderCart();
        if (window.updateCartCount) window.updateCartCount();
    }
};

window.removeFromCart = (id) => {
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    renderCart();
    if (window.updateCartCount) window.updateCartCount();
};

window.checkout = () => {
    const cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    if (cart.length === 0) return alert("El carrito está vacío");

    // Guardar el pedido en el historial para el admin
    const orders = JSON.parse(localStorage.getItem('lc1-orders-db')) || [];
    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        items: cart,
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        status: 'Pendiente'
    };
    orders.push(newOrder);
    localStorage.setItem('lc1-orders-db', JSON.stringify(orders));

    let message = "¡Hola LC1 Goalkeeper! 👋 Quiero realizar el siguiente pedido:\n\n";
    let total = 0;

    cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
        total += item.price * item.quantity;
    });

    message += `\n💰 *Total: $${total.toLocaleString('es-AR')}*`;
    message += `\n\nPor favor, confirmame disponibilidad y métodos de pago.`;

    const encodedMessage = encodeURIComponent(message);
    const settings = JSON.parse(localStorage.getItem('lc1-settings')) || (window.LC1_Data ? window.LC1_Data.settings : { whatsapp: '541140236384' });
    const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodedMessage}`;
    
    // Vaciar carrito después de comprar
    localStorage.removeItem('lc1-cart');
    renderCart();
    if (window.updateCartCount) window.updateCartCount();

    window.open(whatsappUrl, '_blank');
};
