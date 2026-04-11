// LC1 Goalkeeper Tracker API (Frontend)
// Modular system for logging user behavior without a backend (LocalStorage based)

const Tracker = {
    MAX_LOGS: 1000,
    startTime: Date.now(),
    
    init() {
        this.trackVisit();
        this.bindEvents();
        this.trackUnload();
    },

    logEvent(type, data = {}) {
        let logs = JSON.parse(localStorage.getItem('lc1-event-logs')) || [];
        
        const event = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            type: type,
            path: window.location.pathname.split('/').pop() || 'home',
            data: data,
            timestamp: new Date().toISOString()
        };

        logs.push(event);

        // Rotating logs if too many
        if (logs.length > this.MAX_LOGS) {
            logs = logs.slice(-this.MAX_LOGS);
        }

        localStorage.setItem('lc1-event-logs', JSON.stringify(logs));
        console.log(`[LC1-Tracker] Event: ${type}`, data);
    },

    trackVisit() {
        // Find product ID if on shop page
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        this.logEvent('page_view', { 
            userAgent: navigator.userAgent,
            productId: productId
        });
    },

    bindEvents() {
        // Track specific clicks globally
        document.addEventListener('click', (e) => {
            // Whatsapp Tracking
            if (e.target.closest('.whatsapp-float')) {
                this.logEvent('whatsapp_click', { origin: 'floating' });
            }
            
            // Generic marked tracking
            const trackBtn = e.target.closest('[data-track]');
            if (trackBtn) {
                const eventName = trackBtn.getAttribute('data-track');
                const eventValue = trackBtn.getAttribute('data-track-value');
                this.logEvent(eventName, { value: eventValue });
            }
        });
    },

    trackUnload() {
        window.addEventListener('beforeunload', () => {
            const duration = Math.round((Date.now() - this.startTime) / 1000);
            this.logEvent('session_time', { seconds: duration });
        });
    }
};

// Auto-initiate
document.addEventListener('DOMContentLoaded', () => Tracker.init());

// Export for manual use (addToCart, etc)
window.LC1_Tracker = Tracker;
