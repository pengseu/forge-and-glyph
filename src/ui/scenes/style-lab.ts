import { getCardDef } from '../../game/cards'
import { createBattleState, startTurn } from '../../game/combat'
import { EMPTY_MATERIAL_BAG } from '../../game/materials'
import { createRunState } from '../../game/run'
import type { BattleState, GameState, RunState, ShopMaterialOffer, ShopOffer } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { renderBattle } from './battle'
import { renderForge } from './forge'
import { renderInventory } from './inventory'
import { renderMap } from './map'
import { renderResult } from './result'
import { renderReward } from './reward'
import { renderShop } from './shop'

export type StyleLabScenePreset =
  | 'title'
  | 'weapon_select'
  | 'battle'
  | 'map'
  | 'reward'
  | 'campfire'
  | 'shop'
  | 'inventory'
  | 'forge'
  | 'enchant'
  | 'event'
  | 'act_transition'
  | 'result'

export const STYLE_LAB_LIVE_STAGE_WIDTH = 1280
export const STYLE_LAB_LIVE_STAGE_HEIGHT = 720

export const STYLE_LAB_SCENE_OPTIONS: Array<{ id: StyleLabScenePreset; label: string }> = [
  { id: 'title', label: '标题' },
  { id: 'weapon_select', label: '武器' },
  { id: 'battle', label: '战斗' },
  { id: 'map', label: '地图' },
  { id: 'reward', label: '奖励' },
  { id: 'campfire', label: '篝火' },
  { id: 'shop', label: '商店' },
  { id: 'inventory', label: '背包' },
  { id: 'forge', label: '锻造' },
  { id: 'enchant', label: '附魔' },
  { id: 'event', label: '事件' },
  { id: 'act_transition', label: '幕间' },
  { id: 'result', label: '结算' },
]

const STYLE_LAB_LIVE_SCENES = new Set<StyleLabScenePreset>([
  'battle',
  'map',
  'reward',
  'shop',
  'inventory',
  'forge',
  'result',
])

export function shouldRenderLiveStyleLabPreview(scene: StyleLabScenePreset): boolean {
  return STYLE_LAB_LIVE_SCENES.has(scene)
}

export function computeStyleLabLiveStageScale(previewWidth: number, previewHeight: number): number {
  if (previewWidth <= 0 || previewHeight <= 0) return 1
  return Math.min(1, previewWidth / STYLE_LAB_LIVE_STAGE_WIDTH, previewHeight / STYLE_LAB_LIVE_STAGE_HEIGHT)
}

export function buildStyleLabLiveStageShellHtml(): string {
  return `
    <div class="style-lab-live-shell">
      <div class="style-lab-live-viewport">
        <div class="style-lab-live-stage" style="--live-stage-width:${STYLE_LAB_LIVE_STAGE_WIDTH}px;--live-stage-height:${STYLE_LAB_LIVE_STAGE_HEIGHT}px;">
          <div class="style-lab-live-stage-content"></div>
        </div>
      </div>
    </div>
  `
}

export function normalizeStyleLabScenePreset(scene: string | null | undefined): StyleLabScenePreset {
  const found = STYLE_LAB_SCENE_OPTIONS.find((option) => option.id === scene)
  return found ? found.id : 'title'
}

function buildNoopCallbacks(): GameCallbacks {
  const noop = () => {}
  return {
    onStartGame: noop,
    onSelectCycleTier: noop as (tier: number) => void,
    onContinueGame: noop,
    onOpenStyleLab: noop,
    onCloseStyleLab: noop,
    onLoadSlot: noop as (slot: 1 | 2 | 3) => void,
    onSaveSlot: noop as (slot: 1 | 2 | 3) => void,
    onToggleChallengeMode: noop,
    onToggleSkipTutorial: noop,
    onToggleMute: noop,
    onSetAudioVolume: noop as (channel: 'master' | 'sfx' | 'bgm', value: number) => void,
    onResetGuides: noop,
    onDismissGuide: noop,
    onSelectStartingWeapon: noop as (weaponDefId: 'iron_longsword' | 'iron_staff') => void,
    onSelectNode: noop as (nodeId: string) => void,
    onPlayCard: noop as (cardUid: string, targetIndex?: number) => void,
    onNormalAttack: noop as (targetIndex?: number) => void,
    onUseBattleMaterial: noop as (materialId: import('../../game/types').MaterialId) => void,
    onEndTurn: noop,
    onSelectCard: noop as (cardId: string) => void,
    onSkipReward: noop,
    onSelectMaterialReward: noop,
    onEquipWeapon: noop as (weaponDefId: string) => void,
    onRestart: noop,
    onCampfireHeal: noop,
    onCampfireUpgradeCard: noop as (cardUid: string) => void,
    onCampfireUpgradeWeapon: noop,
    onCampfireContinue: noop,
    onShopBuyCard: noop as (index: number) => void,
    onShopBuyMaterial: noop as (index: number) => void,
    onShopHeal: noop,
    onShopRemoveCard: noop as (cardUid: string) => void,
    onShopTransformCard: noop as (cardUid: string) => void,
    onShopLeave: noop,
    onOpenInventory: noop,
    onCloseInventory: noop,
    onInventoryEquip: noop as (weaponUid: string) => void,
    onForgeCraft: noop as (recipeId: string) => void,
    onForgeEnchant: noop as (enchantmentId: import('../../game/types').EnchantmentId, replaceIndex?: number) => void,
    onForgeUpgradeCard: noop as (cardUid: string) => void,
    onForgeRemoveCard: noop as (cardUid: string) => void,
    onForgeLeave: noop,
    onEnchantApply: noop as (enchantmentId: import('../../game/types').EnchantmentId, replaceIndex?: number) => void,
    onEnchantLeave: noop,
    onEventChoose: noop as (optionId: import('../../game/types').EventOptionId) => void,
    onChooseIntermission: noop as (choiceId: import('../../game/act').IntermissionChoiceId) => void,
    onChooseIntermissionCard: noop as (cardId: string) => void,
    onRemoveIntermissionCard: noop as (cardUid: string) => void,
    onConfirmIntermission: noop,
  }
}

function buildStyleLabRun(): RunState {
  const run = createRunState({ legacyWeaponDefId: 'iron_longsword', unlockedBlueprints: [], blueprintMastery: {} })
  run.gold = 188
  run.playerHp = 42
  run.playerMaxHp = 60
  run.equippedWeapon = { uid: 'w_equipped', defId: 'iron_longsword', enchantments: ['flame', 'thunder'] }
  run.weaponInventory = [
    run.equippedWeapon,
    { uid: 'w_staff', defId: 'iron_staff', enchantments: ['bless'] },
  ]
  run.materials = {
    ...EMPTY_MATERIAL_BAG,
    iron_ingot: 2,
    steel_ingot: 1,
    elemental_essence: 2,
    war_essence: 1,
    guard_essence: 1,
    goblin_crown_fragment: 1,
    shadow_crystal: 1,
    abyss_heart: 0,
    mythril_ingot: 1,
    meteor_iron_ingot: 1,
  }
  run.deck = [
    ...run.deck,
    { uid: 'extra_slash_1', defId: 'slash' },
    { uid: 'extra_block_1', defId: 'block' },
    { uid: 'extra_spark_1', defId: 'spark' },
  ]
  const current = run.mapNodes[0]
  if (current) current.completed = true
  const nextNode = current?.connections[0] ? run.mapNodes.find((node) => node.id === current.connections[0]) : null
  if (nextNode) run.currentNodeId = nextNode.id
  const completedNeighbor = run.mapNodes.find((node) => node.id !== run.currentNodeId && node.y === 0)
  if (completedNeighbor) completedNeighbor.completed = true
  return run
}

function buildStyleLabBattle(): BattleState {
  let battle = createBattleState(
    ['goblin_king', 'goblin_minion', 'shadow_assassin', 'stone_gargoyle'],
    undefined,
    'iron_longsword',
    { ...EMPTY_MATERIAL_BAG, iron_ingot: 1, elemental_essence: 1, guard_essence: 1 },
    ['flame', 'thunder'],
  )
  battle = startTurn(battle)
  battle.player = {
    ...battle.player,
    hp: 42,
    armor: 9,
    strength: 2,
    wisdom: 1,
    barrier: 4,
    charge: 2,
    poisonOnAttack: 2,
  }
  battle.enemies = battle.enemies.map((enemy, index) => {
    if (index === 0) return { ...enemy, hp: 54, maxHp: 90, armor: 10, strength: 2, intentIndex: 1 }
    if (index === 1) return { ...enemy, hp: 18, maxHp: 18, burn: 2, vulnerable: 1 }
    if (index === 2) return { ...enemy, hp: 22, maxHp: 28, poison: 3, weakened: 1 }
    return { ...enemy, hp: 30, maxHp: 40, armor: 6, intentIndex: 0 }
  })
  return battle
}

function buildStyleLabRewardCards() {
  return [getCardDef('slash'), getCardDef('spark'), getCardDef('block')]
}

function buildStyleLabShopOffers(): { offers: ShopOffer[]; materialOffers: ShopMaterialOffer[] } {
  return {
    offers: [
      { cardId: 'slash', price: 52, sold: false },
      { cardId: 'spark', price: 66, sold: false },
      { cardId: 'block', price: 41, sold: true },
    ],
    materialOffers: [
      { materialId: 'iron_ingot', price: 22, quantity: 2, sold: false },
      { materialId: 'elemental_essence', price: 40, quantity: 1, sold: false },
      { materialId: 'guard_essence', price: 40, quantity: 1, sold: true },
    ],
  }
}

function buildStyleLabResultStats(): GameState['stats'] {
  return {
    turns: 9,
    remainingHp: 17,
    finalSnapshot: {
      gold: 188,
      playerHp: 17,
      playerMaxHp: 60,
      deckSize: 15,
      materials: {
        ...EMPTY_MATERIAL_BAG,
        iron_ingot: 2,
        steel_ingot: 1,
        mythril_ingot: 0,
        meteor_iron_ingot: 0,
        elemental_essence: 2,
        war_essence: 0,
        guard_essence: 0,
        goblin_crown_fragment: 1,
        shadow_crystal: 0,
        abyss_heart: 0,
      },
      weapons: [{ defId: 'iron_longsword', enchantments: ['flame', 'thunder'] }],
    },
    runReport: {
      startedAt: 1,
      durationSec: 245,
      path: [
        { nodeId: 'n1', nodeType: 'normal_battle', at: 1 },
        { nodeId: 'n2', nodeType: 'shop', at: 2 },
        { nodeId: 'n3', nodeType: 'boss_battle', at: 3 },
      ],
      logs: ['样式工坊预览：用于验证结果页布局'],
      battles: [
        {
          nodeId: 'n1',
          nodeType: 'normal_battle',
          enemyIds: ['goblin_scout'],
          startedAt: 1,
          turns: 3,
          result: 'victory',
          logs: [{ at: 1, turn: 1, actor: 'system', message: '战斗开始' }],
        },
        {
          nodeId: 'n3',
          nodeType: 'boss_battle',
          enemyIds: ['goblin_king'],
          startedAt: 2,
          turns: 6,
          result: 'victory',
          logs: [{ at: 2, turn: 6, actor: 'player', message: '击败地精王' }],
        },
      ],
    },
  }
}

function renderScenePreview(scene: StyleLabScenePreset): string {
  if (scene === 'title') {
    return `
      <div class="style-lab-scene style-lab-scene--title">
        <div class="mock-title-bg"></div>
        <div class="mock-title-content">
          <div class="mock-title-main">锻铸与咒印</div>
          <div class="mock-title-sub">Forge & Glyph</div>
          <div class="mock-btn-row">
            <button class="btn btn-primary btn-lg">开始冒险</button>
            <button class="btn btn-md">样式工坊</button>
          </div>
        </div>
      </div>
    `
  }
  if (scene === 'weapon_select') {
    return `
      <div class="style-lab-scene style-lab-scene--weapon">
        <div class="mock-header">选择你的起始武器</div>
        <div class="mock-two-col">
          <section class="panel">长剑面板</section>
          <section class="panel">法杖面板</section>
        </div>
      </div>
    `
  }
  if (scene === 'campfire') {
    return `
      <div class="style-lab-scene style-lab-scene--campfire">
        <div class="mock-header">篝火休憩</div>
        <div class="mock-art-box">篝火图</div>
        <div class="mock-three-panels">
          <section class="panel">休息</section>
          <section class="panel">升级卡牌</section>
          <section class="panel">继续旅程</section>
        </div>
      </div>
    `
  }
  if (scene === 'enchant') {
    return `
      <div class="style-lab-scene style-lab-scene--enchant">
        <div class="mock-header">附魔台</div>
        <div class="mock-two-col">
          <section class="panel">附魔列表</section>
          <section class="panel">武器预览</section>
        </div>
      </div>
    `
  }
  if (scene === 'event') {
    return `
      <div class="style-lab-scene style-lab-scene--event">
        <section class="panel mock-event-panel">
          <div class="panel-title">随机事件</div>
          <div class="panel-body">事件文案区域</div>
          <div class="mock-btn-row">
            <button class="btn btn-md">选项A</button>
            <button class="btn btn-md btn-ghost">选项B</button>
          </div>
        </section>
      </div>
    `
  }
  if (scene === 'act_transition') {
    return `
      <div class="style-lab-scene style-lab-scene--act-transition">
        <section class="panel mock-event-panel">
          <div class="panel-title">第 2 幕 · 幕间抉择</div>
          <div class="mock-three-panels">
            <section class="panel">抉择1</section>
            <section class="panel">抉择2</section>
            <section class="panel">抉择3</section>
          </div>
        </section>
      </div>
    `
  }
  return buildStyleLabLiveStageShellHtml()
}

function mountLivePreview(scene: StyleLabScenePreset, host: HTMLElement): void {
  const callbacks = buildNoopCallbacks()
  if (scene === 'battle') {
    renderBattle(host, buildStyleLabBattle(), callbacks, undefined, 1)
    return
  }
  if (scene === 'map') {
    renderMap(host, buildStyleLabRun(), [], callbacks)
    return
  }
  if (scene === 'reward') {
    renderReward(
      host,
      buildStyleLabRewardCards(),
      { iron_ingot: 1, elemental_essence: 2, guard_essence: 1 },
      'iron_staff',
      callbacks,
      2,
      '已自动获得：暗影水晶 ×1',
    )
    return
  }
  if (scene === 'shop') {
    const run = buildStyleLabRun()
    const { offers, materialOffers } = buildStyleLabShopOffers()
    renderShop(host, run, offers, materialOffers, callbacks)
    return
  }
  if (scene === 'inventory') {
    renderInventory(host, buildStyleLabRun(), callbacks)
    return
  }
  if (scene === 'forge') {
    renderForge(host, buildStyleLabRun(), callbacks)
    return
  }
  if (scene === 'result') {
    renderResult(host, 'victory', buildStyleLabResultStats(), () => {})
  }
}

function syncLiveStageScale(preview: HTMLElement): void {
  const stage = preview.querySelector<HTMLElement>('.style-lab-live-stage')
  if (!stage) return
  const rect = preview.getBoundingClientRect()
  const scale = computeStyleLabLiveStageScale(rect.width, rect.height)
  stage.style.setProperty('--live-stage-scale', `${scale}`)
}

export function renderStyleLab(
  container: HTMLElement,
  onBack: () => void,
): void {
  const defaultScene: StyleLabScenePreset = 'battle'
  container.innerHTML = `
    <div class="scene-style-lab">
      <header class="style-lab-topbar">
        <button class="btn btn-ghost btn-sm" id="btn-style-lab-back">← 返回首页</button>
        <h2 class="style-lab-title">样式测试工坊</h2>
      </header>
      <nav class="style-lab-tabs" aria-label="场景预览模式">
        ${STYLE_LAB_SCENE_OPTIONS.map((option) => `
          <button
            class="style-lab-tab ${option.id === defaultScene ? 'is-active' : ''}"
            data-scene-preset="${option.id}"
            aria-selected="${option.id === defaultScene ? 'true' : 'false'}"
          >${option.label}</button>
        `).join('')}
      </nav>
      <section id="style-lab-preview">${renderScenePreview(defaultScene)}</section>
      <footer class="style-lab-footer">
        已接入真实页面预览的场景：战斗 / 地图 / 奖励 / 商店 / 背包 / 锻造 / 结算，其余仍为结构占位图。
      </footer>
    </div>
  `

  container.querySelector('#btn-style-lab-back')?.addEventListener('click', onBack)

  const preview = container.querySelector<HTMLElement>('#style-lab-preview')
  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('.style-lab-tab'))
  if (!preview || tabs.length === 0) return

  let resizeHandler: (() => void) | null = null

  const switchTo = (sceneRaw: string | null | undefined): void => {
    const scene = normalizeStyleLabScenePreset(sceneRaw)
    preview.innerHTML = renderScenePreview(scene)
    preview.classList.toggle('is-live-preview', shouldRenderLiveStyleLabPreview(scene))
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    if (shouldRenderLiveStyleLabPreview(scene)) {
      const host = preview.querySelector<HTMLElement>('.style-lab-live-stage-content')
      if (host) {
        mountLivePreview(scene, host)
        resizeHandler = () => syncLiveStageScale(preview)
        syncLiveStageScale(preview)
        window.addEventListener('resize', resizeHandler)
      }
    }
    tabs.forEach((tab) => {
      const active = tab.dataset.scenePreset === scene
      tab.classList.toggle('is-active', active)
      tab.setAttribute('aria-selected', active ? 'true' : 'false')
    })
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTo(tab.dataset.scenePreset))
  })

  switchTo(defaultScene)
}
