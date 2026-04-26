// Lógica de la Página de Detalle de Producto
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    // UI Loading state
    const title = document.getElementById('pd-title');
    const desc = document.getElementById('pd-desc');
    if (title) title.innerHTML = '<span class="skeleton" style="display:inline-block; width:100%; height:40px;"></span>';
    if (desc) desc.innerHTML = '<span class="skeleton" style="display:inline-block; width:100%; height:20px; margin-bottom:10px;"></span><span class="skeleton" style="display:inline-block; width:80%; height:20px;"></span>';

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    console.log("[LC1 Detail] Buscando producto...");
    try {
        if (typeof FirebaseService === 'undefined') {
            throw new Error("FirebaseService no está definido.");
        }

        // 1. Intentar obtener desde Firebase
        let productsList = await FirebaseService.getProducts().catch(() => []);
        
        // Fallback inmediato
        if (!productsList || productsList.length === 0) {
            productsList = window.LC1_Data ? window.LC1_Data.products : [];
        }

        const product = productsList.find(p => String(p.id) === String(productId));

        if (!product) {
            const fallbackList = window.LC1_Data ? window.LC1_Data.products : [];
            const fallbackProduct = fallbackList.find(p => String(p.id) === String(productId));
            
            if (fallbackProduct) {
                renderProductDetail(fallbackProduct);
            } else {
                document.body.innerHTML = `<div style="text-align:center; padding:5rem; background:#fff; color:#000;"><h1>Producto no encontrado</h1><p>El código "${productId}" no coincide con ningún ítem activo.</p><br><a href="shop.html" style="color:var(--primary-color); font-weight:700;">Volver a la tienda</a></div>`;
            }
            return;
        }

        renderProductDetail(product);
    } catch (error) {
        console.error("Error crítico al cargar detalle:", error);
        // Fallback de emergencia total
        const product = (window.LC1_Data ? window.LC1_Data.products : []).find(p => String(p.id) === String(productId));
        if (product) {
            renderProductDetail(product);
        } else {
            document.body.innerHTML = `<div style="text-align:center; padding:5rem; background:#fff; color:#000;"><h1>Error de Conexión</h1><p>No pudimos recuperar la información del producto.</p><br><a href="shop.html" style="color:var(--primary-color);">Reintentar</a></div>`;
        }
    }
});

function renderProductDetail(product) {
    // 1. Set Title and Metadata (SEO)
    const productTitle = `${product.name} | LC1 Goalkeeper`;
    document.title = productTitle;
    
    // Actualizar Meta Tags dinámicamente
    const metaDesc = document.querySelector('meta[name="description"]') || document.getElementById('meta-desc');
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.getElementById('og-title');
    const ogDesc = document.querySelector('meta[property="og:description"]') || document.getElementById('og-desc');
    const ogImage = document.querySelector('meta[property="og:image"]') || document.getElementById('og-image');
    const ogUrl = document.querySelector('meta[property="og:url"]') || document.getElementById('og-url');

    const fullDesc = product.desc || "Experimenta el máximo nivel de control y protección con los guantes LC1. Diseñados para el alto rendimiento.";
    
    if (metaDesc) metaDesc.content = fullDesc;
    if (ogTitle) ogTitle.content = productTitle;
    if (ogDesc) ogDesc.content = fullDesc;
    if (ogImage) ogImage.content = product.image;
    if (ogUrl) ogUrl.content = window.location.href;

    renderProductSchema(product);
    
    // 2. Fill the HTML
    const mainImg = document.getElementById('pd-image');
    const title = document.getElementById('pd-title');
    const price = document.getElementById('pd-price');
    const desc = document.getElementById('pd-desc');
    const badgeContainer = document.getElementById('pd-badges');

    if (mainImg) mainImg.src = product.image;
    if (title) title.textContent = product.name;
    if (price) price.textContent = `$${product.price.toLocaleString('es-AR')}`;
    if (desc) desc.textContent = product.desc || "Experimenta el máximo nivel de control y protección con los guantes LC1. Diseñados para el alto rendimiento.";

    // Badges dinámicos (Solo categoría para ser 100% honestos)
    if (badgeContainer) {
        badgeContainer.innerHTML = `<span class="pd-badge" style="background:#f4f4f4; color:#000; border:1px solid #ddd;">${product.category}</span>`;
    }

    // 2.5 Galería de imágenes (Carrusel estilo Mercado Libre)
    const sliderTrack = document.getElementById('pd-slider-track');
    const thumbnailsContainer = document.getElementById('pd-thumbnails');
    const btnPrev = document.getElementById('pd-prev');
    const btnNext = document.getElementById('pd-next');
    let currentImageIndex = 0;

    const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

    if (sliderTrack) {
        sliderTrack.innerHTML = allImages.map(img => `<img src="${img}" class="slider-item" width="600" height="600">`).join('');
    }

    if (allImages.length > 1) {
        const updateMainImage = (index) => {
            currentImageIndex = index;
            if (sliderTrack) {
                const scrollAmount = sliderTrack.offsetWidth * index;
                sliderTrack.scrollTo({ left: scrollAmount, behavior: 'smooth' });
            }
            
            if (thumbnailsContainer) {
                Array.from(thumbnailsContainer.children).forEach((c, idx) => {
                    c.style.borderColor = idx === index ? 'var(--accent-color)' : 'transparent';
                    c.style.opacity = idx === index ? '1' : '0.6';
                });
            }
        };

        if (btnPrev) {
            btnPrev.style.display = 'flex';
            btnPrev.onclick = () => {
                currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
                updateMainImage(currentImageIndex);
            };
        }

        if (btnNext) {
            btnNext.style.display = 'flex';
            btnNext.onclick = () => {
                currentImageIndex = (currentImageIndex + 1) % allImages.length;
                updateMainImage(currentImageIndex);
            };
        }

        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = allImages.map((imgSrc, idx) => `
                <img src="${imgSrc}" class="pd-thumb" onclick="window.pd_goToImage(${idx})" style="border-color: ${idx === 0 ? 'var(--accent-color)' : 'transparent'}; opacity: ${idx === 0 ? '1' : '0.6'};" width="80" height="80">
            `).join('');
            
            // Expose globally for the onclick attribute
            window.pd_goToImage = (idx) => updateMainImage(idx);
        }

        // Sync scroll back to index if user scrolls manually
        sliderTrack.onscroll = () => {
            const index = Math.round(sliderTrack.scrollLeft / sliderTrack.offsetWidth);
            if (index !== currentImageIndex) {
                currentImageIndex = index;
                if (thumbnailsContainer) {
                    Array.from(thumbnailsContainer.children).forEach((c, idx) => {
                        c.style.borderColor = idx === index ? 'var(--accent-color)' : 'transparent';
                        c.style.opacity = idx === index ? '1' : '0.6';
                    });
                }
            }
        };
    } else {
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        if (thumbnailsContainer) thumbnailsContainer.style.display = 'none';
    }

    // 2.8 Configurar botones de talle dependiendo de la categoría y ageCategory
    const sizeButtonsContainer = document.getElementById('size-buttons-container');
    const sizeContainer = document.querySelector('.pd-size-selector');
    const selectedSizeInput = document.getElementById('selected-size');
    const category = product.category.toLowerCase();
    // Mejora: Detección flexible de categoría para mostrar talles (Bug 1 Fix)
    const requiresSize = category.includes('guante') || category.includes('indumentaria');

    if (sizeContainer) {
        sizeContainer.style.display = requiresSize ? 'block' : 'none';
    }

    if (sizeButtonsContainer && requiresSize) {
        // Usar talles del producto (asignados por Admin) o fallback si es indumentaria antigua
        let availableSizes = product.sizes || [];
        
        if (availableSizes.length === 0) {
            if (category === 'indumentaria') availableSizes = ["S", "M", "L", "XL", "XXL"];
            else if (product.ageCategory === 'junior') availableSizes = ["4", "5"];
            else availableSizes = ["6", "7", "8", "9", "10", "11"]; // Fallback adultos (6 al 11)
        }

        // Determinar si los talles son numéricos (guantes) o letras (indumentaria)
        const isNumeric = availableSizes.some(s => !isNaN(s));
        const helpText = isNumeric 
            ? "¿No sabés tu talle? Medí desde el inicio de la palma hasta la punta del dedo medio."
            : "Si estás entre dos talles, elegí el más grande.";
            
        // Actualizar texto de ayuda dinámicamente
        const helpTextEl = document.getElementById('size-help-text');
        if (helpTextEl) helpTextEl.textContent = helpText;

        sizeButtonsContainer.innerHTML = availableSizes.map(size => `
            <button class="size-btn" onclick="selectProductSize('${size}', this)">${size}</button>
        `).join('');

        // Función global para manejar el click en los botones
        window.selectProductSize = (size, element) => {
            selectedSizeInput.value = size;
            // Remover clase active de todos
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            // Agregar a este
            element.classList.add('active');
            // Ocultar error si existía
            document.getElementById('size-error').style.display = 'none';
        };
    }

    // Validación de Talle Helper
    const validateSize = () => {
        if (!requiresSize) return 'N/A'; 
        
        const errorMsg = document.getElementById('size-error');
        const size = selectedSizeInput.value;
        
        if (!size) {
            if (errorMsg) {
                errorMsg.textContent = "Por favor seleccioná un talle"; // Mensaje específico solicitado
                errorMsg.style.display = 'block';
            }
            return null;
        }
        if (errorMsg) errorMsg.style.display = 'none';
        return size;
    };

    // 3. Botones de Acción y Validación de Stock
    const btnCart = document.getElementById('btn-add-cart');
    const btnWA = document.getElementById('btn-wa-direct');
    
    if (product.available === false) {
        if (btnCart) {
            btnCart.innerHTML = '<i class="fas fa-times-circle"></i> PRODUCTO SIN STOCK';
            btnCart.style.background = '#888';
            btnCart.style.cursor = 'not-allowed';
            btnCart.onclick = null;
        }
        if (btnWA) {
            btnWA.style.display = 'none';
        }
        if (badgeContainer) {
            badgeContainer.innerHTML += `<span class="pd-badge" style="background:#ff3e3e; color:#fff;">SIN STOCK</span>`;
        }
        return; // Detener configuración de eventos de compra
    }

    if (btnCart) {
        btnCart.onclick = () => {
            const size = validateSize();
            if (!size) return;
            addToCart(product, size);
            if (window.openCart) window.openCart();
        };
    }

    if (btnWA) {
        btnWA.onclick = async () => {
            const size = validateSize();
            if (!size) return;
            const msg = `Hola LC1! 👋 Quiero comprar el producto: *${product.name}* (Talle: ${size}) que tiene un precio de *$${product.price.toLocaleString('es-AR')}*. ¿Tienen stock?`;
            
            const settings = await FirebaseService.getSettings() || (window.LC1_Data ? window.LC1_Data.settings : { whatsapp: '541140236384' });
            window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }
}

function addToCart(product, size) {
    let cart = getSafeJSON('lc1-cart', []);
    const existing = cart.find(item => item.id === product.id && item.size === size);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: 1
        });
    }
    
    localStorage.setItem('lc1-cart', JSON.stringify(cart));
    if (window.renderCart) window.renderCart();
    if (window.updateCartCount) window.updateCartCount();
}

window.shareProduct = () => {
    const title = document.title;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `¡Mirá este producto en LC1 Goalkeeper!`,
            url: url
        }).catch(err => {
             console.log("Error sharing:", err);
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showToast('Vínculo copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            showToast('No se pudo copiar el vínculo', 'error');
        });
    }
};

function renderProductSchema(product) {
    // Eliminar script previo si existe para evitar duplicados en navegación dinámica
    const existingScript = document.getElementById('product-schema');
    if (existingScript) existingScript.remove();

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": [product.image],
        "description": product.desc || "Equipamiento profesional para porteros.",
        "sku": product.sku || product.id.toString(),
        "brand": {
            "@type": "Brand",
            "name": "LC1 Goalkeeper"
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "ARS",
            "price": product.price,
            "availability": product.available !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    const script = document.createElement('script');
    script.id = 'product-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    console.log("[SEO] JSON-LD Product Schema Injected");
}
