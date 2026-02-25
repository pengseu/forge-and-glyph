// --- Card Effects ---
export type CardEffect =
  | { type: 'damage'; value: number }
  | { type: 'multi_damage'; value: number; hits: number }
  | { type: 'armor'; value: number }
  | { type: 'heal'; value: number }
  | { type: 'gain_mana'; value: number }
  | { type: 'gain_stamina'; value: number }
  | { type: 'burn'; value: number }

export type CostType = 'stamina' | 'mana' | 'free'
export type CardCategory = 'combat' | 'spell' | 'technique'
export type Rarity = 'basic' | 'common' | 'rare' | 'epic'

export interface CardDef {
  id: string
  name: string
  cost: number
  costType: CostType
  category: CardCategory
  rarity: Rarity
  description: string
  effects: CardEffect[]
}

export interface CardInstance {
  uid: string        // unique per instance in deck
  defId: string      // references CardDef.id
}

// --- Enemy ---
export type EnemyIntent =
  | { type: 'attack'; value: number }
  | { type: 'defend'; value: number }
  | { type: 'buff'; buffType: 'strength'; value: number }

export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  intents: EnemyIntent[]  // cycles through these
}

// --- Battle State ---
export type BattlePhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat'

export interface PlayerState {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  mana: number
  maxMana: number
  armor: number
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
}

export interface EnemyState {
  defId: string
  hp: number
  maxHp: number
  armor: number
  strength: number
  burn: number
  intentIndex: number
}

export interface BattleState {
  player: PlayerState
  enemy: EnemyState
  turn: number
  phase: BattlePhase
}

// --- Scene ---
export type Scene = 'title' | 'battle' | 'result'

export interface GameState {
  scene: Scene
  battle: BattleState | null
  lastResult: 'victory' | 'defeat' | null
  stats: { turns: number; remainingHp: number }
}
