// Catálogo Centralizado LC1 Goalkeeper
// Este archivo contiene los datos base que se cargan si no hay cambios en LocalStorage.

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

const initialCategories = [
    { id: 1, name: "Guantes", slug: "guantes", desc: "Látex profesional para todo tipo de clima.", image: "Roma/Photoroom_20260409_062835.png" },
    { id: 2, name: "Indumentaria", slug: "indumentaria", desc: "Camisetas, shorts y protección elite.", image: "Roma/Photoroom_20260409_070006.png" },
    { id: 3, name: "Reparación", slug: "reparacion", desc: "Devolvele el grip a tus guantes favoritos.", image: "Roma/Photoroom_20260108_133941.png" }
];

const initialSettings = {
    storeName: 'LC1 GOALKEEPER',
    whatsapp: '541140236384',
    currency: '$',
    catSectionTitle: 'Explora <span>Categorías</span>',
    featuredSectionTitle: 'Lanzamientos <span>Elite</span>'
};

// Exportar para uso global
window.LC1_Data = {
    products: initialProducts,
    categories: initialCategories,
    settings: initialSettings
};
