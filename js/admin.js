// Lógica del Panel de Administración LC1 Goalkeeper
// Autenticación: Firebase Auth
// Persistencia: Firestore & Storage
const ADMIN_VERSION = "2.3.0";
console.log(`%c[LC1 Admin v${ADMIN_VERSION}] Iniciando sistema...`, "color: #F9FF20; font-weight: bold; font-size: 16px;");

// PRUEBA DE CARGA: Eliminada para producción.

// --- Diagnóstico de Carga ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error("%c[CRITICAL ERROR] Fallo en el script: ", "background: red; color: white; padding: 5px;", {msg, url, lineNo, error});
    if (typeof showToast === 'function') {
        showToast("Error crítico en el sistema: " + msg, "error");
    }
    return false;
};

// Check if running via file://
const isRunningLocally = window.location.protocol === 'file:';
if (isRunningLocally) {
    console.warn("[LC1 Admin] Advertencia: Ejecutado vía file://. Firebase Auth podría fallar.");
}

let currentProductImages = [];
let currentCategoryImage = "";
let processingImagesCount = 0;

function updateProcessingState(delta) {
    processingImagesCount += delta;
    if (processingImagesCount < 0) processingImagesCount = 0;
}

// Productos y Categorías de Respaldo (para evitar colisión global)
const adminInitialProducts = window.LC1_Data ? window.LC1_Data.products : [];
const adminInitialCategories = window.LC1_Data ? window.LC1_Data.categories : [];

// getSafeJSON ahora se carga desde utils.js


// REEMPLAZO Firebase: Las variables ahora se poblarán desde Firestore
let adminProducts = [];
let adminCategories = [];
let adminOrders = [];
let adminLogs = []; // Global Analytics Logs
let adminSettings = {};

// Obtener datos iniciales de Firebase
async function loadInitialData() {
    console.log("[LC1 Admin] Cargando datos...");
    try {
        // Intentar cargar desde Firebase con un timeout implícito o capturando error
        const fbProducts = await FirebaseService.getProducts();
        const fbCategories = await FirebaseService.getCategories();
        const fbSettings = await FirebaseService.getSettings();
        const fbOrders = await FirebaseService.getOrders();
        
        // Si la conexión fue exitosa, usamos los datos de Firebase (aunque sea una lista vacía)
        // Si la base de datos no tiene productos o devuelve vacío, usamos el respaldo
        if (!fbProducts || fbProducts.length === 0) {
            console.log("[LC1 Admin] Firestore vacío, cargando respaldo local...");
            adminProducts = adminInitialProducts;
        } else {
            adminProducts = fbProducts;
        }
        adminCategories = fbCategories;
        adminSettings = fbSettings || (window.LC1_Data ? window.LC1_Data.settings : {});
        adminOrders = fbOrders;
        
        adminLogs = await FirebaseService.getEvents(2000).catch(() => []); // Logs no son críticos
        
        console.log("[LC1 Admin] Datos sincronizados con la nube.");
    } catch (error) {
        console.warn("[LC1 Admin] Usando respaldo local (Nube inaccesible):", error.message);
        adminProducts = adminInitialProducts;
        adminCategories = adminInitialCategories;
        adminSettings = window.LC1_Data ? window.LC1_Data.settings : {};
        adminOrders = []; 
        showToast('Modo Local: Datos de respaldo cargados', 'info');
    } finally {
        // Sincronizar UI independientemente de la fuente
        loadSettings();
        renderAdminProducts();
        renderAdminOrders();
        renderAdminCategories();
        renderAdminHomeFeatured();
        renderCategorySelect(); 
        calculateStats();
    }
}

function renderCategorySelect() {
    const select = document.getElementById('p-category');
    if (!select) return;
    
    // Si la lista de categorías está vacía, usamos las básicas por defecto
    const categoriesToShow = (adminCategories && adminCategories.length > 0) ? adminCategories : [
        { slug: 'guantes', name: 'Guantes' },
        { slug: 'indumentaria', name: 'Indumentaria' },
        { slug: 'reparacion', name: 'Reparación' }
    ];
    
    select.innerHTML = `
        <option value="" disabled selected>Seleccionar Categoría</option>
        ${categoriesToShow.map(cat => `
            <option value="${cat.slug}">${cat.name}</option>
        `).join('')}
    `;

    // Vincular la visibilidad de la categoría de edad
    select.onchange = () => {
        if (typeof window.toggleAgeCategoryVisibility === 'function') {
            window.toggleAgeCategoryVisibility();
        }
    };
}

// Listas negras para evitar que la sincronización restaure items eliminados
let adminDeletedProducts = getSafeJSON('lc1-deleted-products', []);
let adminDeletedCategories = getSafeJSON('lc1-deleted-categories', []);

adminSettings = getSafeJSON('lc1-settings', window.LC1_Data ? window.LC1_Data.settings : {
    storeName: 'LC1 GOALKEEPER',
    whatsapp: '541140236384',
    currency: '$',
    catSectionTitle: 'Nuestras <span>Categorías</span>',
    featuredSectionTitle: 'PRODUCTOS <span>TOP</span>'
});

// Instancias de Chart.js para limpieza
let chartVisits = null;
let chartMix = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[LC1 Admin] Iniciando procesos base...");

    
    // 0. DIAGNÓSTICO DE SISTEMA
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const diagPanel = document.getElementById('diag-panel');

    if (isRunningLocally && diagPanel) {
        diagPanel.innerHTML += `<p style="color:#ffb300; font-size:0.75rem; margin-top:0.5rem;"><i class="fas fa-exclamation-triangle"></i> Estás abriendo el archivo localmente. Firebase Auth requiere un servidor (usar Live Server).</p>`;
        diagPanel.style.display = 'block';
    }

    try {
        const connection = await FirebaseService.checkConnection();
        if (connection.firestore) {
            console.log("[LC1 Admin] Conexión con Firebase OK.");
            if (statusDot) {
                statusDot.className = 'status-dot online';
                statusText.innerHTML = 'En Línea <span style="color:#00ff64; font-size:0.6rem;">(Firebase Activo)</span>';
            }
        } else {
            console.warn("[LC1 Admin] Fallo de conexión:", connection.error);
            if (statusDot) {
                statusDot.className = 'status-dot offline';
                statusText.innerHTML = 'Error de Nube <span style="color:#ff3e3e; font-size:0.6rem;">(Ver Consola)</span>';
            }
            if (diagPanel) {
                diagPanel.innerHTML += `<p style="color:#ff4444; font-size:0.75rem;">Error de conexión: ${connection.error}</p>`;
                diagPanel.style.display = 'block';
            }
        }
    } catch (e) {
        console.error("[LC1 Admin] Fallo en diagnóstico:", e);
    }

    // 1. VINCULAR LOGIN CON FIREBASE AUTH
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            let emailInput = document.getElementById('login-email').value.trim();
            const passInput = document.getElementById('login-pass').value.trim();
            const loginBtn = loginForm.querySelector('.btn-primary');
            const originalText = loginBtn.innerHTML;

            // Alias: Si no tiene @, tratarlo como nombre de usuario agregando @admin.com
            if (emailInput && !emailInput.includes('@')) {
                emailInput += '@admin.com';
            }

            console.log("[LC1 Admin] Intento de login Firebase:", emailInput);


            try {
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
                loginBtn.disabled = true;
                
                // 1. Entrar a Firebase con la cuenta maestra (Puente)
                // Usamos la cuenta original que sí funciona en Firebase
                await FirebaseService.login('administrador@admin.com', 'admin12345'); 

                // 2. Verificar credenciales personalizadas en Firestore
                const access = await FirebaseService.getAccess();
                
                const rawUser = document.getElementById('login-email').value.trim();
                const rawPass = document.getElementById('login-pass').value.trim();
                
                if (rawUser === access.username && rawPass === access.password) {
                    console.log("[LC1 Admin] Login exitoso.");
                } else {
                    await FirebaseService.logout();
                    throw new Error("Credenciales incorrectas");
                }
            } catch (error) {
                console.warn("[LC1 Admin] Error de acceso:", error.message);
                const errorEl = document.getElementById('login-error');
                if (errorEl) {
                    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Usuario o contraseña incorrectos.`;
                    errorEl.style.display = 'block';
                }
                showToast('Usuario o contraseña incorrectos', 'error');
            } finally {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        };
    }

    // 2. ESCUCHAR CAMBIOS DE AUTENTICACION (Fuente de Verdad)
    FirebaseService.onAuth((user) => {
        if (user) {
            handleAuthSuccess(user);
        } else {
            console.log("[LC1 Admin] Sin sesión activa. Mostrando Login.");
            const loginSection = document.getElementById('login-section');
            const dashboardSection = document.getElementById('dashboard-section');
            if (loginSection) {
                loginSection.style.display = 'flex';
                // Limpiar campos por seguridad
                document.getElementById('login-email').value = '';
                document.getElementById('login-pass').value = '';
            }
            if (dashboardSection) dashboardSection.style.display = 'none';
        }
    });

    function handleAuthSuccess(user) {
        // Bloquear acceso si es usuario local simulado
        if (!user || !user.uid || user.email.includes('@local')) {
            firebase.auth().signOut();
            return;
        }

        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        console.log("[LC1 Admin] Sesión activa:", user.email);
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) {
            dashboardSection.style.display = 'flex';
            dashboardSection.classList.add('fade-in');
        }

        // Actualizar UI de estado
        if (statusDot) statusDot.className = 'status-dot online';
        if (statusText) statusText.innerHTML = 'Autenticado <span style="color:#00ff64; font-size:0.6rem;">(Nube Activa)</span>';
        
        // Remover advertencia si existe
        const existingWarning = document.getElementById('local-mode-warning');
        if (existingWarning) existingWarning.remove();
        
        const adminNameDisplay = document.querySelector('#admin-user-info');
        if (adminNameDisplay) {
            adminNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email.split('@')[0]}`;
        }

        // Cargar datos
        loadInitialData();
        
        // Activar sección por defecto (Inventario)
        switchSection('products');
        
        if (!document.body.dataset.loaded) {
            showToast('Bienvenido, Administrador', 'success');
            document.body.dataset.loaded = "true";
        }
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


    // 4. Mejorar Previsualizaciones (Click to Upload)
    const setupPreviewClick = (previewId, fileId) => {
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.style.cursor = 'pointer';
            preview.onclick = () => document.getElementById(fileId).click();
            preview.title = "Haz click para cambiar la imagen";
        }
    };

    setupPreviewClick('p-preview', 'p-file');
    setupPreviewClick('cat-preview', 'cat-file');
});

// showToast ahora se carga desde utils.js


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

// --- Seguridad & Auth (Consolidado en Firebase) ---

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

window.logout = async () => {
    try {
        await FirebaseService.logout();
        location.reload();
    } catch (error) {
        location.reload();
    }
};







window.switchSection = async (sectionId, element = null) => {
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
    if (sectionId === 'stats') await calculateStats();
};

// --- Products Management ---

function renderAdminProducts() {
    const grid = document.getElementById('admin-products-list');
    const counter = document.getElementById('count-products');
    if (!grid) return;

    grid.innerHTML = adminProducts.map(p => `
        <div class="admin-product-card ${!p.available ? 'out-of-stock' : ''} ${p.featured ? 'has-featured' : ''}">
            <div class="card-img-container">
                ${p.featured ? '<div class="badge-featured">Destacado</div>' : ''}
                ${!p.available ? '<div class="badge-status no-stock">SIN STOCK</div>' : ''}
                ${p.label ? `<div class="badge-status promo" style="top: ${p.available ? '1.5rem' : '4.5rem'}">${p.label}</div>` : ''}
                <img src="${p.image}" alt="${p.name}" width="300" height="300">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                <span class="card-category">${p.category}</span>
                <span style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">${p.sku || '#' + p.id.toString().slice(-4)}</span>
            </div>
            <h3 class="card-title">${p.name}</h3>
            <span class="card-price">${adminSettings.currency}${p.price.toLocaleString('es-AR')}</span>
            
            <div class="card-actions">
                <button class="btn-editor" onclick="editProduct('${p.id}')">
                    <i class="fas fa-pencil-alt"></i> Editor
                </button>
                <button class="card-btn-icon btn-star ${p.featured ? 'active' : ''}" onclick="toggleFeatured('${p.id}')" title="Destacar">
                    <i class="fas fa-star"></i>
                </button>
                <button class="card-btn-icon btn-view ${!p.available ? 'active' : ''}" onclick="toggleAvailability('${p.id}')" title="Alternar Stock">
                    <i class="fas ${p.available ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <button class="card-btn-icon btn-delete" onclick="deleteProduct('${p.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (counter) counter.textContent = adminProducts.length;
}

window.toggleFeatured = async (id) => {
    const p = adminProducts.find(p => String(p.id) === String(id));
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
    const p = adminProducts.find(p => String(p.id) === String(id));
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
    const grid = document.getElementById('admin-featured-list');
    if (!grid) return;

    const featuredItems = adminProducts.filter(p => p.featured);
    
    grid.innerHTML = featuredItems.map(p => `
        <div class="admin-product-card">
            <div class="badge-featured">Destacado</div>
            <div class="card-img-container" style="height: 180px; background: #f8f9fa;">
                <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:contain;" width="300" height="300">
            </div>
            <span class="card-category">${p.category}</span>
            <h3 class="card-title">${p.name}</h3>
            <span class="card-price" style="font-size: 1.1rem;">${adminSettings.currency}${p.price.toLocaleString('es-AR')}</span>
            
            <div class="card-actions" style="margin-top: 1rem;">
                <button class="btn-editor" onclick="editProduct('${p.id}')" style="width: auto; flex: 1;">
                    <i class="fas fa-pencil-alt"></i> Editar
                </button>
                <button class="card-btn-icon btn-star active" onclick="toggleFeatured('${p.id}')" title="Quitar de Portada">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.saveProduct = async () => {
    const form = document.getElementById('product-form');
    const idToEdit = form.dataset.editId;
    const saveBtn = form.querySelector('.btn-save');
    
    // 1. Validaciones Críticas
    if (processingImagesCount > 0) {
        return showToast('Las imágenes aún se están procesando. Espera un momento...', 'info');
    }

    if (!currentProductImages || currentProductImages.length === 0) {
        return showToast('El producto debe tener al menos una imagen', 'error');
    }

    const name = document.getElementById('p-name').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);

    if (!name || isNaN(price)) {
        return showToast('Nombre y precio son obligatorios', 'error');
    }

    // 2. Feedback Visual de Carga
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
    saveBtn.disabled = true;

    // 3. VERIFICACIÓN DE SESIÓN FIREBASE (A prueba de balas)
    const currentUser = firebase.auth().currentUser;

    if (!currentUser) {
        // Cortar la ejecución si no hay sesión real de Firebase
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        console.error("[LC1 Admin] Intento de guardado sin sesión de Firebase.");
        return showToast('Sesión no sincronizada con Firebase. Cerrá sesión y volvé a ingresar.', 'error');
    }

    // Timeout helper
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

    try {
        console.log("[LC1 Admin] Iniciando ciclo de guardado de producto...");

        // 3. Procesar Subida de Imágenes
        // Solo las que empiezan con 'data:image' son nuevas y requieren upload
        const uploadPromises = currentProductImages.map(async (img, i) => {
            if (img && typeof img === 'string' && img.startsWith('data:image')) {
                console.log(`[LC1 Admin] Subiendo nueva imagen [${i}] a Firebase...`);
                const blob = FirebaseService.base64ToBlob(img);
                const fileName = `products/${Date.now()}_${i}.jpg`;
                
                // Aplicar timeout de 30 segundos por imagen
                return await Promise.race([
                    FirebaseService.uploadImage(blob, fileName),
                    timeout(30000)
                ]);
            }
            return img; 
        });

        console.log("[LC1 Admin] Esperando subida de imágenes...");
        const finalImages = (await Promise.all(uploadPromises)).filter(img => img != null);
        console.log("[LC1 Admin] Imágenes procesadas con éxito:", finalImages.length);

        const selectedCategory = document.getElementById('p-category').value;
        const ageCategory = document.getElementById('p-age-category').value;

        // Mejora: Lógica de talles automáticos refinada por categoría
        let autoSizes;
        let finalAgeCategory = null;

        if (selectedCategory === 'indumentaria') {
            autoSizes = ["S", "M", "L", "XL", "XXL"];
            finalAgeCategory = null;
        } else if (selectedCategory === 'guantes' || selectedCategory.includes('guante') || selectedCategory.includes('junior')) {
            autoSizes = (ageCategory === 'junior' || ageCategory === 'niño') ? ["4", "5"] : ["6", "7", "8", "9", "10", "11"];
            finalAgeCategory = ageCategory;
        } else {
            autoSizes = []; // Reparación u otros sin talle
            finalAgeCategory = null;
        }

        const newProduct = {
            id: idToEdit ? String(idToEdit) : String(Date.now()),
            name: name,
            sku: document.getElementById('p-sku').value.trim(),
            price: price,
            category: selectedCategory,
            ageCategory: finalAgeCategory, // Nueva categoría de edad (null si no aplica)
            sizes: autoSizes,              // Talles automáticos
            desc: document.getElementById('p-desc').value.trim(),
            label: document.getElementById('p-label').value.trim(),
            available: document.getElementById('p-available').checked,
            featured: document.getElementById('p-featured').checked,
            customizable: document.getElementById('p-customizable').checked,
            image: finalImages[0], 
            images: finalImages   
        };

        // 4. Guardar en Firestore (con timeout de 15 segundos)
        console.log("[LC1 Admin] Guardando datos en Firestore...");
        await Promise.race([
            FirebaseService.saveProduct(newProduct),
            timeout(15000)
        ]);

        // 5. Actualizar estado local
        if (idToEdit) {
            const index = adminProducts.findIndex(p => String(p.id) === String(idToEdit));
            if (index !== -1) adminProducts[index] = newProduct;
        } else {
            adminProducts.push(newProduct);
        }

        renderAdminProducts();
        renderAdminHomeFeatured();
        calculateStats(); 
        
        closeModal();
        showToast('Producto guardado y sincronizado con éxito', 'success');

    } catch (error) {
        console.error("[LC1 Admin] Error fatal al guardar producto:", error);
        let errorMsg = 'Error al guardar. Reintenta.';
        if (error.message === 'Timeout') errorMsg = 'La conexión es lenta o falló. Reintenta.';
        showToast(errorMsg, 'error');
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        processingImagesCount = 0; 
    }
};



window.deleteProduct = (id) => {
    showConfirm('¿Estás seguro de que quieres eliminar este producto?', async () => {
        try {
            await FirebaseService.deleteProduct(id);
            adminProducts = adminProducts.filter(p => String(p.id) !== String(id));
            renderAdminProducts();
            showToast('Producto eliminado de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar producto', 'error');
        }
    });
};

window.editProduct = (id) => {
    const p = adminProducts.find(p => String(p.id) === String(id));
    if (!p) return;

    document.getElementById('p-name').value = p.name;
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-age-category').value = p.ageCategory || 'adulto'; 
    
    // Disparar visibilidad de edad
    window.toggleAgeCategoryVisibility();
    
    document.getElementById('p-desc').value = p.desc || '';
    document.getElementById('p-label').value = p.label || '';
    document.getElementById('p-available').checked = p.available !== undefined ? p.available : true;
    document.getElementById('p-featured').checked = p.featured || false;
    document.getElementById('p-customizable').checked = p.customizable || false;
    
    currentProductImages = p.images || (p.image ? [p.image] : []);
    
    window.renderProductImagesPreview();
    
    document.getElementById('product-form').dataset.editId = id;
    document.getElementById('modal-title').textContent = 'Editar producto';
    document.getElementById('product-modal').style.display = 'flex';
};

window.openModal = () => {
    const form = document.getElementById('product-form');
    if (form) form.reset();
    document.getElementById('product-form').dataset.editId = '';
    document.getElementById('modal-title').textContent = 'Nuevo producto';
    currentProductImages = [];
    window.renderProductImagesPreview();
    document.getElementById('product-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('product-modal').style.display = 'none';
};

window.renderProductImagesPreview = () => {
    const container = document.getElementById('image-preview-container');
    if (!container) return;
    container.innerHTML = currentProductImages.map((img, index) => `
        <div class="image-preview-item" style="position:relative; display:inline-block; margin-right:10px;">
            <img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #ddd;">
            <button type="button" onclick="window.removeProductImage(${index})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
};

window.removeProductImage = (index) => {
    currentProductImages.splice(index, 1);
    window.renderProductImagesPreview();
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
                <select class="admin-select" onchange="updateOrderStatus('${o.id}', this.value)" style="padding: 6px 10px; font-size: 0.75rem; border-radius: 8px;">
                    <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${o.status === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>
                <button class="btn-icon" onclick="viewOrderDetails('${o.id}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            </td>
            <td>
                <button class="btn-icon delete" onclick="deleteOrder('${o.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).reverse().join('');

    const statTotalOrders = document.getElementById('stat-total-orders');
    if (statTotalOrders) statTotalOrders.textContent = `${adminOrders.length} Pedidos Registrados`;
}

async function calculateStats() {
    console.log("[LC1 Admin] Calculando métricas en tiempo real...");
    try {
        // 1. Obtener eventos de Firebase
        const logs = await FirebaseService.getEvents(1000);
        
        // 2. Métricas Financieras (Basadas en pedidos)
        const activeOrders = adminOrders.filter(o => o.status !== 'Cancelado');
        const revenue = activeOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const avgOrder = activeOrders.length > 0 ? revenue / activeOrders.length : 0;

        const elRev = document.getElementById('stat-total-revenue');
        const elAvg = document.getElementById('stat-avg-order');
        if (elRev) elRev.textContent = `${adminSettings.currency}${revenue.toLocaleString('es-AR')}`;
        if (elAvg) elAvg.textContent = `${adminSettings.currency}${avgOrder.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

        // 3. Métricas de Tráfico (Basadas en eventos)
        const visits = logs.filter(l => l.type === 'page_view').length;
        const waClicks = logs.filter(l => l.type === 'whatsapp_click').length;
        const cartAdds = logs.filter(l => l.type === 'add_to_cart').length;
        
        const sessionLogs = logs.filter(l => l.type === 'session_time');
        const avgTimeSec = sessionLogs.length > 0 
            ? sessionLogs.reduce((acc, l) => acc + (l.data?.seconds || 0), 0) / sessionLogs.length 
            : 0;

        const elVisits = document.getElementById('ana-total-visits');
        const elWA = document.getElementById('ana-wa-clicks');
        const elAdds = document.getElementById('ana-cart-adds');
        const elTime = document.getElementById('ana-avg-time');

        if (elVisits) elVisits.textContent = visits.toLocaleString();
        if (elWA) elWA.textContent = waClicks.toLocaleString();
        if (elAdds) elAdds.textContent = cartAdds.toLocaleString();
        if (elTime) elTime.textContent = (avgTimeSec / 60).toFixed(1) + 'm';

        // 4. Ranking de Productos Más Vendidos
        const prodStats = {};
        activeOrders.forEach(o => {
            o.items?.forEach(item => {
                prodStats[item.name] = (prodStats[item.name] || 0) + (item.quantity || 0);
            });
        });

        const topProducts = Object.entries(prodStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const prodContainer = document.getElementById('top-products-chart');
        if (prodContainer) {
            if (topProducts.length === 0) {
                prodContainer.innerHTML = '<p style="text-align:center; color:#666; padding:1.5rem;">Sin datos de ventas</p>';
            } else {
                const maxVal = topProducts[0][1];
                prodContainer.innerHTML = topProducts.map(([name, count]) => {
                    const width = (count / maxVal) * 100;
                    return `
                        <div class="bar-item">
                            <div class="bar-label"><span>${name}</span><span>${count} vendidos</span></div>
                            <div class="bar-bg"><div class="bar-fill" style="width: ${width}%"></div></div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 5. Gráficos Chart.js
        if (typeof Chart !== 'undefined') {
            // Destruir instancias previas
            if (chartVisits) chartVisits.destroy();
            if (chartMix) chartMix.destroy();

            // Gráfico de Visitas (7 días)
            const daysMap = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                daysMap[d.toISOString().split('T')[0]] = 0;
            }

            logs.filter(l => l.type === 'page_view').forEach(l => {
                const dateKey = l.clientTimestamp?.split('T')[0] || (l.timestamp?.toDate ? l.timestamp.toDate().toISOString().split('T')[0] : null);
                if (dateKey && daysMap[dateKey] !== undefined) daysMap[dateKey]++;
            });

            const canvasVisits = document.getElementById('chart-visits-daily');
            if (canvasVisits) {
                chartVisits = new Chart(canvasVisits.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: Object.keys(daysMap).map(k => k.split('-').slice(1).reverse().join('/')),
                        datasets: [{
                            label: 'Visitas',
                            data: Object.values(daysMap),
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
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
                    }
                });
            }

            // Gráfico Mix de Eventos
            const mixMeta = {
                'Páginas': visits,
                'WhatsApp': waClicks,
                'Carrito': cartAdds,
                'Otros': logs.length - (visits + waClicks + cartAdds + sessionLogs.length)
            };

            const canvasMix = document.getElementById('chart-events-mix');
            if (canvasMix) {
                chartMix = new Chart(canvasMix.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(mixMeta),
                        datasets: [{
                            data: Object.values(mixMeta),
                            backgroundColor: ['#F9FF20', '#25d366', '#00c8ff', '#ff6b00'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        cutout: '75%',
                        plugins: { legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 10 } } } }
                    }
                });
            }
        }

    } catch (error) {
        console.error("[LC1 Admin] Fallo en calculateStats:", error);
        showToast('Error cargando estadísticas', 'error');
    }
}

window.updateOrderStatus = async (id, newStatus) => {
    const order = adminOrders.find(o => String(o.id) === String(id));
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
            adminOrders = adminOrders.filter(o => String(o.id) !== String(id));
            renderAdminOrders();
            calculateStats();
            showToast('Registro eliminado de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar pedido', 'error');
        }
    });
};

window.viewOrderDetails = (id) => {
    const o = adminOrders.find(o => String(o.id) === String(id));
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

    // Campos de Seguridad (Plan B: Firestore)
    const sEmail = document.getElementById('set-admin-email');
    const sPass = document.getElementById('set-admin-pass');
    
    FirebaseService.getAccess().then(access => {
        if (sEmail) sEmail.value = access.username;
        if (sPass) sPass.value = access.password; // Cargamos la clave actual por comodidad
        const sPassConfirm = document.getElementById('set-admin-pass-confirm');
        if (sPassConfirm) sPassConfirm.value = access.password;
    });
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
        // 1. Guardar Ajustes Generales en Firestore
        await FirebaseService.saveSettings(adminSettings);
        
        // 2. Procesar Cambios de Seguridad (Plan B: Firestore)
        const newUsername = document.getElementById('set-admin-email').value.trim();
        const newPass = document.getElementById('set-admin-pass').value.trim();
        const newPassConfirm = document.getElementById('set-admin-pass-confirm').value.trim();
        
        if (newUsername || newPass) {
            // Validar coincidencia
            if (newPass !== newPassConfirm) {
                showToast('Las contraseñas no coinciden', 'error');
                return;
            }
            if (newPass.length < 4) {
                showToast('La contraseña debe tener al menos 4 caracteres', 'error');
                return;
            }
            
            console.log("[LC1 Admin] Actualizando credenciales en base de datos...");
            await FirebaseService.updateAccess(newUsername, newPass);
        }

        showToast('Ajustes y Seguridad sincronizados', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error("Error al guardar ajustes:", error);
        showToast('Error al guardar: ' + (error.message || 'Error desconocido'), 'error');
    }
}


// --- Image Processing ---

window.renderProductImagesPreview = () => {
    const preview = document.getElementById('p-preview');
    if (!currentProductImages || currentProductImages.length === 0) {
        preview.innerHTML = `<i class="fas fa-image" style="color:#ccc; font-size:3rem; margin:auto;"></i>`;
        return;
    }
    
    preview.innerHTML = currentProductImages.map((img, idx) => `
        <div style="position:relative; flex-shrink:0; display:inline-block; height:100px;">
            <img src="${img}" style="height:100px; width:auto; border-radius:8px; object-fit:contain; border:2px solid var(--primary-color);">
            <button type="button" onclick="removeProductImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; z-index:10;"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
};

window.removeProductImage = (idx) => {
    currentProductImages.splice(idx, 1);
    window.renderProductImagesPreview();
};

function processImage(file, target = 'product', isMultiple = false) {
    if (!file) return;
    updateProcessingState(1);
    
    let previewId = 'p-preview';
    if (target === 'category') previewId = 'cat-preview';
    
    const preview = document.getElementById(previewId);
    const originalPreviewContent = preview ? preview.innerHTML : '';
    
    if (preview) {
        preview.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-color);"></i>
            <span style="font-size:0.7rem; margin-top:10px; color:var(--text-muted);">Procesando...</span>
        </div>`;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000; 
            const MAX_HEIGHT = 1000;
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
                currentProductImages.push(finalBase64);
                window.renderProductImagesPreview();
            } else {
                currentCategoryImage = finalBase64;
                if (preview) {
                    preview.innerHTML = `<img src="${currentCategoryImage}" style="width:100%; height:100%; object-fit:${target === 'product' ? 'contain' : 'cover'};">`;
                }
            }
        } catch (err) {
            console.error("[LC1 Admin] Error al procesar canvas:", err);
            showToast('Error cargando la foto', 'error');
        } finally {
            updateProcessingState(-1);
            URL.revokeObjectURL(objectUrl);
        }
    };
    
    img.onerror = () => {
        updateProcessingState(-1);
        URL.revokeObjectURL(objectUrl);
        showToast('Error al abrir la imagen', 'error');
        if (preview) preview.innerHTML = originalPreviewContent;
    };

    img.src = objectUrl;
}

// Modal Helpers
window.openModal = (isFeatured = false) => {
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = isFeatured ? 'Nuevo Producto Destacado' : 'Nuevo Producto';
    document.getElementById('product-form').reset();
    currentProductImages = [];
    window.renderProductImagesPreview();
    delete document.getElementById('product-form').dataset.editId;
    
    // Asegurar que las categorías estén cargadas y la visibilidad reseteada
    renderCategorySelect();
    window.toggleAgeCategoryVisibility();

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
    const grid = document.getElementById('admin-categories-list');
    if (!grid) return;

    grid.innerHTML = adminCategories.map(cat => `
        <div class="admin-product-card">
            <div class="card-img-container" style="height: 180px; background: #f8f9fa;">
                <img src="${cat.image}" alt="${cat.name}" style="width:100%; height:100%; object-fit:contain;" width="400" height="400"
                     onerror="this.src='https://placehold.co/400x400/f8f9fa/111?text=${cat.name}'; this.onerror=null;">
            </div>
            <h3 class="card-title" style="color: #000; font-size: 1.2rem; margin-top: 0.5rem;">${cat.name}</h3>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1.5rem; height: 2.4rem; overflow: hidden;">${cat.desc}</p>
            <div class="card-actions">
                <button class="btn-editor" onclick="openCategoryModal('${cat.id}')" style="flex: 1;">
                    <i class="fas fa-pencil-alt"></i> Editar
                </button>
                <button class="card-btn-icon btn-delete" onclick="deleteCategory('${cat.id}')" title="Eliminar Categoría">
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
        const cat = adminCategories.find(c => String(c.id) === String(id));
        if (!cat) return;
        modal.dataset.editId = id;
        document.getElementById('cat-modal-title').textContent = 'Editar Categoría';
        document.getElementById('cat-name').value = cat.name;
        document.getElementById('cat-desc').value = cat.desc;
        document.getElementById('cat-preview').innerHTML = `<img src="${cat.image}" style="width:100%; height:100%; object-fit:cover;">`;
        currentCategoryImage = cat.image;
    } else {
        delete modal.dataset.editId;
        document.getElementById('cat-modal-title').textContent = 'Nueva Categoría';
        document.getElementById('category-form').reset();
        document.getElementById('cat-preview').innerHTML = `<i class="fas fa-image" style="color:#333; font-size:4rem;"></i>`;
        currentCategoryImage = '';
    }
};

window.openCatModal = () => {
    const modal = document.getElementById('category-modal');
    modal.dataset.editId = '';
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-desc').value = '';
    currentCategoryImage = '';
    const preview = document.getElementById('cat-image-preview');
    if (preview) preview.src = '';
    modal.style.display = 'flex';
};

window.editCategory = (id) => {
    const cat = adminCategories.find(c => String(c.id) === String(id));
    if (!cat) return;
    const modal = document.getElementById('category-modal');
    modal.dataset.editId = id;
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-desc').value = cat.desc || '';
    currentCategoryImage = cat.image;
    const preview = document.getElementById('cat-image-preview');
    if (preview) preview.src = cat.image;
    modal.style.display = 'flex';
};

window.closeCatModal = () => {
    document.getElementById('category-modal').style.display = 'none';
    currentCategoryImage = '';
};

window.saveCategory = async () => {
    const modal = document.getElementById('category-modal');
    const idToEdit = modal.dataset.editId;
    const saveBtn = document.querySelector('#category-modal .btn-save');
    
    if (processingImagesCount > 0) {
        return showToast('Espera a que termine de procesarse la imagen...', 'info');
    }

    if (!currentCategoryImage) {
        return showToast('Por favor, selecciona una foto para la categoría', 'error');
    }

    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveBtn.disabled = true;

    try {
        let finalImageUrl = currentCategoryImage;
        
        // Subir si es nueva imagen
        if (currentCategoryImage.startsWith('data:image')) {
            const blob = FirebaseService.base64ToBlob(currentCategoryImage);
            finalImageUrl = await FirebaseService.uploadImage(blob, `categories/${Date.now()}.jpg`);
        }

        const categoryData = {
            id: idToEdit ? String(idToEdit) : String(Date.now()),
            name: document.getElementById('cat-name').value,
            slug: document.getElementById('cat-name').value.toLowerCase().replace(/ /g, '-'),
            desc: document.getElementById('cat-desc').value,
            image: finalImageUrl
        };

        await FirebaseService.saveCategory(categoryData);

        if (idToEdit) {
            const index = adminCategories.findIndex(c => String(c.id) === String(idToEdit));
            if (index !== -1) adminCategories[index] = categoryData;
        } else {
            adminCategories.push(categoryData);
        }

        renderAdminCategories();
        closeCatModal();
        showToast(idToEdit ? 'Categoría actualizada' : 'Categoría creada', 'success');
    } catch (error) {
        console.error("Error guardando categoría:", error);
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
            adminCategories = adminCategories.filter(c => String(c.id) !== String(id));
            renderAdminCategories();
            showToast('Categoría eliminada de la nube', 'info');
        } catch (error) {
            showToast('Error al eliminar categoría', 'error');
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

    // Listener para cambio de categoría en el formulario de producto
    const categorySelect = document.getElementById('p-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', window.toggleAgeCategoryVisibility);
    }

    // Listener para imágenes de producto
    const pImageInput = document.getElementById('p-image');
    if (pImageInput) {
        pImageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentProductImages.push(event.target.result);
                    window.renderProductImagesPreview();
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Listener para imagen de categoría
    const cImageInput = document.getElementById('c-image');
    if (cImageInput) {
        cImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentCategoryImage = event.target.result;
                    const preview = document.getElementById('cat-image-preview');
                    if (preview) preview.src = currentCategoryImage;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Función para controlar la visibilidad del selector de edad según la categoría
window.toggleAgeCategoryVisibility = () => {
    const category = document.getElementById('p-category').value;
    const wrapper = document.getElementById('age-category-wrapper');
    if (wrapper) {
        // Mostrar si es guantes, o si incluye "guante" o "junior"
        const isGuantesOrJunior = category === 'guantes' || category.includes('guante') || category.includes('junior');
        wrapper.style.display = isGuantesOrJunior ? 'block' : 'none';
        
        // Auto-seleccionar "junior" si la categoría contiene la palabra "junior"
        if (category.includes('junior')) {
            const ageCategorySelect = document.getElementById('p-age-category');
            if (ageCategorySelect && ageCategorySelect.value !== 'junior') {
                ageCategorySelect.value = 'junior';
            }
        }
    }
};
