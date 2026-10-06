// Exercise Library Database
// Can be extended with images, videos, and more details

export type MuscleGroup = 
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pernas'
  | 'Quadríceps'
  | 'Posteriores'
  | 'Glúteos'
  | 'Panturrilha'
  | 'Abdômen'
  | 'Antebraço'

export type Equipment = 
  | 'Barra'
  | 'Halteres'
  | 'Máquina'
  | 'Cabo'
  | 'Peso Corporal'
  | 'Kettlebell'
  | 'Elástico'

export interface Exercise {
  id: string
  nome: string
  musculos: MuscleGroup[]
  equipamento: Equipment
  instrucoes?: string
  dificuldade: 'Iniciante' | 'Intermediário' | 'Avançado'
}

export const exerciseLibrary: Exercise[] = [
  // PEITO
  {
    id: 'supino-reto',
    nome: 'Supino Reto',
    musculos: ['Peito', 'Tríceps', 'Ombros'],
    equipamento: 'Barra',
    instrucoes: 'Deitado no banco, desça a barra até o peito e empurre de volta',
    dificuldade: 'Intermediário'
  },
  {
    id: 'supino-inclinado',
    nome: 'Supino Inclinado',
    musculos: ['Peito', 'Ombros', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Similar ao supino reto, mas com banco inclinado 30-45°',
    dificuldade: 'Intermediário'
  },
  {
    id: 'supino-declinado',
    nome: 'Supino Declinado',
    musculos: ['Peito', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Banco declinado, foco na parte inferior do peito',
    dificuldade: 'Intermediário'
  },
  {
    id: 'crucifixo-reto',
    nome: 'Crucifixo Reto',
    musculos: ['Peito'],
    equipamento: 'Halteres',
    instrucoes: 'Abra os braços com halteres, cotovelos levemente flexionados',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crucifixo-inclinado',
    nome: 'Crucifixo Inclinado',
    musculos: ['Peito', 'Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Crucifixo em banco inclinado, foca peito superior',
    dificuldade: 'Iniciante'
  },
  {
    id: 'flexao',
    nome: 'Flexão de Braço',
    musculos: ['Peito', 'Tríceps', 'Ombros'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Clássico exercício de peso corporal',
    dificuldade: 'Iniciante'
  },

  // COSTAS
  {
    id: 'barra-fixa',
    nome: 'Barra Fixa',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Pegada pronada, puxe até o queixo passar a barra',
    dificuldade: 'Intermediário'
  },
  {
    id: 'remada-curvada',
    nome: 'Remada Curvada',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'Incline o tronco e puxe a barra até o abdômen',
    dificuldade: 'Intermediário'
  },
  {
    id: 'puxada-alta',
    nome: 'Puxada Alta',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Sentado, puxe a barra até a altura do peito',
    dificuldade: 'Iniciante'
  },
  {
    id: 'remada-sentada',
    nome: 'Remada Sentada',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Sentado, puxe o cabo até o abdômen',
    dificuldade: 'Iniciante'
  },
  {
    id: 'pullover',
    nome: 'Pullover',
    musculos: ['Costas', 'Peito'],
    equipamento: 'Halteres',
    instrucoes: 'Deitado, leve o halter por trás da cabeça e volte',
    dificuldade: 'Intermediário'
  },
  {
    id: 'levantamento-terra',
    nome: 'Levantamento Terra',
    musculos: ['Costas', 'Posteriores', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Levante a barra do chão mantendo costas retas',
    dificuldade: 'Avançado'
  },

  // OMBROS
  {
    id: 'desenvolvimento-militar',
    nome: 'Desenvolvimento Militar',
    musculos: ['Ombros', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Em pé, empurre a barra acima da cabeça',
    dificuldade: 'Intermediário'
  },
  {
    id: 'desenvolvimento-halteres',
    nome: 'Desenvolvimento com Halteres',
    musculos: ['Ombros', 'Tríceps'],
    equipamento: 'Halteres',
    instrucoes: 'Sentado, empurre halteres acima da cabeça',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-lateral',
    nome: 'Elevação Lateral',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Eleve halteres lateralmente até altura dos ombros',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-frontal',
    nome: 'Elevação Frontal',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Eleve halteres à frente até altura dos ombros',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crucifixo-invertido',
    nome: 'Crucifixo Invertido',
    musculos: ['Ombros', 'Costas'],
    equipamento: 'Halteres',
    instrucoes: 'Inclinado, abra os braços lateralmente',
    dificuldade: 'Intermediário'
  },

  // BÍCEPS
  {
    id: 'rosca-direta',
    nome: 'Rosca Direta',
    musculos: ['Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'Flexione os cotovelos levando a barra até o peito',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-alternada',
    nome: 'Rosca Alternada',
    musculos: ['Bíceps'],
    equipamento: 'Halteres',
    instrucoes: 'Alterne flexões de cotovelo com halteres',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-martelo',
    nome: 'Rosca Martelo',
    musculos: ['Bíceps', 'Antebraço'],
    equipamento: 'Halteres',
    instrucoes: 'Pegada neutra, flexione os cotovelos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-scott',
    nome: 'Rosca Scott',
    musculos: ['Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'No banco scott, isola o bíceps',
    dificuldade: 'Intermediário'
  },

  // TRÍCEPS
  {
    id: 'triceps-testa',
    nome: 'Tríceps Testa',
    musculos: ['Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Deitado, flexione apenas os cotovelos',
    dificuldade: 'Intermediário'
  },
  {
    id: 'triceps-corda',
    nome: 'Tríceps Corda',
    musculos: ['Tríceps'],
    equipamento: 'Cabo',
    instrucoes: 'Puxe a corda para baixo estendendo os cotovelos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'triceps-frances',
    nome: 'Tríceps Francês',
    musculos: ['Tríceps'],
    equipamento: 'Halteres',
    instrucoes: 'Sentado ou em pé, leve halter atrás da cabeça',
    dificuldade: 'Intermediário'
  },
  {
    id: 'mergulho',
    nome: 'Mergulho',
    musculos: ['Tríceps', 'Peito'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Em paralelas, desça e suba o corpo',
    dificuldade: 'Intermediário'
  },

  // PERNAS - QUADRÍCEPS
  {
    id: 'agachamento-livre',
    nome: 'Agachamento Livre',
    musculos: ['Quadríceps', 'Glúteos', 'Posteriores'],
    equipamento: 'Barra',
    instrucoes: 'Com barra nas costas, desça até coxas paralelas',
    dificuldade: 'Intermediário'
  },
  {
    id: 'agachamento-frontal',
    nome: 'Agachamento Frontal',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Barra na frente dos ombros, agache',
    dificuldade: 'Avançado'
  },
  {
    id: 'leg-press',
    nome: 'Leg Press 45°',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'Empurre a plataforma com as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'cadeira-extensora',
    nome: 'Cadeira Extensora',
    musculos: ['Quadríceps'],
    equipamento: 'Máquina',
    instrucoes: 'Estenda as pernas contra resistência',
    dificuldade: 'Iniciante'
  },
  {
    id: 'afundo',
    nome: 'Afundo',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Halteres',
    instrucoes: 'Dê um passo à frente e desça',
    dificuldade: 'Iniciante'
  },

  // PERNAS - POSTERIORES
  {
    id: 'stiff',
    nome: 'Stiff',
    musculos: ['Posteriores', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Pernas semi-retas, desça a barra até o chão',
    dificuldade: 'Intermediário'
  },
  {
    id: 'cadeira-flexora',
    nome: 'Cadeira Flexora',
    musculos: ['Posteriores'],
    equipamento: 'Máquina',
    instrucoes: 'Deitado, flexione as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'mesa-flexora',
    nome: 'Mesa Flexora',
    musculos: ['Posteriores'],
    equipamento: 'Máquina',
    instrucoes: 'De bruços, flexione as pernas',
    dificuldade: 'Iniciante'
  },

  // GLÚTEOS
  {
    id: 'gluteo-quatro-apoios',
    nome: 'Glúteo 4 Apoios',
    musculos: ['Glúteos'],
    equipamento: 'Peso Corporal',
    instrucoes: 'De quatro, eleve a perna para trás',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-pelvica',
    nome: 'Elevação Pélvica',
    musculos: ['Glúteos', 'Posteriores'],
    equipamento: 'Barra',
    instrucoes: 'Deitado, eleve o quadril com barra',
    dificuldade: 'Iniciante'
  },
  {
    id: 'cadeira-abdutora',
    nome: 'Cadeira Abdutora',
    musculos: ['Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'Abra as pernas contra resistência',
    dificuldade: 'Iniciante'
  },

  // PANTURRILHA
  {
    id: 'panturrilha-em-pe',
    nome: 'Panturrilha em Pé',
    musculos: ['Panturrilha'],
    equipamento: 'Máquina',
    instrucoes: 'Eleve os calcanhares o máximo possível',
    dificuldade: 'Iniciante'
  },
  {
    id: 'panturrilha-sentado',
    nome: 'Panturrilha Sentado',
    musculos: ['Panturrilha'],
    equipamento: 'Máquina',
    instrucoes: 'Sentado, eleve os calcanhares',
    dificuldade: 'Iniciante'
  },

  // ABDÔMEN
  {
    id: 'abdominal-reto',
    nome: 'Abdominal Reto',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Deitado, eleve o tronco em direção aos joelhos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'prancha',
    nome: 'Prancha',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Mantenha o corpo reto apoiado nos antebraços',
    dificuldade: 'Iniciante'
  },
  {
    id: 'abdominal-obliquo',
    nome: 'Abdominal Oblíquo',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Rotação do tronco para trabalhar oblíquos',
    dificuldade: 'Iniciante'
  },

  // PEITO (adicionais)
  {
    id: 'supino-halteres',
    nome: 'Supino com Halteres',
    musculos: ['Peito', 'Tríceps', 'Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Igual ao supino reto, mas com halteres — maior amplitude de movimento',
    dificuldade: 'Iniciante'
  },
  {
    id: 'voador-peck-deck',
    nome: 'Voador (Peck Deck)',
    musculos: ['Peito'],
    equipamento: 'Máquina',
    instrucoes: 'Junte os braços à frente do peito na máquina, mantendo cotovelos levemente flexionados',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crossover',
    nome: 'Crossover',
    musculos: ['Peito'],
    equipamento: 'Cabo',
    instrucoes: 'Puxe os cabos de cima cruzando as mãos à frente do corpo',
    dificuldade: 'Intermediário'
  },
  {
    id: 'supino-pegada-fechada',
    nome: 'Supino com Pegada Fechada',
    musculos: ['Tríceps', 'Peito'],
    equipamento: 'Barra',
    instrucoes: 'Pegada estreita no supino, foco maior no tríceps',
    dificuldade: 'Intermediário'
  },

  // COSTAS (adicionais)
  {
    id: 'remada-unilateral',
    nome: 'Remada Unilateral',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Halteres',
    instrucoes: 'Apoiado no banco, puxe o halter até o quadril com um braço de cada vez',
    dificuldade: 'Iniciante'
  },
  {
    id: 'puxada-supinada',
    nome: 'Puxada Supinada',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Puxada com pegada supinada (palmas para cima), maior ativação do bíceps',
    dificuldade: 'Iniciante'
  },
  {
    id: 'puxada-neutra',
    nome: 'Puxada Neutra',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Puxada com triângulo ou pegada neutra, mais confortável para os ombros',
    dificuldade: 'Iniciante'
  },
  {
    id: 'barra-fixa-supinada',
    nome: 'Barra Fixa Supinada (Chin-up)',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Pegada supinada na barra, maior ativação do bíceps que a pegada pronada',
    dificuldade: 'Intermediário'
  },
  {
    id: 'remada-cavalinho',
    nome: 'Remada Cavalinho (T-Bar)',
    musculos: ['Costas'],
    equipamento: 'Barra',
    instrucoes: 'Inclinado sobre a barra fixada no chão, puxe em direção ao abdômen',
    dificuldade: 'Intermediário'
  },
  {
    id: 'hiperextensao',
    nome: 'Hiperextensão Lombar',
    musculos: ['Costas', 'Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'No banco romano, eleve o tronco até a posição horizontal',
    dificuldade: 'Iniciante'
  },

  // OMBROS (adicionais)
  {
    id: 'desenvolvimento-arnold',
    nome: 'Desenvolvimento Arnold',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Inicie com palmas para dentro e gire para fora ao empurrar os halteres',
    dificuldade: 'Intermediário'
  },
  {
    id: 'encolhimento-ombros',
    nome: 'Encolhimento de Ombros (Shrug)',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Eleve os ombros em direção às orelhas, sem dobrar os cotovelos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'face-pull',
    nome: 'Face Pull',
    musculos: ['Ombros', 'Costas'],
    equipamento: 'Cabo',
    instrucoes: 'Puxe a corda em direção ao rosto, abrindo os cotovelos para os lados',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-lateral-cabo',
    nome: 'Elevação Lateral no Cabo',
    musculos: ['Ombros'],
    equipamento: 'Cabo',
    instrucoes: 'Eleve o cabo lateralmente até a altura dos ombros, tensão constante',
    dificuldade: 'Iniciante'
  },

  // BÍCEPS (adicionais)
  {
    id: 'rosca-concentrada',
    nome: 'Rosca Concentrada',
    musculos: ['Bíceps'],
    equipamento: 'Halteres',
    instrucoes: 'Sentado, apoie o cotovelo na coxa e faça a rosca concentrada em um braço',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-barra-w',
    nome: 'Rosca com Barra W (EZ)',
    musculos: ['Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'Barra W reduz o estresse no pulso durante a rosca',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-cabo',
    nome: 'Rosca no Cabo',
    musculos: ['Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Tensão constante no bíceps ao longo de todo o movimento',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-inclinada',
    nome: 'Rosca Inclinada',
    musculos: ['Bíceps'],
    equipamento: 'Halteres',
    instrucoes: 'Banco reclinado 45°, braços atrás do corpo para maior alongamento',
    dificuldade: 'Intermediário'
  },

  // TRÍCEPS (adicionais)
  {
    id: 'triceps-coice',
    nome: 'Tríceps Coice (Kickback)',
    musculos: ['Tríceps'],
    equipamento: 'Halteres',
    instrucoes: 'Inclinado, estenda o braço para trás mantendo o cotovelo fixo',
    dificuldade: 'Iniciante'
  },
  {
    id: 'triceps-maquina',
    nome: 'Tríceps na Máquina',
    musculos: ['Tríceps'],
    equipamento: 'Máquina',
    instrucoes: 'Pressione a barra ou pegas para baixo isolando o tríceps',
    dificuldade: 'Iniciante'
  },
  {
    id: 'extensao-triceps-unilateral',
    nome: 'Extensão de Tríceps Unilateral',
    musculos: ['Tríceps'],
    equipamento: 'Cabo',
    instrucoes: 'Com uma alça, estenda um braço de cada vez para baixo no cabo',
    dificuldade: 'Iniciante'
  },

  // PERNAS / QUADRÍCEPS (adicionais)
  {
    id: 'agachamento-sumo',
    nome: 'Agachamento Sumô',
    musculos: ['Quadríceps', 'Glúteos', 'Posteriores'],
    equipamento: 'Halteres',
    instrucoes: 'Pés afastados e apontados para fora, segure um halter entre as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'agachamento-bulgaro',
    nome: 'Agachamento Búlgaro',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Halteres',
    instrucoes: 'Pé traseiro elevado no banco, agache na perna da frente',
    dificuldade: 'Avançado'
  },
  {
    id: 'hack-squat',
    nome: 'Hack Squat',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'Na máquina de hack squat, desça até 90° e empurre de volta',
    dificuldade: 'Intermediário'
  },
  {
    id: 'step-up',
    nome: 'Step-up no Banco',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Suba e desça de um banco ou caixa alternando as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'passada-caminhando',
    nome: 'Passada Caminhando',
    musculos: ['Quadríceps', 'Glúteos', 'Posteriores'],
    equipamento: 'Halteres',
    instrucoes: 'Alterne passadas à frente andando pelo espaço',
    dificuldade: 'Iniciante'
  },

  // POSTERIORES (adicionais)
  {
    id: 'levantamento-terra-romeno',
    nome: 'Levantamento Terra Romeno',
    musculos: ['Posteriores', 'Glúteos', 'Costas'],
    equipamento: 'Barra',
    instrucoes: 'Pernas levemente flexionadas, desça a barra deslizando pelas coxas',
    dificuldade: 'Intermediário'
  },
  {
    id: 'good-morning',
    nome: 'Good Morning',
    musculos: ['Posteriores', 'Costas'],
    equipamento: 'Barra',
    instrucoes: 'Barra nas costas, incline o tronco à frente mantendo as costas retas',
    dificuldade: 'Intermediário'
  },

  // GLÚTEOS (adicionais)
  {
    id: 'kickback-cabo',
    nome: 'Kickback no Cabo',
    musculos: ['Glúteos'],
    equipamento: 'Cabo',
    instrucoes: 'Apoiado na máquina, empurre a perna para trás com tornozeleira',
    dificuldade: 'Iniciante'
  },
  {
    id: 'abdutora-cabo',
    nome: 'Abdução de Quadril no Cabo',
    musculos: ['Glúteos'],
    equipamento: 'Cabo',
    instrucoes: 'Com tornozeleira, abra a perna lateralmente no cabo',
    dificuldade: 'Iniciante'
  },

  // PANTURRILHA (adicionais)
  {
    id: 'panturrilha-leg-press',
    nome: 'Panturrilha no Leg Press',
    musculos: ['Panturrilha'],
    equipamento: 'Máquina',
    instrucoes: 'Com pés na borda da plataforma, flexione e estenda o tornozelo',
    dificuldade: 'Iniciante'
  },

  // ABDÔMEN (adicionais)
  {
    id: 'roda-abdominal',
    nome: 'Roda Abdominal (Ab Wheel)',
    musculos: ['Abdômen'],
    equipamento: 'Máquina',
    instrucoes: 'De joelhos, role a roda à frente e volte sem deixar o quadril cair',
    dificuldade: 'Avançado'
  },
  {
    id: 'elevacao-pernas-barra',
    nome: 'Elevação de Pernas na Barra',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Suspenso na barra, eleve as pernas até 90° ou acima',
    dificuldade: 'Avançado'
  },
  {
    id: 'elevacao-pernas-deitado',
    nome: 'Elevação de Pernas Deitado',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Deitado, eleve as pernas esticadas até 90° e baixe sem encostar',
    dificuldade: 'Iniciante'
  },
  {
    id: 'russian-twist',
    nome: 'Russian Twist',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Sentado com tronco inclinado, gire de lado a lado (pode usar peso)',
    dificuldade: 'Intermediário'
  },
  {
    id: 'prancha-lateral',
    nome: 'Prancha Lateral',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Apoiado no antebraço e pé, mantenha o corpo reto de lado',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crunch-maquina',
    nome: 'Crunch na Máquina',
    musculos: ['Abdômen'],
    equipamento: 'Máquina',
    instrucoes: 'Flexione o tronco na máquina de abdominal com carga',
    dificuldade: 'Iniciante'
  },
  {
    id: 'obliquo-cabo',
    nome: 'Abdominal Oblíquo no Cabo',
    musculos: ['Abdômen'],
    equipamento: 'Cabo',
    instrucoes: 'Segure o cabo acima e incline lateralmente trabalhando os oblíquos',
    dificuldade: 'Intermediário'
  },
]

// Helper functions
export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase().trim()
  
  if (!lowerQuery) return exerciseLibrary
  
  return exerciseLibrary.filter(exercise => 
    exercise.nome.toLowerCase().includes(lowerQuery) ||
    exercise.musculos.some(musculo => musculo.toLowerCase().includes(lowerQuery)) ||
    exercise.equipamento.toLowerCase().includes(lowerQuery)
  )
}

export const getExercisesByMuscleGroup = (muscleGroup: MuscleGroup): Exercise[] => {
  return exerciseLibrary.filter(exercise => 
    exercise.musculos.includes(muscleGroup)
  )
}

export const getExercisesByEquipment = (equipment: Equipment): Exercise[] => {
  return exerciseLibrary.filter(exercise => 
    exercise.equipamento === equipment
  )
}

export const getMuscleGroups = (): MuscleGroup[] => {
  return Array.from(new Set(exerciseLibrary.flatMap(e => e.musculos)))
}
