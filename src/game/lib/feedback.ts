/** Haptics and the wooden bead click. No music and no bells. */

export function haptic(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* unsupported (e.g. iOS): ignore silently */
  }
}

let ctx: AudioContext | null = null;

/** A short, dry wooden click: filtered noise with a fast decay. */
export function beadClick(enabled: boolean, strong = false) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = strong ? 900 : 1500;
    band.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.value = strong ? 0.7 : 0.45;
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    /* audio blocked: stay silent */
  }
}
