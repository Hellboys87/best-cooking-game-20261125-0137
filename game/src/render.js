// Warung Kilat — all canvas drawing: kitchen, stations, cook, food,
// order board, HUD, particles, banners and the title / results screens.

import { CANVAS_W, CANVAS_H, DAY_LENGTH, TUNING, ITEMS, RECIPES, STATIONS, PANTRY_BINS, PALETTE, recipeById } from './config.js';
import { unlockedRecipes } from './state.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg || 'rgba(0,0,0,0.35)';
  ctx.fill();
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

// Draw one ingredient as a distinct colour + shape so it reads at a glance.
export function drawIngredient(ctx, itemId, x, y, size) {
  const item = ITEMS[itemId];
  if (!item) return;
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = item.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  switch (item.shape) {
    case 'noodles': {
      ctx.lineWidth = 3;
      ctx.strokeStyle = item.color;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(0, i * s * 0.14, s * 0.32, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      break;
    }
    case 'drumstick': {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.34, s * 0.26, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath();
      ctx.arc(s * 0.32, -s * 0.28, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bulb': {
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.22);
      ctx.lineTo(s * 0.12, -s * 0.48);
      ctx.lineTo(-s * 0.08, -s * 0.46);
      ctx.closePath();
      ctx.fillStyle = '#7ed07e';
      ctx.fill();
      break;
    }
    case 'chilli': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, -s * 0.1);
      ctx.quadraticCurveTo(0, s * 0.5, s * 0.36, -s * 0.3);
      ctx.quadraticCurveTo(0, s * 0.08, -s * 0.36, -s * 0.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2f7d32';
      ctx.fillRect(s * 0.22, -s * 0.42, s * 0.16, s * 0.12);
      break;
    }
    case 'leaf': {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.36, s * 0.22, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'egg': {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.3, s * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bag': {
      roundRect(ctx, -s * 0.26, -s * 0.3, s * 0.52, s * 0.6, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.lineTo(0, -s * 0.5);
      ctx.stroke();
      break;
    }
    case 'bottle': {
      roundRect(ctx, -s * 0.16, -s * 0.1, s * 0.32, s * 0.44, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-s * 0.1, -s * 0.42, s * 0.2, s * 0.34);
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(-s * 0.16, s * 0.02, s * 0.32, s * 0.16);
      break;
    }
    case 'cube': {
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-s * 0.24, -s * 0.24, s * 0.48, s * 0.48);
      ctx.strokeRect(-s * 0.24, -s * 0.24, s * 0.48, s * 0.48);
      ctx.restore();
      break;
    }
    case 'rice': {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.12, s * 0.4, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e8dcc0';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * s * 0.18, -s * 0.08, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'chopped': {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.save();
        ctx.translate(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.14);
        ctx.rotate(a);
        ctx.fillRect(-s * 0.14, -s * 0.05, s * 0.28, s * 0.1);
        ctx.restore();
      }
      break;
    }
    case 'friedEgg': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'skewer': {
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(s * 0.45, 0);
      ctx.stroke();
      ctx.fillStyle = item.color;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * s * 0.26, 0, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'cup': {
      ctx.fillStyle = '#e8e0c8';
      roundRect(ctx, -s * 0.28, -s * 0.2, s * 0.56, s * 0.5, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.fillRect(-s * 0.2, -s * 0.12, s * 0.4, s * 0.2);
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 0.18);
      ctx.lineTo(s * 0.18, s * 0.18);
      ctx.moveTo(s * 0.18, -s * 0.18);
      ctx.lineTo(-s * 0.18, s * 0.18);
      ctx.stroke();
      break;
    }
    case 'plate': {
      ctx.fillStyle = '#f5f0e6';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#c96f3f';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.32, s * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }
  ctx.restore();
}

function drawStation(ctx, st, state) {
  const near = state.nearStation && state.nearStation.id === st.id;
  ctx.save();
  if (near) {
    ctx.shadowColor = '#ffd23f';
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.fillStyle = PALETTE.counter;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Wooden front edge.
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, st.x, st.y + st.h - 22, st.w, 22, 10);
  ctx.fill();
  text(ctx, st.label, st.x + st.w / 2, st.y + st.h - 11, 13, '#ffe9b0', 'center', 'bold');
  ctx.restore();

  if (st.id === 'pantry') {
    for (const bin of PANTRY_BINS) {
      const bx = st.x + 8 + bin.col * 39;
      const by = st.y + 8 + bin.row * 44;
      roundRect(ctx, bx, by, 35, 40, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      drawIngredient(ctx, bin.item, bx + 17, by + 20, 26);
    }
  }
  if (st.id === 'board') {
    // Chopping board surface.
    roundRect(ctx, st.x + 18, st.y + 12, st.w - 36, st.h - 44, 8);
    ctx.fillStyle = '#e8dcc0';
    ctx.fill();
    ctx.strokeStyle = '#b09a6a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.board) {
      const b = state.board;
      drawIngredient(ctx, b.done ? b.item : b.raw, st.x + st.w / 2, st.y + 42, 44);
      if (!b.done) {
        // Progress ring with the timing sweet-spot band.
        const cx = st.x + st.w / 2;
        const cy = st.y + 42;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + b.progress * Math.PI * 2);
        ctx.strokeStyle = '#57ab5a';
        ctx.stroke();
        // Needle: release E while it is inside the yellow band for PERFECT.
        const na = -Math.PI / 2 + b.needle * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, -Math.PI / 2 + TUNING.chopSweetLow * Math.PI * 2, -Math.PI / 2 + TUNING.chopSweetHigh * Math.PI * 2);
        ctx.strokeStyle = '#ffd23f';
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.strokeStyle = '#d64541';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(na) * 34, cy + Math.sin(na) * 34);
        ctx.stroke();
        text(ctx, 'TAHAN E — lepas di kuning!', cx, st.y + 94, 11, '#5d4037');
      } else {
        text(ctx, b.perfect ? 'PERFECT!' : 'Siap diambil', st.x + st.w / 2, st.y + 86, 12, b.perfect ? '#2f7d32' : '#5d4037');
      }
    } else {
      text(ctx, 'Taruh bahan di sini', st.x + st.w / 2, st.y + 40, 12, '#8a7a5a');
      text(ctx, 'lalu tahan E untuk iris', st.x + st.w / 2, st.y + 58, 11, '#8a7a5a');
    }
    // First-chop hint: a short-lived label just below the board, shown only
    // the first time the player puts something on the board to chop.
    if (state.chopHint > 0 && state.board && !state.board.done) {
      const hx = st.x + st.w / 2;
      const hy = st.y + st.h + 18;
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.chopHint);
      roundRect(ctx, hx - 150, hy - 15, 300, 30, 15);
      ctx.fillStyle = 'rgba(20,12,8,0.88)';
      ctx.fill();
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, 'Lepas E di zona kuning = PERFECT!', hx, hy + 1, 13, '#ffd23f');
      ctx.restore();
    }
  }
  if (st.id === 'stove') {
    drawCookSlot(ctx, state, 'wok', st.x + st.w * 0.25, st.y + 46);
    drawCookSlot(ctx, state, 'grill', st.x + st.w * 0.75, st.y + 46);
    text(ctx, 'WOK', st.x + st.w * 0.25, st.y + 92, 11, '#ffe9b0');
    text(ctx, 'PANGGANG', st.x + st.w * 0.75, st.y + 92, 11, '#ffe9b0');
  }
  if (st.id === 'rice') {
    ctx.fillStyle = '#cfd8dc';
    roundRect(ctx, st.x + 30, st.y + 18, st.w - 60, 52, 10);
    ctx.fill();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.ellipse(st.x + st.w / 2, st.y + 18, (st.w - 60) / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Steam wisps.
    const t = state.animTime;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const sx = st.x + st.w / 2 - 24 + i * 24;
      const sy = st.y + 8 - ((t * 14 + i * 9) % 18);
      ctx.beginPath();
      ctx.moveTo(sx, sy + 8);
      ctx.quadraticCurveTo(sx + 5, sy + 2, sx - 3, sy - 4);
      ctx.stroke();
    }
    drawIngredient(ctx, 'rice', st.x + st.w / 2, st.y + 48, 40);
  }
  if (st.id === 'fridge') {
    roundRect(ctx, st.x + 24, st.y + 10, st.w - 48, st.h - 40, 8);
    ctx.fillStyle = '#bfe8ff';
    ctx.fill();
    ctx.strokeStyle = '#5d8a99';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#5d8a99';
    ctx.beginPath();
    ctx.moveTo(st.x + 24, st.y + 44);
    ctx.lineTo(st.x + st.w - 24, st.y + 44);
    ctx.stroke();
    drawIngredient(ctx, 'ice', st.x + st.w / 2, st.y + 62, 34);
  }
  if (st.id === 'plating') {
    // The plate on the counter with its components so far.
    const px = st.x + 120;
    const py = st.y + 52;
    ctx.fillStyle = '#f5f0e6';
    ctx.beginPath();
    ctx.ellipse(px, py, 92, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c96f3f';
    ctx.lineWidth = 3;
    ctx.stroke();
    state.plate.forEach((item, i) => {
      drawIngredient(ctx, item, px - 56 + i * 38, py - 6, 30);
    });
    if (state.plate.length === 0) text(ctx, 'Piring kosong', px, py, 12, '#8a7a5a');
  }
  if (st.id === 'window') {
    ctx.fillStyle = '#3b2f2f';
    roundRect(ctx, st.x + 14, st.y + 10, st.w - 28, 52, 8);
    ctx.fill();
    text(ctx, 'SERAHKAN DI SINI', st.x + st.w / 2, st.y + 36, 13, '#ffd23f');
    const done = state.carrying && typeof state.carrying === 'object' && state.carrying.plate;
    if (done) {
      drawIngredient(ctx, 'plate', st.x + st.w / 2, st.y + 66, 44);
      text(ctx, 'Siap disajikan!', st.x + st.w / 2, st.y + 96, 11, '#ffe9b0');
    } else {
      text(ctx, 'Bawa piring jadi', st.x + st.w / 2, st.y + 84, 12, '#d7ccc8');
    }
  }
  if (st.id === 'bin') {
    ctx.fillStyle = '#546e7a';
    roundRect(ctx, st.x + 28, st.y + 16, st.w - 56, st.h - 48, 8);
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#37474f';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(st.x + 44 + i * 16, st.y + 28);
      ctx.lineTo(st.x + 44 + i * 16, st.y + st.h - 44);
      ctx.stroke();
    }
  }
}

function drawCookSlot(ctx, state, slot, cx, cy) {
  const job = state[slot];
  // Burner ring.
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = job ? '#37474f' : '#263238';
  ctx.fill();
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (job) {
    const hot = job.heat < TUNING.heatBurn;
    drawIngredient(ctx, job.burnt ? 'burnt' : job.item, cx, cy - 4, 40);
    // Heat bar with the green zone.
    const bx = cx - 34;
    const by = cy + 26;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(bx, by, 68, 9);
    ctx.fillStyle = '#57ab5a';
    ctx.fillRect(bx + 68 * TUNING.heatGreenLow, by, 68 * (TUNING.heatGreenHigh - TUNING.heatGreenLow), 9);
    ctx.fillStyle = job.burnt ? '#1c1c1c' : job.heat >= TUNING.heatGreenLow && job.heat <= TUNING.heatGreenHigh ? '#ffd23f' : '#ff7043';
    ctx.fillRect(bx, by, 68 * Math.min(1, job.heat), 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 68, 9);
    if (job.burnt) text(ctx, 'GOSONG', cx, cy - 40, 12, '#ff5252');
  } else {
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCook(ctx, state) {
  const c = state.cook;
  const bob = c.moving ? Math.sin(c.walkBob) * 3 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white cook shirt + apron.
  ctx.fillStyle = '#f5f0e6';
  roundRect(ctx, -16, -6, 32, 34, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#c96f3f';
  roundRect(ctx, -11, 6, 22, 20, 6);
  ctx.fill();
  // Head + chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(0, -18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -28, 8, 0, Math.PI * 2);
  ctx.arc(6, -28, 8, 0, Math.PI * 2);
  ctx.arc(0, -32, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Eyes look in the walking direction.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(c.dir * 3 - 4, -18, 1.8, 0, Math.PI * 2);
  ctx.arc(c.dir * 3 + 4, -18, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried item above the head.
  if (state.carrying) {
    const itemId = typeof state.carrying === 'string' ? state.carrying : 'plate';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(0, -52, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
    drawIngredient(ctx, itemId, 0, -52, 26);
    if (typeof state.carrying === 'object' && state.carrying.plate) {
      const recipe = recipeById(state.carrying.recipeId);
      text(ctx, recipe.short, 0, -74, 11, '#ffffff');
    }
  }
  ctx.restore();
}

function drawOrderBoard(ctx, state) {
  roundRect(ctx, 16, 8, CANVAS_W - 32, 112, 14);
  ctx.fillStyle = PALETTE.boardBg;
  ctx.fill();
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'PESANAN', 96, 30, 18, '#ffd23f', 'left');
  text(ctx, 'WARUNG KILAT', 96, 52, 11, '#d7ccc8', 'left');
  // Menu today, tucked into the free corner under the title (two short lines).
  const unlocked = unlockedRecipes(state.elapsed);
  const locked = RECIPES.filter((r) => r.unlockAt > state.elapsed);
  const shorts = unlocked.map((r) => r.short);
  text(ctx, shorts.slice(0, 2).join('  •  '), 36, 76, 11, '#ffe9b0', 'left');
  if (shorts.length > 2) {
    text(ctx, shorts.slice(2).join('  •  '), 36, 92, 11, '#ffe9b0', 'left');
  } else if (locked.length > 0) {
    const next = locked[0];
    const at = Math.max(0, next.unlockAt - Math.floor(state.elapsed));
    text(ctx, `${next.short} buka ${at} dtk lagi`, 36, 92, 10, '#bcaaa4', 'left');
  }
  // Order tickets.
  for (let i = 0; i < 3; i++) {
    const tx = 200 + i * 300;
    const ty = 20;
    const tw = 280;
    const th = 88;
    const order = state.orders[i];
    roundRect(ctx, tx, ty, tw, th, 10);
    ctx.fillStyle = order ? PALETTE.ticket : 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = order ? '#d7ccc8' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!order) {
      text(ctx, '— kosong —', tx + tw / 2, ty + th / 2, 13, '#8d6e63');
      continue;
    }
    const frac = Math.max(0, order.patience / order.patienceMax);
    const urgent = frac < 0.3;
    text(ctx, order.name, tx + 12, ty + 18, 15, PALETTE.ink, 'left');
    text(ctx, `${order.value} koin`, tx + tw - 12, ty + 18, 13, '#8a5a2b', 'right');
    order.steps.forEach((step, j) => {
      drawIngredient(ctx, step, tx + 26 + j * 44, ty + 48, 30);
    });
    // Patience bar.
    bar(ctx, tx + 12, ty + 72, tw - 24, 10, frac, urgent ? '#d64541' : frac < 0.55 ? '#ff9f43' : '#57ab5a');
    if (urgent && Math.floor(state.animTime * 3) % 2 === 0) {
      text(ctx, 'CEPAT!', tx + tw - 12, ty + 44, 12, '#d64541', 'right');
    }
  }
}

function drawHud(ctx, state) {
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  const timeText = `${mins}:${String(secs).padStart(2, '0')}`;
  // Timer pill.
  roundRect(ctx, CANVAS_W / 2 - 90, 128, 180, 44, 22);
  ctx.fillStyle = state.rush ? '#d64541' : '#3b2f2f';
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, `⏱ ${timeText}`, CANVAS_W / 2, 150, 24, '#ffffff');
  // Coins + combo.
  roundRect(ctx, 36, 128, 220, 44, 22);
  ctx.fillStyle = '#3b2f2f';
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
  text(ctx, `🪙 ${state.coins}`, 60, 150, 22, '#f2c94c', 'left');
  if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, 240, 150, 16, '#ff9f43', 'right');
  // Rush badge.
  if (state.rush) {
    roundRect(ctx, CANVAS_W - 272, 128, 236, 44, 22);
    ctx.fillStyle = '#d64541';
    ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.stroke();
    text(ctx, '🔥 RUSH HOUR', CANVAS_W - 154, 150, 20, '#ffffff');
  }
  // Controls hint — on a dark pill with padding, so it never crowds the
  // bottom edge of the frame.
  roundRect(ctx, 140, 766, CANVAS_W - 280, 26, 13);
  ctx.fillStyle = 'rgba(20,12,8,0.62)';
  ctx.fill();
  text(ctx, 'WASD/←↑→↓ gerak  •  E pakai/ambil  •  Klik stasiun untuk jalan ke sana  •  P jeda  •  M suara  •  R ulang', CANVAS_W / 2, 779, 12, 'rgba(255,255,255,0.9)');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,8,0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '🍜 WARUNG KILAT 🍜', CANVAS_W / 2, 250, 64, '#ffd23f');
  text(ctx, 'Masak cepat, sajikan hangat — jangan sampai pelanggan kabur!', CANVAS_W / 2, 310, 22, '#ffffff');
  text(ctx, 'Ambil bahan di pantry, iris di talenan, goreng di wok, panggang di kompor,', CANVAS_W / 2, 352, 18, '#ffe9b0');
  text(ctx, 'rangkai di meja saji sesuai urutan resep, lalu serahkan di jendela.', CANVAS_W / 2, 380, 18, '#ffe9b0');
  // Recipe cards.
  RECIPES.forEach((r, i) => {
    const cx = CANVAS_W / 2 - 420 + i * 220;
    roundRect(ctx, cx - 100, 420, 200, 120, 12);
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.fill();
    text(ctx, r.name, cx, 446, 15, PALETTE.ink);
    r.steps.forEach((s, j) => drawIngredient(ctx, s, cx - 60 + j * 40, 480, 28));
    text(ctx, `${r.value} koin`, cx, 516, 13, '#8a5a2b');
    if (r.unlockAt > 0) text(ctx, `buka di ${r.unlockAt} dtk`, cx, 532, 11, '#bcaaa4');
  });
  const pulse = 0.7 + 0.3 * Math.sin(state.animTime * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan E atau klik untuk mulai memasak!', CANVAS_W / 2, 600, 24, '#ffffff');
  ctx.globalAlpha = 1;
  text(ctx, '180 detik • 4 resep • combo = bonus koin', CANVAS_W / 2, 640, 15, '#ffd23f');
}

function drawEnd(ctx, state) {
  // Fully opaque backdrop: nothing from the kitchen (cook sprite included)
  // may show through the results screen.
  ctx.fillStyle = '#17100a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const r = state.result;
  text(ctx, 'HARI SELESAI!', CANVAS_W / 2, 190, 56, '#ffd23f');
  // Stars.
  for (let i = 0; i < 3; i++) {
    const sx = CANVAS_W / 2 - 110 + i * 110;
    const lit = i < r.stars;
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = lit ? '#ffd23f' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', sx, 270);
  }
  const rows = [
    ['Koin didapat', `${r.coins}`],
    ['Hidangan disajikan', `${r.served}`],
    ['Combo terbaik', `x${r.bestCombo}`],
    ['Perfect chop', `${r.perfectChops}`],
    ['Makanan gosong', `${r.burnt}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 350 + i * 44;
    text(ctx, label, CANVAS_W / 2 - 160, y, 20, '#ffe9b0', 'left');
    text(ctx, value, CANVAS_W / 2 + 160, y, 20, '#ffffff', 'right');
  });
  const verdict = r.stars === 3 ? 'Warungmu legendaris, bro! 🏆' : r.stars === 2 ? 'Mantap! Pelanggan pulang kenyang.' : r.stars === 1 ? 'Lumayan — besok masak lebih cepat lagi.' : 'Hari yang berat... coba lagi, bro!';
  text(ctx, verdict, CANVAS_W / 2, 600, 22, '#ffffff');
  const pulse = 0.7 + 0.3 * Math.sin(state.animTime * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan R untuk main lagi', CANVAS_W / 2, 650, 22, '#ffd23f');
  ctx.globalAlpha = 1;
}

export function render(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    const mag = state.shake * 8;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  // Floor: teal checker tiles.
  const tile = 64;
  for (let ty = 0; ty < CANVAS_H / tile; ty++) {
    for (let tx = 0; tx < CANVAS_W / tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  // Wall strip behind the top stations.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 126, CANVAS_W, 16);
  ctx.fillStyle = PALETTE.terracotta;
  ctx.fillRect(0, 140, CANVAS_W, 4);

  drawOrderBoard(ctx, state);
  for (const st of STATIONS) drawStation(ctx, st, state);
  drawCook(ctx, state);

  // Particles.
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Floating texts.
  for (const f of state.floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 18, f.color);
    ctx.globalAlpha = 1;
  }
  // Move-target marker.
  if (state.moveTarget) {
    ctx.strokeStyle = 'rgba(255,210,63,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.moveTarget.x, state.moveTarget.y, 10 + Math.sin(state.animTime * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Near-station hint.
  if (state.nearStation && state.screen === 'play' && !state.paused) {
    text(ctx, `E — ${state.nearStation.label}`, state.cook.x, state.cook.y - 88, 13, '#ffffff');
  }

  drawHud(ctx, state);

  // Perfect-chop flash: a big gold badge over the board, unmistakable.
  if (state.perfectFlash > 0) {
    const st = STATIONS.find((s) => s.id === 'board');
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2;
    const a = Math.min(1, state.perfectFlash);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 52 + (1 - a) * 70, 0, Math.PI * 2);
    ctx.stroke();
    roundRect(ctx, cx - 128, cy - 28, 256, 56, 16);
    ctx.fillStyle = 'rgba(20,12,8,0.92)';
    ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, `PERFECT! +${TUNING.perfectChopBonus}`, cx, cy + 1, 28, '#ffd23f');
    ctx.restore();
  }

  // Banner (rush hour, unlocks) — large and solid so it reads at a glance
  // even in a shrunken screenshot.
  if (state.banner) {
    ctx.globalAlpha = Math.min(1, state.banner.life);
    roundRect(ctx, CANVAS_W / 2 - 360, 224, 720, 118, 18);
    ctx.fillStyle = '#d64541';
    ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 5;
    ctx.stroke();
    text(ctx, state.banner.text, CANVAS_W / 2, 264, 46, '#ffffff');
    text(ctx, state.banner.sub, CANVAS_W / 2, 310, 19, '#ffe9b0');
    ctx.globalAlpha = 1;
  }

  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'end') drawEnd(ctx, state);
  if (state.paused && state.screen === 'play') {
    ctx.fillStyle = 'rgba(20,12,8,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, 'JEDA — tekan P untuk lanjut', CANVAS_W / 2, CANVAS_H / 2, 32, '#ffffff');
  }
  // Burn flash.
  if (state.burnFlash > 0) {
    ctx.fillStyle = `rgba(214,69,65,${state.burnFlash * 0.25})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  ctx.restore();
}
