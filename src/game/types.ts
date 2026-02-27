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
  | { type: 'conditional_damage'; base: number; value: number; condition: 'enemy_damaged' | 'combat_played' }
  | { type: 'execute'; threshold: number; damage: number; baseDamage: number }
  | { type: 'buff_next_combat_double' }
  | { type: 'buff_next_spell'; bonusDamage: number; bonusMana: number }
  | { type: 'self_damage_gain_mana'; damage: number; mana: number }
  | { type: 'scaling_damage'; base: number; perCombatPlayed: number }
  | { type: 'chain_damage'; value: number; bounces: number }
  | { type: 'permanent_poison_on_attack'; value: number }
  | { type: 'damage_gain_armor'; damage: number; armor: number }
  | { type: 'conditional_armor'; value: number; condition: 'damage_taken' }
  | { type: 'draw_cards'; value: number }
  | { type: 'aoe_damage'; value: number }
  | { type: 'aoe_burn'; value: number }
  | { type: 'lifesteal'; value: number }
  | { type: 'combat_damage_bonus'; value: number }
  | { type: 'vulnerable'; value: number }
  | { type: 'gain_wisdom'; value: number }
  | { type: 'gain_barrier'; value: number }
  | { type: 'gain_charge'; value: number }

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
  uid: string
  defId: string
  upgraded?: boolean
}

// --- Enemy ---
export type EnemyIntent =
  | { type: 'attack'; value: number }
  | { type: 'defend'; value: number }
  | { type: 'buff'; buffType: 'strength'; value: number }
  | { type: 'weaken'; value: number }
  | { type: 'poison'; value: number }
  | { type: 'summon'; enemyId: string }
  | { type: 'summon_multi'; enemyId: string; count: number }
  | { type: 'defend_attack'; defendValue: number; attackValue: number }

export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  intents: EnemyIntent[]
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
  strength: number
  weaponDiscount: number
  equippedWeaponId: string | null
  buffNextCombat: number
  poisonOnAttack: number
  buffNextCombatDouble: boolean
  buffNextSpellDamage: number
  buffNextSpellMana: number
  poison: number
  wisdom: number
  barrier: number
  charge: number
  weakened: number
  guardArmorPerTurn: number
  weaponPerTurnUsed: boolean
  normalAttackUsedThisTurn: boolean
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
  freeze: number
  poison: number
  weakened: number
  vulnerable: number
  freezeImmune: boolean
  intentIndex: number
  damagedThisTurn: boolean
}

export interface TurnTracking {
  combatCardsPlayedThisTurn: number
  damageTakenThisTurn: number
  bonusManaNextTurn: number
  combatDamageBonus: number
}

export interface BattleState {
  player: PlayerState
  enemies: EnemyState[]
  availableMaterials: MaterialBag
  usedMaterials: Partial<Record<MaterialId, boolean>>
  turn: number
  phase: BattlePhase
  turnTracking: TurnTracking
}

// --- Weapon ---
export interface WeaponDef {
  id: string
  name: string
  rarity: 'basic' | 'upgraded'
  effect: string
  normalAttack: { damage: number; hits?: number }
}

export interface WeaponInstance {
  uid: string
  defId: string
}

export interface ShopOffer {
  cardId: string
  price: number
  sold: boolean
}

export type MaterialId =
  | 'iron_ingot'
  | 'steel_ingot'
  | 'elemental_essence'
  | 'war_essence'
  | 'guard_essence'
  | 'goblin_crown_fragment'

export type MaterialBag = Record<MaterialId, number>

// --- Scene ---
export type Scene = 'title' | 'map' | 'battle' | 'reward' | 'result' | 'campfire' | 'shop' | 'inventory' | 'forge'

export interface GameState {
  scene: Scene
  run: RunState | null
  battle: BattleState | null
  rewardCards: CardDef[]
  rewardMaterials: Partial<MaterialBag>
  shopOffers: ShopOffer[]
  droppedWeaponId: string | null
  lastResult: 'victory' | 'defeat' | null
  stats: { turns: number; remainingHp: number }
}

// --- Map System ---
export type NodeType = 'normal_battle' | 'elite_battle' | 'boss_battle' | 'campfire' | 'shop' | 'forge'

export interface MapNode {
  id: string
  type: NodeType
  enemyIds?: string[]
  completed: boolean
  x: number
  y: number
  connections: string[]
}

export interface RunState {
  currentNodeId: string
  visitedNodes: Set<string>
  deck: CardInstance[]
  mapNodes: MapNode[]
  turn: number
  equippedWeapon: WeaponInstance | null
  weaponInventory: WeaponInstance[]
  playerHp: number
  playerMaxHp: number
  gold: number
  materials: MaterialBag
}

export interface RewardState {
  candidateCards: CardDef[]
  selectedCard: CardDef | null
}

export type EnemyType =
  | 'goblin_scout'
  | 'forest_wolf'
  | 'mushroom_creature'
  | 'goblin_king'
  | 'goblin_minion'
  | 'shadow_assassin'
  | 'stone_gargoyle'
