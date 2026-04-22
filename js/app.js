let productsList = [];
let categoriesList = [];
let siteSettings = {};

async function loadSiteData() {
    console.log("[LC1 App] Iniciando carga de datos...");

    // Mostrar Skeletons inmediatamente
    if (shopContainer) renderLoadingSkeletons(shopContainer, 6);
    if (featuredContainer) renderLoadingSkeletons(featuredContainer, 3);
    if (categoriesContainer) renderLoadingSkeletons(categoriesContainer, 3, 'category');

    try {
        if (typeof FirebaseService === 'undefined') {
            throw new Error("FirebaseService no está definido.");
        }

        productsList = await FirebaseService.getProducts().catch(() => []);
        categoriesList = await FirebaseService.getCategories().catch(() => []);
        const fbSettings = await FirebaseService.getSettings().catch(() => null);
        
        siteSettings = fbSettings || (window.LC1_Data ? window.LC1_Data.settings : {});

        if (!productsList || productsList.length === 0) {
            productsList = window.LC1_Data ? window.LC1_Data.products : [];
        }
        if (!categoriesList || categoriesList.length === 0) {
            categoriesList = window.LC1_Data ? window.LC1_Data.categories : [];
        }

        renderPage();
        syncBranding();
    } catch (error) {
        console.error("[LC1 App] Error crítico:", error);
        if (window.LC1_Data) {
            productsList = window.LC1_Data.products;
            categoriesList = window.LC1_Data.categories;
            siteSettings = window.LC1_Data.settings;
            renderPage();
        }
    }
}

function renderLoadingSkeletons(container, count = 4, type = 'product') {
    if (!container) return;
    
    let skeletonMarkup = "";
    if (type === 'product') {
        skeletonMarkup = Array(count).fill(`
            <div class="skeleton-card">
                <div class="skeleton-img skeleton"></div>
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-price skeleton"></div>
                <div class="skeleton-btn skeleton" style="height: 45px; margin-top: auto;"></div>
            </div>
        `).join('');
    } else {
        skeletonMarkup = Array(count).fill(`
            <div class="skeleton-cat skeleton" style="height: 450px;"></div>
        `).join('');
    }
    
    container.innerHTML = skeletonMarkup;
}

// Elementos del DOM
const featuredContainer = document.getElementById('featured-products');
const shopContainer = document.getElementById('shop-products');
const categoriesContainer = document.getElementById('categories-container');
const cartCountElement = document.querySelector('.cart-count');

// Variables de Estado
let currentCategory = 'all';
let currentSortOrder = 'none';
let currentSearchTerm = '';

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
    if (shopContainer) updateShopDisplay();
    
    // Inyectar filtros en la sidebar si estamos en la tienda
    renderSidebarFilters();
    
    // IMPORTANTE: Registrar nuevos elementos para la animación de aparición
    if (window.reobserveReveal) {
        setTimeout(window.reobserveReveal, 100);
    }
}

function renderSidebarFilters() {
    const filterContainer = document.getElementById('category-filters');
    const priceFiltersContainer = document.getElementById('price-filters'); // Nuevo ID recomendado
    if (!filterContainer) return;

    // 1. Renderizar Categorías
    const categoriesMarkup = categoriesList.map(cat => `
        <button class="filter-btn ${currentCategory === cat.slug ? 'active' : ''}" 
                onclick="filterByCategory('${cat.slug}')">
            ${cat.name}
        </button>
    `).join('');

    filterContainer.innerHTML = `
        <button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" 
                onclick="filterByCategory('all')">
            Todos
        </button>
        ${categoriesMarkup}
    `;

    // 2. Actualizar estados de Ordenamiento (Precio)
    // Buscamos los botones de precio por su onclick
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (!onclick) return;
        
        if (onclick.includes("'low'")) {
            currentSortOrder === 'low' ? btn.classList.add('active') : btn.classList.remove('active');
        } else if (onclick.includes("'high'")) {
            currentSortOrder === 'high' ? btn.classList.add('active') : btn.classList.remove('active');
        }
    });
}

function renderCategories() {
    categoriesContainer.innerHTML = categoriesList.map(cat => `
        <a href="shop.html?cat=${cat.slug}" class="category-card">
            <img src="${cat.image}" alt="${cat.name}" width="600" height="800">
            <div class="category-overlay">
                <h3 class="sport-font">${cat.name}</h3>
                <p>${cat.desc}</p>
            </div>
        </a>
    `).join('');
}

function renderFeatured() {
    const featuredItems = productsList.filter(p => p.featured && p.available !== false);
    featuredContainer.innerHTML = featuredItems.map(p => productCard(p)).join('');
}


function updateShopDisplay() {
    if (!shopContainer) return;

    console.log(`[LC1 App] Actualizando tienda: Cat=${currentCategory}, Sort=${currentSortOrder}`);

    // 1. Filtrar por Disponibilidad, Categoría y Búsqueda
    let filtered = productsList.filter(p => p.available !== false);
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (currentSearchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    }
    
    // 2. Aplicar Ordenamiento
    if (currentSortOrder === 'low') {
        filtered.sort((a,b) => a.price - b.price);
    } else if (currentSortOrder === 'high') {
        filtered.sort((a,b) => b.price - a.price);
    }
    
    // 3. Renderizar
    if (filtered.length === 0) {
        shopContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--glass-border); margin-bottom: 1.5rem;"></i>
                <h3 class="sport-font" style="color: #000; margin-bottom: 0.5rem;">No encontramos coincidencias</h3>
                <p style="color: #444;">Probá con otra categoría o restablecé los filtros.</p>
                <button onclick="filterByCategory('all')" class="btn-buy" style="max-width: 250px; margin: 2rem auto 0;">Ver todos los productos</button>
            </div>
        `;
    } else {
        shopContainer.innerHTML = filtered.map(p => productCard(p)).join('');
    }
    
    // Registrar nuevos elementos inyectados
    if (window.reobserveReveal) window.reobserveReveal();

    // Actualizar estados visuales de los filtros
    renderSidebarFilters();
}

function productCard(product) {
    const category = product.category.toLowerCase();
    const showSize = ['guantes', 'indumentaria'].includes(category) && !['accesorios', 'reparacion'].includes(category);
    const isIndumentaria = product.category.toLowerCase() === 'indumentaria';
    const sizeOptions = isIndumentaria 
        ? `<option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>`
        : `<option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option>`;

    let sizeHTML = showSize ? `
        <div style="margin-bottom: 15px;">
            <select id="shop-size-${product.id}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-color); color: var(--text-color); font-size: 0.9rem;">
                <option value="" disabled selected>Seleccioná tu talle</option>
                ${sizeOptions}
            </select>
        </div>
    ` : '';

    return `
        <div class="product-card reveal">
            <div class="product-img" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
                <img src="${product.image}" alt="${product.name}" loading="lazy" width="400" height="400">
            </div>
            <div class="product-info" style="padding-top: 0.5rem; display: flex; flex-direction: column; flex: 1;">
                <span class="card-category">${product.category}</span>
                <h3 class="card-title" onclick="window.location.href='product.html?id=${product.id}'" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.8rem; cursor:pointer;">${product.name}</h3>
                <p class="card-price" style="margin-bottom: 10px;">$${product.price.toLocaleString('es-AR')}</p>
                
                ${sizeHTML}
                
                <div class="product-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-buy" onclick="window.addToCartWithSize('${product.id}')">
                        <i class="fas fa-shopping-bag"></i> AGREGAR AL CARRITO
                    </button>
                    <button class="btn-whatsapp" onclick="window.buyWhatsappWithSize('${product.id}')" style="width: 100%;">
                        <i class="fab fa-whatsapp"></i> COMPRAR POR WHATSAPP
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Global Filters for Shop Page
window.filterByCategory = (cat) => {
    currentCategory = cat;
    // Limpiar búsqueda al cambiar de categoría si se desea, por ahora mantenemos ambas
    updateShopDisplay();
    
    // Scroll suave hacia arriba al filtrar
    window.scrollTo({ top: 300, behavior: 'smooth' });
};

window.searchProducts = (term) => {
    currentSearchTerm = term.trim();
    updateShopDisplay();
};

// Global Sort for Shop Page
window.filterByPrice = (order) => {
    // Si ya está activo, lo desactivamos al hacer click de nuevo (Toggle)
    currentSortOrder = (currentSortOrder === order) ? 'none' : order;
    updateShopDisplay();
};

window.addToCartWithSize = (productId) => {
    const sizeSelect = document.getElementById(`shop-size-${productId}`);
    const product = productsList.find(p => String(p.id) === String(productId));
    const category = product.category.toLowerCase();
    const requiresSize = ['guantes', 'indumentaria'].includes(category) && !['accesorios', 'reparacion'].includes(category);

    if (requiresSize && sizeSelect && !sizeSelect.value) {
        showToast('Por favor seleccioná un talle para continuar', 'error');
        return;
    }
    const size = sizeSelect ? sizeSelect.value : 'N/A';
    let cart = getSafeJSON('lc1-cart', []);
    
    // Check if same product with same size exists
    const existing = cart.find(item => String(item.id) === String(productId) && item.size === size);
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
    const product = productsList.find(p => String(p.id) === String(productId));
    const category = product.category.toLowerCase();
    const requiresSize = ['guantes', 'indumentaria'].includes(category) && !['accesorios', 'reparacion'].includes(category);

    if (requiresSize && sizeSelect && !sizeSelect.value) {
        showToast('Por favor seleccioná un talle para continuar', 'error');
        return;
    }
    const size = sizeSelect ? sizeSelect.value : 'N/A';
    
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
