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

const productsList = getSafeJSON('lc1-products-db', staticProducts);
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
    
    shopContainer.innerHTML = filtered.map(p => productCard(p)).join('');
}

function productCard(product) {
    return `
        <div class="product-card">
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="desc" style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 0.5rem;">${product.desc}</p>
                <p class="price">$${product.price.toLocaleString('es-AR')}</p>
                <button class="btn-buy" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>
    `;
}

// Global Filters for Shop Page
window.app_filter = (cat) => {
    currentCategory = cat;
    renderShop(cat);
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
