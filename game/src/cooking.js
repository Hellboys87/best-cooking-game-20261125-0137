// Warung Kilat — the cooking rules: chopping with a timing sweet spot,
// wok and grill heat with a green zone, burning, plating in recipe order,
// serving for coins and combo, and the rubbish bin.

import { TUNING, ITEMS, CHOP_MAP, WOK_MAP, GRILL_MAP, PANTRY_BINS, STATIONS, recipeById } from './config.js';
import { addFloat, addParticles } from './state.js';

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

function pantryBinAt(station, x, y) {
  // Bins are drawn at x+8+col*39, y+8+row*44, each 35x40 — detect the same grid.
  const col = Math.floor((x - station.x - 8) / 39);
  const relY = y - station.y - 8;
  const row = relY < 44 ? 0 : relY < 88 ? 1 : -1;
  if (col < 0 || col > 4 || row < 0 || row > 1) return null;
  return PANTRY_BINS.find((b) => b.col === col && b.row === row) || null;
}

function plateMatchesOrder(plate, order) {
  if (plate.length !== order.steps.length) return false;
  return plate.every((item, i) => item === order.steps[i]);
}

function plateCouldMatch(plate, order) {
  if (plate.length >= order.steps.length) return false;
  return plate.every((item, i) => item === order.steps[i]);
}

// What happens when the cook presses E (or clicks) at a station.
export function interact(state, station, sfx, clickX, clickY) {
  if (!station || state.screen !== 'play' || state.paused) return;
  const c = state.cook;
  const carrying = state.carrying;

  switch (station.kind) {
    case 'pantry': {
      if (carrying) { deny(state, sfx, 'Tangan penuh!'); return; }
      const bin = pantryBinAt(station, clickX ?? c.x, clickY ?? c.y);
      const item = bin ? bin.item : nearestBinItem(station, c.x);
      state.carrying = item;
      addParticles(state, c.x, c.y - 20, ITEMS[item].color, 8, 50);
      if (sfx) sfx.pickup();
      break;
    }
    case 'board': {
      if (state.board) {
        // Item already on the board: pick the finished chop up.
        if (state.board.done && !carrying) {
          state.carrying = state.board.item;
          state.board = null;
          if (sfx) sfx.pickup();
        }
        return;
      }
      if (carrying && CHOP_MAP[carrying]) {
        state.board = { item: CHOP_MAP[carrying], raw: carrying, progress: 0, needle: 0, needleDir: 1, done: false, perfect: false };
        state.carrying = null;
        if (sfx) sfx.place();
      } else if (carrying) {
        deny(state, sfx, 'Tidak bisa diiris!');
      }
      break;
    }
    case 'stove': {
      // Left half is the wok, right half the grill.
      const midX = station.x + station.w / 2;
      const atX = clickX ?? c.x;
      const slot = atX < midX ? 'wok' : 'grill';
      const active = slot === 'wok' ? state.wok : state.grill;
      const map = slot === 'wok' ? WOK_MAP : GRILL_MAP;
      if (active) {
        if (!carrying && active.heat >= TUNING.heatBurn) {
          state.carrying = 'burnt';
          state[slot] = null;
          if (sfx) sfx.pickup();
        } else if (!carrying && active.heat >= TUNING.heatGreenLow) {
          state.carrying = map[active.item];
          state[slot] = null;
          addParticles(state, c.x, c.y - 20, '#ffd23f', 10, 60);
          if (sfx) sfx.ding();
        } else if (!carrying) {
          deny(state, sfx, 'Belum matang!');
        } else {
          deny(state, sfx, 'Masih dimasak!');
        }
        return;
      }
      if (carrying && map[carrying]) {
        state[slot] = { item: carrying, heat: 0 };
        state.carrying = null;
        if (sfx) sfx.sizzle();
      } else if (carrying) {
        deny(state, sfx, 'Tidak bisa dimasak di sini!');
      }
      break;
    }
    case 'rice': {
      if (carrying) { deny(state, sfx, 'Tangan penuh!'); return; }
      state.carrying = 'rice';
      addParticles(state, station.x + station.w / 2, station.y, '#ffffff', 10, 40);
      if (sfx) sfx.pickup();
      break;
    }
    case 'fridge': {
      if (carrying) { deny(state, sfx, 'Tangan penuh!'); return; }
      state.carrying = 'ice';
      addParticles(state, station.x + station.w / 2, station.y, '#bfe8ff', 10, 40);
      if (sfx) sfx.pickup();
      break;
    }
    case 'plating': {
      if (carrying && typeof carrying === 'string') {
        // Add a component to the plate, in recipe order.
        const next = state.plate.length;
        const ok = state.orders.some((o) => {
          const recipe = recipeById(o.recipeId);
          return recipe.steps[next] === carrying && plateCouldMatch(state.plate, o);
        });
        if (ok) {
          state.plate.push(carrying);
          state.carrying = null;
          addParticles(state, station.x + 120, station.y + 40, '#f2c94c', 8, 50);
          if (sfx) sfx.place();
          // Plate complete? It becomes a carryable finished dish.
          const full = state.orders.find((o) => plateMatchesOrder(state.plate, o));
          if (full) {
            state.carrying = { plate: true, recipeId: full.recipeId };
            state.plate = [];
            addFloat(state, station.x + 120, station.y, 'Piring siap!', '#f2c94c');
            if (sfx) sfx.ding();
          }
        } else {
          deny(state, sfx, 'Bukan urutan resep!');
        }
      } else if (carrying && carrying.plate) {
        deny(state, sfx, 'Piring sudah jadi!');
      }
      break;
    }
    case 'window': {
      if (carrying && typeof carrying === 'object' && carrying.plate) {
        servePlate(state, sfx);
      } else if (carrying) {
        deny(state, sfx, 'Bawa piring jadi ke sini!');
      }
      break;
    }
    case 'bin': {
      if (carrying) {
        if (typeof carrying === 'object' && carrying.plate) {
          addFloat(state, c.x, c.y - 50, 'Piring dibuang', '#ff8a80');
        }
        state.carrying = null;
        if (sfx) sfx.place();
      } else if (state.plate.length > 0) {
        state.plate = [];
        addFloat(state, station.x + 60, station.y - 10, 'Piring dibersihkan', '#ff8a80');
        if (sfx) sfx.place();
      } else if (state.board) {
        state.board = null;
        addFloat(state, c.x, c.y - 50, 'Dibuang', '#ff8a80');
        if (sfx) sfx.place();
      }
      break;
    }
    default:
      break;
  }
}

function nearestBinItem(station, x) {
  const col = Math.max(0, Math.min(4, Math.floor((x - station.x - 8) / 39)));
  const bin = PANTRY_BINS.find((b) => b.col === col && b.row === 0);
  return bin ? bin.item : 'noodles';
}

function deny(state, sfx, text) {
  const c = state.cook;
  addFloat(state, c.x, c.y - 56, text, '#ff8a80');
  if (sfx) sfx.buzz();
}

function servePlate(state, sfx) {
  const plate = state.carrying;
  const orderIndex = state.orders.findIndex((o) => o.recipeId === plate.recipeId);
  const windowStation = stationById('window');
  const wx = windowStation.x + windowStation.w / 2;
  const wy = windowStation.y;
  if (orderIndex === -1) {
    // No such order any more (patience ran out): nothing, combo lost.
    state.carrying = null;
    state.combo = 0;
    addFloat(state, wx, wy - 10, 'Pesanan sudah pergi!', '#ff8a80');
    if (sfx) sfx.buzz();
    return;
  }
  const order = state.orders[orderIndex];
  const patienceFrac = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(TUNING.tipPerPatience * patienceFrac);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const mult = Math.min(TUNING.comboCap, 1 + (state.combo - 1) * TUNING.comboStep);
  const earned = Math.round((order.value + tip) * mult);
  state.coins += earned;
  state.served += 1;
  state.orders.splice(orderIndex, 1);
  state.carrying = null;
  addFloat(state, wx, wy - 10, `+${earned} koin`, '#f2c94c');
  if (state.combo >= 2) addFloat(state, wx, wy - 38, `COMBO x${state.combo}!`, '#ff9f43');
  addParticles(state, wx, wy, '#f2c94c', 16, 90);
  if (sfx) sfx.coin();
}

// Called every frame while E is held near the chopping board.
export function updateChopping(state, dt, sfx) {
  const b = state.board;
  if (!b || b.done) return;
  b.progress += dt / TUNING.chopSeconds;
  // The needle sweeps back and forth; release E inside the green band
  // for a perfect chop.
  b.needle += b.needleDir * dt * 1.6;
  if (b.needle > 1) { b.needle = 1; b.needleDir = -1; }
  if (b.needle < 0) { b.needle = 0; b.needleDir = 1; }
  if (Math.random() < dt * 8) {
    const st = stationById('board');
    addParticles(state, st.x + st.w / 2, st.y + st.h / 2, '#e8e0c8', 1, 30);
  }
  if (b.progress >= 1) finishChop(state, sfx, false);
}

// Releasing E while chopping: perfect if the needle is in the sweet spot.
export function releaseChop(state, sfx) {
  const b = state.board;
  if (!b || b.done) return;
  const inSpot = b.needle >= 0.35 && b.needle <= 0.65;
  if (inSpot) finishChop(state, sfx, true);
}

function finishChop(state, sfx, perfect) {
  const b = state.board;
  b.done = true;
  b.perfect = perfect;
  if (perfect) {
    state.perfectChops += 1;
    state.coins += TUNING.perfectChopBonus;
    const st = stationById('board');
    addFloat(state, st.x + st.w / 2, st.y - 8, `PERFECT +${TUNING.perfectChopBonus}`, '#7ed07e');
    if (sfx) sfx.perfect();
  } else if (sfx) {
    sfx.chop();
  }
}

// Heat rises on the wok and grill; food burns past the red line.
export function updateCooking(state, dt, sfx) {
  for (const slot of ['wok', 'grill']) {
    const job = state[slot];
    if (!job) continue;
    const seconds = slot === 'wok' ? TUNING.wokSeconds : TUNING.grillSeconds;
    job.heat += dt / seconds;
    if (job.heat >= TUNING.heatBurn && !job.burnt) {
      job.burnt = true;
      state.burntCount += 1;
      state.burnFlash = 1;
      state.shake = 1;
      const st = stationById('stove');
      addFloat(state, st.x + st.w / 2, st.y - 8, 'GOSONG!', '#ff5252');
      addParticles(state, st.x + st.w / 2, st.y + 30, '#333333', 14, 80);
      if (sfx) sfx.burn();
    }
    // Sizzle wisps while something cooks.
    if (Math.random() < dt * 6) {
      const st = stationById('stove');
      const offX = slot === 'wok' ? st.w * 0.25 : st.w * 0.75;
      addParticles(state, st.x + offX, st.y + 20, '#cfd8dc', 1, 26);
    }
  }
}
