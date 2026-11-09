// Zentrale Masse des simulierten Stadions (in Metern).
// Achtung: Das ist ein vereinfachtes, fiktives Modell – keine offiziellen Masse des San Siro.
// Die 3D-Szene und die Stadionkarte lesen beide diese Werte, damit sie immer übereinstimmen.

export const PITCH = {
  length: 105, // x-Achse
  width: 68, // z-Achse
  grassMargin: 6,
};

// Innenkante der Tribünen als abgerundetes Rechteck (Halbmasse).
export const BOWL = {
  hx: 62,
  hz: 44,
  radius: 14,
};

// Drei Ränge. "offset" = Abstand von der Innenkante nach aussen.
export const TIERS = [
  { name: 'Unterring', offset: 0, y: 1.0, rows: 16, run: 0.85, rise: 0.42 },
  { name: 'Mittelring', offset: 10.5, y: 11.0, rows: 15, run: 0.85, rise: 0.62 },
  { name: 'Oberring', offset: 20.5, y: 25.0, rows: 16, run: 0.9, rise: 0.75 },
];

export const FACADE_OFFSET = 37; // Aussenwand
export const ROOF = { inner: 5, outer: 39, y: 47, thickness: 1.6 };

// Augenhöhe einer Person im Rollstuhl (Durchschnittswert für die Simulation).
export const EYE_HEIGHT_SEATED = 1.15;

// Rollstuhlplattform im Mittelring auf der Nordseite (z negativ).
export const PLATFORM = {
  halfWidth: 9,
  depth: 3.4,
};

// Hilfsfunktion: Halbmasse der Ringe bei einem bestimmten Abstand
export function ringAt(offset) {
  return {
    hx: BOWL.hx + offset,
    hz: BOWL.hz + offset,
    r: BOWL.radius + offset,
  };
}

// Qualitätsstufe: auf Smartphones und schwachen Geräten wird weniger gerendert.
function detectQuality() {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('quality');
  if (forced === 'low' || forced === 'high') return forced;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  return coarse || small || cores <= 4 ? 'low' : 'high';
}

export const QUALITY = detectQuality();

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
