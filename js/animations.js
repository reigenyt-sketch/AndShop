// Inicializar ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Detectar preferencia de reducción de movimiento
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Configuración global de GSAP
gsap.config({
    nullTargetWarn: false,
    force3D: !prefersReducedMotion // Desactivar 3D si se reduce movimiento
});

// Evitar animaciones complejas si el usuario prefiere menos movimiento
if (prefersReducedMotion) {
    gsap.defaults({ duration: 0.1 }); // Animaciones casi instantáneas
}

document.addEventListener('DOMContentLoaded', () => {
    // ================================
    // HERO SECTION: Animación en capas
    // ================================
    const hero = document.getElementById('home');
    if (hero) {
        const heroImage = hero.querySelector('img');
        const heroTitle = hero.querySelector('h2');
        const heroText = hero.querySelector('p');
        const heroButton = hero.querySelector('a[href="#products"]');

        // Parallax suave en fondo (solo si no se reduce movimiento)
        if (!prefersReducedMotion && heroImage) {
            gsap.to(heroImage, {
                y: 50,
                ease: "none",
                scrollTrigger: {
                    trigger: hero,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }

        // Elementos de texto y botón
        const heroElements = [heroTitle, heroText, heroButton].filter(Boolean);
        gsap.set(heroElements, { opacity: 0, y: 30 });

        if (!prefersReducedMotion) {
            gsap.timeline({ delay: 0.4 })
                .to(heroTitle, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out"
                })
                .to(heroText, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: "power2.out"
                }, "+=0.2")
                .to(heroButton, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "back.out(1.2)",
                    scale: 1.05,
                    transformOrigin: "center",
                    onStart: () => {
                        const pulse = gsap.to(heroButton, {
                            scale: 1,
                            duration: 0.3,
                            ease: "power2.out",
                            repeat: -1,
                            yoyo: true
                        });
                        pulse.timeScale(2); // Más rápido
                    }
                }, "+=0.3");
        } else {
            // Si se reduce movimiento: mostrar sin animación
            gsap.set(heroElements, { opacity: 1, y: 0 });
        }
    }

    // ================================
    // Animaciones de secciones al hacer scroll
    // ================================
    const sections = gsap.utils.toArray('main section');
    sections.forEach(section => {
        if (section.id === 'home') return; // Ya animado

        gsap.from(section, {
            opacity: 0,
            y: 60,
            scale: 0.98,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
                markers: false // Cambiar a true solo en desarrollo
            }
        });
    });

    // ================================
    // Microinteracciones: Hover en botones y enlaces
    // ================================
    if (!prefersReducedMotion) {
        document.querySelectorAll('button, a').forEach(el => {
            // Excluir íconos pequeños como cerrar carrito
            if (el.closest('[aria-label*="cerrar"]') || el.classList.contains('filter-btn')) return;

            el.addEventListener('mouseenter', () => {
                gsap.to(el, {
                    scale: 1.05,
                    boxShadow: el.tagName === 'BUTTON'
                        ? '0 10px 20px rgba(79, 70, 229, 0.2)'
                        : 'none',
                    duration: 0.2,
                    ease: "back.out(1.7)",
                    overwrite: "auto"
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    scale: 1,
                    boxShadow: 'none',
                    duration: 0.25,
                    ease: "power2.out"
                });
            });
        });

        // Iconos de redes y carrito
        document.querySelectorAll(`
            .text-gray-600.hover\\:text-primary, 
            #cart-icon, 
            .footer-social a, 
            .fab
        `).forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                gsap.to(icon, {
                    y: -2,
                    color: window.getComputedStyle(icon).getPropertyValue('color') !== '#4f46e5'
                        ? '#4f46e5'
                        : '',
                    duration: 0.2,
                    ease: "power1.out"
                });
            });

            icon.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    y: 0,
                    color: '',
                    duration: 0.25,
                    ease: "power2.out"
                });
            });
        });
    }

    // ================================
    // Animación del logo en header
    // ================================
    const headerImg = document.querySelector('header img');
    const headerH1 = document.querySelector('header h1');
    if ((headerImg || headerH1) && !prefersReducedMotion) {
        gsap.from([headerImg, headerH1].filter(Boolean), {
            opacity: 0,
            y: -20,
            duration: 0.7,
            delay: 0.2,
            ease: "power2.out",
            stagger: 0.1
        });
    }

    // ================================
    // ScrollTrigger: Header fijo con efecto de blur
    // ================================
    ScrollTrigger.create({
        start: "top -100",
        end: "max",
        onEnter: () => gsap.to('header', {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 1px 10px rgba(0, 0, 0, 0.1)",
            duration: 0.3
        }),
        onLeaveBack: () => gsap.to('header', {
            backgroundColor: "transparent",
            backdropFilter: "none",
            boxShadow: "none",
            duration: 0.3
        })
    });

    // ================================
    // Optimización: Pausar animaciones en pestaña inactiva
    // ================================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            gsap.globalTimeline.pause();
        } else {
            gsap.globalTimeline.resume();
        }
    });
});