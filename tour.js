import { StadiumMap } from './map.js';

const $ = (sel) => document.querySelector(sel);

// Bedienoberfläche der Stadiontour: Standortinfo, Karte, Standortwahl, Tastatur.
export class TourUI {
  constructor({ locations, onSelect, onSkip, onLook, onReset, onBack }) {
    this.locations = locations;
    this.onSelect = onSelect;
    this.root = $('#tour');
    this.hud = $('#hud');
    this.map = new StadiumMap($('#map'), locations, onSelect);
    this.stationButtons = new Map();
    this.flying = false;

    this.buildStations();

    $('#skip').addEventListener('click', onSkip);
    $('#back').addEventListener('click', onBack);
    $('#reset-view').addEventListener('click', onReset);
    $('#toggle-hud').addEventListener('click', () => this.toggleHud());
    // Auf dem Smartphone: Details der Standortinfo auf- und zuklappen
    $('#info-toggle').addEventListener('click', () => {
      const info = $('.info');
      const open = info.classList.toggle('is-expanded');
      $('#info-toggle').setAttribute('aria-expanded', String(open));
      $('#info-toggle').textContent = open ? 'Weniger' : 'Details';
    });

    document.addEventListener('keydown', (e) => {
      if (this.root.hidden) return;
      if (e.target.closest('input, textarea')) return;
      const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      // Pfeiltasten nur zum Umsehen, wenn kein Button fokussiert ist
      if (keys[e.key] && !e.target.closest('button')) {
        e.preventDefault();
        onLook(keys[e.key]);
      } else if (e.key === 'r' || e.key === 'R') {
        onReset();
      } else if (e.key === 'h' || e.key === 'H') {
        this.toggleHud();
      } else if (e.key === 'Escape' && this.flying) {
        onSkip();
      } else {
        const loc = this.locations.find((l) => String(l.number) === e.key);
        if (loc) onSelect(loc);
      }
    });
  }

  buildStations() {
    const list = $('#station-list');
    for (const loc of this.locations) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'station';
      btn.innerHTML = `<span class="station-num">${loc.number}</span><span class="station-label">${loc.title}</span>`;
      btn.addEventListener('click', () => this.onSelect(loc));
      list.append(btn);
      this.stationButtons.set(loc.id, btn);
    }
  }

  show() {
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add('is-visible'));
  }

  hide() {
    this.root.classList.remove('is-visible');
    this.root.hidden = true;
    this.setInfo(null);
    this.setActive(null);
  }

  toggleHud() {
    const hidden = this.hud.classList.toggle('is-hidden');
    const btn = $('#toggle-hud');
    btn.setAttribute('aria-pressed', String(hidden));
    btn.querySelector('.label-long').textContent = hidden ? 'Bedienung einblenden' : 'Bedienung ausblenden';
    btn.querySelector('.label-short').textContent = hidden ? 'Einblenden' : 'Ausblenden';
  }

  startFlight(loc) {
    this.flying = true;
    this.map.setDisabled(true);
    for (const b of this.stationButtons.values()) b.disabled = true;
    $('#flight-status').hidden = false;
    $('#look-hint').hidden = true;
    this.root.classList.add('is-flying');
    this.setActive(loc.id);
  }

  arrive(loc) {
    this.flying = false;
    this.map.setDisabled(false);
    for (const b of this.stationButtons.values()) b.disabled = false;
    $('#flight-status').hidden = true;
    $('#look-hint').hidden = false;
    this.root.classList.remove('is-flying');
    this.setInfo(loc);
  }

  setActive(id) {
    this.map.setActive(id);
    for (const [key, btn] of this.stationButtons) {
      if (key === id) btn.setAttribute('aria-current', 'location');
      else btn.removeAttribute('aria-current');
    }
  }

  setInfo(loc) {
    const info = $('.info');
    if (!loc) {
      info.classList.remove('is-visible');
      return;
    }
    info.classList.remove('is-expanded');
    $('#info-toggle').setAttribute('aria-expanded', 'false');
    $('#info-toggle').textContent = 'Details';
    $('#info-number').textContent = `Standort ${loc.number} von ${this.locations.length}`;
    $('#info-kicker').textContent = loc.kicker;
    $('#info-title').textContent = loc.title;
    $('#info-text').textContent = loc.description;
    const dl = $('#info-facts');
    dl.replaceChildren();
    for (const [k, v] of loc.facts) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      row.append(dt, dd);
      dl.append(row);
    }
    info.classList.add('is-visible');
  }

  updateMap(pos, yaw, visible) {
    if (this.root.hidden) return;
    this.map.updateView(pos.x, pos.z, yaw, visible);
  }
}
