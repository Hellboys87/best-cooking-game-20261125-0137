// Warung Kilat — configuration: recipes, stations, tuning and colours.
// Everything the rest of the game needs to know lives here so the other
// modules stay small and focused.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const DAY_LENGTH = 180; // seconds in one working day
export const RUSH_AT = 60; // seconds left when rush hour starts
export const UNLOCK_THIRD_AT = 60; // seconds elapsed when Sate unlocks
export const UNLOCK_FOURTH_AT = 120; // seconds elapsed when Es Teh unlocks

export const TUNING = {
  cookSpeed: 260, // pixels per second
  chopSeconds: 2.2, // hold-to-chop time
  wokSeconds: 5.0, // heat 0 -> 1 on the wok
  grillSeconds: 6.0, // heat 0 -> 1 on the grill
  heatGreenLow: 0.45, // wok/grill green zone start
  heatGreenHigh: 0.78, // wok/grill green zone end
  heatBurn: 0.92, // past this the food burns
  patienceSeconds: 48, // base order patience
  rushPatienceSeconds: 32,
  orderGapSeconds: 22, // gap between new orders
  rushOrderGapSeconds: 13,
  maxOrders: 3,
  tipPerPatience: 12, // max tip coins for a full patience bar
  perfectChopBonus: 5,
  comboStep: 0.25, // +25% per combo level, capped below
  comboCap: 2.0,
  stars: [60, 180, 320], // coins for 1, 2, 3 stars
};

// Every carryable thing in the kitchen. `shape` picks how render draws it,
// `color` is its main fill, `from` tells the player where it comes from.
export const ITEMS = {
  noodles: { name: 'Mie Mentah', color: '#f2c94c', shape: 'noodles', hint: 'Pantry' },
  chicken: { name: 'Ayam Mentah', color: '#f2998a', shape: 'drumstick', hint: 'Pantry' },
  shallot: { name: 'Bawang', color: '#d98bb0', shape: 'bulb', hint: 'Pantry' },
  chilli: { name: 'Cabai', color: '#e5484d', shape: 'chilli', hint: 'Pantry' },
  veg: { name: 'Sayur', color: '#57ab5a', shape: 'leaf', hint: 'Pantry' },
  egg: { name: 'Telur', color: '#f7ead1', shape: 'egg', hint: 'Pantry' },
  teabag: { name: 'Teh Celup', color: '#8a5a2b', shape: 'bag', hint: 'Pantry' },
  soy: { name: 'Kecap Manis', color: '#4a2c14', shape: 'bottle', hint: 'Pantry' },
  peanut: { name: 'Saus Kacang', color: '#c98a3d', shape: 'bottle', hint: 'Pantry' },
  sugar: { name: 'Gula', color: '#ffffff', shape: 'cube', hint: 'Pantry' },
  rice: { name: 'Nasi', color: '#fff8e7', shape: 'rice', hint: 'Rice Cooker' },
  ice: { name: 'Es Batu', color: '#bfe8ff', shape: 'cube', hint: 'Fridge' },
  shallotChopped: { name: 'Bawang Iris', color: '#e8a7c3', shape: 'chopped', hint: 'Chopping' },
  chilliChopped: { name: 'Cabai Iris', color: '#ff6b5e', shape: 'chopped', hint: 'Chopping' },
  vegChopped: { name: 'Sayur Iris', color: '#7ed07e', shape: 'chopped', hint: 'Chopping' },
  eggFried: { name: 'Telur Goreng', color: '#ffd23f', shape: 'friedEgg', hint: 'Wok' },
  noodlesCooked: { name: 'Mie Goreng', color: '#e8a13a', shape: 'noodles', hint: 'Wok' },
  chickenGrilled: { name: 'Sate Bakar', color: '#a35a2a', shape: 'skewer', hint: 'Grill' },
  tea: { name: 'Teh Hangat', color: '#b06a2e', shape: 'cup', hint: 'Grill' },
  burnt: { name: 'Gosong!', color: '#1c1c1c', shape: 'burnt', hint: 'Bin it!' },
  plate: { name: 'Piring Saji', color: '#f5f0e6', shape: 'plate', hint: 'Serve it' },
};

// What each raw item becomes, and where it is transformed.
export const CHOP_MAP = { shallot: 'shallotChopped', chilli: 'chilliChopped', veg: 'vegChopped' };
export const WOK_MAP = { egg: 'eggFried', noodles: 'noodlesCooked' };
export const GRILL_MAP = { chicken: 'chickenGrilled', teabag: 'tea' };

// The four dishes of the warung. `steps` must be added to the plate in order.
export const RECIPES = [
  {
    id: 'nasi',
    name: 'Nasi Goreng Kilat',
    short: 'Nasi Goreng',
    value: 45,
    unlockAt: 0,
    steps: ['rice', 'shallotChopped', 'eggFried', 'soy'],
  },
  {
    id: 'mie',
    name: 'Mie Goreng Pedas',
    short: 'Mie Goreng',
    value: 40,
    unlockAt: 0,
    steps: ['noodlesCooked', 'chilliChopped', 'vegChopped'],
  },
  {
    id: 'sate',
    name: 'Sate Ayam Bakar',
    short: 'Sate Ayam',
    value: 55,
    unlockAt: UNLOCK_THIRD_AT,
    steps: ['chickenGrilled', 'peanut'],
  },
  {
    id: 'esteh',
    name: 'Es Teh Manis',
    short: 'Es Teh',
    value: 30,
    unlockAt: UNLOCK_FOURTH_AT,
    steps: ['tea', 'ice', 'sugar'],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Kitchen stations. `kind` drives the interaction in cooking.js.
// Pantry bins are laid out inside the pantry rectangle.
export const STATIONS = [
  { id: 'pantry', kind: 'pantry', label: 'PANTRY', x: 36, y: 150, w: 210, h: 120 },
  { id: 'board', kind: 'board', label: 'TALENAN', x: 270, y: 150, w: 170, h: 120 },
  { id: 'stove', kind: 'stove', label: 'KOMPOR + WOK', x: 464, y: 150, w: 220, h: 120 },
  { id: 'rice', kind: 'rice', label: 'RICE COOKER', x: 708, y: 150, w: 150, h: 120 },
  { id: 'fridge', kind: 'fridge', label: 'KULKAS', x: 882, y: 150, w: 150, h: 120 },
  { id: 'plating', kind: 'plating', label: 'MEJA SAJI', x: 36, y: 640, w: 520, h: 120 },
  { id: 'window', kind: 'window', label: 'JENDELA SAJI', x: 600, y: 640, w: 260, h: 120 },
  { id: 'bin', kind: 'bin', label: 'TEMPAT SAMPAH', x: 900, y: 640, w: 120, h: 120 },
];

export const PANTRY_BINS = [
  { item: 'noodles', col: 0, row: 0 },
  { item: 'chicken', col: 1, row: 0 },
  { item: 'shallot', col: 2, row: 0 },
  { item: 'chilli', col: 3, row: 0 },
  { item: 'veg', col: 4, row: 0 },
  { item: 'egg', col: 0, row: 1 },
  { item: 'teabag', col: 1, row: 1 },
  { item: 'soy', col: 2, row: 1 },
  { item: 'peanut', col: 3, row: 1 },
  { item: 'sugar', col: 4, row: 1 },
];

export const PALETTE = {
  floorA: '#2e8b8b',
  floorB: '#2a7f7f',
  wall: '#f7e8c9',
  wood: '#8a5a2b',
  woodDark: '#6e451f',
  counter: '#a9713d',
  terracotta: '#c96f3f',
  cream: '#fff6e0',
  ink: '#2b2118',
  red: '#d64541',
  gold: '#f2c94c',
  green: '#57ab5a',
  boardBg: '#3b2f2f',
  ticket: '#fff8e7',
};
