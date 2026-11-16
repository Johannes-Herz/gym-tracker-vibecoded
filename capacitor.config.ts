import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'de.johannes.gymtracker',
  appName: 'Gym Tracker',
  webDir: 'dist-android',
  plugins: {
    SystemBars: {
      // The WebView is edge-to-edge (Android 15+). `css` also injects --safe-area-inset-*
      // (used by src/styles/base.css). `index.html` has viewport-fit=cover, hinted here so the
      // first frame does not jump.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // Icons follow the device appearance, which is what the app's prefers-color-scheme theme follows.
      style: 'DEFAULT',
    },
  },
}

export default config
