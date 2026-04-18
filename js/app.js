let productsList = [];
let categoriesList = [];
let galleryList = [];
let siteSettings = {};

async function loadSiteData() {
    console.log("[LC1 App] Cargando datos desde la nube...");
    try {
        productsList = await FirebaseService.getProducts();
        categoriesList = await FirebaseService.getCategories();
        galleryList = await FirebaseService.getGallery();
        siteSettings = await FirebaseService.getSettings() || window.LC1_Data.settings;

        // Fallback a locales si la nube está vacía (solo primer arranque)
        if (productsList.length === 0) productsList = window.LC1_Data.products;
        if (categoriesList.length === 0) categoriesList = window.LC1_Data.categories;
        if (galleryList.length === 0) galleryList = window.LC1_Data.gallery;

        renderPage();
        syncBranding();
    } catch (error) {
        console.error("[LC1 App] Error cargando base de datos:", error);
        // Fallback de emergencia
        productsList = window.LC1_Data.products;
        categoriesList = window.LC1_Data.categories;
        galleryList = window.LC1_Data.gallery;
        siteSettings = window.LC1_Data.settings;
        renderPage();
    }
}

// Elementos del DOM
const featuredContainer = document.getElementById('featured-products');
const shopContainer = document.getElementById('shop-products');
const categoriesContainer = document.getElementById('categories-container');
const actionGalleryContainer = document.getElementById('action-gallery-container');
const cartCountElement = document.querySelector('.cart-count');

// Variables de Estado
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Detectar talle en URL si aplica
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) currentCategory = catParam;

    loadSiteData();
    updateCartCount();
});

function renderPage() {
    if (categoriesContainer) renderCategories();
    if (featuredContainer) renderFeatured();
    if (shopContainer) renderShop(currentCategory);
    if (actionGalleryContainer) renderActionGallery();
    
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

function renderActionGallery() {
    if (!actionGalleryContainer) return;
    
    if (galleryList.length === 0) {
        actionGalleryContainer.parentElement.parentElement.style.display = 'none';
        return;
    }
    actionGalleryContainer.parentElement.parentElement.style.display = 'block';
    
    actionGalleryContainer.innerHTML = galleryList.map(item => {
        if (item.type === 'video') {
            return `
                <div class="gallery-item">
                    <iframe src="${item.data}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
                </div>
            `;
        } else {
            return `
                <div class="gallery-item">
                    <div style="background: url('${item.data}') center/cover;"></div>
                </div>
            `;
        }
    }).join('');

    // Logic for navigation arrows
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    if (prevBtn && nextBtn && actionGalleryContainer) {
        // Only hide if literally 0 items
        if (galleryList.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            
            prevBtn.onclick = () => {
                const step = actionGalleryContainer.offsetWidth;
                actionGalleryContainer.scrollBy({ left: -step, behavior: 'smooth' });
            };
            nextBtn.onclick = () => {
                const step = actionGalleryContainer.offsetWidth;
                actionGalleryContainer.scrollBy({ left: step, behavior: 'smooth' });
            };
        }
    }
}

function renderShop(category) {
    const filtered = category === 'all' 
        ? productsList 
        : productsList.filter(p => p.category === category);
    
    if (filtered.length === 0) {
        shopContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--glass-border); margin-bottom: 1.5rem;"></i>
                <h3 class="sport-font" style="color: #000; margin-bottom: 0.5rem;">No encontramos coincidencias</h3>
                <p style="color: #444;">Probá con otra categoría o restablecé los filtros.</p>
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
    const isIndumentaria = product.category === 'indumentaria';
    const sizeOptions = isIndumentaria 
        ? `<option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>`
        : `<option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option>`;

    let sizeHTML = `
        <div style="margin-bottom: 15px;">
            <select id="shop-size-${product.id}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-color); color: var(--text-color); font-size: 0.9rem;">
                <option value="" disabled selected>Seleccioná tu talle</option>
                ${sizeOptions}
            </select>
        </div>
    `;

    return `
        <div class="product-card reveal">
            <div class="product-img" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info" style="padding-top: 0.5rem; display: flex; flex-direction: column; flex: 1;">
                <span class="card-category">${product.category}</span>
                <h3 class="card-title" onclick="window.location.href='product.html?id=${product.id}'" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.8rem; cursor:pointer;">${product.name}</h3>
                <p class="card-price" style="margin-bottom: 10px;">$${product.price.toLocaleString('es-AR')}</p>
                
                ${sizeHTML}
                
                <div class="product-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-buy" onclick="window.addToCartWithSize(${product.id})">
                        <i class="fas fa-shopping-bag"></i> AGREGAR AL CARRITO
                    </button>
                    <button class="btn-whatsapp" onclick="window.buyWhatsappWithSize(${product.id})" style="width: 100%;">
                        <i class="fab fa-whatsapp"></i> COMPRAR POR WHATSAPP
                    </button>
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

window.addToCartWithSize = (productId) => {
    const sizeSelect = document.getElementById(`shop-size-${productId}`);
    if (sizeSelect && !sizeSelect.value) {
        showToast('Por favor seleccioná un talle para continuar', 'error');
        return;
    }
    const size = sizeSelect ? sizeSelect.value : null;

    let cart = getSafeJSON('lc1-cart', []);
    const product = productsList.find(p => p.id === productId);
    
    // Check if same product with same size exists
    const existing = cart.find(item => item.id === productId && item.size === size);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, size: size, quantity: 1 });
    }
    
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    updateCartCount();
    
    // Tracking de Analíticas
    if (window.LC1_Tracker) {
        window.LC1_Tracker.logEvent('add_to_cart', { 
            id: productId, 
            name: product.name,
            size: size
        });
    }
    
    showToast(`${product.name} añadido al carrito`, 'success');
};

window.buyWhatsappWithSize = (productId) => {
    const sizeSelect = document.getElementById(`shop-size-${productId}`);
    if (sizeSelect && !sizeSelect.value) {
        showToast('Por favor seleccioná un talle para continuar', 'error');
        return;
    }
    const size = sizeSelect ? sizeSelect.value : null;
    const product = productsList.find(p => p.id === productId);
    
    const msg = `Hola LC1! 👋 Quiero comprar el producto: *${product.name}* (Talle: ${size}) que tiene un precio de *$${product.price.toLocaleString('es-AR')}*. ¿Tienen stock?`;
    const whatsappNumber = siteSettings.whatsapp || '541140236384';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
};

function updateCartCount() {
    const cart = getSafeJSON('lc1-cart', []);
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = total;
    }
}

// La función showToast se movió a utils.js para ser compartida.


// Estilos de animación para el toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
`;
document.head.appendChild(style);
// Sync Branding from Admin
function syncBranding() {
    const settings = siteSettings;

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
