// Firebase Service for LC1 Goalkeeper
// Using Firebase Compat SDK for easy integration with existing global-scope scripts.

// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

const FirebaseService = {
    // --- Products ---
    async getProducts() {
        console.log("[Firebase] Fetching products...");
        const snapshot = await db.collection("products").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveProduct(product) {
        const id = String(product.id);
        console.log("[Firebase] Saving product:", id);
        return await db.collection("products").doc(id).set(product);
    },

    async deleteProduct(id) {
        console.log("[Firebase] Deleting product:", id);
        return await db.collection("products").doc(String(id)).delete();
    },

    // --- Categories ---
    async getCategories() {
        const snapshot = await db.collection("categories").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveCategory(category) {
        const id = String(category.id);
        return await db.collection("categories").doc(id).set(category);
    },

    async deleteCategory(id) {
        return await db.collection("categories").doc(String(id)).delete();
    },

    // --- Gallery ---
    async getGallery() {
        const snapshot = await db.collection("gallery").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveGalleryItem(item) {
        const id = String(item.id);
        return await db.collection("gallery").doc(id).set(item);
    },

    async deleteGalleryItem(id) {
        return await db.collection("gallery").doc(String(id)).delete();
    },

    // --- Settings ---
    async getSettings() {
        const doc = await db.collection("settings").doc("main").get();
        return doc.exists ? doc.data() : null;
    },

    async saveSettings(settings) {
        return await db.collection("settings").doc("main").set(settings);
    },

    // --- Orders ---
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
        console.log("[Firebase] Uploading image to:", path);
        const storageRef = storage.ref(path);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
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
