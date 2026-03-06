// --- Card Effects ---
export type CardEffect =
  | { type: 'damage'; value: number }
  | { type: 'damage_shred_armor'; damage: number; shred: number }
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
  | { type: 'redraw_hand'; value: number }
  | { type: 'aoe_damage'; value: number }
  | { type: 'aoe_burn'; value: number }
  | { type: 'self_damage'; value: number }
  | { type: 'lifesteal'; value: number }
  | { type: 'combat_damage_bonus'; value: number }
  | { type: 'vulnerable'; value: number }
  | { type: 'gain_wisdom'; value: number }
  | { type: 'gain_barrier'; value: number }
  | { type: 'gain_charge'; value: number }
  | { type: 'burn_burst'; perStack: number }
  | { type: 'aoe_freeze'; value: number }
  | { type: 'poison_burst'; base: number; perPoison: number }
  | { type: 'set_next_turn_stamina_penalty'; value: number }
  | { type: 'set_end_turn_self_damage'; value: number }
  | { type: 'gain_thorns'; value: number }
  | { type: 'set_magic_absorb'; bonusMana: number }
  | { type: 'global_cost_reduction'; value: number }
  | { type: 'set_damage_taken_multiplier'; value: number }
  | { type: 'set_double_damage_armor_this_turn' }
  | { type: 'hp_percent_for_strength'; hpPercent: number; strength: number }
  | { type: 'current_hp_percent_for_strength'; hpPercent: number; strength: number }
  | { type: 'draw_cards_if_affordable'; value: number }
  | { type: 'conditional_damage_vs_vulnerable'; base: number; vulnerableDamage: number }
  | { type: 'purge_curse'; value: number }
  | { type: 'purge_curse_in_hand_draw' }

export type CostType = 'stamina' | 'mana' | 'free' | 'hybrid'
export type CardCategory = 'combat' | 'spell' | 'technique'
export type Rarity = 'basic' | 'common' | 'rare' | 'epic' | 'legendary'

export interface CardDef {
  id: string
  name: string
  cost: number
  costType: CostType
  category: CardCategory
  rarity: Rarity
  description: string
  effects: CardEffect[]
  exhaust?: boolean
  unplayable?: boolean
  onDrawSelfDamage?: number
  onDrawExhaust?: boolean
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
  | { type: 'curse'; cardId: string; count: number }
  | { type: 'summon'; enemyId: string }
  | { type: 'summon_multi'; enemyId: string; count: number }
  | { type: 'defend_attack'; defendValue: number; attackValue: number }
  | { type: 'heal_ally_lowest'; value: number }
  | { type: 'buff_ally_highest_hp'; value: number }

export interface EnemyDef {
  id: string
  name: string
  sprite: string
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
  tempCostReduction: number
  nextTurnStaminaPenalty: number
  pendingEndTurnSelfDamage: number
  thorns: number
  magicAbsorbBonusMana: number
  damageTakenMultiplier: number
  doubleDamageArmorThisTurn: boolean
  attackDamageMultiplierThisTurn: number
  firstSpellDiscountUsed: boolean
  spellDiscountUsedCountThisTurn: number
  weaponPerTurnUsed: boolean
  attackCounterThisBattle: number
  spellCounterThisBattle: number
  costIncreasedCardDefIds: string[]
  normalAttackUsedThisTurn: boolean
  equippedEnchantments: EnchantmentId[]
  frostCounter: number
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
  evadedThisAction: boolean
  turnStartArmorGain: number
  bossPhase: number
}

export interface TurnTracking {
  combatCardsPlayedThisTurn: number
  damageTakenThisTurn: number
  damageDealtThisTurn: number
  bonusManaNextTurn: number
  combatDamageBonus: number
  enchantEvents: string[]
}

export interface BattleState {
  player: PlayerState
  enemies: EnemyState[]
  trialModifier?: 'flame' | 'speed' | 'endure'
  trialTurnLimit?: number
  enemyDamageMultiplier?: number
  availableMaterials: MaterialBag
  usedMaterials: Partial<Record<MaterialId, boolean>>
  turn: number
  phase: BattlePhase
  turnTracking: TurnTracking
}

export interface WeaponOnCardPlayedContext {
  state: BattleState
  cardDef: CardDef
  spentStaminaCost: number
  targetIndex: number
  targetBeforeHpArmor: number
  drawCards: (state: BattleState, count: number) => BattleState
}

// --- Weapon ---
export type WeaponEffect =
  | { type: 'next_combat_discount'; discount: number }
  | { type: 'first_low_cost_combat_draw'; maxCost: number; draw: number }
  | { type: 'heavy_hit_shred_armor'; minDamage: number; shred: number }
  | { type: 'first_combat_damage_bonus_percent'; percent: number }
  | { type: 'spell_damage_bonus_and_charge'; damagePercent: number; chargeGain: number }
  | { type: 'custom'; text: string }

export interface WeaponDef {
  id: string
  name: string
  rarity: 'basic' | 'upgraded' | 'legendary' | 'replica'
  effect: WeaponEffect
  normalAttack: { damage: number; hits?: number }
  onCardPlayed?: (ctx: WeaponOnCardPlayedContext) => BattleState
}

export type EnchantmentId = 'flame' | 'frost' | 'thunder' | 'soul' | 'void' | 'bless' | 'abyss'

export interface WeaponInstance {
  uid: string
  defId: string
  enchantments: EnchantmentId[]
}

export interface ShopOffer {
  cardId: string
  price: number
  sold: boolean
}

export interface ShopMaterialOffer {
  materialId: MaterialId
  price: number
  sold: boolean
  quantity?: number
}

export type MaterialId =
  | 'iron_ingot'
  | 'steel_ingot'
  | 'mythril_ingot'
  | 'meteor_iron_ingot'
  | 'elemental_essence'
  | 'war_essence'
  | 'guard_essence'
  | 'goblin_crown_fragment'
  | 'shadow_crystal'
  | 'abyss_heart'

export type MaterialBag = Record<MaterialId, number>

// --- Scene ---
export type Scene = 'title' | 'style_lab' | 'weapon_select' | 'map' | 'battle' | 'reward' | 'result' | 'campfire' | 'shop' | 'inventory' | 'forge' | 'enchant' | 'event' | 'act_transition'

export type EventOptionId =
  | 'leave'
  | 'trade_hp_for_rare'
  | 'search_camp'
  | 'camp_rest'
  | 'altar_blood'
  | 'altar_gold'
  | 'altar_leave'
  | 'take_traveler_gift'
  | 'traveler_gold'
  | 'traveler_iron'
  | 'traveler_essence'
  | 'traveler_heal'
  | 'upgrade_random_card'
  | 'remove_random_card'
  | 'temple_power'
  | 'temple_guard'
  | 'temple_wealth'
  | 'temple_purge'
  | 'legacy_equip'
  | 'legacy_salvage'
  | 'cursed_open'
  | 'cursed_leave'
  | 'smith_upgrade'
  | 'smith_steel'
  | 'traveler_help'
  | 'traveler_rob'
  | 'traveler_ignore'
  | 'library_take_two'
  | 'rift_gaze'
  | 'rift_avoid'
  | 'guardian_challenge'
  | 'guardian_escape'
  | 'pool_sacrifice'
  | 'pool_drink'
  | 'caravan_sell_materials'
  | 'caravan_buy_steel_bundle'
  | 'caravan_buy_essence_bundle'
  | 'sanctum_sacrifice'
  | 'sanctum_warrior'
  | 'sanctum_mage'
  | 'sanctum_balance'
  | 'trial_flame'
  | 'trial_speed'
  | 'trial_endure'

export interface EventOptionDef {
  id: EventOptionId
  label: string
  description: string
}

export interface EventDef {
  id:
    | 'mysterious_merchant'
    | 'abandoned_camp'
    | 'altar'
    | 'traveler'
    | 'forge_spirit'
    | 'temple'
    | 'legacy_echo'
    | 'cursed_chest'
    | 'wandering_smith'
    | 'shadow_altar'
    | 'injured_traveler'
    | 'ancient_library'
    | 'abyss_rift'
    | 'ancient_guardian'
    | 'destiny_pool'
    | 'last_caravan'
    | 'sanctum_choice'
    | 'trial_choice'
  title: string
  description: string
  options: EventOptionDef[]
}

export interface PathEntry {
  nodeId: string
  nodeType: NodeType
  at: number
}

export interface BattleLogEntry {
  at: number
  turn: number
  actor: 'player' | 'enemy' | 'system'
  message: string
}

export interface BattleReport {
  nodeId: string
  nodeType: NodeType
  enemyIds: string[]
  startedAt: number
  endedAt?: number
  turns: number
  result?: 'victory' | 'defeat'
  logs: BattleLogEntry[]
}

export interface FinalSnapshot {
  gold: number
  playerHp: number
  playerMaxHp: number
  deckSize: number
  materials: MaterialBag
  weapons: Array<{ defId: string; enchantments: EnchantmentId[] }>
}

export interface RunReport {
  startedAt: number
  endedAt?: number
  durationSec?: number
  path: PathEntry[]
  battles: BattleReport[]
  logs: string[]
}

export interface GameState {
  seedText: string
  rngState: number
  hasAutoSave: boolean
  saveSlots: Array<{
    slot: 1 | 2 | 3
    savedAt: number | null
    scene: Scene | null
    act: 1 | 2 | 3 | null
    hp: number | null
    gold: number | null
  }>
  challengeUnlocked: boolean
  challengeModeEnabled: boolean
  skipTutorial: boolean
  tutorialStep: number
  workshopGuideSeen: boolean
  guideFlags: {
    resonance: boolean
    curse: boolean
    materialEmergency: boolean
    temple: boolean
  }
  activeGuide: { id: string; title: string; body: string } | null
  audio: {
    muted: boolean
    master: number
    sfx: number
    bgm: number
  }
  scene: Scene
  run: RunState | null
  battle: BattleState | null
  currentEvent: EventDef | null
  activeTrialModifier: 'flame' | 'speed' | 'endure' | null
  intermissionMode: 'none' | 'knowledge_pick' | 'knowledge_remove' | 'foresight_pick' | 'deep_purify'
  intermissionCardOptions: CardDef[]
  intermissionRemoveRemaining: number
  rewardCards: CardDef[]
  rewardMaterials: Partial<MaterialBag>
  shopOffers: ShopOffer[]
  shopMaterialOffers: ShopMaterialOffer[]
  droppedWeaponId: string | null
  lastResult: 'victory' | 'defeat' | null
  stats: {
    turns: number
    remainingHp: number
    runReport: RunReport | null
    finalSnapshot: FinalSnapshot | null
  }
}

// --- Map System ---
export type NodeType =
  | 'normal_battle'
  | 'elite_battle'
  | 'boss_battle'
  | 'campfire'
  | 'shop'
  | 'forge'
  | 'enchant'
  | 'event'
  | 'trial'
  | 'temple'
  | 'treasure'

export interface MapNode {
  id: string
  type: NodeType
  enemyIds?: string[]
  requiresMaterial?: MaterialId
  completed: boolean
  x: number
  y: number
  connections: string[]
}

export interface RunState {
  act: 1 | 2 | 3
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
  bonusStrength: number
  bonusWisdom: number
  bonusMaxMana: number
  nextBattleEnemyStrengthBonus: number
  materials: MaterialBag
  unlockedBlueprints?: string[]
  blueprintMastery?: Record<string, number>
  legacyWeaponDefId?: string | null
  legacyWeaponEnchantments?: EnchantmentId[]
  legacyEventSeen?: boolean
  replicaEliteKills?: Record<string, number>
  completedReplicaInheritanceBlueprints?: string[]
}

export interface RewardState {
  candidateCards: CardDef[]
  selectedCard: CardDef | null
}

export type EnemyType =
  | 'goblin_scout'
  | 'forest_wolf'
  | 'mushroom_creature'
  | 'goblin_brute'
  | 'goblin_shaman'
  | 'goblin_king'
  | 'goblin_minion'
  | 'shadow_assassin'
  | 'stone_gargoyle'
  | 'thorn_vine'
  | 'shadow_walker'
  | 'berserker'
  | 'lich'
  | 'iron_golem'
  | 'dark_witch'
  | 'shadow_eye'
  | 'void_messenger'
  | 'soul_weaver'
  | 'elemental_symbiote'
  | 'abyss_knight'
  | 'fate_weaver'
  | 'abyss_lord'
