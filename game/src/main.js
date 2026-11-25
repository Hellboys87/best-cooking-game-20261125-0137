// Warung Kilat — game loop and wiring: input, state, cooking and render.

import { CANVAS_W, CANVAS_H, TUNING, STATIONS } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import {
  createState, startDay, endDay, updateDay, updateFx,
  nearestStation, stationAt,
} from './state.js';
import { interact, updateChopping, releaseChop, updateCooking } from './cooking.js';
import { render } from './render.js';
import { buildShotState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new SoundEngine();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotState = shotName ? buildShotState(shotName) : null;
const state = shotState || createState();
let shotMode = !!shotState;
if (shotMode) document.body.classList.add('shot');

let lastTime = performance.now();

function clampToKitchen(x, y) {
  return {
    x: Math.max(30, Math.min(CANVAS_W - 30, x)),
    y: Math.max(290, Math.min(CANVAS_H - 30, y)),
  };
}

function stationFront(station) {
  return {
    x: station.x + station.w / 2,
    y: station.y + station.h + 26,
  };
}

function tryInteractAt(station, clickX, clickY) {
  if (state.screen === 'title') {
    sfx.ensure();
    sfx.startMusic();
    startDay(state);
    return;
  }
  if (state.screen === 'end') return;
  interact(state, station, sfx, clickX, clickY);
}

const input = new Input(canvas, {
  onAnyKey() {
    sfx.ensure();
    if (state.screen === 'play' && !state.paused) sfx.startMusic();
  },
  onInteractDown() {
    if (state.screen === 'title') {
      sfx.ensure();
      sfx.startMusic();
      startDay(state);
      return;
    }
    if (state.screen !== 'play' || state.paused) return;
    const st = nearestStation(state);
    if (!st) return;
    // Holding E on the chopping board chops; a tap elsewhere interacts.
    if (st.id === 'board' && state.board && !state.board.done) {
      state.chopHeld = true;
      return;
    }
    tryInteractAt(st, state.cook.x, state.cook.y);
  },
  onInteractUp() {
    if (state.chopHeld) {
      state.chopHeld = false;
      releaseChop(state, sfx);
    }
  },
  onPause() {
    if (state.screen === 'play') state.paused = !state.paused;
  },
  onRestart() {
    if (state.screen === 'end' || state.screen === 'play') {
      sfx.ensure();
      startDay(state);
      state.paused = false;
    }
  },
  onMute() {
    state.muted = !state.muted;
    sfx.setMuted(state.muted);
  },
  onCanvasClick(x, y) {
    if (state.screen === 'title') {
      sfx.ensure();
      sfx.startMusic();
      startDay(state);
      return;
    }
    if (state.screen !== 'play' || state.paused) return;
    const st = stationAt(state, x, y);
    if (st) {
      const front = stationFront(st);
      state.moveTarget = front;
      state.pendingStation = st;
      state.pendingClick = { x, y };
    } else {
      state.moveTarget = clampToKitchen(x, y);
      state.pendingStation = null;
    }
  },
});

function moveCook(dt) {
  const c = state.cook;
  const vec = input.moveVector();
  let vx = vec.x;
  let vy = vec.y;
  if (vx === 0 && vy === 0 && state.moveTarget) {
    const dx = state.moveTarget.x - c.x;
    const dy = state.moveTarget.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      state.moveTarget = null;
      if (state.pendingStation) {
        const st = state.pendingStation;
        state.pendingStation = null;
        tryInteractAt(st, state.pendingClick.x, state.pendingClick.y);
      }
    } else {
      vx = dx / d;
      vy = dy / d;
    }
  }
  if (vx !== 0 || vy !== 0) {
    c.moving = true;
    c.dir = vx !== 0 ? Math.sign(vx) : c.dir;
    c.walkBob += dt * 12;
    const next = clampToKitchen(c.x + vx * TUNING.cookSpeed * dt, c.y + vy * TUNING.cookSpeed * dt);
    // Do not walk through stations: slide along them instead.
    const blocked = STATIONS.some((s) => next.x > s.x - 14 && next.x < s.x + s.w + 14 && next.y > s.y - 14 && next.y < s.y + s.h + 14);
    if (!blocked) {
      c.x = next.x;
      c.y = next.y;
    } else {
      const tryX = clampToKitchen(c.x + vx * TUNING.cookSpeed * dt, c.y);
      const blockedX = STATIONS.some((s) => tryX.x > s.x - 14 && tryX.x < s.x + s.w + 14 && tryX.y > s.y - 14 && tryX.y < s.y + s.h + 14);
      if (!blockedX) c.x = tryX.x;
      const tryY = clampToKitchen(c.x, c.y + vy * TUNING.cookSpeed * dt);
      const blockedY = STATIONS.some((s) => tryY.x > s.x - 14 && tryY.x < s.x + s.w + 14 && tryY.y > s.y - 14 && tryY.y < s.y + s.h + 14);
      if (!blockedY) c.y = tryY.y;
    }
  } else {
    c.moving = false;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (!shotMode) {
    updateFx(state, dt);
    if (state.screen === 'play' && !state.paused) {
      updateDay(state, dt, sfx);
      moveCook(dt);
      state.nearStation = nearestStation(state);
      if (state.chopHeld && state.nearStation && state.nearStation.id === 'board') {
        updateChopping(state, dt, sfx);
      }
      updateCooking(state, dt, sfx);
      sfx.setRush(state.rush);
    }
  } else {
    // Screenshot states render one frozen, deterministic frame.
    updateFx(state, 0);
  }

  render(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
