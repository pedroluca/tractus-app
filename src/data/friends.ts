import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
import { notifyFriendRequest } from '@/lib/api'
import { db } from '@/lib/firebase'
import { asOtherUser } from './profile'
import type { UserProfile } from './types'

export type FriendshipStatus = 'none' | 'aceito' | 'enviado' | 'recebido'

export type Friendship = {
  id: string
  solicitanteID: string
  receptorID: string
  status: 'pendente' | 'aceito'
  participantes: string[]
  dataCriacao?: string
}

export type Friend = { friendshipId: string; user: UserProfile }

const friendshipsRef = () => collection(db, 'amizades')

async function loadProfiles(ids: string[]): Promise<Map<string, UserProfile>> {
  const snaps = await Promise.all(Array.from(new Set(ids)).map(id => getDoc(doc(db, 'usuarios', id))))
  const map = new Map<string, UserProfile>()
  snaps.forEach(snap => {
    if (snap.exists()) map.set(snap.id, asOtherUser(snap.id, snap.data()))
  })
  return map
}

/** Amigos aceitos de um usuário, já com o perfil de cada um */
export async function getFriends(userId: string): Promise<Friend[]> {
  const snapshot = await getDocs(query(friendshipsRef(), where('participantes', 'array-contains', userId), where('status', '==', 'aceito')))
  const pairs = snapshot.docs
    .map(friendshipDoc => ({ friendshipId: friendshipDoc.id, friendId: (friendshipDoc.data().participantes as string[]).find(id => id !== userId) }))
    .filter((pair): pair is { friendshipId: string; friendId: string } => !!pair.friendId)

  const profiles = await loadProfiles(pairs.map(pair => pair.friendId))
  return pairs
    .map(pair => ({ friendshipId: pair.friendshipId, user: profiles.get(pair.friendId) }))
    .filter((friend): friend is Friend => !!friend.user)
    .sort((a, b) => a.user.nome.localeCompare(b.user.nome))
}

export async function getFriendsCount(userId: string): Promise<number> {
  const snapshot = await getDocs(query(friendshipsRef(), where('participantes', 'array-contains', userId), where('status', '==', 'aceito')))
  return snapshot.size
}

/** Contagem de solicitações recebidas pendentes, em tempo real (badge da aba) */
export function subscribePendingRequestsCount(userId: string, onChange: (count: number) => void) {
  return onSnapshot(
    query(friendshipsRef(), where('receptorID', '==', userId), where('status', '==', 'pendente')),
    snapshot => onChange(snapshot.size),
    () => onChange(0),
  )
}

export type FriendRequest = { id: string; requester: UserProfile; createdAt: string }

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const snapshot = await getDocs(query(friendshipsRef(), where('receptorID', '==', userId), where('status', '==', 'pendente')))
  const profiles = await loadProfiles(snapshot.docs.map(requestDoc => requestDoc.data().solicitanteID))

  return snapshot.docs
    .map(requestDoc => ({
      id: requestDoc.id,
      requester: profiles.get(requestDoc.data().solicitanteID),
      createdAt: requestDoc.data().dataCriacao ?? '',
    }))
    .filter((request): request is FriendRequest => !!request.requester)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function acceptFriendRequest(friendshipId: string) {
  await updateDoc(doc(db, 'amizades', friendshipId), { status: 'aceito' })
}

export async function removeFriendship(friendshipId: string) {
  await deleteDoc(doc(db, 'amizades', friendshipId))
}

export async function getMyFriendships(userId: string): Promise<Friendship[]> {
  const snapshot = await getDocs(query(friendshipsRef(), where('participantes', 'array-contains', userId)))
  return snapshot.docs.map(friendshipDoc => ({ id: friendshipDoc.id, ...friendshipDoc.data() } as Friendship))
}

export function getFriendshipStatus(friendships: Friendship[], myId: string, otherId: string): FriendshipStatus {
  const friendship = friendships.find(item => item.participantes.includes(otherId))
  if (!friendship) return 'none'
  if (friendship.status === 'aceito') return 'aceito'
  return friendship.solicitanteID === myId ? 'enviado' : 'recebido'
}

export async function sendFriendRequest(me: UserProfile, receptorId: string): Promise<Friendship> {
  const data = {
    solicitanteID: me.id,
    receptorID: receptorId,
    status: 'pendente' as const,
    participantes: [me.id, receptorId],
    dataCriacao: new Date().toISOString(),
  }
  const ref = await addDoc(friendshipsRef(), data)
  notifyFriendRequest(me.nome, receptorId)
  return { id: ref.id, ...data }
}

/**
 * Lista de usuários para a busca de amigos. O web baixa a coleção inteira e filtra em memória;
 * mantive o mesmo comportamento para não exigir índices novos, mas com cache em memória por sessão.
 */
let usersCache: { at: number; users: (UserProfile & { hasName: boolean })[] } | null = null

export async function searchUsers(term: string, excludeId: string): Promise<UserProfile[]> {
  const normalized = term.trim().toLowerCase().replace(/^@/, '')
  if (!normalized) return []

  if (!usersCache || Date.now() - usersCache.at > 5 * 60 * 1000) {
    const snapshot = await getDocs(collection(db, 'usuarios'))
    usersCache = { at: Date.now(), users: snapshot.docs.map(userDoc => ({ ...asOtherUser(userDoc.id, userDoc.data()), hasName: typeof userDoc.data().nome === 'string' })) }
  }

  return usersCache.users
    .filter(user => user.id !== excludeId && user.isActive !== false && user.hasName)
    .filter(user => user.nome.toLowerCase().includes(normalized) || user.username?.toLowerCase().includes(normalized))
    .slice(0, 30)
}
