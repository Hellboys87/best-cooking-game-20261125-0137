// Warung Kilat — game state: the cook, the orders, the day timer, coins,
// combo, particles and floating text. Pure data plus the per-frame update.

import { CANVAS_W, CANVAS_H, DAY_LENGTH, RUSH_AT, TUNING, RECIPES, recipeById, STATIONS } from './config.js';

let orderCounter = 0;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickUnlockedRecipe(rng, elapsed) {
  const unlocked = RECIPES.filter((r) => r.unlockAt <= elapsed);
  return unlocked[Math.floor(rng() * unlocked.length)];
}

export function makeOrder(rng, elapsed, rush) {
  const recipe = pickUnlockedRecipe(rng, elapsed);
  const patience = rush ? TUNING.rushPatienceSeconds : TUNING.patienceSeconds;
  orderCounter += 1;
  return {
    id: orderCounter,
    recipeId: recipe.id,
    name: recipe.name,
    short: recipe.short,
    value: recipe.value,
    steps: [...recipe.steps],
    patience,
    patienceMax: patience,
    born: elapsed,
  };
}

export function createState() {
  return {
    screen: 'title', // title | play | end
    paused: false,
    muted: false,
    elapsed: 0, // seconds since the day started
    timeLeft: DAY_LENGTH,
    rush: false,
    rushAnnounced: false,
    orders: [],
    orderTimer: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectChops: 0,
    burntCount: 0,
    cook: { x: CANVAS_W / 2, y: 430, dir: 1, moving: false, walkBob: 0 },
    carrying: null, // item id, or { plate: true, recipeId, steps } for a finished plate
    plate: [], // components currently on the plating counter
    board: null, // { item, progress, needle, perfect } while chopping
    wok: null, // { item, heat, slot: 'wok' } while cooking
    grill: null, // { item, heat, slot: 'grill' } while cooking
    particles: [],
    floats: [], // { x, y, text, color, life }
    banner: null, // { text, sub, life }
    burnFlash: 0,
    perfectFlash: 0, // big PERFECT! flash over the board, decays to 0
    chopHint: 0, // seconds left of the first-chop hint by the board
    chopHintShown: false, // the first-chop hint only ever shows once
    shake: 0,
    animTime: 0, // drives idle animation; frozen for screenshot states
    rng: mulberry32(20261125),
    moveTarget: null,
    nearStation: null,
    interactHeld: false,
    chopHeld: false,
    lastTickSecond: -1,
    result: null, // filled when the day ends
  };
}

export function stationAt(state, x, y) {
  for (const s of STATIONS) {
    if (x >= s.x - 14 && x <= s.x + s.w + 14 && y >= s.y - 14 && y <= s.y + s.h + 14) return s;
  }
  return null;
}

export function nearestStation(state) {
  const c = state.cook;
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD < 110 ? best : null;
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color: color || '#ffffff', life: 1.4 });
}

export function addParticles(state, x, y, color, n, spread) {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const sp = 30 + state.rng() * (spread || 70);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.5 + state.rng() * 0.5,
      maxLife: 1,
      color,
      size: 2 + state.rng() * 3,
    });
  }
}

export function startDay(state) {
  state.screen = 'play';
  state.elapsed = 0;
  state.timeLeft = DAY_LENGTH;
  state.rush = false;
  state.rushAnnounced = false;
  state.orders = [];
  state.orderTimer = TUNING.orderGapSeconds;
  state.coins = 0;
  state.served = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.perfectChops = 0;
  state.burntCount = 0;
  state.carrying = null;
  state.plate = [];
  state.board = null;
  state.wok = null;
  state.grill = null;
  state.particles = [];
  state.floats = [];
  state.banner = null;
  state.perfectFlash = 0;
  state.chopHint = 0;
  state.chopHintShown = false;
  state.result = null;
  state.cook.x = CANVAS_W / 2;
  state.cook.y = 430;
  // Two opening orders so the board is busy from the first second.
  state.orders.push(makeOrder(state.rng, 0, false));
  state.orders.push(makeOrder(state.rng, 0, false));
}

export function endDay(state) {
  state.screen = 'end';
  const stars = state.coins >= TUNING.stars[2] ? 3 : state.coins >= TUNING.stars[1] ? 2 : state.coins >= TUNING.stars[0] ? 1 : 0;
  state.result = {
    coins: state.coins,
    served: state.served,
    bestCombo: state.bestCombo,
    perfectChops: state.perfectChops,
    burnt: state.burntCount,
    stars,
  };
}

// One tick of the day clock: timer, patience, order spawns, rush hour.
export function updateDay(state, dt, sfx) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, DAY_LENGTH - state.elapsed);

  if (!state.rush && state.timeLeft <= RUSH_AT) {
    state.rush = true;
    state.rushAnnounced = true;
    state.banner = { text: 'RUSH HOUR!', sub: 'Pesanan makin cepat — tetap tenang, bro!', life: 2.6 };
    if (sfx) sfx.bell();
  }

  // Patience drains; expired orders walk away and break the combo.
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      state.orders.splice(i, 1);
      if (state.combo > 0) {
        addFloat(state, CANVAS_W / 2, 150, 'Pelanggan pergi... combo hilang', '#ff8a80');
      }
      state.combo = 0;
    }
  }

  // Tick sound when any patience bar is nearly empty.
  const low = state.orders.some((o) => o.patience < 6 && o.patience > 0);
  const sec = Math.floor(state.elapsed * 2);
  if (low && sec !== state.lastTickSecond) {
    state.lastTickSecond = sec;
    if (sfx) sfx.tick();
  }

  // New orders on a schedule, faster during rush hour.
  state.orderTimer -= dt;
  if (state.orderTimer <= 0 && state.orders.length < TUNING.maxOrders) {
    state.orders.push(makeOrder(state.rng, state.elapsed, state.rush));
    state.orderTimer = state.rush ? TUNING.rushOrderGapSeconds : TUNING.orderGapSeconds;
    if (sfx) sfx.bell();
  } else if (state.orderTimer <= 0) {
    state.orderTimer = 4; // board full: check again soon
  }

  if (state.timeLeft <= 0) endDay(state);
}

// Particles, floats, banner and flash decay — runs in every screen.
export function updateFx(state, dt) {
  state.animTime += dt;
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 20 * dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floats.length - 1; i >= 0; i--) {
    const f = state.floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) state.floats.splice(i, 1);
  }
  if (state.banner) {
    state.banner.life -= dt;
    if (state.banner.life <= 0) state.banner = null;
  }
  if (state.burnFlash > 0) state.burnFlash = Math.max(0, state.burnFlash - dt * 2.2);
  if (state.perfectFlash > 0) state.perfectFlash = Math.max(0, state.perfectFlash - dt * 1.1);
  if (state.chopHint > 0) state.chopHint = Math.max(0, state.chopHint - dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);
}

export function unlockedRecipes(elapsed) {
  return RECIPES.filter((r) => r.unlockAt <= elapsed);
}

export function starsForCoins(coins) {
  return coins >= TUNING.stars[2] ? 3 : coins >= TUNING.stars[1] ? 2 : coins >= TUNING.stars[0] ? 1 : 0;
}

export { recipeById };
