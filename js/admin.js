// Lógica del Panel de Administración LC1 Goalkeeper
// Persistencia: LocalStorage
console.log("%c[LC1 Admin] Script cargado correctamente.", "color: #ccff00; font-weight: bold; font-size: 14px;");

let currentImageBase64 = '';

// Productos Iniciales
const initialProducts = [
    { id: 101, name: "LC1 Pro Elite Neon", sku: "GLV-001", category: "guantes", price: 45000, image: "https://images.unsplash.com/photo-1518114139744-245ed43dd4f7?q=80&w=400", featured: true, available: true, customizable: false, label: "Top Ventas", desc: "Látex alemán 4mm" },
    { id: 102, name: "Taza Personalizada Portero", sku: "ACC-001", category: "accesorios", price: 3500, image: "https://images.unsplash.com/photo-1517256011242-7511d51a6509?q=80&w=400", featured: false, available: true, customizable: true, label: "", desc: "Cerámica alta calidad" },
    { id: 103, name: "Camiseta LC1 Training Black", sku: "IND-001", category: "indumentaria", price: 18000, image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=400", featured: true, available: true, customizable: false, label: "Nuevo", desc: "Dry-fit tecnología" },
    { id: 104, name: "Guante LC1 Grip Master", sku: "GLV-002", category: "guantes", price: 38000, image: "https://images.unsplash.com/photo-1526509867162-5b0c0319526e?q=80&w=400", featured: false, available: true, customizable: false, label: "", desc: "Corte negativo" },
    { id: 105, name: "Short LC1 Matchday", sku: "IND-002", category: "indumentaria", price: 12000, image: "https://images.unsplash.com/photo-1515462277125-26977f1f4cc2?q=80&w=400", featured: false, available: true, customizable: false, label: "", desc: "Ligero y resistente" },
    { id: 106, name: "Remera Sublimada LC1", sku: "IND-003", category: "indumentaria", price: 6500, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400", featured: true, available: true, customizable: true, label: "Elite", desc: "Full print" },
    { id: 107, name: "Botella Deportiva LC1", sku: "ACC-002", category: "accesorios", price: 5000, image: "https://images.unsplash.com/photo-1523362628744-4c22397d416b?q=80&w=400", featured: false, available: true, customizable: false, label: "", desc: "Aluminio 750ml" },
    
    // --- NUEVO CATALOGO ROMA ---
    { id: 201, name: "Guante Roma Pro Blue", sku: "GLV-R01", category: "guantes", price: 42000, image: "Roma/Photoroom_20260409_062835.png", featured: true, available: true, customizable: false, label: "Roma", desc: "Nivel Profesional" },
    { id: 202, name: "Camiseta Roma Match", sku: "IND-R01", category: "indumentaria", price: 28000, image: "Roma/Photoroom_20260409_070006.png", featured: true, available: true, customizable: false, label: "Roma", desc: "Diseño exclusivo LC1" },
    { id: 203, name: "Guante Roma Black Edition", sku: "GLV-R02", category: "guantes", price: 42000, image: "Roma/Photoroom_20260409_062847.png", featured: false, available: true, customizable: false, label: "Roma", desc: "Black latex extreme" },
    { id: 204, name: "Camiseta Roma Training", sku: "IND-R02", category: "indumentaria", price: 26000, image: "Roma/Photoroom_20260409_070037.png", featured: false, available: true, customizable: false, label: "Roma", desc: "Entrenamiento pro" },
    { id: 205, name: "Guante Roma Hybrid", sku: "GLV-R03", category: "guantes", price: 39000, image: "Roma/Photoroom_20260409_070242.png", featured: false, available: true, customizable: false, label: "Oferta", desc: "Corte híbrido" },
    { id: 206, name: "Conjunto Roma GK", sku: "IND-R03", category: "indumentaria", price: 35000, image: "Roma/Photoroom_20260409_061310.png", featured: true, available: true, customizable: false, label: "Roma", desc: "Colección 2026" },
    { id: 207, name: "Guante Roma Junior", sku: "GLV-R04", category: "guantes", price: 25000, image: "Roma/Photoroom_20260409_061832.png", featured: false, available: true, customizable: false, label: "", desc: "Talles infantiles" },
    { id: 208, name: "Short Roma Pro", sku: "IND-R04", category: "indumentaria", price: 15000, image: "Roma/Photoroom_20260321_120341.jpg", featured: false, available: true, customizable: false, label: "", desc: "Protección lateral" },
    { id: 209, name: "Media Roma Elite", sku: "ACC-R01", category: "accesorios", price: 4500, image: "Roma/Photoroom_20260321_121438.jpg", featured: false, available: true, customizable: false, label: "", desc: "Antideslizante" },
    { id: 210, name: "Pantalón Roma GK", sku: "IND-R05", category: "indumentaria", price: 32000, image: "Roma/Photoroom_20260321_121451.jpg", featured: false, available: true, customizable: false, label: "", desc: "Acolchado premium" },
    { id: 211, name: "Guante Roma Classic", sku: "GLV-R05", category: "guantes", price: 35000, image: "Roma/Photoroom_20260403_221132.jpg", featured: false, available: true, customizable: false, label: "", desc: "Estilo clásico" },
    { id: 212, name: "Camiseta Roma Sublimada", sku: "IND-R06", category: "indumentaria", price: 29000, image: "Roma/Photoroom_20260108_005601.png", featured: true, available: true, customizable: true, label: "Custom", desc: "Personaliza tu diseño" },
    { id: 213, name: "Guante Roma Vapor", sku: "GLV-R06", category: "guantes", price: 48000, image: "Roma/Photoroom_20260108_124110.png", featured: false, available: true, customizable: false, label: "Top", desc: "Máximo agarre" },
    { id: 214, name: "Protector Roma Gear", sku: "ACC-R02", category: "accesorios", price: 9500, image: "Roma/Photoroom_20260108_130223.png", featured: false, available: true, customizable: false, label: "", desc: "Alta protección" },
    { id: 215, name: "Guante Roma Titan", sku: "GLV-R07", category: "guantes", price: 52000, image: "Roma/Photoroom_20260108_131155.png", featured: true, available: true, customizable: false, label: "Nuevo", desc: "Titanium pack" },
    { id: 216, name: "Mochila Roma Sport", sku: "ACC-R03", category: "accesorios", price: 22000, image: "Roma/Photoroom_20260108_133023.png", featured: false, available: true, customizable: false, label: "", desc: "Espacio para guantes" },
    { id: 217, name: "Cinta Roma Wrap", sku: "ACC-R04", category: "accesorios", price: 3000, image: "Roma/Photoroom_20260108_133941.png", featured: false, available: true, customizable: false, label: "", desc: "Vendaje cohesivo" },
    { id: 218, name: "Guante Roma Training Day", sku: "GLV-R08", category: "guantes", price: 28000, image: "Roma/20250522_064405_0000.jpeg", featured: false, available: true, customizable: false, label: "Escuela", desc: "Ideal para prácticas" },
    { id: 219, name: "Camiseta Roma Neo", sku: "IND-R07", category: "indumentaria", price: 27000, image: "Roma/20250522_064535_0000.jpeg", featured: false, available: true, customizable: false, label: "", desc: "Colores vibrantes" },
    { id: 220, name: "Guante Roma Pro Green", sku: "GLV-R09", category: "guantes", price: 45000, image: "Roma/20250522_064647_0000.jpeg", featured: false, available: true, customizable: false, label: "", desc: "Látex natural" },
    { id: 221, name: "Guante Roma Pro Red", sku: "GLV-R10", category: "guantes", price: 45000, image: "Roma/20250522_064749_0000.jpeg", featured: false, available: true, customizable: false, label: "", desc: "Pasión futbolera" },

    // --- COMBOS Y PACKS (EXPANSIÓN) ---
    { id: 301, name: "Combo Roma Elite Full", sku: "CMB-001", category: "guantes", price: 85000, image: "Roma/Photoroom_20260108_131155.png", featured: true, available: true, customizable: false, label: "Ahorro", desc: "Incluye: Guantes Titan + Camiseta Match + Medias Elite" },
    { id: 302, name: "Pack Entrenamiento LC1", sku: "CMB-002", category: "indumentaria", price: 45000, image: "Roma/Photoroom_20260409_070037.png", featured: false, available: true, customizable: false, label: "Promo", desc: "Incluye: 2 Camisetas de Entrenamiento + Short Pro" },
    { id: 303, name: "Kit Guantes + Spray Limpiador", sku: "CMB-003", category: "guantes", price: 48000, image: "Roma/Photoroom_20260409_062835.png", featured: false, available: true, customizable: false, label: "Básico", desc: "Guantes Roma Pro + Spray de cuidado" },
    { id: 304, name: "Combo Junior Academy", sku: "CMB-004", category: "guantes", price: 32000, image: "Roma/Photoroom_20260409_061832.png", featured: false, available: true, customizable: false, label: "Kid", desc: "Guantes Junior + Pelota LC1" },
    { id: 305, name: "Mega Pack Personalizado", sku: "CMB-005", category: "indumentaria", price: 95000, image: "Roma/Photoroom_20260108_005601.png", featured: true, available: true, customizable: true, label: "VIP", desc: "Indumentaria completa con tu nombre y número" }
];

// Categorías Iniciales
const initialCategories = [
    { id: 1, name: "Guantes", slug: "guantes", desc: "Látex profesional para todo tipo de clima.", image: "Roma/Photoroom_20260409_062835.png" },
    { id: 2, name: "Indumentaria", slug: "indumentaria", desc: "Camisetas, shorts y protección elite.", image: "Roma/Photoroom_20260409_070006.png" },
    { id: 3, name: "Reparación", slug: "reparacion", desc: "Devolvele el grip a tus guantes favoritos.", image: "Roma/Photoroom_20260108_133941.png" }
];

const getSafeJSON = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing LocalStorage key "${key}":`, e);
        return defaultValue;
    }
};

let adminProducts = getSafeJSON('lc1-products-db', initialProducts);
let adminCategories = getSafeJSON('lc1-categories-db', initialCategories);
let adminOrders = getSafeJSON('lc1-orders-db', []);
let adminSettings = getSafeJSON('lc1-settings', {
    storeName: 'LC1 GOALKEEPER',
    whatsapp: '541140236384',
    currency: '$',
    catSectionTitle: 'Explora <span>Categorías</span>',
    featuredSectionTitle: 'Lanzamientos <span>Elite</span>'
});

let adminAuth = getSafeJSON('lc1-admin-auth', {
    user: 'administrador',
    pass: 'admin12345'
});

// Instancias de Chart.js para limpieza
let chartVisits = null;
let chartMix = null;

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminProductGrid = document.getElementById('admin-product-grid');
const adminCategoriesGrid = document.getElementById('admin-categories-grid');
const adminOrdersList = document.getElementById('admin-orders-list');
const countProducts = document.getElementById('count-products');
const adminFeaturedGrid = document.getElementById('admin-featured-grid');

document.addEventListener('DOMContentLoaded', () => {
    syncRomaProducts(); // Auto-sincronizar nuevos productos
    syncCategories(); // Auto-sincronizar categorías
    checkAuth();
    loadSettings();
    
    // Login Event
    document.getElementById('btn-login').onclick = () => {
        const userInput = document.getElementById('login-email').value.trim();
        const passInput = document.getElementById('login-pass').value.trim();
        
        if (userInput === adminAuth.user && passInput === adminAuth.pass) {
            sessionStorage.setItem('lc1-admin-token', 'true');
            checkAuth();
        } else {
            const errorEl = document.getElementById('login-error');
            if (errorEl) errorEl.style.display = 'block';
        }
    };

    // Image Upload Event (Products)
    const fileInput = document.getElementById('p-file');
    if (fileInput) {
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processImage(file, 'product');
        };
    }

    // Image Upload Event (Categories)
    const catFileInput = document.getElementById('cat-file');
    if (catFileInput) {
        catFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processImage(file, 'category');
        };
    }

    // Product Form Event
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.onsubmit = (e) => {
            e.preventDefault();
            saveProduct();
        };
    }
    
    // Category Form Event
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.onsubmit = (e) => {
            e.preventDefault();
            saveCategory();
        };
    }

    // Settings Form Event
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.onsubmit = (e) => {
            e.preventDefault();
            saveSettings();
        };
    }

    // Auth Settings Form Event
    const authForm = document.getElementById('auth-settings-form');
    if (authForm) {
        authForm.onsubmit = (e) => {
            e.preventDefault();
            saveAuthSettings();
        };
    }
});

window.showToast = (msg, type = 'success') => {
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
};

window.showConfirm = (text, callback) => {
    const modal = document.getElementById('confirm-modal');
    const textEl = document.getElementById('confirm-text');
    const btn = document.getElementById('confirm-btn');

    if (!modal || !textEl || !btn) return;

    textEl.textContent = text;
    modal.style.display = 'flex';

    btn.onclick = () => {
        callback();
        closeConfirm();
    };
};

window.closeConfirm = () => {
    document.getElementById('confirm-modal').style.display = 'none';
};

// Actualizar títulos dinámicos desde el dashboard
window.updateDynamicTitle = (key, val) => {
    adminSettings[key] = val;
    localStorage.setItem('lc1-settings', JSON.stringify(adminSettings));
    console.log(`Setting updated: ${key} = ${val}`);
};

// --- Security & Auth ---

window.togglePassVisibility = (id, el) => {
    const input = document.getElementById(id);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        el.classList.remove('fa-eye');
        el.classList.add('fa-eye-slash');
        el.style.color = 'var(--primary-color)';
    } else {
        input.type = 'password';
        el.classList.remove('fa-eye-slash');
        el.classList.add('fa-eye');
        el.style.color = 'var(--text-muted)';
    }
};

function checkAuth() {
    const isAuth = sessionStorage.getItem('lc1-admin-token');
    if (isAuth) {
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'flex';
        
        // Update Admin name in top bar
        const adminNameDisplay = document.querySelector('#admin-user-info');
        if (adminNameDisplay) {
            adminNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${adminAuth.user}`;
        }

        renderAdminProducts();
        renderAdminOrders();
        calculateStats();
        showToast('Sesión iniciada correctamente', 'success');
    } else {
        if (loginSection) loginSection.style.display = 'flex';
        if (dashboardSection) dashboardSection.style.display = 'none';
    }
}

window.logout = () => {
    sessionStorage.removeItem('lc1-admin-token');
    location.reload();
};

// Sincronizar productos de la carpeta Roma si no existen en DB
function syncRomaProducts() {
    let currentDB = getSafeJSON('lc1-products-db', initialProducts);
    let updated = false;

    initialProducts.forEach(ip => {
        if (!currentDB.find(p => p.id === ip.id)) {
            currentDB.push(ip);
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem('lc1-products-db', JSON.stringify(currentDB));
        adminProducts = currentDB;
        console.log("Roma Catalog Synced!");
    }
}

// Sincronizar categorías si no existen
function syncCategories() {
    let currentDB = getSafeJSON('lc1-categories-db', initialCategories);
    let updated = false;

    initialCategories.forEach(ic => {
        if (!currentDB.find(c => c.id === ic.id)) {
            currentDB.push(ic);
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem('lc1-categories-db', JSON.stringify(currentDB));
        adminCategories = currentDB;
        console.log("Categories Synced!");
    }
}

window.switchSection = (sectionId, element = null) => {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.style.display = 'block';
    
    document.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback for direct calls
        const link = document.querySelector(`.menu-link[onclick*="'${sectionId}'"]`);
        if (link) link.classList.add('active');
    }

    if (sectionId === 'products') renderAdminProducts();
    if (sectionId === 'categories') {
        renderAdminCategories();
        renderAdminHomeFeatured();
    }
    if (sectionId === 'orders') renderAdminOrders();
    if (sectionId === 'stats') calculateStats();
};

// --- Products Management ---

function renderAdminProducts() {
    if (!adminProductGrid) return;

    adminProductGrid.innerHTML = adminProducts.map(p => `
        <div class="admin-product-card ${!p.available ? 'out-of-stock' : ''} ${p.featured ? 'has-featured' : ''}">
            ${p.featured ? '<div class="badge-featured">Destacado</div>' : ''}
            ${!p.available ? '<div class="badge-status no-stock">SIN STOCK</div>' : ''}
            ${p.label ? `<div class="badge-status promo" style="top: ${p.available ? '1rem' : '3.5rem'}">${p.label}</div>` : ''}
            <div class="card-img-container">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <span class="card-id">${p.sku || '#' + p.id.toString().slice(-4)}</span>
            <span class="card-category">${p.category}</span>
            <h3 class="card-title">${p.name}</h3>
            <span class="card-price">${adminSettings.currency}${p.price.toLocaleString('es-AR')}</span>
            
            <div class="card-actions">
                <button class="btn-editor" onclick="editProduct(${p.id})">
                    <i class="fas fa-pencil-alt"></i> Editor
                </button>
                <button class="card-btn-icon btn-star ${p.featured ? 'active' : ''}" onclick="toggleFeatured(${p.id})" title="Destacar">
                    <i class="fas fa-star"></i>
                </button>
                <button class="card-btn-icon btn-view ${!p.available ? 'active' : ''}" onclick="toggleAvailability(${p.id})" title="Alternar Stock">
                    <i class="fas ${p.available ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <button class="card-btn-icon btn-delete" onclick="deleteProduct(${p.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (countProducts) countProducts.textContent = adminProducts.length;
}

window.toggleFeatured = (id) => {
    const p = adminProducts.find(p => p.id === id);
    if (p) {
        p.featured = !p.featured;
        localStorage.setItem('lc1-products-db', JSON.stringify(adminProducts));
        renderAdminProducts();
        renderAdminHomeFeatured(); // Sincronizar con Mi Portada si está abierta
    }
};

window.toggleAvailability = (id) => {
    const p = adminProducts.find(p => p.id === id);
    if (p) {
        p.available = !p.available;
        localStorage.setItem('lc1-products-db', JSON.stringify(adminProducts));
        renderAdminProducts();
    }
};

// --- Home Featured Grid (Mi Portada) ---
function renderAdminHomeFeatured() {
    if (!adminFeaturedGrid) return;

    const featuredItems = adminProducts.filter(p => p.featured);
    
    if (featuredItems.length === 0) {
        adminFeaturedGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: rgba(204,255,0,0.05); border-radius: 20px; border: 1px dashed var(--primary-color);">
                <i class="fas fa-star" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-muted);">No tienes productos destacados en el inicio.</p>
                <p style="font-size: 0.8rem; margin-top: 5px;">Agrega productos desde la pestaña <b>Productos</b> usando el icono de estrella.</p>
            </div>
        `;
        return;
    }

    adminFeaturedGrid.innerHTML = featuredItems.map(p => `
        <div class="admin-product-card">
            <div class="badge-featured">Destacado</div>
            <div class="card-img-container">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <h3 class="card-title">${p.name}</h3>
            <div class="card-actions">
                <button class="btn-editor" onclick="editProduct(${p.id})" style="width: auto; flex: 1;">
                    <i class="fas fa-pencil-alt"></i> Editar
                </button>
                <button class="card-btn-icon btn-star active" onclick="toggleFeatured(${p.id})" title="Quitar de Portada">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.saveProduct = () => {
    const idToEdit = document.getElementById('product-form').dataset.editId;
    
    if (!currentImageBase64 && !idToEdit) {
        return alert('Por favor, selecciona una imagen');
    }

    const newProduct = {
        id: idToEdit ? parseInt(idToEdit) : Date.now(),
        name: document.getElementById('p-name').value,
        sku: document.getElementById('p-sku').value,
        price: parseFloat(document.getElementById('p-price').value),
        category: document.getElementById('p-category').value,
        desc: document.getElementById('p-desc').value,
        label: document.getElementById('p-label').value,
        available: document.getElementById('p-available').checked,
        featured: document.getElementById('p-featured').checked,
        customizable: document.getElementById('p-customizable').checked,
        image: currentImageBase64 || (idToEdit ? adminProducts.find(p => p.id === parseInt(idToEdit)).image : '')
    };

    if (idToEdit) {
        const index = adminProducts.findIndex(p => p.id === parseInt(idToEdit));
        adminProducts[index] = newProduct;
    } else {
        adminProducts.push(newProduct);
    }

    localStorage.setItem('lc1-products-db', JSON.stringify(adminProducts));
    renderAdminProducts();
    closeModal();
    showToast('Producto guardado correctamente', 'success');
};

window.deleteProduct = (id) => {
    showConfirm('¿Estás seguro de que quieres eliminar este producto?', () => {
        adminProducts = adminProducts.filter(p => p.id !== id);
        localStorage.setItem('lc1-products-db', JSON.stringify(adminProducts));
        renderAdminProducts();
        showToast('Producto eliminado', 'info');
    });
};

window.editProduct = (id) => {
    const p = adminProducts.find(p => p.id === id);
    if (!p) return;

    document.getElementById('p-name').value = p.name;
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-desc').value = p.desc || '';
    document.getElementById('p-label').value = p.label || '';
    document.getElementById('p-available').checked = p.available !== undefined ? p.available : true;
    document.getElementById('p-featured').checked = p.featured || false;
    document.getElementById('p-customizable').checked = p.customizable || false;
    
    currentImageBase64 = p.image;
    document.getElementById('p-preview').innerHTML = `<img src="${p.image}" style="width:100%; height:100%; object-fit:contain;">`;
    
    document.getElementById('product-form').dataset.editId = id;
    document.getElementById('modal-title').textContent = 'Editar producto';
    document.getElementById('product-modal').style.display = 'flex';
};

// --- Orders Management ---

function renderAdminOrders() {
    if (!adminOrdersList) return;

    adminOrdersList.innerHTML = adminOrders.length === 0 
        ? '<tr><td colspan="6" style="text-align:center; padding:3rem; color:#666;">No hay pedidos registrados aún.</td></tr>'
        : adminOrders.map(o => `
        <tr>
            <td><span style="font-size:0.8rem;">${o.date}</span></td>
            <td><span style="font-weight:600;">#ORD-${String(o.id).slice(-5)}</span></td>
            <td><span style="font-weight:700; color:#ff6b00;">${adminSettings.currency}${o.total.toLocaleString('es-AR')}</span></td>
            <td>
                <select onchange="updateOrderStatus(${o.id}, this.value)" style="background:#fff; color:#333; border:1px solid #ddd; padding:4px; border-radius:4px; font-size:0.7rem;">
                    <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${o.status === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>
                <button class="btn-icon" onclick="viewOrderDetails(${o.id})" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            </td>
            <td>
                <button class="btn-icon delete" onclick="deleteOrder(${o.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).reverse().join('');

    const statTotalOrders = document.getElementById('stat-total-orders');
    if (statTotalOrders) statTotalOrders.textContent = `${adminOrders.length} Pedidos Registrados`;
}

function calculateStats() {
    if (adminOrders.length === 0) {
        document.getElementById('stat-total-revenue').textContent = adminSettings.currency + '0';
        document.getElementById('stat-avg-order').textContent = adminSettings.currency + '0';
        document.getElementById('stat-total-orders').textContent = '0 Pedidos Registrados';
        return;
    }

    const total = adminOrders.reduce((acc, o) => acc + (o.status !== 'Cancelado' ? o.total : 0), 0);
    const avg = total / adminOrders.length;

    const statRevenue = document.getElementById('stat-total-revenue');
    const statAvg = document.getElementById('stat-avg-order');
    const statTotalOrders = document.getElementById('stat-total-orders');

    if (statRevenue) statRevenue.textContent = adminSettings.currency + total.toLocaleString('es-AR');
    if (statAvg) statAvg.textContent = adminSettings.currency + avg.toLocaleString('es-AR');
    if (statTotalOrders) statTotalOrders.textContent = `${adminOrders.length} Pedidos Registrados`;

    renderTopSellingChart();
    processAnalytics();
}

function renderTopSellingChart() {
    const chartContainer = document.getElementById('top-products-chart');
    if (!chartContainer) return;

    const productCounts = {};
    adminOrders.forEach(order => {
        if (order.status !== 'Cancelado') {
            order.items.forEach(item => {
                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
            });
        }
    });

    const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sortedProducts.length === 0) {
        chartContainer.innerHTML = '<p style="color:#666; text-align:center; padding:2rem;">Sin datos de ventas suficientes.</p>';
        return;
    }

    const maxVal = sortedProducts[0][1];

    chartContainer.innerHTML = sortedProducts.map(([name, count]) => {
        const percentage = (count / maxVal) * 100;
        return `
            <div class="chart-bar-row">
                <div class="chart-bar-label">
                    <span>${name}</span>
                    <span style="font-weight:700;">${count} vendidos</span>
                </div>
                <div class="chart-bar-wrap">
                    <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Analytics Pro Engine ---

function processAnalytics() {
    const logs = getSafeJSON('lc1-event-logs', []);
    
    // KPIs
    const totalVisits = logs.filter(l => l.type === 'page_view').length;
    const waClicks = logs.filter(l => l.type === 'whatsapp_click').length;
    const cartAdds = logs.filter(l => l.type === 'add_to_cart').length;
    
    const sessionLogs = logs.filter(l => l.type === 'session_time');
    const avgTimeSec = sessionLogs.length > 0 
        ? sessionLogs.reduce((acc, l) => acc + (l.data.seconds || 0), 0) / sessionLogs.length 
        : 0;

    // Inyectar en UI
    const elVisits = document.getElementById('ana-total-visits');
    const elWA = document.getElementById('ana-wa-clicks');
    const elCart = document.getElementById('ana-cart-adds');
    const elTime = document.getElementById('ana-avg-time');

    if (elVisits) elVisits.textContent = totalVisits.toLocaleString();
    if (elWA) elWA.textContent = waClicks.toLocaleString();
    if (elCart) elCart.textContent = cartAdds.toLocaleString();
    if (elTime) elTime.textContent = (avgTimeSec / 60).toFixed(1) + 'm';

    // Preparar Gráficos
    renderAnalyticsCharts(logs);
}

function renderAnalyticsCharts(logs) {
    if (!document.getElementById('chart-visits-daily')) return;

    // 1. Data para Visitas diarias (Last 7 days)
    const days = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toISOString().split('T')[0]] = 0;
    }

    logs.filter(l => l.type === 'page_view').forEach(l => {
        const dateKey = l.timestamp.split('T')[0];
        if (days[dateKey] !== undefined) days[dateKey]++;
    });

    const visitLabels = Object.keys(days).reverse();
    const visitData = Object.values(days).reverse();

    // 2. Data para Mix de Eventos
    const mix = {
        'Páginas': logs.filter(l => l.type === 'page_view').length,
        'WhatsApp': logs.filter(l => l.type === 'whatsapp_click').length,
        'Carrito': logs.filter(l => l.type === 'add_to_cart').length,
        'Otros': logs.filter(l => !['page_view','whatsapp_click','add_to_cart','session_time'].includes(l.type)).length
    };

    // Renderizado Chart.js
    if (chartVisits) chartVisits.destroy();
    if (chartMix) chartMix.destroy();

    const ctxVisits = document.getElementById('chart-visits-daily').getContext('2d');
    chartVisits = new Chart(ctxVisits, {
        type: 'line',
        data: {
            labels: visitLabels,
            datasets: [{
                label: 'Visitas',
                data: visitData,
                borderColor: '#ccff00',
                backgroundColor: 'rgba(204,255,0,0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    const ctxMix = document.getElementById('chart-events-mix').getContext('2d');
    chartMix = new Chart(ctxMix, {
        type: 'doughnut',
        data: {
            labels: Object.keys(mix),
            datasets: [{
                data: Object.values(mix),
                backgroundColor: ['#ccff00', '#25d366', '#00c8ff', '#ff6b00'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 10 } } }
            },
            cutout: '70%'
        }
    });
}

window.updateOrderStatus = (id, newStatus) => {
    const order = adminOrders.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('lc1-orders-db', JSON.stringify(adminOrders));
        
        // Sync UI
        renderAdminOrders();
        calculateStats(); // Recalculate revenue if canceled
        
        showToast(`Pedido #${String(id).slice(-5)} actualizado a ${newStatus}`, 'success');
    }
};

window.deleteOrder = (id) => {
    showConfirm('¿Eliminar registro de este pedido permanentemente?', () => {
        adminOrders = adminOrders.filter(o => o.id !== id);
        localStorage.setItem('lc1-orders-db', JSON.stringify(adminOrders));
        renderAdminOrders();
        calculateStats();
        showToast('Registro eliminado', 'info');
    });
};

window.viewOrderDetails = (id) => {
    const o = adminOrders.find(o => o.id === id);
    if (!o) return;

    const modal = document.getElementById('order-modal');
    const body = document.getElementById('order-modal-body');

    body.innerHTML = `
        <div class="order-detail-card">
            <h4 style="color:var(--text-muted); margin-bottom:1rem;">Resumen de Items</h4>
            ${o.items.map(item => `
                <div class="order-item-row">
                    <span>${item.name} x${item.quantity}</span>
                    <span style="font-weight:700;">${adminSettings.currency}${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                </div>
            `).join('')}
            
            <div class="order-total-highlight">
                <span>TOTAL</span>
                <span>${adminSettings.currency}${o.total.toLocaleString('es-AR')}</span>
            </div>
        </div>
        <div style="background:rgba(255,255,255,0.03); padding:1.5rem; border-radius:15px; border: 1px solid rgba(255,255,255,0.05);">
            <h4 style="color:var(--primary-color); margin-bottom:1rem;">Información del Cliente</h4>
            <p style="margin-bottom:0.5rem;"><i class="fas fa-clock" style="margin-right:10px;"></i> ${o.date}</p>
            <p style="margin-bottom:0.5rem;"><i class="fas fa-hashtag" style="margin-right:10px;"></i> SKU Ref: ${o.items[0]?.sku || 'N/A'}</p>
            <p><i class="fas fa-info-circle" style="margin-right:10px;"></i> Estado: <span style="color:#00ff64;">${o.status}</span></p>
        </div>
    `;

    modal.style.display = 'flex';
};

window.closeOrderModal = () => {
    document.getElementById('order-modal').style.display = 'none';
};

// --- Settings Logic ---

function loadSettings() {
    const sName = document.getElementById('set-store-name');
    const sWA = document.getElementById('set-whatsapp');
    const sCurr = document.getElementById('set-currency');
    
    if (sName) sName.value = adminSettings.storeName;
    if (sWA) sWA.value = adminSettings.whatsapp;
    if (sCurr) sCurr.value = adminSettings.currency;

    // Popular campos de títulos dinámicos (en Ajustes)
    const sCatTitle = document.getElementById('set-cat-title');
    const sFeatTitle = document.getElementById('set-featured-title');
    if (sCatTitle) sCatTitle.value = adminSettings.catSectionTitle;
    if (sFeatTitle) sFeatTitle.value = adminSettings.featuredSectionTitle;

    // Campos de Seguridad
    const sUser = document.getElementById('set-admin-user');
    if (sUser) sUser.value = adminAuth.user;
}

// Nueva función de guardado automático para títulos
window.updateDynamicTitle = (key, value) => {
    adminSettings[key] = value;
    localStorage.setItem('lc1-settings', JSON.stringify(adminSettings));
    // Opcional: Mostrar un micro-toast o solo feedback visual sutil
    console.log(`Setting updated: ${key} = ${value}`);
};

function saveSettings() {
    adminSettings = {
        storeName: document.getElementById('set-store-name').value,
        whatsapp: document.getElementById('set-whatsapp').value,
        currency: document.getElementById('set-currency').value,
        catSectionTitle: document.getElementById('set-cat-title').value,
        featuredSectionTitle: document.getElementById('set-featured-title').value
    };
    localStorage.setItem('lc1-settings', JSON.stringify(adminSettings));
    showToast('Ajustes guardados correctamente', 'success');
    setTimeout(() => location.reload(), 1000);
}

function saveAuthSettings() {
    const newUser = document.getElementById('set-admin-user').value.trim();
    const newPass = document.getElementById('set-admin-pass').value.trim();
    const confirmPass = document.getElementById('set-admin-pass-confirm').value.trim();

    if (!newUser) {
        return showToast('El usuario no puede estar vacío', 'error');
    }

    if (newPass && newPass !== confirmPass) {
        return showToast('Las contraseñas no coinciden', 'error');
    }

    adminAuth.user = newUser;
    if (newPass) {
        adminAuth.pass = newPass;
    }

    localStorage.setItem('lc1-admin-auth', JSON.stringify(adminAuth));
    showToast('Credenciales actualizadas correctamente', 'success');
    
    // Reset pass fields
    document.getElementById('set-admin-pass').value = '';
    document.getElementById('set-admin-pass-confirm').value = '';
}

// --- Image Processing ---

function processImage(file, target = 'product') {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            const previewId = target === 'product' ? 'p-preview' : 'cat-preview';
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = `<img src="${currentImageBase64}" style="width:100%; height:100%; object-fit:${target === 'product' ? 'contain' : 'cover'};">`;
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Modal Helpers
window.openModal = (isFeatured = false) => {
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = isFeatured ? 'Nuevo Producto Destacado' : 'Nuevo Producto';
    document.getElementById('product-form').reset();
    document.getElementById('p-preview').innerHTML = `<i class="fas fa-image" style="color:#ccc; font-size:3rem;"></i>`;
    currentImageBase64 = '';
    delete document.getElementById('product-form').dataset.editId;
    
    // Si viene desde "Añadir Destacado", marcamos el checkbox
    if (isFeatured) {
        document.getElementById('p-featured').checked = true;
    }
};

window.closeModal = () => {
    document.getElementById('product-modal').style.display = 'none';
};
// --- Categories Management ---

function renderAdminCategories() {
    if (!adminCategoriesGrid) return;

    adminCategoriesGrid.innerHTML = adminCategories.map(cat => `
        <div class="admin-product-card">
            <div class="card-img-container" style="height: 200px;">
                <img src="${cat.image}" alt="${cat.name}" style="object-fit: cover;">
            </div>
            <h3 class="card-title" style="color: var(--primary-color); font-size: 1.4rem;">${cat.name}</h3>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1.5rem;">${cat.desc}</p>
            <div class="card-actions">
                <button class="btn-editor" onclick="openCategoryModal(${cat.id})" style="flex: 1;">
                    <i class="fas fa-pencil-alt"></i> Editar
                </button>
                <button class="card-btn-icon btn-delete" onclick="deleteCategory(${cat.id})" title="Eliminar Categoría">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.openCategoryModal = (id = null) => {
    const modal = document.getElementById('category-modal');
    modal.style.display = 'flex';
    
    if (id) {
        const cat = adminCategories.find(c => c.id === id);
        if (!cat) return;
        modal.dataset.editId = id;
        document.getElementById('cat-modal-title').textContent = 'Editar Categoría';
        document.getElementById('cat-name').value = cat.name;
        document.getElementById('cat-desc').value = cat.desc;
        document.getElementById('cat-preview').innerHTML = `<img src="${cat.image}" style="width:100%; height:100%; object-fit:cover;">`;
        currentImageBase64 = cat.image;
    } else {
        delete modal.dataset.editId;
        document.getElementById('cat-modal-title').textContent = 'Nueva Categoría';
        document.getElementById('category-form').reset();
        document.getElementById('cat-preview').innerHTML = `<i class="fas fa-image" style="color:#333; font-size:4rem;"></i>`;
        currentImageBase64 = '';
    }
};

window.closeCatModal = () => {
    document.getElementById('category-modal').style.display = 'none';
    currentImageBase64 = '';
};

window.saveCategory = () => {
    const idToEdit = document.getElementById('category-modal').dataset.editId;
    
    const categoryData = {
        id: idToEdit ? parseInt(idToEdit) : Date.now(),
        name: document.getElementById('cat-name').value,
        slug: document.getElementById('cat-name').value.toLowerCase().replace(/ /g, '-'),
        desc: document.getElementById('cat-desc').value,
        image: currentImageBase64
    };

    if (!categoryData.image) {
        return showToast('Por favor, selecciona una foto para la categoría', 'error');
    }

    if (idToEdit) {
        const index = adminCategories.findIndex(c => c.id === parseInt(idToEdit));
        if (index !== -1) adminCategories[index] = categoryData;
    } else {
        adminCategories.push(categoryData);
    }

    localStorage.setItem('lc1-categories-db', JSON.stringify(adminCategories));
    renderAdminCategories();
    closeCatModal();
    showToast(idToEdit ? 'Categoría actualizada' : 'Categoría creada', 'success');
};

window.deleteCategory = (id) => {
    showConfirm('¿Estás seguro de que quieres eliminar esta categoría?', () => {
        adminCategories = adminCategories.filter(c => c.id !== id);
        localStorage.setItem('lc1-categories-db', JSON.stringify(adminCategories));
        renderAdminCategories();
        showToast('Categoría eliminada', 'info');
    });
};

// --- Mobile Sidebar Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.querySelector('aside.sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.onclick = () => {
            sidebar.classList.toggle('active');
        };

        // Cerrar al clickear link en móvil
        sidebar.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
});
