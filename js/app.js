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
        else if (product.ageCategory === 'junior' || product.ageCategory === 'niño') availableSizes = ["4", "5"];
        else availableSizes = ["6", "7", "8", "9", "10", "11"];
    }

    const sizeOptions = availableSizes.map(s => `<option value="${s}">${s}</option>`).join('');

    let sizeHTML = showSize ? `
        <div class="shop-size-selector" style="margin-bottom: 8px; position: relative;">
            <!-- Botón Estilo Dropdown -->
            <button id="size-toggle-btn-${product.id}" 
                    onclick="document.getElementById('size-list-wrapper-${product.id}').style.display='block'; this.style.display='none';"
                    style="width: 100%; padding: 10px; border: 1.5px solid var(--glass-border); background: rgba(255,255,255,0.05); border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: var(--text-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;">
                <span>Seleccionar Talle</span>
                <i class="fas fa-chevron-down" style="font-size: 0.7rem; opacity: 0.5;"></i>
            </button>

            <!-- Lista de Talles (Vertical y Estilizada) -->
            <div id="size-list-wrapper-${product.id}" class="size-list-container" style="display: none; animation: slideDown 0.3s ease-out;">
                <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid var(--glass-border); padding: 5px;">
                    ${availableSizes.map(s => `
                        <button class="size-list-item" 
                            onclick="window.selectShopSize('${product.id}', '${s}', this)"
                            style="width: 100%; padding: 8px 15px; border: none; background: transparent; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; color: var(--text-color); transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;">
                            <span>Talle ${s}</span>
                            <i class="fas fa-check check-icon" style="display: none; font-size: 0.7rem; color: #000;"></i>
                        </button>
                    `).join('')}
                    <!-- Opción para cerrar/cancelar -->
                    <button onclick="document.getElementById('size-list-wrapper-${product.id}').style.display='none'; document.getElementById('size-toggle-btn-${product.id}').style.display='flex';"
                            style="width: 100%; padding: 6px; border: none; background: transparent; color: var(--text-muted); font-size: 0.7rem; cursor: pointer; text-align: center; border-top: 1px solid var(--glass-border); margin-top: 4px;">
                        Cerrar
                    </button>
                </div>
            </div>
            <input type="hidden" id="shop-size-input-${product.id}" value="">
        </div>
    ` : '';

    return `
        <div class="product-card reveal">
            <div class="product-img" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
                <img src="${product.image}" alt="${product.name}" loading="lazy" width="400" height="400" 
                     style="max-height: 180px; object-fit: cover;"
                     onerror="this.src='https://placehold.co/400x400/111/fff?text=Producto'; this.onerror=null;">
            </div>
            <div class="product-info" style="padding-top: 0.3rem; display: flex; flex-direction: column; flex: 1;">
                <span class="card-category">${product.category}</span>
                <h3 class="card-title" onclick="window.location.href='product.html?id=${product.id}'" 
                    style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.4rem; cursor:pointer;">${product.name}</h3>
                <p class="card-price" style="margin-bottom: 5px;">$${product.price.toLocaleString('es-AR')}</p>
                
                ${sizeHTML}
                
                <div class="product-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 6px;">
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

window.selectShopSize = (productId, size, itemEl) => {
    const wrapper = document.getElementById(`size-list-wrapper-${productId}`);
    const toggleBtn = document.getElementById(`size-toggle-btn-${productId}`);

    // Quitar clase active y ocultar iconos de check de todos los items del mismo producto
    document.querySelectorAll(`#size-list-wrapper-${productId} .size-list-item`).forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-color)';
        const icon = btn.querySelector('.check-icon');
        if (icon) icon.style.display = 'none';
    });

    // Activar el item clickeado
    if (itemEl) {
        itemEl.style.background = 'var(--accent-color)';
        itemEl.style.color = '#000';
        const icon = itemEl.querySelector('.check-icon');
        if (icon) icon.style.display = 'block';
    }

    // Guardar el valor en el input hidden
    const input = document.getElementById(`shop-size-input-${productId}`);
    if (input) input.value = size;

    // Actualizar el texto del botón toggle para mostrar el talle elegido y cerrarlo
    if (toggleBtn) {
        toggleBtn.querySelector('span').textContent = `Talle: ${size}`;
        toggleBtn.style.display = 'flex';
        toggleBtn.style.borderColor = 'var(--accent-color)';
    }
    if (wrapper) wrapper.style.display = 'none';
};

window.addToCartWithSize = (productId) => {
    const sizeInput = document.getElementById(`shop-size-input-${productId}`);
    const product = productsList.find(p => String(p.id) === String(productId));
    const category = product.category.toLowerCase();
    const requiresSize = category.includes('guante') || category.includes('indumentaria');

    if (requiresSize && sizeInput && !sizeInput.value) {
        showToast('Seleccioná un talle para continuar', 'error');
        // Si la lista está oculta, mostrarla automáticamente
        const wrapper = document.getElementById(`size-list-wrapper-${productId}`);
        const toggleBtn = document.getElementById(`size-toggle-btn-${productId}`);
        if (wrapper) wrapper.style.display = 'block';
        if (toggleBtn) toggleBtn.style.display = 'none';

        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => wrapper.classList.remove('shake'), 400);
        }
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
    const requiresSize = category.includes('guante') || category.includes('indumentaria');

    if (requiresSize && sizeInput && !sizeInput.value) {
        showToast('Seleccioná un talle para continuar', 'error');
        // Si la lista está oculta, mostrarla automáticamente
        const wrapper = document.getElementById(`size-list-wrapper-${productId}`);
        const toggleBtn = document.getElementById(`size-toggle-btn-${productId}`);
        if (wrapper) wrapper.style.display = 'block';
        if (toggleBtn) toggleBtn.style.display = 'none';

        if (wrapper) {
            wrapper.classList.add('shake');
            setTimeout(() => wrapper.classList.remove('shake'), 400);
        }
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
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    
    .size-list-item:hover { background: rgba(249, 255, 32, 0.1) !important; padding-left: 20px !important; }
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
const initMobileMenu = () => {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        const toggleMenu = (e) => {
            if (e) e.preventDefault();
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        };

        menuToggle.addEventListener('click', toggleMenu);
        menuToggle.addEventListener('touchstart', toggleMenu, {passive: false});

        // Cerrar al clickear link
        navLinks.querySelectorAll('a').forEach(link => {
            const closeMenu = () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            };
            link.addEventListener('click', closeMenu);
        });
    }
};

// Asegurar ejecución si ya cargó el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}

