import { doc, updateDoc } from '@react-native-firebase/firestore'
import { router, type Href } from 'expo-router'
import { OneSignal, type NotificationClickEvent } from 'react-native-onesignal'
import { env } from './env'
import { db } from './firebase'

let initialized = false

// As notificações enviadas pelo backend carregam URLs do app web; aqui elas viram rotas do app
const WEB_PATH_TO_ROUTE: [RegExp, (match: RegExpMatchArray) => Href][] = [
  [/^\/profile\/streak-calendar/, () => '/profile/streak-calendar'],
  [/^\/profile\/connections/, () => '/coaching'],
  [/^\/profile\/log/, () => '/profile/log'],
  [/^\/profile\/badges/, () => '/profile/badges'],
  [/^\/profile/, () => '/profile'],
  [/^\/friends/, () => '/friends'],
  [/^\/friend\/([^/]+)/, match => ({ pathname: '/friend/[id]', params: { id: match[1] } })],
  [/^\/progress/, () => '/progress'],
  [/^\/train/, () => '/'],
]

function routeFromUrl(url: string | undefined): Href | null {
  if (!url) return null
  let path = url
  try {
    path = new URL(url).pathname
  } catch {
    // já é um path relativo
  }
  for (const [pattern, toRoute] of WEB_PATH_TO_ROUTE) {
    const match = path.match(pattern)
    if (match) return toRoute(match)
  }
  return null
}

function handleNotificationClick(event: NotificationClickEvent) {
  const data = event.notification.additionalData as { url?: string } | undefined
  const route = routeFromUrl(event.notification.launchURL ?? data?.url)
  if (route) router.push(route)
}

export function initPush() {
  if (initialized || !env.oneSignalAppId) return
  initialized = true
  OneSignal.initialize(env.oneSignalAppId)
  OneSignal.Notifications.addEventListener('click', handleNotificationClick)
}

async function saveSubscription(userId: string, subscriptionId: string | null | undefined) {
  if (!subscriptionId) return
  // updateDoc (e não setDoc com merge): nunca cria um perfil incompleto no meio do cadastro
  await updateDoc(doc(db, 'usuarios', userId), {
    pushProvider: 'onesignal',
    oneSignalExternalId: userId,
    oneSignalSubscriptionId: subscriptionId,
    pushPlatform: 'android-native',
    updated_at: Date.now(),
  })
}

/**
 * Vincula o aparelho ao usuário no OneSignal (external_id = uid do Firebase), pede a permissão
 * de notificação (Android 13+ exige) e salva o subscription id no Firestore, que é o que os
 * crons em PHP usam para enviar os pushes.
 */
let connectedUserId: string | null = null
let subscriptionListenerAdded = false

export async function connectPushUser(userId: string) {
  if (!env.oneSignalAppId) return
  initPush()
  connectedUserId = userId
  OneSignal.login(userId)

  // Um único listener para o app todo; ele salva o id para quem estiver logado no momento
  if (!subscriptionListenerAdded) {
    subscriptionListenerAdded = true
    OneSignal.User.pushSubscription.addEventListener('change', event => {
      if (connectedUserId) saveSubscription(connectedUserId, event.current.id).catch(() => {})
    })
  }

  await OneSignal.Notifications.requestPermission(false).catch(() => false)
  const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync().catch(() => null)
  await saveSubscription(userId, subscriptionId).catch(() => {})
}

export function disconnectPushUser() {
  connectedUserId = null
  if (!initialized) return
  OneSignal.logout()
}
