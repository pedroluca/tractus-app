import { Crown, Flame, GraduationCap, Laptop, Rocket, Trophy, type LucideIcon } from 'lucide-react-native'

// Definições estáticas das conquistas (fonte da verdade, igual ao app web)

export type BadgeTone = 'founder' | 'premium' | 'info' | 'success' | 'streak'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  Icon: LucideIcon
  /** Badges com ordem definida aparecem primeiro, ordenadas por esse valor */
  order?: number
  /** Se true, a cor da badge vira o anel do avatar */
  hasImageBorder: boolean
  tone: BadgeTone
}

/** Tamanho de cada bloco de marco da streak, em semanas */
export const STREAK_MILESTONE_WEEKS = 4

export function getStreakMilestoneValue(streak: number): number {
  if (streak < STREAK_MILESTONE_WEEKS) return 0
  return Math.floor(streak / STREAK_MILESTONE_WEEKS) * STREAK_MILESTONE_WEEKS
}

function createStreakMilestoneBadge(milestoneValue: number): BadgeDefinition {
  return {
    id: 'streak-milestone',
    title: `${milestoneValue} semanas de streak`,
    description: `Completou ${milestoneValue} semanas seguidas de treino. Cada bloco de ${STREAK_MILESTONE_WEEKS} semanas fortalece sua consistência.`,
    Icon: Flame,
    order: 4.5,
    hasImageBorder: false,
    tone: 'streak',
  }
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'founder',
    title: 'Fundador',
    description: 'Desenvolvedor que fundou o Tractus. Obrigado por acreditar desde o início!',
    Icon: Laptop,
    order: 0,
    hasImageBorder: true,
    tone: 'founder',
  },
  {
    id: 'premium',
    title: 'Premium',
    description: 'Usuário com acesso Premium ao Tractus e a todos os recursos exclusivos da plataforma.',
    Icon: Crown,
    order: 1,
    hasImageBorder: true,
    tone: 'premium',
  },
  {
    id: 'trainer',
    title: 'Treinador',
    description: 'Personal trainer no Tractus, profissional que orienta os treinos dos alunos.',
    Icon: GraduationCap,
    order: 2,
    hasImageBorder: false,
    tone: 'info',
  },
  {
    id: 'alpha',
    title: 'Alpha User',
    description: 'Fez parte da fase Alpha do Tractus, testando o app antes do lançamento público.',
    Icon: Rocket,
    order: 3,
    hasImageBorder: false,
    tone: 'success',
  },
  {
    id: 'streak-100',
    title: '100 dias de treino',
    description: 'Este usuário completou 100 dias de treino.',
    Icon: Flame,
    order: 5,
    hasImageBorder: false,
    tone: 'streak',
  },
  {
    id: 'streak-leader',
    title: 'Líder de treinos',
    description: 'Este usuário tem o maior acumulado de streaks!',
    Icon: Trophy,
    order: 4,
    hasImageBorder: false,
    tone: 'streak',
  },
]

const BADGE_MAP = new Map(BADGE_DEFINITIONS.map(badge => [badge.id, badge]))

type BadgeSource = {
  badges?: string[]
  isFounder?: boolean
  isPremium?: boolean
  isTrainer?: boolean
  longestStreak?: number
  streakVersion?: number
}

/**
 * Resolve as badges do usuário em ordem de exibição.
 * Fonte: `badges: string[]`; perfis antigos sem o campo usam isFounder/isPremium/isTrainer.
 */
export function resolveUserBadges(user: BadgeSource): BadgeDefinition[] {
  const ids = user.badges && user.badges.length > 0
    ? user.badges
    : [user.isFounder && 'founder', user.isPremium && 'premium', user.isTrainer && 'trainer'].filter((id): id is string => !!id)

  const resolved = ids.map(id => BADGE_MAP.get(id)).filter((badge): badge is BadgeDefinition => !!badge)

  // Perfis ainda não migrados para a streak semanal guardam longestStreak em dias
  const milestoneValue = user.streakVersion === 2 ? getStreakMilestoneValue(user.longestStreak || 0) : 0
  if (milestoneValue > 0) resolved.push(createStreakMilestoneBadge(milestoneValue))

  return resolved.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

/** Tom do anel do avatar: badge de maior prioridade com borda, ou nenhum */
export function resolveAvatarTone(badges: BadgeDefinition[]): BadgeTone | null {
  return badges.find(badge => badge.hasImageBorder)?.tone ?? null
}
