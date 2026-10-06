import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from '@react-native-firebase/firestore'
import { db } from '@/lib/firebase'
import { asOtherUser } from './profile'
import type { UserProfile } from './types'

export type TrainerRelation = {
  id: string
  trainerId: string
  studentId: string
  status: 'pending' | 'accepted'
  requestedByRole: 'trainer' | 'student'
  requesterId: string
  targetId: string
  participants: string[]
  createdAt: string
  updatedAt: string
}

export type CoachingData = {
  relations: TrainerRelation[]
  pendingReceived: { relation: TrainerRelation; requester: UserProfile }[]
  outgoingPending: TrainerRelation[]
  students: UserProfile[]
  trainers: UserProfile[]
}

async function loadProfiles(ids: string[]): Promise<Map<string, UserProfile>> {
  const snaps = await Promise.all(Array.from(new Set(ids)).map(id => getDoc(doc(db, 'usuarios', id))))
  const map = new Map<string, UserProfile>()
  snaps.forEach(snap => {
    if (snap.exists()) map.set(snap.id, asOtherUser(snap.id, snap.data()))
  })
  return map
}

export async function getCoachingData(userId: string): Promise<CoachingData> {
  const snapshot = await getDocs(query(collection(db, 'trainer_relations'), where('participants', 'array-contains', userId)))
  const relations = snapshot.docs.map(relationDoc => ({ id: relationDoc.id, ...relationDoc.data() } as TrainerRelation))

  const received = relations.filter(relation => relation.status === 'pending' && relation.targetId === userId)
  const accepted = relations.filter(relation => relation.status === 'accepted')

  const profiles = await loadProfiles([
    ...received.map(relation => relation.requesterId),
    ...accepted.map(relation => (relation.trainerId === userId ? relation.studentId : relation.trainerId)),
  ])

  const byName = (a: UserProfile, b: UserProfile) => a.nome.localeCompare(b.nome)

  return {
    relations,
    pendingReceived: received
      .map(relation => ({ relation, requester: profiles.get(relation.requesterId) }))
      .filter((item): item is { relation: TrainerRelation; requester: UserProfile } => !!item.requester)
      .sort((a, b) => b.relation.createdAt.localeCompare(a.relation.createdAt)),
    outgoingPending: relations.filter(relation => relation.status === 'pending' && relation.requesterId === userId),
    students: accepted
      .filter(relation => relation.trainerId === userId)
      .map(relation => profiles.get(relation.studentId))
      .filter((user): user is UserProfile => !!user)
      .sort(byName),
    trainers: accepted
      .filter(relation => relation.studentId === userId)
      .map(relation => profiles.get(relation.trainerId))
      .filter((user): user is UserProfile => !!user)
      .sort(byName),
  }
}

/** Busca exata por username ou email (mesma regra do web, para não expor a lista de usuários) */
export async function findUserForCoaching(term: string): Promise<UserProfile | null> {
  const normalized = term.trim().replace(/^@/, '')
  if (!normalized) return null

  const byUsername = await getDocs(query(collection(db, 'usuarios'), where('username', '==', normalized)))
  const userDoc = byUsername.docs[0]
    ?? (await getDocs(query(collection(db, 'usuarios'), where('email', '==', normalized.toLowerCase())))).docs[0]

  return userDoc ? asOtherUser(userDoc.id, userDoc.data()) : null
}

export class CoachingRequestError extends Error {}

export async function sendCoachingRequest(me: UserProfile, target: UserProfile, existing: TrainerRelation[]) {
  let trainerId: string
  let studentId: string
  let requestedByRole: 'trainer' | 'student'

  if (me.isTrainer) {
    trainerId = me.id
    studentId = target.id
    requestedByRole = 'trainer'
  } else if (target.isTrainer) {
    trainerId = target.id
    studentId = me.id
    requestedByRole = 'student'
  } else {
    throw new CoachingRequestError('Para solicitar um treinador, busque um perfil marcado como treinador.')
  }

  const already = existing.find(relation => relation.trainerId === target.id || relation.studentId === target.id)
  if (already) {
    throw new CoachingRequestError(already.status === 'accepted' ? 'Vocês já têm um vínculo ativo.' : 'Já existe uma solicitação pendente com esse usuário.')
  }

  const now = new Date().toISOString()
  await setDoc(doc(db, 'trainer_relations', `${trainerId}_${studentId}`), {
    trainerId,
    studentId,
    status: 'pending',
    requestedByRole,
    requesterId: me.id,
    targetId: target.id,
    participants: [trainerId, studentId],
    createdAt: now,
    updatedAt: now,
  })
}

export async function acceptCoachingRequest(relationId: string) {
  const now = new Date().toISOString()
  await updateDoc(doc(db, 'trainer_relations', relationId), { status: 'accepted', updatedAt: now, respondedAt: now })
}

export async function removeCoachingRelation(relationId: string) {
  await deleteDoc(doc(db, 'trainer_relations', relationId))
}

/** Confirma que o usuário logado é treinador com vínculo aceito com o aluno */
export async function canManageStudent(trainerId: string, studentId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'trainer_relations', `${trainerId}_${studentId}`))
  return snap.exists() && snap.data()?.status === 'accepted'
}
