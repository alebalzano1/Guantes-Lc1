/**
 * LC1 Goalkeeper - Scroll Reveal Controller
 * Handles the activation of 'reveal' classes as the user scrolls.
 */

document.addEventListener('DOMContentLoaded', () => {
    const reveals = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // observer.unobserve(entry.target); // Keep observing if we want it to repeat, or unobserve for one-time
            }
        });
    }, revealOptions);

    reveals.forEach(el => {
        revealObserver.observe(el);
    });

    // Handle Navbar Shrink on Scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.padding = "0.8rem 5%";
            nav.style.background = "rgba(10, 10, 10, 0.95)";
        } else {
            nav.style.padding = "1.5rem 5%";
            nav.style.background = "rgba(10, 10, 10, 0.8)";
        }
    });
});
