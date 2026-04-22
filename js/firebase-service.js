// Firebase Service for LC1 Goalkeeper
// Using Firebase Compat SDK for easy integration with existing global-scope scripts.

// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

const FirebaseService = {
    // --- Authentication ---
    async login(email, password) {
        console.log("[Firebase] Iniciar sesión para:", email);
        return await auth.signInWithEmailAndPassword(email, password);
    },

    async logout() {
        console.log("[Firebase] Cerrar sesión...");
        return await auth.signOut();
    },

    onAuth(callback) {
        return auth.onAuthStateChanged(callback);
    },

    /**
     * Verifies connection to Firebase by attempting to fetch categories.
     * Returns a summary of the system state.
     */
    async checkConnection() {
        console.log("[Firebase] Verificando conexión...");
        const result = {
            initialized: !!firebase.apps.length,
            auth: !!auth,
            firestore: false,
            error: null
        };
        
        try {
            // Attempt a simple read to verify Firestore
            await db.collection("categories").limit(1).get();
            result.firestore = true;
        } catch (e) {
            console.error("[Firebase] Error de diagnóstico:", e);
            result.error = e.message;
        }
        return result;
    },

    // --- Products ---
    async getProducts(bypassCache = false) {
        return this._getWithCache("lc1_products", async () => {
            console.log("[Firebase] Fetching products from Firestore...");
            const snapshot = await db.collection("products").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }, bypassCache);
    },

    async saveProduct(product) {
        const id = String(product.id);
        console.log("[Firebase] Saving product:", id);
        this._clearCache("lc1_products");
        return await db.collection("products").doc(id).set(product);
    },

    async deleteProduct(id) {
        console.log("[Firebase] Deleting product:", id);
        this._clearCache("lc1_products");
        return await db.collection("products").doc(String(id)).delete();
    },

    // --- Categories ---
    async getCategories(bypassCache = false) {
        return this._getWithCache("lc1_categories", async () => {
            console.log("[Firebase] Fetching categories from Firestore...");
            const snapshot = await db.collection("categories").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }, bypassCache);
    },

    async saveCategory(category) {
        const id = String(category.id);
        this._clearCache("lc1_categories");
        return await db.collection("categories").doc(id).set(category);
    },

    async deleteCategory(id) {
        this._clearCache("lc1_categories");
        return await db.collection("categories").doc(String(id)).delete();
    },


    // --- Settings ---
    async getSettings(bypassCache = false) {
        return this._getWithCache("lc1_settings", async () => {
            console.log("[Firebase] Fetching settings from Firestore...");
            const doc = await db.collection("settings").doc("main").get();
            return doc.exists ? doc.data() : null;
        }, bypassCache);
    },

    async saveSettings(settings) {
        this._clearCache("lc1_settings");
        return await db.collection("settings").doc("main").set(settings);
    },

    // --- Internal Cache Logic ---
    _getWithCache(key, fetcher, bypass = false) {
        const ttl = 5 * 60 * 1000; // 5 minutos
        const now = Date.now();
        
        if (!bypass) {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (now - timestamp < ttl) {
                    console.log(`[Cache] Usando datos cacheados para: ${key}`);
                    return Promise.resolve(data);
                }
            }
        }

        return fetcher().then(data => {
            sessionStorage.setItem(key, JSON.stringify({ data, timestamp: now }));
            return data;
        });
    },

    _clearCache(key) {
        sessionStorage.removeItem(key);
        console.log(`[Cache] Limpiado: ${key}`);
    },

    // --- Orders (Always fresh, no cache) ---
    async getOrders() {
        const snapshot = await db.collection("orders").orderBy("date", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveOrder(order) {
        const id = String(order.id);
        return await db.collection("orders").doc(id).set(order);
    },

    async deleteOrder(id) {
        return await db.collection("orders").doc(String(id)).delete();
    },

    // --- Storage (Images) ---
    async uploadImage(file, path) {
        console.log(`[Firebase] Iniciando subida a: ${path}...`);
        try {
            const storageRef = storage.ref(path);
            const snapshot = await storageRef.put(file);
            console.log(`[Firebase] Archivo subido con éxito: ${path}`);
            const url = await snapshot.ref.getDownloadURL();
            console.log(`[Firebase] URL obtenida: ${url}`);
            return url;
        } catch (error) {
            console.error(`[Firebase] Error CRÍTICO en la subida a ${path}:`, error);
            throw error;
        }
    },

    // --- Analytics ---
    async logEvent(event) {
        try {
            // Evitar loguear si es el administrador (opcional, pero recomendado)
            const user = firebase.auth().currentUser;
            if (user) return; // No logueamos acciones del admin

            return await db.collection("logs").add({
                ...event,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                clientTimestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn("[Firebase] Error logging event:", error);
        }
    },

    async getEvents(limitCount = 1000) {
        const snapshot = await db.collection("logs")
            .orderBy("timestamp", "desc")
            .limit(limitCount)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Utility to convert Base64 to Blob
    base64ToBlob(base64, contentType = 'image/jpeg') {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    }
};

// Export for global use
window.FirebaseService = FirebaseService;
