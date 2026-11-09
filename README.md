# Virtual Stadium Experience – Prototyp

Digitale Stadionvorschau für Rollstuhlfahrende. Schulprojekt ÜK 368 (LB Element c) von Giuliano und Kimi.

**Wichtig:** Alle Wege, Plätze, Masse und Angaben sind simuliert. Es sind keine offiziellen Informationen zum Stadion San Siro. Es gibt keinen Ticketverkauf und keine Verbindung zur UEFA oder zu Fussballverbänden.

## Stand: Etappe 1

- Startseite mit Nacht-Stadion und Button «Enter Stadium»
- 3D-Stadion bei Nacht (stilisiert, selbst gebaut, keine externen Modelle)
- Zwei Standorte: Eingang Nord und Rollstuhlplattform Mittelring
- Kamerafahrt zwischen den Standorten, freies Umsehen
- Stadionkarte mit Standorten und Blickrichtung
- Responsiv für Laptop und Smartphone
- Hinweis «Simulation» immer sichtbar

## Bedienung

| Aktion | Maus / Touch | Tastatur |
|---|---|---|
| Umsehen | Ziehen bzw. Wischen | Pfeiltasten (wenn kein Button fokussiert ist) |
| Standort wechseln | Karte oder Leiste unten | `1`, `2` |
| Blick zurücksetzen | «Blick zurücksetzen» | `R` |
| Fahrt überspringen | «Überspringen» | `Esc` |
| Bedienung aus-/einblenden | Button oben rechts | `H` |

## Auf Vercel veröffentlichen

Voraussetzung: ein GitHub-Konto und ein Vercel-Konto (Anmeldung bei Vercel mit GitHub).

1. Auf github.com ein neues Repository erstellen, z. B. `virtual-stadium-experience` (Public oder Private).
2. Im Repository «uploading an existing file» wählen und **den Inhalt dieses Ordners** hochladen (nicht den Ordner `node_modules`, falls vorhanden). Danach «Commit changes».
3. Auf vercel.com: «Add New…» → «Project» → das Repository importieren.
4. Vercel erkennt Vite automatisch (Build: `npm run build`, Output: `dist`). Auf «Deploy» klicken.
5. Nach rund einer Minute gibt es einen Link wie `https://virtual-stadium-experience.vercel.app`.
6. Link im privaten Browserfenster und auf dem Smartphone testen (ohne Anmeldung).

Jede neue Version auf GitHub wird von Vercel automatisch neu veröffentlicht.

## Lokal starten (optional)

Benötigt Node.js 18 oder neuer.

```bash
npm install
npm run dev
```

## Projektstruktur

Alle Dateien liegen bewusst im Hauptordner (einfacher Upload über die GitHub-Webseite).

```
index.html      Seitenaufbau (Startseite, Tour, Hinweise)
main.js         Start der App, Renderloop
main.css        Gestaltung
config.js       Masse des simulierten Stadions, Qualitätsstufe
locations.js    Standorte, Texte, Kamerafahrten
stadium.js      3D-Stadion
environment.js  Himmel, Vorplatz, Umgebung
textures.js     selbst gezeichnete Texturen (Rasen, Banden, Schild)
geometry.js     Hilfsfunktionen für die Stadionform
renderer.js     Renderer und Flutlicht-Effekt
CameraRig.js    Kamerafahrt und Umsehen
map.js          Stadionkarte
tour.js         Bedienung der Tour
toast.js        Fehlermeldungen
```

Auf Smartphones läuft automatisch eine leichtere Grafikstufe. Mit `?quality=high` oder `?quality=low` in der Adresse lässt sie sich erzwingen.
