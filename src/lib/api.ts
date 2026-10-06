import { collection, getDocs, query, where } from '@react-native-firebase/firestore'
import { env } from './env'
import { db } from './firebase'

// Endpoints PHP hospedados na Hostinger (os mesmos que o app web usa)

type UploadKind = 'profile' | 'bug-report'

const uploadEndpoint = (kind: UploadKind) =>
  kind === 'profile'
    ? env.uploadUrl
    : env.uploadUrl.replace('upload-profile-image.php', 'upload-bug-report-image.php')

/** Envia uma imagem local (uri do image picker) e devolve a URL pública */
export async function uploadImage(localUri: string, userId: string, kind: UploadKind): Promise<string> {
  const endpoint = uploadEndpoint(kind)
  if (!endpoint) throw new Error('EXPO_PUBLIC_API_UPLOAD_URL não configurada')

  const formData = new FormData()
  // No React Native o FormData aceita { uri, name, type } no lugar de um File
  formData.append('image', { uri: localUri, name: `${kind}-${Date.now()}.jpg`, type: 'image/jpeg' } as unknown as Blob)
  formData.append('userId', userId)

  const response = await fetch(endpoint, { method: 'POST', body: formData })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success || !data.imageUrl) {
    throw new Error(data?.message || 'Falha no upload da imagem')
  }

  return data.imageUrl as string
}

type PushParams = {
  targetIds: string[]
  title: string
  body: string
  url: string
}

async function sendPush({ targetIds, title, body, url }: PushParams): Promise<boolean> {
  if (targetIds.length === 0 || !env.pushSecret) return false

  try {
    const response = await fetch(`${env.apiBaseUrl}/send-admin-push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.pushSecret,
        target_ids: targetIds,
        title,
        body,
        url,
        icon: `${env.webAppUrl}/icon-512.png`,
      }),
    })
    const data = await response.json().catch(() => null)
    return response.ok && data?.status !== 'error'
  } catch (error) {
    if (__DEV__) console.warn('Erro ao enviar push:', error)
    return false
  }
}

/** Notifica todos os admins (novo cadastro, pedido de Premium, relato de bug) */
export async function notifyAdmins(title: string, body: string, adminPath = '/admin/dashboard'): Promise<void> {
  try {
    const snapshot = await getDocs(query(collection(db, 'usuarios'), where('isAdmin', '==', true)))
    const targetIds = snapshot.docs
      .map(adminDoc => adminDoc.data().oneSignalSubscriptionId || adminDoc.data().player_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 10)

    await sendPush({ targetIds, title, body, url: `${env.webAppUrl}${adminPath}` })
  } catch (error) {
    if (__DEV__) console.warn('Erro ao notificar admins:', error)
  }
}

/** Avisa o destinatário de uma solicitação de amizade (fire-and-forget) */
export function notifyFriendRequest(senderName: string, receptorId: string) {
  if (!env.pushSecret) return

  fetch(`${env.apiBaseUrl}/send-friend-request-notification.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.pushSecret, sender_name: senderName, receptor_id: receptorId }),
  }).catch(() => {})
}
