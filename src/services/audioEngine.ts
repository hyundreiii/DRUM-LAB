import { DrumKitId, DrumPadId } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
  private metronomeGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentKit: DrumKitId = 'acoustic';
  private customPadVolumes: Partial<Record<DrumPadId, number>> = {};
  private customPadPitches: Partial<Record<DrumPadId, number>> = {};

  // For open hi-hat choke
  private openHatNode: { gain: GainNode; stopTime: number } | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with autoplay policy
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.drumGain = this.ctx.createGain();
      this.drumGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.drumGain.connect(this.masterGain);

      this.metronomeGain = this.ctx.createGain();
      this.metronomeGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.metronomeGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setKit(kit: DrumKitId) {
    this.currentKit = kit;
  }

  public getKit(): DrumKitId {
    return this.currentKit;
  }

  public setMasterVolume(vol: number) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setDrumVolume(vol: number) {
    this.init();
    if (this.drumGain && this.ctx) {
      this.drumGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setMetronomeVolume(vol: number) {
    this.init();
    if (this.metronomeGain && this.ctx) {
      this.metronomeGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setPadCustomization(padId: DrumPadId, volume?: number, pitch?: number) {
    if (volume !== undefined) this.customPadVolumes[padId] = volume;
    if (pitch !== undefined) this.customPadPitches[padId] = pitch;
  }

  public playDrum(padId: DrumPadId, velocity: number = 1.0) {
    this.init();
    if (!this.ctx || !this.drumGain || this.isMuted) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const padVol = this.customPadVolumes[padId] ?? 1.0;
    const padPitch = this.customPadPitches[padId] ?? 0;
    const pitchMultiplier = Math.pow(2, padPitch / 12);
    const finalVelocity = Math.max(0.1, Math.min(1.5, velocity * padVol));

    // Mobile haptics
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (padId === 'kick') navigator.vibrate(28);
        else if (padId === 'snare') navigator.vibrate(18);
        else navigator.vibrate(10);
      } catch {
        // Ignored if device doesn't support or permission blocked
      }
    }

    // Hi-hat choking: hitting closed hi-hat chokes open hi-hat immediately
    if (padId === 'hihat_closed' && this.openHatNode) {
      try {
        this.openHatNode.gain.gain.cancelScheduledValues(now);
        this.openHatNode.gain.gain.setValueAtTime(this.openHatNode.gain.gain.value, now);
        this.openHatNode.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        this.openHatNode = null;
      } catch {
        // Node may have already ended
      }
    }

    switch (padId) {
      case 'kick':
        this.synthKick(now, finalVelocity, pitchMultiplier);
        break;
      case 'snare':
        this.synthSnare(now, finalVelocity, pitchMultiplier);
        break;
      case 'hihat_closed':
        this.synthHiHat(now, finalVelocity, pitchMultiplier, false);
        break;
      case 'hihat_open':
        this.synthHiHat(now, finalVelocity, pitchMultiplier, true);
        break;
      case 'crash':
        this.synthCrash(now, finalVelocity, pitchMultiplier, 1.0);
        break;
      case 'crash2':
        this.synthCrash(now, finalVelocity, pitchMultiplier * 1.25, 0.7);
        break;
      case 'ride':
        this.synthRide(now, finalVelocity, pitchMultiplier);
        break;
      case 'tom_high':
        this.synthTom(now, finalVelocity, 185 * pitchMultiplier, 120 * pitchMultiplier, 0.35);
        break;
      case 'tom_mid':
        this.synthTom(now, finalVelocity, 140 * pitchMultiplier, 90 * pitchMultiplier, 0.42);
        break;
      case 'tom_floor':
        this.synthTom(now, finalVelocity, 95 * pitchMultiplier, 55 * pitchMultiplier, 0.55);
        break;
      case 'cowbell':
        this.synthCowbell(now, finalVelocity, pitchMultiplier);
        break;
      case 'tambourine':
        this.synthTambourine(now, finalVelocity, pitchMultiplier);
        break;
    }
  }

  // Synthesis: KICK DRUM
  private synthKick(t: number, vel: number, pitchMult: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    let startFreq = 140 * pitchMult;
    let endFreq = 42 * pitchMult;
    let decay = 0.45;
    let clickGain = 0.8;
    let subGain = 1.0;

    if (this.currentKit === 'rock') {
      startFreq = 160 * pitchMult;
      endFreq = 46 * pitchMult;
      decay = 0.48;
      clickGain = 1.2;
      subGain = 1.2;
    } else if (this.currentKit === 'pop') {
      startFreq = 150 * pitchMult;
      endFreq = 48 * pitchMult;
      decay = 0.38;
      clickGain = 1.0;
    } else if (this.currentKit === 'electronic') {
      // 808 Style boomy sub drop
      startFreq = 180 * pitchMult;
      endFreq = 38 * pitchMult;
      decay = 0.85;
      clickGain = 0.6;
      subGain = 1.4;
    } else if (this.currentKit === 'metal') {
      // Razor-sharp click attack for fast double kick
      startFreq = 220 * pitchMult;
      endFreq = 52 * pitchMult;
      decay = 0.32;
      clickGain = 1.6;
      subGain = 1.1;
    } else if (this.currentKit === 'jazz') {
      startFreq = 110 * pitchMult;
      endFreq = 50 * pitchMult;
      decay = 0.5;
      clickGain = 0.4;
      subGain = 0.9;
    }

    const kickGain = ctx.createGain();
    kickGain.gain.setValueAtTime(vel * subGain, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    kickGain.connect(this.drumGain);

    // Main Tone Oscillator (Pitch Sweep)
    const osc = ctx.createOscillator();
    osc.type = this.currentKit === 'electronic' ? 'sine' : 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);

    // Sub-bass layer
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(startFreq * 0.75, t);
    subOsc.frequency.exponentialRampToValueAtTime(endFreq * 0.8, t + 0.07);

    // Transient Beater Click (Attack pop)
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1200 * pitchMult, t);
    clickOsc.frequency.exponentialRampToValueAtTime(80, t + 0.025);

    const clickGainNode = ctx.createGain();
    clickGainNode.gain.setValueAtTime(clickGain * vel * 0.8, t);
    clickGainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    clickOsc.connect(clickGainNode);
    clickGainNode.connect(kickGain);

    osc.connect(kickGain);
    subOsc.connect(kickGain);

    osc.start(t);
    subOsc.start(t);
    clickOsc.start(t);

    osc.stop(t + decay);
    subOsc.stop(t + decay);
    clickOsc.stop(t + 0.03);
  }

  // Synthesis: SNARE DRUM
  private synthSnare(t: number, vel: number, pitchMult: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    let bodyFreq = 185 * pitchMult;
    let noiseDecay = 0.25;
    let bodyDecay = 0.18;
    let noiseFilterFreq = 1800;
    let snapLevel = 1.0;

    if (this.currentKit === 'rock') {
      bodyFreq = 210 * pitchMult;
      noiseDecay = 0.32;
      bodyDecay = 0.22;
      noiseFilterFreq = 2400;
      snapLevel = 1.3;
    } else if (this.currentKit === 'pop') {
      bodyFreq = 200 * pitchMult;
      noiseDecay = 0.24;
      noiseFilterFreq = 3000;
      snapLevel = 1.1;
    } else if (this.currentKit === 'electronic') {
      bodyFreq = 170 * pitchMult;
      noiseDecay = 0.38;
      bodyDecay = 0.15;
      noiseFilterFreq = 2200;
      snapLevel = 1.4;
    } else if (this.currentKit === 'metal') {
      bodyFreq = 230 * pitchMult;
      noiseDecay = 0.28;
      bodyDecay = 0.16;
      noiseFilterFreq = 3500;
      snapLevel = 1.5;
    } else if (this.currentKit === 'jazz') {
      bodyFreq = 175 * pitchMult;
      noiseDecay = 0.2;
      bodyDecay = 0.25;
      noiseFilterFreq = 1500;
      snapLevel = 0.7;
    }

    // Drum Shell / Tone
    const toneOsc = ctx.createOscillator();
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(bodyFreq, t);
    toneOsc.frequency.exponentialRampToValueAtTime(bodyFreq * 0.6, t + bodyDecay);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(vel * 0.7, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + bodyDecay);
    toneOsc.connect(toneGain);
    toneGain.connect(this.drumGain);

    // Snare Wires Noise
    const bufferSize = ctx.sampleRate * noiseDecay;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(noiseFilterFreq, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.85 * snapLevel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDecay);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);

    toneOsc.start(t);
    whiteNoise.start(t);
    toneOsc.stop(t + bodyDecay);
    whiteNoise.stop(t + noiseDecay);
  }

  // Synthesis: HI-HAT (Closed & Open)
  private synthHiHat(t: number, vel: number, pitchMult: number, isOpen: boolean) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    const decay = isOpen ? (this.currentKit === 'jazz' ? 0.85 : 0.65) : 0.065;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const fundamental = 40 * pitchMult;

    const hatGain = ctx.createGain();
    hatGain.gain.setValueAtTime(vel * (isOpen ? 0.7 : 0.6), t);
    hatGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    if (isOpen) {
      this.openHatNode = { gain: hatGain, stopTime: t + decay };
    }

    // Highpass filter for sizzle
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(isOpen ? 6500 : 7200, t);

    // Bandpass filter to sculpt metallic tone
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(9500 * pitchMult, t);
    bandpass.Q.setValueAtTime(1.8, t);

    hatGain.connect(this.drumGain);
    highpass.connect(hatGain);
    bandpass.connect(highpass);

    // Detuned metallic oscillators
    ratios.forEach((ratio) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(fundamental * ratio, t);
      osc.connect(bandpass);
      osc.start(t);
      osc.stop(t + decay);
    });

    // Add high-end white noise burst for crisp stick impact
    const clickSize = ctx.sampleRate * 0.02;
    const clickBuf = ctx.createBuffer(1, clickSize, ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickSize; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
    }
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickG = ctx.createGain();
    clickG.gain.setValueAtTime(vel * 0.4, t);
    clickSrc.connect(clickG);
    clickG.connect(hatGain);
    clickSrc.start(t);
    clickSrc.stop(t + 0.02);
  }

  // Synthesis: CRASH CYMBAL
  private synthCrash(t: number, vel: number, pitchMult: number, lengthScale: number = 1.0) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    const decay = (this.currentKit === 'metal' ? 2.6 : 1.9) * lengthScale;
    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(vel * 0.65, t);
    crashGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    crashGain.connect(this.drumGain);

    // Dual layer: Metallic tone bank + high filtered noise shimmer
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(4500 * pitchMult, t);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(7500 * pitchMult, t);
    bandpass.Q.setValueAtTime(1.2, t);

    highpass.connect(crashGain);
    bandpass.connect(highpass);

    const freqs = [315, 473, 597, 781, 1024, 1342, 1780];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f * pitchMult, t);
      osc.connect(bandpass);
      osc.start(t);
      osc.stop(t + decay);
    });

    // Shimmer noise
    const noiseLen = ctx.sampleRate * Math.min(2.5, decay);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      nData[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(5500, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.55, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(crashGain);

    noise.start(t);
    noise.stop(t + decay);
  }

  // Synthesis: RIDE CYMBAL
  private synthRide(t: number, vel: number, pitchMult: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    const decay = this.currentKit === 'jazz' ? 3.0 : 2.2;
    const rideGain = ctx.createGain();
    rideGain.gain.setValueAtTime(vel * 0.6, t);
    rideGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    rideGain.connect(this.drumGain);

    // Bell Ping tone
    const bellOsc = ctx.createOscillator();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1450 * pitchMult, t);

    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(vel * 0.8, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    bellOsc.connect(bellGain);
    bellGain.connect(rideGain);
    bellOsc.start(t);
    bellOsc.stop(t + 0.4);

    // Shimmering body
    const ratios = [587, 845, 1180, 1620, 2350];
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(6000 * pitchMult, t);
    bandpass.Q.setValueAtTime(2.5, t);
    bandpass.connect(rideGain);

    ratios.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * pitchMult, t);
      osc.connect(bandpass);
      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // Synthesis: TOM-TOMS (High, Mid, Floor)
  private synthTom(t: number, vel: number, startFreq: number, endFreq: number, decay: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;

    if (this.currentKit === 'rock') {
      decay *= 1.25;
      startFreq *= 1.05;
    } else if (this.currentKit === 'jazz') {
      decay *= 1.4;
    } else if (this.currentKit === 'electronic') {
      decay *= 1.6;
    }

    const tomGain = ctx.createGain();
    tomGain.gain.setValueAtTime(vel * 0.8, t);
    tomGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    tomGain.connect(this.drumGain);

    // Main sweeping fundamental
    const osc = ctx.createOscillator();
    osc.type = this.currentKit === 'electronic' ? 'sine' : 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + decay * 0.7);
    osc.connect(tomGain);

    // Harmonic resonance overtone
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(startFreq * 1.5, t);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, t + decay * 0.4);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(vel * 0.35, t);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + decay * 0.5);

    osc2.connect(osc2Gain);
    osc2Gain.connect(tomGain);

    // Head slap attack
    const slapOsc = ctx.createOscillator();
    slapOsc.type = 'triangle';
    slapOsc.frequency.setValueAtTime(450, t);
    slapOsc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

    const slapGain = ctx.createGain();
    slapGain.gain.setValueAtTime(vel * 0.3, t);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    slapOsc.connect(slapGain);
    slapGain.connect(tomGain);

    osc.start(t);
    osc2.start(t);
    slapOsc.start(t);

    osc.stop(t + decay);
    osc2.stop(t + decay);
    slapOsc.stop(t + 0.04);
  }

  // Synthesis: COWBELL
  private synthCowbell(t: number, vel: number, pitchMult: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;
    const decay = 0.32;

    const cowbellGain = ctx.createGain();
    cowbellGain.gain.setValueAtTime(vel * 0.75, t);
    cowbellGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    cowbellGain.connect(this.drumGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(820 * pitchMult, t);
    filter.Q.setValueAtTime(3.2, t);
    filter.connect(cowbellGain);

    const f1 = 587 * pitchMult;
    const f2 = 845 * pitchMult;

    [f1, f2].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // Synthesis: TAMBOURINE
  private synthTambourine(t: number, vel: number, pitchMult: number) {
    if (!this.ctx || !this.drumGain) return;
    const ctx = this.ctx;
    const decay = 0.28;

    const tambGain = ctx.createGain();
    tambGain.gain.setValueAtTime(vel * 0.65, t);
    tambGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    tambGain.connect(this.drumGain);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(6800 * pitchMult, t);
    highpass.connect(tambGain);

    // Multi-burst jingle noise grains
    const length = ctx.sampleRate * decay;
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // 3 subtle shaker bursts
      const env = Math.sin((i / length) * Math.PI * 3) > 0 ? 1 : 0.3;
      data[i] = (Math.random() * 2 - 1) * env * Math.exp((-i * 4) / length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(highpass);
    src.start(t);
    src.stop(t + decay);
  }

  // METRONOME TICK
  public playMetronomeClick(isDownbeat: boolean) {
    this.init();
    if (!this.ctx || !this.metronomeGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const freq = isDownbeat ? 1400 : 900;
    const decay = isDownbeat ? 0.06 : 0.04;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isDownbeat ? 1.0 : 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    osc.connect(gain);
    gain.connect(this.metronomeGain);

    osc.start(t);
    osc.stop(t + decay);
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }
}

export const audioEngine = new AudioEngine();
