export type ProgressiveSet = { reps: number; weight: number }

export interface Treino {
  id: string
  dia: string
  musculo: string
  usuarioID: string
  createdByUserId?: string
  isTemplate?: boolean
  /** Ordem customizada dos IDs dos exercícios */
  exerciseOrder?: string[]
}

export interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  /** Descanso em segundos */
  tempoIntervalo: number
  isFeito: boolean
  isSkipped: boolean
  lastDoneDate?: string
  nota?: string
  usesProgressiveWeight?: boolean
  progressiveSets?: ProgressiveSet[]
  setsDone: number
  /** Timestamp (ms) em que o descanso atual termina; null quando não há descanso em andamento */
  restEndsAt: number | null
}

export interface Privacidade {
  ocultarEmail?: boolean
  ocultarNascimento?: boolean
  ocultarAtividades?: boolean
  ocultarTreinos?: boolean
  ocultarAmigos?: boolean
  ocultarStreak?: boolean
  ocultarPeso?: boolean
  ocultarAltura?: boolean
  ocultarInstagram?: boolean
}

export interface UserProfile {
  id: string
  nome: string
  email?: string
  telefone?: string
  username?: string
  photoURL?: string
  bio?: string
  dataNascimento?: string
  instagram?: string
  /** cm */
  altura?: number
  /** kg */
  peso?: number
  isTrainer?: boolean
  cref?: string
  isPremium?: boolean
  isFounder?: boolean
  isAdmin?: boolean
  isActive?: boolean
  badges?: string[]
  currentStreak?: number
  longestStreak?: number
  totalWorkouts?: number
  freezeCount?: number
  lastStreakWeek?: string
  lastWorkoutDate?: string
  streakVersion?: number
  scheduledDays?: number[]
  privacidade?: Privacidade
  audioEnabled?: boolean
  emailNotifications?: boolean
  themeMode?: 'light' | 'dark' | 'system'
  primaryColor?: string
  hasCompletedOnboarding?: boolean
  lastSeenAppVersion?: string
  lastBirthdayCelebrationDate?: string
}

export type LogEntry = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  usesProgressiveWeight?: boolean
  progressiveSets?: ProgressiveSet[]
  /** ISO string */
  data: string
}

export type BodyMeasurement = {
  id: string
  usuarioID: string
  data: string
  peso: number
  altura: number
  imc: number
  notas?: string
}
