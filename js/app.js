const staticProducts = window.LC1_Data ? window.LC1_Data.products : [];
const staticCategories = window.LC1_Data ? window.LC1_Data.categories : [];

const getSafeJSON = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing LocalStorage key "${key}":`, e);
        return defaultValue;
    }
};

const productsListSource = getSafeJSON('lc1-products-db', staticProducts);
// Si por alguna razón la lista está vacía pero tenemos datos estáticos, restauramos
const productsList = (productsListSource.length === 0 && staticProducts.length > 0) ? staticProducts : productsListSource;
const categoriesList = getSafeJSON('lc1-categories-db', staticCategories);

// Elementos del DOM
const featuredContainer = document.getElementById('featured-products');
const shopContainer = document.getElementById('shop-products');
const categoriesContainer = document.getElementById('categories-container');
const cartCountElement = document.querySelector('.cart-count');

// Variables de Estado
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Sync Branding
    syncBranding();

    // Detectar categoría desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) currentCategory = catParam;

    renderPage();
    updateCartCount();
});

function renderPage() {
    if (categoriesContainer) renderCategories();
    if (featuredContainer) renderFeatured();
    if (shopContainer) renderShop(currentCategory);
    
    // IMPORTANTE: Registrar nuevos elementos para la animación de aparición
    if (window.reobserveReveal) {
        setTimeout(window.reobserveReveal, 100);
    }
}

function renderCategories() {
    categoriesContainer.innerHTML = categoriesList.map(cat => `
        <a href="shop.html?cat=${cat.slug}" class="category-card">
            <img src="${cat.image}" alt="${cat.name}">
            <div class="category-overlay">
                <h3 class="sport-font">${cat.name}</h3>
                <p>${cat.desc}</p>
            </div>
        </a>
    `).join('');
}

function renderFeatured() {
    const featuredItems = productsList.filter(p => p.featured);
    featuredContainer.innerHTML = featuredItems.map(p => productCard(p)).join('');
}

function renderShop(category) {
    const filtered = category === 'all' 
        ? productsList 
        : productsList.filter(p => p.category === category);
    
    if (filtered.length === 0) {
        shopContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--glass-border); margin-bottom: 1.5rem;"></i>
                <h3 class="sport-font" style="color: #fff; margin-bottom: 0.5rem;">No encontramos coincidencias</h3>
                <p style="color: var(--text-muted);">Probá con otra categoría o restablecé los filtros.</p>
                <button onclick="app_filter('all')" class="btn-buy" style="max-width: 250px; margin: 2rem auto 0;">Ver todos los productos</button>
            </div>
        `;
        return;
    }

    shopContainer.innerHTML = filtered.map(p => productCard(p)).join('');
    
    // Registrar nuevos elementos inyectados
    if (window.reobserveReveal) window.reobserveReveal();
}

function productCard(product) {
    const whatsappNumber = (window.LC1_Data && window.LC1_Data.settings) ? window.LC1_Data.settings.whatsapp : '541140236384';
    const whatsappMsg = encodeURIComponent(`¡Hola LC1! 👋 Me interesa este producto: ${product.name}. ¿Me podrían asesorar?`);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

    // Lógica de Etiquetas de Urgencia
    let badgeHTML = '';
    if (product.label) {
        const isUrgency = product.label.toLowerCase().includes('unidades') || product.label.toLowerCase().includes('agotar');
        badgeHTML = `<span class="badge-label ${isUrgency ? 'badge-urgency' : ''}">${product.label}</span>`;
    }

    return `
        <div class="product-card reveal">
            ${badgeHTML}
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info" style="padding-top: 0.5rem;">
                <span class="card-category">${product.category}</span>
                <h3 class="card-title" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.8rem;">${product.name}</h3>
                <p class="card-price">$${product.price.toLocaleString('es-AR')}</p>
                
                <div class="product-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-buy" onclick="addToCart(${product.id})">
                        <i class="fas fa-shopping-bag"></i> AGREGAR AL CARRITO
                    </button>
                    <a href="${whatsappLink}" target="_blank" class="btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> COMPRAR POR WHATSAPP
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Global Filters for Shop Page
window.app_filter = (cat) => {
    currentCategory = cat;
    renderShop(cat);
    
    // Scroll suave hacia arriba al filtrar
    window.scrollTo({ top: 300, behavior: 'smooth' });
};

// Global Sort for Shop Page
window.filterByPrice = (order) => {
    const sorted = [...productsList].filter(p => currentCategory === 'all' || p.category === currentCategory);
    if (order === 'low') sorted.sort((a,b) => a.price - b.price);
    if (order === 'high') sorted.sort((a,b) => b.price - a.price);
    shopContainer.innerHTML = sorted.map(p => productCard(p)).join('');
};

// Lógica de Carrito
window.addToCart = (productId) => {
    let cart = getSafeJSON('lc1-cart', []);
    const product = productsList.find(p => p.id === productId);
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    updateCartCount();
    
    // Tracking de Analíticas
    if (window.LC1_Tracker) {
        window.LC1_Tracker.logEvent('add_to_cart', { 
            id: productId, 
            name: product.name 
        });
    }
    
    // Alerta estilizada o Notificación (Simple alert por ahora)
    showToast(`${product.name} añadido al carrito`, 'success');
};

function updateCartCount() {
    const cart = getSafeJSON('lc1-cart', []);
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = total;
    }
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-content">
            <p style="margin:0; font-weight:600; font-size:0.9rem;">${msg}</p>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Estilos de animación para el toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
`;
document.head.appendChild(style);
// Sync Branding from Admin
function syncBranding() {
    const settings = getSafeJSON('lc1-settings', window.LC1_Data ? window.LC1_Data.settings : {
        catSectionTitle: 'Explora <span>Categorías</span>',
        featuredSectionTitle: 'Lanzamientos <span>Elite</span>'
    });

    const catTitleEl = document.getElementById('cat-section-title');
    const featuredTitleEl = document.getElementById('featured-section-title');

    if (catTitleEl && settings.catSectionTitle) {
        catTitleEl.innerHTML = settings.catSectionTitle;
    }
    if (featuredTitleEl && settings.featuredSectionTitle) {
        featuredTitleEl.innerHTML = settings.featuredSectionTitle;
    }
}
// --- Mobile Menu Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.onclick = () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        };

        // Cerrar al clickear link
        navLinks.querySelectorAll('a').forEach(link => {
            link.onclick = () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            };
        });
    }
});
