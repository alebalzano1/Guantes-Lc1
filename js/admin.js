// Lógica del Panel de Administración LC1 Goalkeeper
// Persistencia: LocalStorage
console.log("%c[LC1 Admin] Iniciando sistema...", "color: #F9FF20; font-weight: bold; font-size: 16px;");

// PRUEBA DE CARGA: Eliminada para producción.

// --- Diagnóstico de Carga ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error("%c[CRITICAL ERROR] Fallo en el script: ", "background: red; color: white; padding: 5px;", {msg, url, lineNo, error});
    alert("Error detectado: " + msg);
    return false;
};

let currentImageBase64 = '';
let currentImagesArray = [];

// Productos y Categorías de Respaldo (para evitar colisión global)
const adminInitialProducts = window.LC1_Data ? window.LC1_Data.products : [];
const adminInitialCategories = window.LC1_Data ? window.LC1_Data.categories : [];

const getSafeJSON = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing LocalStorage key "${key}":`, e);
        return defaultValue;
    }
};

// REEMPLAZO Firebase: Las variables ahora se poblarán desde Firestore
let adminProducts = [];
let adminCategories = [];
let adminGallery = [];
let adminOrders = [];
let adminSettings = {};

// Obtener datos iniciales de Firebase
async function loadInitialData() {
    console.log("[LC1 Admin] Cargando datos desde Firebase...");
    try {
        adminProducts = await FirebaseService.getProducts();
        adminCategories = await FirebaseService.getCategories();
        adminGallery = await FirebaseService.getGallery();
        adminSettings = await FirebaseService.getSettings() || window.LC1_Data.settings;
        adminOrders = await FirebaseService.getOrders();
        
        console.log("[LC1 Admin] Datos cargados:", {
            products: adminProducts.length,
            categories: adminCategories.length,
            orders: adminOrders.length
        });

        // Sincronizar UI
        checkAuth();
        loadSettings();
    } catch (error) {
        console.error("[LC1 Admin] Error fatal cargando Firebase:", error);
        showToast('Error de conexión con la base de datos', 'error');
    }
}

// Listas negras para evitar que la sincronización restaure items eliminados
let adminDeletedProducts = getSafeJSON('lc1-deleted-products', []);
let adminDeletedCategories = getSafeJSON('lc1-deleted-categories', []);

let adminSettings = getSafeJSON('lc1-settings', window.LC1_Data ? window.LC1_Data.settings : {
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

// Verificación de integridad del objeto adminAuth
if (!adminAuth || typeof adminAuth !== 'object' || !adminAuth.user || !adminAuth.pass) {
    console.warn("[LC1 Admin] Datos de autenticación corruptos o antiguos. Reseteando a valores de fábrica...");
    adminAuth = { user: 'administrador', pass: 'admin12345' };
    localStorage.setItem('lc1-admin-auth', JSON.stringify(adminAuth));
} else {
    console.log("[LC1 Admin] Credenciales cargadas: ", { user: adminAuth.user, passLength: adminAuth.pass.length });
    // console.table(adminAuth); // Solo activar para debugging extremo
}

// Instancias de Chart.js para limpieza
let chartVisits = null;
let chartMix = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[LC1 Admin] Iniciando procesos base...");
    
    // 1. VINCULAR LOGIN (Prioridad Absoluta)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const userInput = document.getElementById('login-email').value.trim();
            const passInput = document.getElementById('login-pass').value.trim();
            
            console.log("[LC1 Admin] Intento de login con usuario:", userInput);

            // Validación contra credenciales guardadas (adminAuth)
            const isValid = (userInput.toLowerCase() === adminAuth.user.toLowerCase() && passInput === adminAuth.pass);

            if (isValid) {
                console.log("[LC1 Admin] Acceso concedido.");
                sessionStorage.setItem('lc1-admin-token', 'true');
                checkAuth();
            } else {
                console.warn("[LC1 Admin] Acceso Denegado.");
                const errorEl = document.getElementById('login-error');
                if (errorEl) {
                    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Usuario o contraseña incorrectos.`;
                    errorEl.style.display = 'block';
                }
                showToast('Credenciales incorrectas', 'error');
            }
        };
        console.log("[LC1 Admin] Sistema de login vinculado.");
    }

    // 2. CARGAR EL RESTO (Desde Firebase)
    try {
        loadInitialData();
    } catch (err) {
        console.warn("[LC1 Admin] Aviso: Fallo crítico al iniciar datos.", err);
    }


    // Image Upload Event (Products)
    const fileInput = document.getElementById('p-file');
    if (fileInput) {
        fileInput.onchange = (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                const preview = document.getElementById('p-preview');
                if (preview.innerHTML.includes('fa-image')) {
                    preview.innerHTML = '';
                }
                Array.from(files).forEach((file, idx) => processImage(file, 'product', true));
            }
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

    // Image Upload Event (Gallery)
    const galFileInput = document.getElementById('gal-file');
    if (galFileInput) {
        galFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processImage(file, 'gallery');
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

    // Gallery Form Event
    const galleryForm = document.getElementById('gallery-form');
    if (galleryForm) {
        galleryForm.onsubmit = (e) => {
            e.preventDefault();
            saveGalleryItem();
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
    console.log("[LC1 Admin] Verificando estado de autenticación...");
    const isAuth = sessionStorage.getItem('lc1-admin-token');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (isAuth) {
        console.log("[LC1 Admin] Sesión activa.");
        
        // 1. CAMBIO VISUAL INMEDIATO (Prioridad 1)
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) {
            dashboardSection.style.display = 'flex';
            dashboardSection.classList.add('fade-in');
        }
        
        // 2. CARGA DE MÓDULOS (Protegidos por try-catch para no romper la UI)
        try {
            const adminNameDisplay = document.querySelector('#admin-user-info');
            if (adminNameDisplay) {
                adminNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${adminAuth.user}`;
            }

            renderAdminProducts();
            renderAdminOrders();
            renderAdminCategories();
            calculateStats();

            if (!document.body.dataset.loaded) {
                showToast('Bienvenido, Administrador', 'success');
                document.body.dataset.loaded = "true";
            }
        } catch (error) {
            console.error("[LC1 Admin] Error al cargar módulos del dashboard:", error);
            showToast('Error al cargar algunos datos del tablero', 'info');
        }
    } else {
        console.log("[LC1 Admin] Sesión no iniciada.");
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
    let currentDB = getSafeJSON('lc1-products-db', adminInitialProducts);
    let updated = false;

    adminInitialProducts.forEach(ip => {
        const isDeleted = adminDeletedProducts.includes(ip.id);
        if (!currentDB.find(p => p.id === ip.id) && !isDeleted) {
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
    let currentDB = getSafeJSON('lc1-categories-db', adminInitialCategories);
    let updated = false;

    adminInitialCategories.forEach(ic => {
        const isDeleted = adminDeletedCategories.includes(ic.id);
        if (!currentDB.find(c => c.id === ic.id) && !isDeleted) {
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

// Sincronizar galería si hay nuevos elementos iniciales
function syncGallery() {
    let currentDB = getSafeJSON('lc1-gallery-db', adminInitialGallery);
    let updated = false;

    adminInitialGallery.forEach(ig => {
        if (!currentDB.find(item => item.id === ig.id)) {
            currentDB.push(ig);
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem('lc1-gallery-db', JSON.stringify(currentDB));
        adminGallery = currentDB;
        console.log("Gallery Synced!");
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
    if (sectionId === 'gallery') renderAdminGallery();
    if (sectionId === 'orders') renderAdminOrders();
    if (sectionId === 'stats') calculateStats();
};

// --- Products Management ---

function renderAdminProducts() {
    const grid = document.getElementById('admin-product-grid');
    const counter = document.getElementById('count-products');
    if (!grid) return;

    grid.innerHTML = adminProducts.map(p => `
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
    
    if (counter) counter.textContent = adminProducts.length;
}

window.toggleFeatured = async (id) => {
    const p = adminProducts.find(p => p.id === id);
    if (p) {
        p.featured = !p.featured;
        try {
            await FirebaseService.saveProduct(p);
            renderAdminProducts();
            renderAdminHomeFeatured();
        } catch (error) {
            showToast('Error al actualizar destaque', 'error');
        }
    }
};

window.toggleAvailability = async (id) => {
    const p = adminProducts.find(p => p.id === id);
    if (p) {
        p.available = !p.available;
        try {
            await FirebaseService.saveProduct(p);
            renderAdminProducts();
        } catch (error) {
            showToast('Error al actualizar disponibilidad', 'error');
        }
    }
};

// --- Home Featured Grid (Mi Portada) ---
function renderAdminHomeFeatured() {
    const grid = document.getElementById('admin-featured-grid');
    if (!grid) return;

    const featuredItems = adminProducts.filter(p => p.featured);
    
    grid.innerHTML = featuredItems.map(p => `
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

window.saveProduct = async () => {
    const idToEdit = document.getElementById('product-form').dataset.editId;
    const saveBtn = document.querySelector('#product-form .btn-save');
    
    if (!currentImageBase64 && !idToEdit) {
        return alert('Por favor, selecciona una imagen');
    }

    // Feedback visual de carga
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    saveBtn.disabled = true;

    try {
        const finalImages = [];
        // Subir cada imagen a Firebase Storage si es Base64
        for (let i = 0; i < currentImagesArray.length; i++) {
            const img = currentImagesArray[i];
            if (img.startsWith('data:image')) {
                const blob = FirebaseService.base64ToBlob(img);
                const fileName = `products/${Date.now()}_${i}.jpg`;
                const url = await FirebaseService.uploadImage(blob, fileName);
                finalImages.push(url);
            } else {
                finalImages.push(img); // Ya es una URL o ruta local
            }
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
            image: finalImages.length > 0 ? finalImages[0] : (idToEdit ? adminProducts.find(p => p.id === parseInt(idToEdit)).image : ''),
            images: finalImages
        };

        // Guardar en Firestore
        await FirebaseService.saveProduct(newProduct);

        // Actualizar estado local
        if (idToEdit) {
            const index = adminProducts.findIndex(p => p.id === parseInt(idToEdit));
            if (index !== -1) adminProducts[index] = newProduct;
        } else {
            adminProducts.push(newProduct);
        }

        renderAdminProducts();
        renderAdminHomeFeatured();
        calculateStats(); 
        
        closeModal();
        showToast('Producto sincronizado con éxito', 'success');

    } catch (error) {
        console.error("Error guardando producto:", error);
        showToast('Error al subir imágenes o guardar datos', 'error');
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
};

window.deleteProduct = (id) => {
    showConfirm('¿Estás seguro de que quieres eliminar este producto?', async () => {
        try {
            await FirebaseService.deleteProduct(id);
            adminProducts = adminProducts.filter(p => p.id !== id);
            renderAdminProducts();
            showToast('Producto eliminado de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar producto', 'error');
        }
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
    currentImagesArray = p.images || (p.image ? [p.image] : []);
    
    window.renderProductImagesPreview();
    
    document.getElementById('product-form').dataset.editId = id;
    document.getElementById('modal-title').textContent = 'Editar producto';
    document.getElementById('product-modal').style.display = 'flex';
};

// --- Orders Management ---

function renderAdminOrders() {
    const list = document.getElementById('admin-orders-list');
    if (!list) return;

    list.innerHTML = adminOrders.length === 0 
        ? '<tr><td colspan="6" style="text-align:center; padding:3rem; color:#666;">No hay pedidos registrados aún.</td></tr>'
        : adminOrders.map(o => `
        <tr>
            <td><span style="font-size:0.8rem;">${o.date}</span></td>
            <td><span style="font-weight:600;">#ORD-${String(o.id).slice(-5)}</span></td>
            <td><span style="font-weight:700; color:#ff6b00;">${adminSettings.currency}${o.total.toLocaleString('es-AR')}</span></td>
            <td>
                <select class="admin-select" onchange="updateOrderStatus(${o.id}, this.value)" style="padding: 6px 10px; font-size: 0.75rem; border-radius: 8px;">
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

    // Renderizado Chart.js (Solo si la librería cargó)
    if (typeof Chart === 'undefined') {
        console.warn("[LC1 Admin] Chart.js no detectado. Saltando renderizado de gráficos.");
        return;
    }

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
                borderColor: '#F9FF20',
                backgroundColor: 'rgba(249, 255, 32, 0.1)',
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
                backgroundColor: ['#F9FF20', '#25d366', '#00c8ff', '#ff6b00'],
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

window.updateOrderStatus = async (id, newStatus) => {
    const order = adminOrders.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
        try {
            await FirebaseService.saveOrder(order);
            renderAdminOrders();
            calculateStats(); 
            showToast(`Pedido #${String(id).slice(-5)} actualizado a ${newStatus}`, 'success');
        } catch (error) {
            showToast('Error al actualizar pedido', 'error');
        }
    }
};

window.deleteOrder = (id) => {
    showConfirm('¿Eliminar registro de este pedido permanentemente?', async () => {
        try {
            await FirebaseService.deleteOrder(id);
            adminOrders = adminOrders.filter(o => o.id !== id);
            renderAdminOrders();
            calculateStats();
            showToast('Registro eliminado de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar pedido', 'error');
        }
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
window.updateDynamicTitle = async (key, value) => {
    adminSettings[key] = value;
    try {
        await FirebaseService.saveSettings(adminSettings);
        console.log(`Firebase updated: ${key} = ${value}`);
    } catch (error) {
        console.error("Error updating dynamic title:", error);
    }
};

async function saveSettings() {
    adminSettings = {
        storeName: document.getElementById('set-store-name').value,
        whatsapp: document.getElementById('set-whatsapp').value,
        currency: document.getElementById('set-currency').value,
        catSectionTitle: document.getElementById('set-cat-title').value,
        featuredSectionTitle: document.getElementById('set-featured-title').value
    };
    try {
        await FirebaseService.saveSettings(adminSettings);
        showToast('Ajustes sincronizados en la nube', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        showToast('Error al guardar ajustes', 'error');
    }
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
    
    // Reset pass fields y forzar recarga para consolidar seguridad
    document.getElementById('set-admin-pass').value = '';
    document.getElementById('set-admin-pass-confirm').value = '';
    
    setTimeout(() => location.reload(), 1500);
}

// --- Image Processing ---

window.renderProductImagesPreview = () => {
    const preview = document.getElementById('p-preview');
    if (!currentImagesArray || currentImagesArray.length === 0) {
        preview.innerHTML = `<i class="fas fa-image" style="color:#ccc; font-size:3rem; margin:auto;"></i>`;
        currentImageBase64 = '';
        return;
    }
    
    currentImageBase64 = currentImagesArray[0];

    preview.innerHTML = currentImagesArray.map((img, idx) => `
        <div style="position:relative; flex-shrink:0; display:inline-block; height:100px;">
            <img src="${img}" style="height:100px; width:auto; border-radius:8px; object-fit:contain; border:2px solid var(--primary-color);">
            <button type="button" onclick="removeProductImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; z-index:10;"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
};

window.removeProductImage = (idx) => {
    currentImagesArray.splice(idx, 1);
    window.renderProductImagesPreview();
};

function processImage(file, target = 'product', isMultiple = false) {
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

            const finalBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            if (target === 'product' && isMultiple) {
                currentImagesArray.push(finalBase64);
                window.renderProductImagesPreview();
            } else {
                currentImageBase64 = finalBase64;
                
                let previewId = 'p-preview';
                if (target === 'category') previewId = 'cat-preview';
                if (target === 'gallery') previewId = 'gal-preview';
                
                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.innerHTML = `<img src="${currentImageBase64}" style="width:100%; height:100%; object-fit:${target === 'product' ? 'contain' : 'cover'};">`;
                }
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
    currentImagesArray = [];
    window.renderProductImagesPreview();
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
    const grid = document.getElementById('admin-categories-grid');
    if (!grid) return;

    grid.innerHTML = adminCategories.map(cat => `
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

window.saveCategory = async () => {
    const modal = document.getElementById('category-modal');
    const idToEdit = modal.dataset.editId;
    const saveBtn = document.querySelector('#category-modal .btn-save');
    
    if (!currentImageBase64) {
        return showToast('Por favor, selecciona una foto para la categoría', 'error');
    }

    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveBtn.disabled = true;

    try {
        let finalImageUrl = currentImageBase64;
        
        // Subir si es nueva imagen
        if (currentImageBase64.startsWith('data:image')) {
            const blob = FirebaseService.base64ToBlob(currentImageBase64);
            finalImageUrl = await FirebaseService.uploadImage(blob, `categories/${Date.now()}.jpg`);
        }

        const categoryData = {
            id: idToEdit ? parseInt(idToEdit) : Date.now(),
            name: document.getElementById('cat-name').value,
            slug: document.getElementById('cat-name').value.toLowerCase().replace(/ /g, '-'),
            desc: document.getElementById('cat-desc').value,
            image: finalImageUrl
        };

        await FirebaseService.saveCategory(categoryData);

        if (idToEdit) {
            const index = adminCategories.findIndex(c => c.id === parseInt(idToEdit));
            if (index !== -1) adminCategories[index] = categoryData;
        } else {
            adminCategories.push(categoryData);
        }

        renderAdminCategories();
        closeCatModal();
        showToast(idToEdit ? 'Categoría actualizada' : 'Categoría creada', 'success');
    } catch (error) {
        showToast('Error al guardar categoría', 'error');
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
};

window.deleteCategory = (id) => {
    showConfirm('¿Estás seguro de que quieres eliminar esta categoría?', async () => {
        try {
            await FirebaseService.deleteCategory(id);
            adminCategories = adminCategories.filter(c => c.id !== id);
            renderAdminCategories();
            showToast('Categoría eliminada de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar categoría', 'error');
        }
    });
};

// --- Action Gallery Management ---

window.renderAdminGallery = () => {
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;

    grid.innerHTML = adminGallery.map(item => `
        <div class="admin-product-card" style="position:relative;">
            <div class="card-img-container" style="height: 250px;">
                ${item.type === 'video' 
                    ? `<iframe src="${item.data}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" frameborder="0"></iframe>` 
                    : `<img src="${item.data}" style="object-fit:cover; width:100%; height:100%;">`
                }
            </div>
            ${item.type === 'video' ? '<div style="position:absolute; top:10px; right:10px; background:var(--primary-color); color:#000; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;"><i class="fas fa-video"></i> VIDEO</div>' : '<div style="position:absolute; top:10px; right:10px; background:#fff; color:#000; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;"><i class="fas fa-image"></i> FOTO</div>'}
            <div class="card-actions" style="margin-top:0; border-top:1px solid rgba(0,0,0,0.1);">
                <button class="btn-save" style="width:100%; font-size: 0.75rem; padding: 0.8rem;" onclick="deleteGalleryItem(${item.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
};

window.openGalleryModal = () => {
    document.getElementById('gallery-form').reset();
    document.getElementById('gal-preview').innerHTML = `<i class="fas fa-image" style="color:#ccc; font-size:3rem;"></i>`;
    currentImageBase64 = '';
    toggleGalleryType('image'); // default
    document.getElementById('gallery-modal').style.display = 'flex';
};

window.closeGalleryModal = () => {
    document.getElementById('gallery-modal').style.display = 'none';
};

window.toggleGalleryType = (type) => {
    const videoCont = document.getElementById('gal-video-container');
    const imgCont = document.getElementById('gal-image-container');
    if (type === 'video') {
        videoCont.style.display = 'block';
        imgCont.style.display = 'none';
        currentImageBase64 = '';
    } else {
        videoCont.style.display = 'none';
        imgCont.style.display = 'block';
    }
};

window.saveGalleryItem = async () => {
    const type = document.getElementById('gal-type').value;
    const saveBtn = document.querySelector('#gallery-form .btn-save');
    
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    saveBtn.disabled = true;

    try {
        let data = '';
        if (type === 'image') {
            if (!currentImageBase64) return alert('Selecciona una imagen');
            if (currentImageBase64.startsWith('data:image')) {
                const blob = FirebaseService.base64ToBlob(currentImageBase64);
                data = await FirebaseService.uploadImage(blob, `gallery/${Date.now()}.jpg`);
            } else {
                data = currentImageBase64;
            }
        } else {
            data = document.getElementById('gal-video-url').value;
            if (!data) return alert('Ingresa la URL del video');
        }

        const newItem = {
            id: Date.now(),
            type: type,
            data: data
        };

        await FirebaseService.saveGalleryItem(newItem);
        adminGallery.push(newItem);
        renderAdminGallery();
        closeGalleryModal();
        showToast('Galería actualizada', 'success');
    } catch (error) {
        showToast('Error al guardar en galería', 'error');
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
};

window.deleteGalleryItem = (id) => {
    showConfirm('¿Eliminar este elemento de la galería?', async () => {
        try {
            await FirebaseService.deleteGalleryItem(id);
            adminGallery = adminGallery.filter(item => item.id !== id);
            renderAdminGallery();
            showToast('Elemento eliminado', 'info');
        } catch (error) {
            showToast('Error al eliminar', 'error');
        }
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
