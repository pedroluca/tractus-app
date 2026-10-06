/// <reference types="node" />
import { existsSync } from 'node:fs'
import type { ConfigContext, ExpoConfig } from 'expo/config'

// APP_VARIANT=development gera um app separado (com.trainlog.app.dev), que pode ficar
// instalado ao lado da versão da Play Store sem conflito de assinatura.
const IS_DEV = process.env.APP_VARIANT === 'development'

const PACKAGE = IS_DEV ? 'com.trainlog.app.dev' : 'com.trainlog.app'
const BRAND_GREEN = '#27AE60'

const iosGoogleServicesFile = existsSync('./GoogleService-Info.plist') ? './GoogleService-Info.plist' : undefined

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'Tractus Dev' : 'Tractus',
  slug: 'tractus-app',
  version: '3.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'tractus',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: PACKAGE,
    supportsTablet: true,
    googleServicesFile: iosGoogleServicesFile,
    infoPlist: {
      // Notificações abrem dentro do app em vez de jogar o usuário no navegador
      OneSignal_suppress_launch_urls: true,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: PACKAGE,
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: BRAND_GREEN,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: BRAND_GREEN,
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/crashlytics',
    [
      'expo-build-properties',
      {
        ios: { useFrameworks: 'static' },
      },
    ],
    ['expo-audio', { microphonePermission: false }],
    'expo-sharing',
    '@react-native-community/datetimepicker',
    [
      'expo-image-picker',
      {
        photosPermission: 'O Tractus usa suas fotos para definir sua foto de perfil e anexar prints nos relatos de suporte.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      'onesignal-expo-plugin',
      {
        mode: IS_DEV ? 'development' : 'production',
        smallIcons: ['./assets/images/notification-icon.png'],
        smallIconAccentColor: BRAND_GREEN,
        disableLocation: true,
      },
    ],
    './plugins/with-onesignal-suppress-urls',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
