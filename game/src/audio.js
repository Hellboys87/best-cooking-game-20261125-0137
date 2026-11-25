// Warung Kilat — all sound is synthesized with the Web Audio API.
// No audio files: a cheerful chiptune loop plus short effect blips.

const MELODY = [
  // [midi note, beats] — a bouncy pentatonic-ish street tune
  [72, 1], [76, 1], [79, 1], [76, 1], [81, 2], [79, 1], [76, 1],
  [74, 1], [76, 1], [77, 2], [76, 1], [74, 1], [72, 2], [0, 1],
  [72, 1], [76, 1], [79, 1], [81, 1], [84, 2], [81, 1], [79, 1],
  [76, 1], [77, 1], [79, 2], [76, 1], [74, 1], [72, 2], [0, 1],
];
const BASS = [48, 0, 55, 0, 53, 0, 55, 0, 48, 0, 55, 0, 57, 0, 55, 0];

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this.nextNoteTime = 0;
    this.noteIndex = 0;
    this.bassIndex = 0;
    this.tempo = 132; // beats per minute, raised during rush hour
    this.rush = false;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
  }

  // Must be called from a user gesture at least once.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.master);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  setRush(rush) {
    this.rush = rush;
    this.tempo = rush ? 168 : 132;
  }

  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.noteIndex = 0;
    this.bassIndex = 0;
    this.scheduleLoop();
  }

  scheduleLoop() {
    if (!this.ctx || !this.musicOn) return;
    const beat = 60 / this.tempo;
    while (this.nextNoteTime < this.ctx.currentTime + 0.35) {
      const [note, len] = MELODY[this.noteIndex % MELODY.length];
      if (note > 0) this.pluck(midiToFreq(note), this.nextNoteTime, len * beat * 0.9, 'square', 0.5);
      const bassNote = BASS[this.bassIndex % BASS.length];
      if (bassNote > 0) this.pluck(midiToFreq(bassNote), this.nextNoteTime, beat * 0.9, 'triangle', 0.9);
      this.nextNoteTime += len * beat;
      this.noteIndex += 1;
      this.bassIndex += 1;
    }
    setTimeout(() => this.scheduleLoop(), 120);
  }

  pluck(freq, when, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  blip(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 3000;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.3;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
  }

  pickup() { this.blip(520, 0.08, 'sine', 0.35, 760); }
  place() { this.blip(340, 0.08, 'sine', 0.35, 260); }
  chop() { this.noise(0.07, 0.4, 1800); this.blip(180, 0.05, 'square', 0.15); }
  perfect() { this.blip(880, 0.1, 'sine', 0.4); setTimeout(() => this.blip(1320, 0.14, 'sine', 0.4), 70); }
  sizzle() { this.noise(0.5, 0.22, 5200); }
  ding() { this.blip(1046, 0.25, 'sine', 0.4); this.blip(1568, 0.3, 'sine', 0.25); }
  coin() {
    this.blip(988, 0.09, 'square', 0.22);
    setTimeout(() => this.blip(1319, 0.16, 'square', 0.22), 80);
  }
  burn() { this.blip(220, 0.35, 'sawtooth', 0.35, 90); this.noise(0.3, 0.25, 900); }
  buzz() { this.blip(140, 0.18, 'sawtooth', 0.3, 110); }
  tick() { this.blip(1200, 0.04, 'square', 0.18); }
  bell() { this.blip(1175, 0.3, 'sine', 0.4); setTimeout(() => this.blip(1568, 0.4, 'sine', 0.3), 120); }
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'square', 0.25), i * 110));
  }
}
