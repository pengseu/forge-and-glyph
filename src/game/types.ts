// --- Card Effects ---
export type CardEffect =
  | { type: 'damage'; value: number }
  | { type: 'multi_damage'; value: number; hits: number }
  | { type: 'armor'; value: number }
  | { type: 'heal'; value: number }
  | { type: 'gain_mana'; value: number }
  | { type: 'gain_stamina'; value: number }
  | { type: 'burn'; value: number }
  | { type: 'freeze'; value: number }
  | { type: 'poison'; value: number }
  | { type: 'gain_strength'; value: number }
  | { type: 'weaken_enemy'; value: number }
  | { type: 'convert_mana_to_stamina'; value: number }
  | { type: 'buff_next_combat'; value: number }

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
  weaponDiscount: number
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

// --- Weapon ---
export interface WeaponDef {
  id: string
  name: string
  rarity: 'basic' | 'upgraded'
  effect: string
}

export interface WeaponInstance {
  uid: string
  defId: string
}

// --- Scene ---
export type Scene = 'title' | 'map' | 'battle' | 'reward' | 'result' | 'campfire'

export interface GameState {
  scene: Scene
  run: RunState | null
  battle: BattleState | null
  rewardCards: CardDef[]
  lastResult: 'victory' | 'defeat' | null
  stats: { turns: number; remainingHp: number }
}

// --- Map System ---
export type NodeType = 'normal_battle' | 'elite_battle' | 'boss_battle' | 'campfire'

export interface MapNode {
  id: string
  type: NodeType
  enemyId?: string
  completed: boolean
  x: number
  y: number
  connections: string[] // connected node IDs
}

export interface RunState {
  currentNodeId: string
  visitedNodes: Set<string>
  deck: CardInstance[]
  mapNodes: MapNode[]
  turn: number
  equippedWeapon: WeaponInstance | null
  weaponInventory: WeaponInstance[]
}

export interface RewardState {
  candidateCards: CardDef[]
  selectedCard: CardDef | null
}

// --- Enemy Types ---
export type EnemyType = 'goblin_scout' | 'forest_wolf' | 'mushroom_creature' | 'goblin_king'
