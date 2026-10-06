import {
  CalendarDays,
  Crown,
  Dumbbell,
  Flame,
  Smartphone,
  Timer,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native'

// Conteúdo estático do app: onboarding, novidades da versão e modelos de treino

export type OnboardingStep = {
  id: string
  Icon: LucideIcon
  title: string
  description: string
  /** Só aparece para quem ainda não é Premium */
  premiumOnly?: boolean
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    Icon: Dumbbell,
    title: 'Bem-vindo ao Tractus',
    description: 'Organize seus treinos, registre cada série e acompanhe sua evolução. Vamos te mostrar rapidinho como tudo funciona.',
  },
  {
    id: 'workouts',
    Icon: CalendarDays,
    title: 'Monte seus treinos por dia',
    description: 'Na aba Treino, crie um treino para cada dia da semana e adicione os exercícios com séries, repetições e carga. Na hora de treinar, é só marcar o que você fez.',
  },
  {
    id: 'streak',
    Icon: Flame,
    title: 'Mantenha sua sequência',
    description: 'Treine pelo menos uma vez por semana para manter sua streak. Uma semana inteira sem treinar quebra a sequência, a menos que você tenha um freeze.',
  },
  {
    id: 'progress',
    Icon: TrendingUp,
    title: 'Acompanhe sua evolução',
    description: 'Em Perfil › Progresso, veja a evolução da sua carga em cada exercício ao longo do tempo.',
  },
  {
    id: 'friends',
    Icon: UsersRound,
    title: 'Treine acompanhado',
    description: 'Adicione amigos para ver os treinos e conquistas deles, ou conecte-se como treinador e aluno para gerenciar treinos juntos.',
  },
  {
    id: 'premium',
    Icon: Crown,
    title: 'Vá além com o Premium',
    description: 'Calendário de streaks, cores personalizadas, métricas corporais, histórico completo dos amigos e o selo exclusivo no seu perfil.',
    premiumOnly: true,
  },
]

export type ReleaseItem = {
  id: string
  Icon: LucideIcon
  title: string
  description: string
}

export type Release = {
  version: string
  date: string
  title: string
  items: ReleaseItem[]
}

/** Notas da versão atual do app nativo (aparecem uma vez para cada usuário) */
export const currentRelease: Release = {
  version: '3.0.0',
  date: '2026-10-05',
  title: 'O Tractus agora é um app nativo',
  items: [
    {
      id: 'native',
      Icon: Smartphone,
      title: 'Mais rápido e fluido',
      description: 'O app foi reconstruído do zero como aplicativo nativo: abre mais rápido, as transições são mais suaves e tudo funciona mesmo sem internet.',
    },
    {
      id: 'timer',
      Icon: Timer,
      title: 'Timer de descanso confiável',
      description: 'O descanso continua contando mesmo se você sair do app, e a tela fica ligada enquanto você treina.',
    },
    {
      id: 'same-data',
      Icon: Dumbbell,
      title: 'Seus dados continuam aqui',
      description: 'Treinos, histórico, streak e amigos são os mesmos da versão anterior. Nada foi perdido.',
    },
  ],
}

export type WorkoutTemplate = {
  /** Código de compartilhamento (workoutId-userId) de um treino real que serve de modelo */
  id: string
  nome: string
  descricao: string
  categoria: 'push_pull_legs' | 'upper_lower' | 'full_body'
}

export const workoutTemplates: WorkoutTemplate[] = [
  { id: '8ljBR0ocfUkxhoWEY2kk-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Push A - Peito Foco', descricao: 'Empurrão focado em peito, ombros e tríceps', categoria: 'push_pull_legs' },
  { id: 'AFWuEBYjgTVBIRdLAKMw-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Pull A - Costas Completo', descricao: 'Puxada focada em costas e bíceps', categoria: 'push_pull_legs' },
  { id: 'C71ZYmqHqzlZ8ShHZZkD-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Legs A - Completo', descricao: 'Pernas completo com foco em quadríceps e posteriores', categoria: 'push_pull_legs' },
  { id: 'pDJG7caKrhSCvFqABWpo-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Upper Body A', descricao: 'Superiores: peito, costas e ombros', categoria: 'upper_lower' },
  { id: 'NZd0ZOWmPx0rdgE0fVU0-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Lower Body A', descricao: 'Inferiores: pernas e glúteos completo', categoria: 'upper_lower' },
  { id: 'vImy9uIt9WEJjHY6d1Ek-IIbUcDeq32Swfqfg5h9h8KL8iC63', nome: 'Full Body Iniciante', descricao: 'Corpo inteiro para iniciantes', categoria: 'full_body' },
]

export const templateCategories = [
  { value: 'push_pull_legs', label: 'Push/Pull/Legs' },
  { value: 'upper_lower', label: 'Upper/Lower' },
  { value: 'full_body', label: 'Full Body' },
] as const

export const PREMIUM = {
  price: 'R$ 9,90',
  pixKey: 'suporte@trainlog.site',
  whatsapp: '5571982434416',
}
