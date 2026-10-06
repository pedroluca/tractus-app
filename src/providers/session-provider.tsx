import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from '@react-native-firebase/auth'
import { setUserId as setCrashlyticsUserId } from '@react-native-firebase/crashlytics'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { getUserProfile, subscribeUserProfile } from '@/data/profile'
import { checkAndResetStreakIfMissed, resetPreviousDaysExercises } from '@/data/streak'
import type { UserProfile } from '@/data/types'
import { identifyUser, trackLogin, trackLogout } from '@/lib/analytics'
import { getLocalDateKey } from '@/lib/dates'
import { auth, crashlytics } from '@/lib/firebase'
import { connectPushUser, disconnectPushUser } from '@/lib/push'
import { kv, storageKeys } from '@/lib/storage'

type SessionContextValue = {
  /** true só na abertura do app, até o Firebase dizer se há usuário logado (e, havendo, até o perfil carregar) */
  initializing: boolean
  user: User | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export class SignInError extends Error {}

/**
 * Rotinas diárias que no web rodavam a cada carregamento de página:
 * zera o progresso de treinos de outros dias e atualiza streak/freezes.
 */
function runDailyMaintenance(userId: string) {
  const today = getLocalDateKey()
  const key = storageKeys.lastMaintenanceDate(userId)
  if (kv.getString(key) === today) return
  kv.set(key, today)

  resetPreviousDaysExercises(userId)
    .then(() => checkAndResetStreakIfMissed(userId))
    .catch(() => kv.remove(key))
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  /** uid cujo perfil já respondeu (com dados ou erro) */
  const [loadedUid, setLoadedUid] = useState<string | null>(null)

  const uid = user?.uid
  // Só a primeira resolução segura a splash; depois disso nunca desmonta a navegação
  // (senão a tela de login perderia o estado no meio do login)
  const [booted, setBooted] = useState(false)
  if (!booted && authReady && (!uid || loadedUid === uid)) setBooted(true)

  useEffect(() => onAuthStateChanged(auth, nextUser => {
    setUser(nextUser)
    setAuthReady(true)
  }), [])

  useEffect(() => {
    // Sem usuário não há o que assinar; o perfil antigo é ignorado pela checagem de uid abaixo
    if (!uid) return

    const unsubscribe = subscribeUserProfile(
      uid,
      nextProfile => {
        setProfile(nextProfile)
        setLoadedUid(uid)
      },
      () => setLoadedUid(uid),
    )

    identifyUser(uid)
    setCrashlyticsUserId(crashlytics, uid).catch(() => {})
    connectPushUser(uid).catch(() => {})
    runDailyMaintenance(uid)

    // O app pode ficar dias aberto em segundo plano: roda a manutenção quando volta e o dia mudou
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') runDailyMaintenance(uid)
    })

    return () => {
      unsubscribe()
      appStateSubscription.remove()
    }
  }, [uid])

  const value = useMemo<SessionContextValue>(() => ({
    initializing: !booted,
    user,
    // Evita expor o perfil de uma conta anterior enquanto o da nova ainda carrega
    profile: profile && profile.id === uid ? profile : null,
    signIn: async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const signedProfile = await getUserProfile(credential.user.uid)

      if (!signedProfile) {
        await firebaseSignOut(auth)
        throw new SignInError('Conta não encontrada no sistema. Entre em contato com o suporte.')
      }
      if (signedProfile.isActive === false) {
        await firebaseSignOut(auth)
        throw new SignInError('Sua conta está inativa. Entre em contato com o suporte para ativá-la.')
      }
      trackLogin()
    },
    signOut: async () => {
      trackLogout()
      disconnectPushUser()
      await firebaseSignOut(auth)
    },
  }), [booted, user, uid, profile])

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession() {
  const context = use(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider')
  return context
}

const CurrentUserContext = createContext<UserProfile | null>(null)

/**
 * Mantém o último perfil válido para as telas protegidas. Durante o logout o perfil vira null
 * um instante antes da navegação sair do grupo (app); assim nenhuma tela renderiza sem usuário.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession()
  const [lastProfile, setLastProfile] = useState(profile)
  if (profile && profile !== lastProfile) setLastProfile(profile)

  const current = profile ?? lastProfile
  if (!current) return null
  return <CurrentUserContext value={current}>{children}</CurrentUserContext>
}

/** Perfil do usuário logado; só use em telas protegidas (dentro do grupo (app)) */
export function useCurrentUser(): UserProfile {
  const profile = use(CurrentUserContext)
  if (!profile) throw new Error('useCurrentUser precisa estar dentro de CurrentUserProvider')
  return profile
}
