// Variáveis EXPO_PUBLIC_* são embutidas no bundle do app: nada aqui é segredo.
export const env = {
  uploadUrl: process.env.EXPO_PUBLIC_API_UPLOAD_URL ?? "",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://apptractus.com.br/api",
  oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "",
  pushSecret: process.env.EXPO_PUBLIC_PUSH_SECRET ?? "",
  webAppUrl: "https://apptractus.com.br",
  privacyPolicyUrl: "https://apptractus.com.br/privacy",
  deleteAccountUrl: "https://apptractus.com.br/delete-account",
  developerUrl: "https://pedroluca.dev.br",
  supportEmail: "suporte@apptractus.com.br",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.trainlog.app",
};
