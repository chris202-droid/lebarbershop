import { useEffect, useRef, useState } from "react";

/**
 * Détecte quand un élément entre dans le viewport, pour déclencher une
 * animation de révélation (fade-in / translation) au défilement — utilisé
 * par les rubriques de la page d'accueil. Se déclenche une seule fois par
 * élément (pas de ré-animation en remontant), pour rester sobre et
 * professionnel plutôt que distrayant.
 */
export default function useEnVue(options = {}) {
  const ref = useRef(null);
  const [enVue, setEnVue] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respecte la préférence système "réduire les animations".
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setEnVue(true);
      return;
    }

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setEnVue(true);
          observateur.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px", ...options }
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return [ref, enVue];
}
