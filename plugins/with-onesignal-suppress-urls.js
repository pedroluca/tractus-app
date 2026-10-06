const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins')

// Sem isso o SDK do OneSignal abre a `url` da notificação no navegador.
// Com a flag, o clique só abre o app e o roteamento fica por conta do listener em src/lib/push.ts
module.exports = function withOneSignalSuppressLaunchUrls(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults)
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(application, 'com.onesignal.suppressLaunchURLs', 'true')
    return cfg
  })
}
