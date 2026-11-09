import { TIERS, FACADE_OFFSET, EYE_HEIGHT_SEATED, ringAt } from './config.js';

// Standorte der Tour. Positionen in Metern, Blickrichtung als yaw/pitch (Bogenmass).
// yaw = 0 schaut Richtung +z (vom Nordeingang zum Spielfeld).
// Alle Texte beschreiben eine Simulation – keine offiziellen Angaben zum San Siro.

const tier2 = TIERS[1];
const platformTop = tier2.y + 4 * tier2.rise + 0.02;
const platformFront = -ringAt(tier2.offset).hz;
const entranceZ = -ringAt(FACADE_OFFSET + 1).hz;

export const LOCATIONS = [
  {
    id: 'eingang-nord',
    number: 1,
    title: 'Eingang Nord',
    kicker: 'Aussenbereich',
    description:
      'Hier beginnt der Stadionbesuch. In dieser Simulation ist der Eingang Nord als stufenloser Zugang für Rollstuhlfahrende vorgesehen.',
    facts: [
      ['Zugang', 'stufenlos (Beispiel)'],
      ['Entfernung zum Tor', 'ca. 30 m'],
    ],
    position: { x: 0, y: EYE_HEIGHT_SEATED, z: entranceZ - 30 },
    yaw: 0,
    pitch: 0.16,
    zone: 'outside',
    // Anflugpunkte für die Kamerafahrt (von weit weg nach nah)
    approach: [
      { x: 0, y: 46, z: entranceZ - 18 },
      { x: 0, y: 10, z: entranceZ - 26 },
    ],
  },
  {
    id: 'plattform-mittelring',
    number: 2,
    title: 'Rollstuhlplattform',
    kicker: 'Mittelring Nord',
    description:
      'Erhöhte Plattform mit markierten Plätzen für Rollstühle. Direkt daneben steht jeweils ein Sitz für eine Begleitperson.',
    facts: [
      ['Lage', 'Mittelring, Nordseite'],
      ['Plätze', '7 Rollstuhlplätze mit Begleitsitz'],
    ],
    position: { x: -0.45, y: platformTop + EYE_HEIGHT_SEATED, z: platformFront - 1.35 },
    yaw: 0,
    pitch: -0.22,
    zone: 'inside',
    // Die Plattform liegt unter dem Dach: Anflug von der Spielfeldseite her
    approach: [
      { x: 0, y: 40, z: platformFront + 28 },
      { x: -0.3, y: 22, z: platformFront + 18 },
    ],
  },
];

// Zwischenpunkte für eine Kamerafahrt von "from" (Standort oder null = Überflug) zu "to".
// Wechselt die Fahrt zwischen aussen und innen, führt sie über das Dach.
export function flightWaypoints(from, to, startPos) {
  const points = [];
  if (from) {
    points.push(...[...from.approach].reverse());
  } else {
    // vom Überflug zuerst auf die Nordseite
    points.push({ x: startPos.x * 0.35, y: 70, z: -150 });
  }
  const zoneFrom = from ? from.zone : 'outside';
  if (zoneFrom !== to.zone) {
    const a = from ? from.approach[0] : points[points.length - 1];
    const b = to.approach[0];
    points.push({ x: (a.x + b.x) / 2, y: 74, z: (a.z + b.z) / 2 });
  }
  points.push(...to.approach);
  return points;
}

export function locationById(id) {
  return LOCATIONS.find((l) => l.id === id);
}
