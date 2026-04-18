// LC1 Goalkeeper - Central Utilities
// This file contains shared functions to avoid duplication and ReferenceErrors across the site.

/**
 * Safely parse JSON from LocalStorage with a fallback value.
 * @param {string} key - The localStorage key.
 * @param {*} defaultValue - The value to return if parsing fails or key is missing.
 * @returns {*} - The parsed object or fallback.
 */
const getSafeJSON = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`[Utils] Error parsing LocalStorage key "${key}":`, e);
        return defaultValue;
    }
};

/**
 * Basic Toast Notification (shared across app/admin)
 */
const showToast = (msg, type = 'success') => {
    // Attempt to find existing container, otherwise we'll wait for DOM
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn("[Utils] No toast-container found in DOM.");
        return;
    }

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

// Export for global use
window.getSafeJSON = getSafeJSON;
window.showToast = showToast;
