
import { InstrumentType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private lastTriggered: Map<string, number> = new Map();

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private frequencies: Record<string, number> = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
  };

  public startNote(type: InstrumentType, note: string) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = Date.now();
    const lastTime = this.lastTriggered.get(note) || 0;
    if (now - lastTime < 20) return;
    this.lastTriggered.set(note, now);

    if (this.activeOscillators.has(note)) return;

    const freq = this.frequencies[note] || 440;
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    switch (type) {
      case InstrumentType.PIANO:
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
        break;
      case InstrumentType.VIOLIN:
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.08); // Faster attack
        break;
      case InstrumentType.HARP:
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
        break;
      case InstrumentType.CHIMES:
        osc.type = 'square';
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
        break;
      case InstrumentType.DRUMS:
        this.playDrum(note);
        return;
    }

    osc.frequency.setValueAtTime(freq, time);
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    this.activeOscillators.set(note, { osc, gain });
  }

  public stopNote(note: string) {
    const entry = this.activeOscillators.get(note);
    if (!entry || !this.ctx) return;

    const { osc, gain } = entry;
    const time = this.ctx.currentTime;

    // Safety: ensure a non-zero start for exponential ramp
    const currentGain = gain.gain.value || 0.001;
    gain.gain.cancelScheduledValues(time);
    gain.gain.setValueAtTime(currentGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15); // Snappier release
    
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
      this.activeOscillators.delete(note);
    }, 200);
  }

  public playNote(type: InstrumentType, note: string) {
    this.startNote(type, note);
    if (type !== InstrumentType.DRUMS) {
        setTimeout(() => this.stopNote(note), 500);
    }
  }

  private playDrum(note: string) {
    const time = this.ctx!.currentTime;
    if (note === 'kick') {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(time + 0.5);
    } else if (note === 'snare') {
      const noise = this.ctx!.createBufferSource();
      const bufferSize = this.ctx!.sampleRate * 0.1;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(0.5, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain!);
      noise.start();
    } else if (note === 'hihat') {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(10000, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(time + 0.05);
    }
  }
}

export const audioService = new AudioService();
