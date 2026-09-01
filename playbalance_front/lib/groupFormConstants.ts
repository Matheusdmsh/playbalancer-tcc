/**
 * Constantes compartilhadas para formulários de grupo
 * Usadas em create-group-wizard.tsx e edit-group-sheet.tsx
 */

export const SPORTS = [
  'Futebol', 
  'Vôlei', 
  'Basquete', 
  'Futsal', 
  'Beach Tennis',
  'Tênis', 
  'Padel', 
  'Handebol', 
  'Outros'
] as const

export const WEEK_DAYS = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terça', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sábado', label: 'Sab' },
  { id: 'domingo', label: 'Dom' },
] as const

export const DURATIONS = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
  { value: '150', label: '2h 30min' },
  { value: '180', label: '3 horas' },
] as const

export const PRICE_TYPES = [
  { id: 'per_person', label: 'Por Pessoa' },
  { id: 'total_split', label: 'Valor Total' },
] as const

/**
 * Estilos padronizados para botões dos formulários
 */
export const BUTTON_STYLES = {
  cancel: "flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm",
  submit: "flex-1 bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm",
  back: "flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm",
  next: "flex-1 bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm",
} as const

/**
 * Estilos padronizados para inputs dos formulários
 */
export const INPUT_STYLES = {
  base: "bg-zinc-800 border-zinc-700 focus:border-green-500 focus:ring-green-500",
  select: "bg-zinc-800 border-zinc-700",
  selectContent: "bg-zinc-900 border-zinc-700 text-white",
} as const

/**
 * Estilos padronizados para botões de dias da semana
 */
export const WEEKDAY_BUTTON_STYLES = {
  selected: "bg-green-800 border-green-400 text-white",
  unselected: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-green-400",
} as const

/**
 * Mensagens de descrição para tipos de valor
 */
export const PRICE_TYPE_DESCRIPTIONS = {
  per_person: {
    label: "Por Pessoa:",
    description: "O valor inserido será fixo por participante e multiplicado pela quantidade de jogadores.",
    color: "blue-400"
  },
  total_split: {
    label: "Valor Total:",
    description: "O valor inserido será dividido igualmente entre todos os participantes do racha.",
    color: "green-400"
  }
} as const
