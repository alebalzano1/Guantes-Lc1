// Catálogo Centralizado LC1 Goalkeeper
// Optimización incremental: Rutas corregidas y Copy persuasivo.

const initialProducts = [
    // --- LÍNEA CLÁSICA / BEST SELLERS ---
    { 
        id: 101, 
        name: "Guante LC1 Pro Elite Neon", 
        sku: "GLV-001", 
        category: "guantes", 
        price: 45000, 
        image: "Roma/20250522_064647_0000.jpeg", 
        featured: true, 
        available: true, 
        customizable: false, 
        label: "TOP", 
        desc: "Máximo rendimiento y alto agarre en cualquier condición climática. Látex profesional de 4mm." 
    },
    { 
        id: 104, 
        name: "Guante LC1 Grip Master", 
        sku: "GLV-002", 
        category: "guantes", 
        price: 42000, 
        image: "Roma/20250522_064749_0000.jpeg", 
        featured: false, 
        available: true, 
        customizable: false, 
        label: "ALTA DEMANDA", 
        desc: "Corte negativo para una sensibilidad superior. Uso profesional garantizado." 
    },
    { 
        id: 103, 
        name: "Camiseta LC1 Training Black", 
        sku: "IND-001", 
        category: "indumentaria", 
        price: 22000, 
        image: "Roma/Photoroom_20260409_070037.png", 
        featured: true, 
        available: true, 
        customizable: false, 
        label: "Nuevo", 
        desc: "Tecnología Dry-Fit de alto rendimiento. Mantenete fresco en cada atajada." 
    },

    // --- COLECCIÓN ROMA (EXCLUSIVA) ---
    { 
        id: 201, 
        name: "Guante Roma Pro Blue", 
        sku: "GLV-R01", 
        category: "guantes", 
        price: 48000, 
        image: "Roma/Photoroom_20260409_062835.png", 
        featured: true, 
        available: true, 
        customizable: false, 
        label: "Últimas unidades", 
        desc: "Látex alemán de alto agarre. Diseñado para el arco más exigente." 
    },
    { 
        id: 203, 
        name: "Guante Roma Black Edition", 
        sku: "GLV-R02", 
        category: "guantes", 
        price: 48000, 
        image: "Roma/Photoroom_20260409_062847.png", 
        featured: false, 
        available: true, 
        customizable: false, 
        label: "Premium", 
        desc: "Elegancia y máximo rendimiento. El guante preferido por los profesionales." 
    },
    { 
        id: 215, 
        name: "Guante Roma Titan White", 
        sku: "GLV-R07", 
        category: "guantes", 
        price: 52000, 
        image: "Roma/Photoroom_20260108_131155.png", 
        featured: true, 
        available: true, 
        customizable: false, 
        label: "Nuevo", 
        desc: "Tecnología Titan de alto agarre. Soporte y durabilidad extrema." 
    },
    { 
        id: 206, 
        name: "Conjunto Roma GK Full", 
        sku: "IND-R03", 
        category: "indumentaria", 
        price: 35000, 
        image: "Roma/Photoroom_20260409_061310.png", 
        featured: true, 
        available: true, 
        customizable: false, 
        label: "Pro Kit", 
        desc: "Protección inteligente en codos y caderas para un uso profesional." 
    },
    { 
        id: 212, 
        name: "Camiseta Roma Sublimada", 
        sku: "IND-R06", 
        category: "indumentaria", 
        price: 32000, 
        image: "Roma/Photoroom_20260108_005601.png", 
        featured: false, 
        available: true, 
        customizable: true, 
        label: "STOCK LIMITADO", 
        desc: "Diseño personalizado de alto rendimiento. Tu nombre, tu estilo." 
    },
    { 
        id: 210, 
        name: "Pantalón Roma GK Acolchado", 
        sku: "IND-R05", 
        category: "indumentaria", 
        price: 28000, 
        image: "Roma/Photoroom_20260321_121451.jpg", 
        featured: false, 
        available: true, 
        customizable: false, 
        label: "Oferta", 
        desc: "Seguridad y confort en cada caída. Uso profesional intenso." 
    },
    { 
        id: 218, 
        name: "Guante Roma Training Day", 
        sku: "GLV-R08", 
        category: "guantes", 
        price: 22000, 
        image: "Roma/20250522_064405_0000.jpeg", 
        featured: false, 
        available: true, 
        customizable: false, 
        label: "Escuela", 
        desc: "Ideal para entrenamiento diario. Gran durabilidad y agarre confiable." 
    },
];

const initialCategories = [
    { 
        id: 1, 
        name: "Guantes", 
        slug: "guantes", 
        desc: "Látex profesional con alto agarre.", 
        image: "Roma/Photoroom_20260409_062835.png" 
    },
    { 
        id: 2, 
        name: "Indumentaria", 
        slug: "indumentaria", 
        desc: "Prendas de uso profesional y resistencia.", 
        image: "Roma/Photoroom_20260409_070006.png" 
    },
    { 
        id: 3, 
        name: "Reparación", 
        slug: "reparacion", 
        desc: "Mantenimiento para máximo rendimiento del látex.", 
        image: "Roma/Photoroom_20260108_133941.png" 
    },
];

const initialSettings = {
    storeName: 'LC1 GOALKEEPER',
    whatsapp: '541140236384',
    currency: '$',
    catSectionTitle: 'Nuestras <span>Categorías</span>',
    featuredSectionTitle: 'PRODUCTOS <span>TOP</span>'
};

// Exportar para uso global
window.LC1_Data = {
    products: initialProducts,
    categories: initialCategories,
    settings: initialSettings
};
