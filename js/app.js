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

        // Si la conexión fue exitosa, respetamos la base de datos (aunque esté vacía)
        // Solo usamos respaldo si Firebase falló o no devolvió nada y el usuario no está logueado
        if (productsList.length === 0 && !fbSettings) {
            productsList = window.LC1_Data ? window.LC1_Data.products : [];
        }
        if (categoriesList.length === 0 && !fbSettings) {
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
            <img src="${cat.image}" alt="${cat.name}" width="600" height="800" onerror="this.src='https://placehold.co/600x800/111/fff?text=${cat.name}'; this.onerror=null;">
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
    // Mejora: Detección flexible de categoría para mostrar talles (Bug 1 Fix)
    const showSize = category.includes('guante') || category.includes('indumentaria');
    let availableSizes = product.sizes || [];
    if (availableSizes.length === 0) {
        if (category === 'indumentaria') availableSizes = ["S", "M", "L", "XL", "XXL"];
        else if (product.ageCategory === 'junior') availableSizes = ["4", "5"];
        else availableSizes = ["6", "7", "8", "9", "10", "11"];
    }

    const sizeOptions = availableSizes.map(s => `<option value="${s}">${s}</option>`).join('');

    let sizeHTML = showSize ? `
        <div class="shop-size-selector" style="margin-bottom: 15px;">
            <select class="size-select-pro" id="shop-size-input-${product.id}" 
                    onchange="window.selectShopSize('${product.id}', this.value)"
                    style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: var(--text-color); font-weight: 700; cursor: pointer; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px;">
                <option value="" disabled selected>Seleccionar Talle</option>
                ${availableSizes.map(s => `<option value="${s}">Talle ${s}</option>`).join('')}
            </select>
        </div>
    ` : '';

    return `
        <div class="product-card reveal">
            <div class="product-img" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
                <img src="${product.image}" alt="${product.name}" loading="lazy" width="400" height="400" onerror="this.src='https://placehold.co/400x400/111/fff?text=Producto'; this.onerror=null;">
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

window.selectShopSize = (productId, size) => {
    const select = document.getElementById(`shop-size-input-${productId}`);
    if (select && size) {
        select.style.borderColor = 'var(--accent-color)';
        select.style.background = 'rgba(249, 255, 32, 0.05)'; 
    }
};

window.addToCartWithSize = (productId) => {
    const sizeInput = document.getElementById(`shop-size-input-${productId}`);
    const product = productsList.find(p => String(p.id) === String(productId));
    const category = product.category.toLowerCase();
    const requiresSize = ['guantes', 'indumentaria'].includes(category) && !['accesorios', 'reparacion'].includes(category);

    if (requiresSize && sizeInput && !sizeInput.value) {
        showToast('Seleccioná un talle para continuar', 'error');
        // Sacudir el selector para llamar la atención
        sizeInput.classList.add('shake');
        setTimeout(() => sizeInput.classList.remove('shake'), 400);
        return;
    }
    const size = sizeInput ? sizeInput.value : 'N/A';
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
    const sizeInput = document.getElementById(`shop-size-input-${productId}`);
    const product = productsList.find(p => String(p.id) === String(productId));
    const category = product.category.toLowerCase();
    const requiresSize = ['guantes', 'indumentaria'].includes(category) && !['accesorios', 'reparacion'].includes(category);

    if (requiresSize && sizeInput && !sizeInput.value) {
        showToast('Seleccioná un talle para continuar', 'error');
        sizeInput.classList.add('shake');
        setTimeout(() => sizeInput.classList.remove('shake'), 400);
        return;
    }
    const size = sizeInput ? sizeInput.value : 'N/A';
    
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
