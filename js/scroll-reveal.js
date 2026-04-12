/**
 * LC1 Goalkeeper - Scroll Reveal Controller (Pro Edition)
 * Handles dynamic observation of 'reveal' elements even after injection.
 */

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            // observer.unobserve(entry.target); 
        }
    });
}, revealOptions);

// Función global para registrar elementos inyectados dinámicamente
window.reobserveReveal = () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => revealObserver.observe(el));
};

document.addEventListener('DOMContentLoaded', () => {
    // Registro inicial
    window.reobserveReveal();

    // Lógica adicional para el Navbar
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            nav.style.padding = "0.8rem 5%";
            nav.style.background = "rgba(10, 10, 10, 0.95)";
        } else {
            nav.style.padding = "1.5rem 5%";
            nav.style.background = "rgba(10, 10, 10, 0.8)";
        }
    });
});
