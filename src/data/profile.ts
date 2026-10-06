import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
import { notifyAdmins } from '@/lib/api'
import { db } from '@/lib/firebase'
import type { Privacidade, UserProfile } from './types'

export const userRef = (userId: string) => doc(db, 'usuarios', userId)

/**
 * Perfil de outro usuário para exibição. Alguns documentos antigos foram criados parcialmente
 * (só com dados de push), então o nome ganha um padrão para nenhuma tela quebrar.
 */
export function asOtherUser(id: string, data: Record<string, unknown> | undefined): UserProfile {
  const nome = typeof data?.nome === 'string' && data.nome.trim() ? data.nome : 'Usuário'
  return { ...data, id, nome } as UserProfile
}

export function subscribeUserProfile(userId: string, onChange: (profile: UserProfile | null) => void, onError?: (error: Error) => void) {
  return onSnapshot(
    userRef(userId),
    snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null),
    onError,
  )
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userRef(userId))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null
}

/** Busca por id do documento ou, se não existir, por username */
export async function findUserByIdOrUsername(idOrUsername: string): Promise<UserProfile | null> {
  const byId = await getDoc(userRef(idOrUsername))
  if (byId.exists()) return asOtherUser(byId.id, byId.data())

  const byUsername = await getDocs(query(collection(db, 'usuarios'), where('username', '==', idOrUsername)))
  const match = byUsername.docs[0]
  return match ? asOtherUser(match.id, match.data()) : null
}

export async function updateUserFields(userId: string, data: Record<string, unknown>) {
  await updateDoc(userRef(userId), data)
}

export class UsernameTakenError extends Error {}

export type ProfileEdit = {
  nome: string
  username: string
  bio: string
  dataNascimento: string
  instagram: string
  isTrainer: boolean
  cref: string
}

export async function saveProfile(current: UserProfile, edit: ProfileEdit) {
  const username = edit.username.trim().replace(/^@/, '')

  if (username && username !== current.username) {
    const snapshot = await getDocs(query(collection(db, 'usuarios'), where('username', '==', username)))
    if (snapshot.docs.some(userDoc => userDoc.id !== current.id)) {
      throw new UsernameTakenError(`O username "@${username}" já está em uso.`)
    }
  }

  const data: Record<string, unknown> = {
    nome: edit.nome.trim(),
    username,
    bio: edit.bio.trim(),
    dataNascimento: edit.dataNascimento,
    instagram: edit.instagram.replace(/^@/, '').trim(),
    isTrainer: edit.isTrainer,
    cref: edit.isTrainer ? edit.cref.trim().toUpperCase() : '',
  }

  if (edit.isTrainer !== !!current.isTrainer) {
    // Perfis antigos sem o campo `badges` derivam as badges das flags; parte delas para não perdê-las
    const seed = current.badges?.length
      ? current.badges
      : [current.isFounder && 'founder', current.isPremium && 'premium', current.isTrainer && 'trainer'].filter((id): id is string => !!id)
    const badges = new Set(seed)
    if (edit.isTrainer) badges.add('trainer')
    else badges.delete('trainer')
    data.badges = Array.from(badges)
  }

  await updateDoc(userRef(current.id), data)
}

export async function setProfilePhoto(userId: string, url: string | null) {
  await updateDoc(userRef(userId), { photoURL: url ?? deleteField() })
}

export async function savePrivacy(userId: string, privacidade: Privacidade) {
  await updateDoc(userRef(userId), { privacidade })
}

export async function markOnboardingComplete(userId: string) {
  await setDoc(userRef(userId), { hasCompletedOnboarding: true }, { merge: true })
}

export async function markAppVersionSeen(userId: string, version: string) {
  await setDoc(userRef(userId), { lastSeenAppVersion: version }, { merge: true })
}

// ─── Cadastro ────────────────────────────────────────────────────────────────

export async function isEmailRegistered(email: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'emailsRegistrados', email.trim().toLowerCase()))
  return snapshot.exists()
}

export async function createUserProfile(params: { uid: string; name: string; email: string; phone: string; isTrainer: boolean; cref: string }) {
  const email = params.email.trim().toLowerCase()

  await setDoc(userRef(params.uid), {
    nome: params.name.trim(),
    email,
    telefone: params.phone,
    isTrainer: params.isTrainer,
    cref: params.isTrainer ? params.cref.trim().toUpperCase() : '',
    isPremium: false,
    isAdmin: false,
    isActive: true,
    criadoEm: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0,
    lastStreakWeek: '',
    totalWorkouts: 0,
    streakVersion: 2,
    scheduledDays: [],
    badges: params.isTrainer ? ['trainer'] : [],
    hasCompletedOnboarding: false,
    origem: 'app-android',
  })

  await setDoc(doc(db, 'emailsRegistrados', email), { uid: params.uid, criadoEm: new Date().toISOString() })

  notifyAdmins('Novo usuário registrado!', `Nome: ${params.name.trim()} | Email: ${email}`, '/admin/dashboard/users')
}

// ─── Premium e suporte ───────────────────────────────────────────────────────

export async function requestPremiumUpgrade(profile: UserProfile) {
  await addDoc(collection(db, 'upgrade_requests'), {
    userId: profile.id,
    userName: profile.nome,
    userEmail: profile.email ?? '',
    userPhone: profile.telefone ?? '',
    message: 'Upgrade direto via app Android',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  notifyAdmins('Nova solicitação de Premium', `${profile.nome} (${profile.email}) solicitou upgrade para Premium.`)
}

export type SupportReport = {
  tipo: string
  titulo: string
  mensagem: string
  imagemUrl: string | null
}

export async function sendSupportReport(profile: UserProfile, report: SupportReport) {
  await addDoc(collection(db, 'bug_reports'), {
    usuarioID: profile.id,
    nome: profile.nome || 'Desconhecido',
    email: profile.email || 'Desconhecido',
    username: profile.username || 'Desconhecido',
    tipo: report.tipo,
    titulo: report.titulo.trim(),
    mensagem: report.mensagem.trim(),
    imagemUrl: report.imagemUrl,
    dataCriacao: serverTimestamp(),
    status: 'pendente',
    origem: 'app-android',
  })

  notifyAdmins(`Novo relato: ${report.tipo}`, `${report.titulo.trim()} - enviado por ${profile.nome}`, '/admin/dashboard/bugs')
}

/** Versão mínima exigida do app nativo (sistema/info.minAppVersion), para forçar atualização pela loja */
export async function getMinAppVersion(): Promise<string | null> {
  const snapshot = await getDoc(doc(db, 'sistema', 'info'))
  const value = snapshot.data()?.minAppVersion
  return typeof value === 'string' ? value : null
}
