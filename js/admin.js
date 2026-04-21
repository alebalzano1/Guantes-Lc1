// Lógica del Panel de Administración LC1 Goalkeeper
// Autenticación: Firebase Auth
// Persistencia: Firestore & Storage
const ADMIN_VERSION = "2.3.0";
console.log(`%c[LC1 Admin v${ADMIN_VERSION}] Iniciando sistema...`, "color: #F9FF20; font-weight: bold; font-size: 16px;");

// PRUEBA DE CARGA: Eliminada para producción.

// --- Diagnóstico de Carga ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error("%c[CRITICAL ERROR] Fallo en el script: ", "background: red; color: white; padding: 5px;", {msg, url, lineNo, error});
    return false;
};

let currentImageBase64 = '';
let currentImagesArray = [];
let isProcessingImage = false;

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
    console.log("[LC1 Admin] Cargando datos desde Firebase...");
    try {
        adminProducts = await FirebaseService.getProducts();
        adminCategories = await FirebaseService.getCategories();
        adminSettings = await FirebaseService.getSettings() || (window.LC1_Data ? window.LC1_Data.settings : {});
        adminOrders = await FirebaseService.getOrders();
        adminLogs = await FirebaseService.getEvents(2000); // Cargar últimos eventos
        
        console.log("[LC1 Admin] Datos cargados:", {
            products: adminProducts.length,
            categories: adminCategories.length,
            orders: adminOrders.length,
            logs: adminLogs.length
        });

        // Sincronizar UI
        loadSettings();
        renderAdminProducts();
        renderAdminOrders();
        renderAdminCategories();
        renderAdminHomeFeatured();
        renderCategorySelect(); // Inyectar categorías en formulario de producto
        calculateStats();
    } catch (error) {
        console.error("[LC1 Admin] Error fatal cargando Firebase:", error);
        showToast('Error de conexión con la base de datos', 'error');
    }
}

function renderCategorySelect() {
    const select = document.getElementById('p-category');
    if (!select) return;
    
    select.innerHTML = adminCategories.map(cat => `
        <option value="${cat.slug}">${cat.name}</option>
    `).join('');
}

// Listas negras para evitar que la sincronización restaure items eliminados
let adminDeletedProducts = getSafeJSON('lc1-deleted-products', []);
let adminDeletedCategories = getSafeJSON('lc1-deleted-categories', []);

adminSettings = getSafeJSON('lc1-settings', window.LC1_Data ? window.LC1_Data.settings : {
    storeName: 'LC1 GOALKEEPER',
    whatsapp: '541140236384',
    currency: '$',
    catSectionTitle: 'Explora <span>Categorías</span>',
    featuredSectionTitle: 'Lanzamientos <span>Elite</span>'
});

// Instancias de Chart.js para limpieza
let chartVisits = null;
let chartMix = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[LC1 Admin] Iniciando procesos base...");
    
    // 1. VINCULAR LOGIN CON FIREBASE AUTH
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            let emailInput = document.getElementById('login-email').value.trim();
            const passInput = document.getElementById('login-pass').value.trim();
            const loginBtn = loginForm.querySelector('.btn-primary');
            const originalText = loginBtn.innerHTML;

            // Alias: Transformar 'administrador' en email válido para Firebase
            if (emailInput.toLowerCase() === 'administrador') {
                emailInput = 'administrador@admin.com';
            }

            console.log("[LC1 Admin] Intento de login Firebase:", emailInput);

            try {
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
                loginBtn.disabled = true;
                
                await FirebaseService.login(emailInput, passInput);
                // El observador onAuth se encargará del resto
            } catch (error) {
                console.warn("[LC1 Admin] Accesso Denegado:", error.code);
                const errorEl = document.getElementById('login-error');
                if (errorEl) {
                    let msg = "Credenciales incorrectas.";
                    if (error.code === 'auth/invalid-email') msg = "Email inválido.";
                    if (error.code === 'auth/user-not-found') msg = "Usuario no registrado.";
                    
                    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
                    errorEl.style.display = 'block';
                }
                showToast('Error de autenticación', 'error');
            } finally {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        };
    }

    // 2. ESCUCHAR CAMBIOS DE AUTENTICACION (Fuente de Verdad)
    FirebaseService.onAuth((user) => {
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (user) {
            console.log("[LC1 Admin] Sesión activa:", user.email);
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) {
                dashboardSection.style.display = 'flex';
                dashboardSection.classList.add('fade-in');
            }
            
            const adminNameDisplay = document.querySelector('#admin-user-info');
            if (adminNameDisplay) {
                adminNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email.split('@')[0]}`;
            }

            // Cargar datos solo cuando hay sesión
            loadInitialData();
            
            if (!document.body.dataset.loaded) {
                showToast('Bienvenido, Administrador', 'success');
                document.body.dataset.loaded = "true";
            }
        } else {
            console.log("[LC1 Admin] Sin sesión activa.");
            if (loginSection) loginSection.style.display = 'flex';
            if (dashboardSection) dashboardSection.style.display = 'none';
        }
    });


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
        showToast('Error al cerrar sesión', 'error');
    }
};

window.initializeAdminAccount = async () => {
    try {
        console.log("[LC1 Admin] Solicitando creación de usuario maestro...");
        // Intentar crear el correo mapeado con la contraseña pedida
        await firebase.auth().createUserWithEmailAndPassword('administrador@admin.com', 'admin12345');
        
        showToast('¡Usuario administrador@admin.com creado!', 'success');
        setTimeout(() => {
            alert('✅ Usuario creado correctamente.\n\nAhora podés usar:\nUsuario: administrador\nPass: admin12345');
            location.reload();
        }, 1000);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert('ℹ️ El usuario ya está configurado en la nube. Solo ingresá tus credenciales.');
        } else {
            console.error(error);
            showToast('Error: ' + error.message, 'error');
        }
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
    const grid = document.getElementById('admin-product-grid');
    const counter = document.getElementById('count-products');
    if (!grid) return;

    grid.innerHTML = adminProducts.map(p => `
        <div class="admin-product-card ${!p.available ? 'out-of-stock' : ''} ${p.featured ? 'has-featured' : ''}">
            ${p.featured ? '<div class="badge-featured">Destacado</div>' : ''}
            ${!p.available ? '<div class="badge-status no-stock">SIN STOCK</div>' : ''}
            ${p.label ? `<div class="badge-status promo" style="top: ${p.available ? '1rem' : '3.5rem'}">${p.label}</div>` : ''}
            <div class="card-img-container">
                <img src="${p.image}" alt="${p.name}" width="300" height="300">
            </div>
            <span class="card-id">${p.sku || '#' + p.id.toString().slice(-4)}</span>
            <span class="card-category">${p.category}</span>
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
    const grid = document.getElementById('admin-featured-grid');
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
    if (isProcessingImage) {
        return showToast('Las imágenes se están procesando. Espera un momento...', 'info');
    }

    if (!currentImagesArray || currentImagesArray.length === 0) {
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

    try {
        console.log("[LC1 Admin] Iniciando ciclo de guardado de producto...");

        // 3. Procesar Subida de Imágenes
        // Solo las que empiezan con 'data:image' son nuevas y requieren upload
        const uploadPromises = currentImagesArray.map(async (img, i) => {
            if (img.startsWith('data:image')) {
                console.log(`[LC1 Admin] Subiendo nueva imagen [${i}] a Firebase...`);
                const blob = FirebaseService.base64ToBlob(img);
                const fileName = `products/${Date.now()}_${i}.jpg`;
                return await FirebaseService.uploadImage(blob, fileName);
            }
            return img; // Ya es una URL de Firebase
        });

        const finalImages = await Promise.all(uploadPromises);
        console.log("[LC1 Admin] Imágenes procesadas:", finalImages.length);

        const newProduct = {
            id: idToEdit ? String(idToEdit) : String(Date.now()),
            name: name,
            sku: document.getElementById('p-sku').value.trim(),
            price: price,
            category: document.getElementById('p-category').value,
            desc: document.getElementById('p-desc').value.trim(),
            label: document.getElementById('p-label').value.trim(),
            available: document.getElementById('p-available').checked,
            featured: document.getElementById('p-featured').checked,
            customizable: document.getElementById('p-customizable').checked,
            image: finalImages[0], // Imagen principal
            images: finalImages   // Galería completa
        };

        // 4. Guardar en Firestore
        await FirebaseService.saveProduct(newProduct);

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
        showToast('Error crítico al guardar. Reintenta o revisa la consola.', 'error');
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        isProcessingImage = false; // Reset de seguridad
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

    // Campos de Seguridad (Omitidos: Gestionado por Firebase)
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
    if (!file) return;
    isProcessingImage = true;
    
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
                currentImagesArray.push(finalBase64);
                window.renderProductImagesPreview();
            } else {
                currentImageBase64 = finalBase64;
                if (preview) {
                    preview.innerHTML = `<img src="${currentImageBase64}" style="width:100%; height:100%; object-fit:${target === 'product' ? 'contain' : 'cover'};">`;
                }
            }
        } catch (err) {
            console.error("[LC1 Admin] Error al procesar canvas:", err);
            showToast('Error cargando la foto', 'error');
        } finally {
            isProcessingImage = false;
            URL.revokeObjectURL(objectUrl);
        }
    };
    
    img.onerror = () => {
        isProcessingImage = false;
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
            <div class="card-img-container" style="height: 180px; background: #f8f9fa;">
                <img src="${cat.image}" alt="${cat.name}" style="width:100%; height:100%; object-fit:contain;" width="400" height="400">
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
    
    if (isProcessingImage) {
        return showToast('Espera a que termine de procesarse la imagen...', 'info');
    }

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
});
