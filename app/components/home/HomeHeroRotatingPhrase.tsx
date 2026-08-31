"use client";

import { useEffect, useState } from "react";

export const HERO_NEED_PHRASES = [
  "Monter un meuble",
  "Réparer une fuite",
  "Entretenir un jardin",
  "Déménager",
  "Faire le ménage",
  "Réparer un véhicule",
  "Installer une prise",
  "Garder un animal",
] as const;

const ROTATE_MS = 2800;

export default function HomeHeroRotatingPhrase() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_NEED_PHRASES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <span
      className="mt-1 block min-h-[1.15em] text-brand-600 dark:text-brand-400"
      aria-live="polite"
    >
      {HERO_NEED_PHRASES[index]}
    </span>
  );
}
