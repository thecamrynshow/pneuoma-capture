import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pneuoma.app',
  appName: 'PNEUOMA Capture',
  webDir: 'www',
  server: {
    url: 'https://capture.pneuoma.com',
  },
  ios: {
    scheme: 'PNEUOMACapture',
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#07080d',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07080d',
      overlaysWebView: true,
    },
  },
}

export default config
