/**
 * Side effects of the rest timer: beep, vibration and screen wake lock.
 * Everything is feature-detected and failures are swallowed: the visual signal
 * is the reliable one, these are best effort. None of this works while the
 * phone is locked or the app is in the background.
 */

const SAMPLE_RATE = 22_050

/** Three short 880 Hz beeps as a mono 16-bit PCM WAV (generated, no sound asset). */
export function makeBeepWav(): Uint8Array {
  const beepMs = 180
  const gapMs = 110
  const beeps = 3
  const perBeep = Math.round((SAMPLE_RATE * beepMs) / 1000)
  const perGap = Math.round((SAMPLE_RATE * gapMs) / 1000)
  const samples = new Int16Array(beeps * perBeep + (beeps - 1) * perGap)
  let pos = 0
  for (let b = 0; b < beeps; b++) {
    for (let i = 0; i < perBeep; i++) {
      // Short fade in/out avoids clicks.
      const edge = Math.min(1, i / 200, (perBeep - 1 - i) / 200)
      samples[pos++] = Math.round(Math.sin((2 * Math.PI * 880 * i) / SAMPLE_RATE) * 0.6 * edge * 32767)
    }
    pos += b < beeps - 1 ? perGap : 0
  }

  const bytes = new Uint8Array(44 + samples.length * 2)
  const view = new DataView(bytes.buffer)
  const text = (offset: number, s: string) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM header size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((s, i) => view.setInt16(44 + i * 2, s, true))
  return bytes
}

export function beepDataUri(): string {
  let binary = ''
  for (const byte of makeBeepWav()) binary += String.fromCharCode(byte)
  return `data:audio/wav;base64,${btoa(binary)}`
}

let audio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!audio) {
    audio = new Audio(beepDataUri())
    audio.preload = 'auto'
  }
  return audio
}

/**
 * Call from a tap (timer start). Browsers only allow later programmatic playback
 * once the element was played from a user gesture, so play it once, silently.
 * An <audio> element is not muted by the iOS silent switch (Web Audio is).
 */
export function unlockAudio(): void {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
    const a = getAudio()
    if (!a) return
    a.volume = 0
    void a
      .play()
      .then(() => {
        a.pause()
        a.currentTime = 0
        a.volume = 1
      })
      .catch(() => {
        a.volume = 1
      })
  } catch {
    // ignore
  }
}

export function beep(): void {
  try {
    const a = getAudio()
    if (!a) return
    a.volume = 1
    a.currentTime = 0
    void a.play().catch(() => {})
  } catch {
    // ignore
  }
}

/** Android only; iOS has no vibration API. */
export function vibrate(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([300, 150, 300])
  } catch {
    // ignore
  }
}

interface WakeLockSentinelLike {
  release(): Promise<void>
}
let wakeLock: WakeLockSentinelLike | null = null
let wakeLockPending = false

/** Keeps the screen on while a timer runs (best effort; released by the browser when hidden). */
export function holdWakeLock(): void {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } })
      .wakeLock
    if (!wl || wakeLock || wakeLockPending) return
    wakeLockPending = true
    wl.request('screen')
      .then((sentinel) => {
        wakeLock = sentinel
        wakeLockPending = false
        // The browser releases it on its own when the page is hidden.
        ;(sentinel as unknown as EventTarget).addEventListener?.('release', () => {
          if (wakeLock === sentinel) wakeLock = null
        })
      })
      .catch(() => {
        wakeLockPending = false
      })
  } catch {
    wakeLockPending = false
  }
}

export function releaseWakeLock(): void {
  const current = wakeLock
  wakeLock = null
  try {
    void current?.release().catch(() => {})
  } catch {
    // ignore
  }
}
