let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function resumeContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") {
    return ctx.resume();
  }
  return Promise.resolve();
}

export function playSound(name: "correct" | "send" | "incorrect" | "transition" | "complete" | "wisdom"): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || !masterGain) return;
    resumeContext(ctx).then(() => {
      try {
        const now = ctx.currentTime;
        switch (name) {
          case "correct": {
            // Two quick high sine hits — cheerful "ding-ding!"
            for (let i = 0; i < 2; i++) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0, now + i * 0.15);
              gain.gain.linearRampToValueAtTime(0.35, now + i * 0.15 + 0.005);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.08);
              osc.connect(gain);
              gain.connect(masterGain!);
              osc.start(now + i * 0.15);
              osc.stop(now + i * 0.15 + 0.08);
            }
            break;
          }
          case "send": {
            // Very subtle short blip
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 220;
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(masterGain!);
            osc.start(now);
            osc.stop(now + 0.05);
            break;
          }
          case "incorrect": {
            // Very soft low tone — gentle "hmm"
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 130.81; // C3
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(masterGain!);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
          }
          case "transition": {
            // White noise through bandpass — gentle whoosh
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let j = 0; j < bufferSize; j++) {
              data[j] = Math.random() * 2 - 1;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 800;
            filter.Q.value = 0.8;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain!);
            source.start(now);
            source.stop(now + 0.5);
            break;
          }
          case "complete": {
            // Three-note ascending arpeggio C4 → E4 → G4
            const freqs = [261.63, 329.63, 392.0];
            freqs.forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              const t = now + i * 0.2;
              gain.gain.setValueAtTime(0, t);
              gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
              osc.connect(gain);
              gain.connect(masterGain!);
              osc.start(t);
              osc.stop(t + 0.35);
            });
            break;
          }
          case "wisdom": {
            // Single sustained D4 with slight vibrato
            const osc = ctx.createOscillator();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 293.66; // D4
            lfo.type = "sine";
            lfo.frequency.value = 5;
            lfoGain.gain.value = 3;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.setValueAtTime(0.15, now + 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain);
            gain.connect(masterGain!);
            lfo.start(now);
            osc.start(now);
            osc.stop(now + 0.8);
            lfo.stop(now + 0.8);
            break;
          }
        }
      } catch {
        // fail silently
      }
    }).catch(() => {
      // fail silently
    });
  } catch {
    // fail silently
  }
}
