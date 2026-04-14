// Lógica del Carrito y Sidebar

// Cargar EmailJS Dinámicamente para el Checkout
if (!window.emailjs) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = () => {
        emailjs.init({ publicKey: "J4gkoDsXKglIVQM4m" });
    };
    document.head.appendChild(script);
}

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
                    <button onclick="showCheckoutForm()" class="btn-primary checkout-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding: 1.2rem;">
                        <i class="fas fa-check"></i> CONTINUAR COMPRA
                    </button>
                </div>
            </div>

            <!-- FORMULARIO DE CHECKOUT -->
            <div id="checkout-form-container" style="display:none; flex:1; flex-direction:column; padding: 2rem; overflow-y:auto;">
                <h3 class="sport-font" style="margin-bottom: 1.5rem; color:var(--primary-color);">Datos de Contacto</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:var(--text-muted);">Nombre y Apellido</label>
                    <input type="text" id="checkout-name" placeholder="Ej: Juan Pérez" style="width:100%; padding:0.8rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:4px;" required>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:var(--text-muted);">Email</label>
                    <input type="email" id="checkout-email" placeholder="tu@email.com" style="width:100%; padding:0.8rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:4px;" required>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:var(--text-muted);">Teléfono</label>
                    <input type="tel" id="checkout-phone" placeholder="Ej: 11 1234 5678" style="width:100%; padding:0.8rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:4px;" required>
                </div>
                <button onclick="submitOrder()" id="btn-submit-order" class="btn-primary checkout-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding: 1.2rem;">
                    <i class="fas fa-paper-plane"></i> CONFIRMAR PEDIDO
                </button>
                <button onclick="hideCheckoutForm()" style="width:100%; background:transparent; border:none; color:var(--text-muted); padding: 1rem; margin-top:0.5rem; cursor:pointer;">
                    Volver al carrito
                </button>
            </div>

            <!-- COMPRA EXITOSA -->
            <div id="checkout-success" style="display:none; flex:1; flex-direction:column; padding: 2rem; align-items:center; justify-content:center; text-align:center;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--primary-color); margin-bottom:1.5rem;"></i>
                <h3 class="sport-font" style="margin-bottom: 1rem; font-size: 1.5rem;">¡Pedido Completado!</h3>
                <p id="success-order-number" style="color:var(--text-muted); margin-bottom:1.5rem; font-weight:bold; font-size:1.1rem;"></p>
                <p style="color:white; margin-bottom:2rem; line-height:1.6;">Te hemos enviado un correo electrónico con las instrucciones para abonar mediante transferencia bancaria.</p>
                <button onclick="closeCartMenu()" class="btn-primary checkout-btn" style="width:100%; padding: 1rem;">
                    ENTENDIDO
                </button>
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
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('lc1-cart', JSON.stringify(cart));
        renderCart();
        if (window.updateCartCount) window.updateCartCount();
    }
};

window.removeFromCart = (index) => {
    let cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    renderCart();
    if (window.updateCartCount) window.updateCartCount();
};

window.showCheckoutForm = () => {
    const cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    if (cart.length === 0) return alert("El carrito está vacío");
    document.getElementById('cart-content').style.display = 'none';
    document.getElementById('checkout-form-container').style.display = 'flex';
};

window.hideCheckoutForm = () => {
    document.getElementById('checkout-form-container').style.display = 'none';
    document.getElementById('cart-content').style.display = 'flex';
};

window.submitOrder = () => {
    const name = document.getElementById('checkout-name').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();

    if (!name || !email || !phone) {
        alert("Por favor completa tus datos.");
        return;
    }

    const btn = document.getElementById('btn-submit-order');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
    btn.disabled = true;

    const cart = JSON.parse(localStorage.getItem('lc1-cart')) || [];
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = Math.floor(Math.random() * 90000) + 10000; // Random 5 digit

    let orderDetails = cart.map(item => `- ${item.name} ${item.size ? `(Talle ${item.size})` : ''} x${item.quantity} ($${(item.price * item.quantity).toLocaleString('es-AR')})`).join('\n');

    // Aquí llamamos a EmailJS
    // Reemplazar estas variables con las reales cuando se cree la cuenta y plantilla
    const templateParams = {
        to_name: name,
        to_email: email,
        order_id: orderId,
        order_total: total.toLocaleString('es-AR'),
        order_details: orderDetails,
        bank_alias: "alebalzano1", 
        phone_contact: "+541127655884" 
    };

    emailjs.send("service_1dhc5d5", "template_rthco6k", templateParams)
        .then(() => {
            // Guardar en la base local (admin view)
            const orders = JSON.parse(localStorage.getItem('lc1-orders-db')) || [];
            orders.push({
                id: orderId,
                customer: { name, email, phone },
                date: new Date().toLocaleString(),
                items: cart,
                total: total,
                status: 'Pendiente'
            });
            localStorage.setItem('lc1-orders-db', JSON.stringify(orders));

            // Vaciar y mostrar exito
            localStorage.removeItem('lc1-cart');
            if (window.updateCartCount) window.updateCartCount();
            renderCart();
            
            document.getElementById('checkout-form-container').style.display = 'none';
            document.getElementById('checkout-success').style.display = 'flex';
            document.getElementById('success-order-number').textContent = `Orden #${orderId}`;
            
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> CONFIRMAR PEDIDO';
            btn.disabled = false;
        })
        .catch((error) => {
            console.error("Error al enviar el email:", error);
            alert("Hubo un error al procesar el pedido. Intenta nuevamente.");
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> CONFIRMAR PEDIDO';
            btn.disabled = false;
        });
};

window.closeCartMenu = () => {
    document.getElementById('cart-sidebar').style.right = '-400px';
    document.getElementById('cart-overlay').style.display = 'none';
    
    // Resetear vistas luego de la animación
    setTimeout(() => {
        document.getElementById('cart-content').style.display = 'flex';
        document.getElementById('checkout-form-container').style.display = 'none';
        document.getElementById('checkout-success').style.display = 'none';
    }, 300);
};
