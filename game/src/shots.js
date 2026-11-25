// Warung Kilat — deterministic screenshot states for ?shot=.
// Each state is built from a fixed seed so the same URL always renders the
// same frame, with no user input. These states are only for screenshots;
// normal play (no ?shot=) starts at the title screen.

import { TUNING, recipeById } from './config.js';
import { createState, startDay, endDay, makeOrder, mulberry32 } from './state.js';

function baseState() {
  const state = createState();
  state.rng = mulberry32(137); // fixed seed: same orders every render
  state.animTime = 3.2; // frozen mid-animation so steam/particles read well
  return state;
}

function orderWith(state, recipeId, patienceFrac) {
  const recipe = recipeById(recipeId);
  const order = {
    id: state.orders.length + 1,
    recipeId: recipe.id,
    name: recipe.name,
    short: recipe.short,
    value: recipe.value,
    steps: [...recipe.steps],
    patienceMax: TUNING.patienceSeconds,
    patience: TUNING.patienceSeconds * patienceFrac,
    born: 0,
  };
  state.orders.push(order);
  return order;
}

export function buildShotState(shot) {
  const state = baseState();

  if (shot === 'start') {
    startDay(state);
    state.elapsed = 0;
    state.timeLeft = 180;
    state.screen = 'title'; // title over the kitchen, first orders posted
    return state;
  }

  if (shot === 'play') {
    startDay(state);
    state.screen = 'play';
    state.elapsed = 85;
    state.timeLeft = 95;
    state.orders = [];
    orderWith(state, 'nasi', 0.62);
    orderWith(state, 'mie', 0.45);
    // One dish mid-assembly on the plating counter: rice + chopped shallot.
    state.plate = ['rice', 'shallotChopped'];
    // A finished plate waits at the serving window: draw it via the cook.
    state.carrying = { plate: true, recipeId: 'mie' };
    state.cook.x = 730;
    state.cook.y = 600;
    state.cook.dir = 1;
    // Something sizzling on the wok and something chopping.
    state.wok = { item: 'egg', heat: 0.6 };
    state.board = { item: 'chilliChopped', raw: 'chilli', progress: 0.55, needle: 0.5, needleDir: 1, done: false, perfect: false };
    state.coins = 86;
    state.combo = 2;
    state.served = 3;
    return state;
  }

  if (shot === 'rush') {
    startDay(state);
    state.screen = 'play';
    state.elapsed = 130;
    state.timeLeft = 50;
    state.rush = true;
    state.orders = [];
    orderWith(state, 'nasi', 0.22);
    orderWith(state, 'sate', 0.15);
    orderWith(state, 'esteh', 0.28);
    state.wok = { item: 'noodles', heat: 0.7 };
    state.grill = { item: 'chicken', heat: 0.55 };
    state.cook.x = 380;
    state.cook.y = 430;
    state.coins = 214;
    state.combo = 4;
    state.served = 8;
    state.banner = { text: 'RUSH HOUR!', sub: 'Pesanan makin cepat — tetap tenang, bro!', life: 2.6 };
    return state;
  }

  if (shot === 'end') {
    startDay(state);
    state.elapsed = 180;
    state.timeLeft = 0;
    endDay(state);
    state.result = { coins: 342, served: 9, bestCombo: 5, perfectChops: 4, burnt: 1, stars: 3 };
    return state;
  }

  return null;
}
