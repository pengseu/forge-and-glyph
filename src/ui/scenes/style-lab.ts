import handCardSkin from '../../assets/style-lab/stylelab_hand_card_bg.png'
import weaponCardSkin from '../../assets/style-lab/stylelab_weapon_card_bg.png'
import { createStarterDeck } from '../../game/cards'
import { createBattleState, startTurn } from '../../game/combat'
import { rollEventByAct } from '../../game/events'
import { EMPTY_MATERIAL_BAG } from '../../game/materials'
import { getRewardCardsByAct } from '../../game/reward'
import { addWeaponToInventory, createRunState, completeNode, equipWeapon } from '../../game/run'
import { generateShopMaterialOffersByAct, generateShopOffersByAct } from '../../game/shop'
import type { StyleLabPreviewMode } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { renderBattle } from './battle'
import { renderEvent } from './event'
import { renderInventory } from './inventory'
import { renderMap } from './map'
import { renderReward } from './reward'
import { renderShop } from './shop'

export type CardLayoutTemplate = 'weapon' | 'hand'
export type CardLayoutElementId =
  | 'name'
  | 'cost'
  | 'art'
  | 'description'
  | 'type'
  | 'enchant_1'
  | 'enchant_2'
  | 'enchant_3'

export interface CardLayoutRect {
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

export interface CardLayoutCanvas {
  width: number
  height: number
}

export interface CardLayoutConfig {
  canvas: CardLayoutCanvas
  elements: Record<CardLayoutElementId, CardLayoutRect>
}

interface CardLayoutState {
  activeTemplate: CardLayoutTemplate
  layouts: Record<CardLayoutTemplate, CardLayoutConfig>
}

const CARD_LAYOUT_STORAGE_KEY = 'fg_style_lab_card_layout_v1'
const CARD_LAYOUT_ELEMENT_ORDER: CardLayoutElementId[] = [
  'name',
  'cost',
  'art',
  'description',
  'type',
  'enchant_1',
  'enchant_2',
  'enchant_3',
]
const CARD_LAYOUT_ELEMENT_LABELS: Record<CardLayoutElementId, string> = {
  name: '名称',
  cost: '费用',
  art: '插画',
  description: '描述',
  type: '类型',
  enchant_1: '附魔1',
  enchant_2: '附魔2',
  enchant_3: '附魔3',
}
const CARD_LAYOUT_VISIBLE_ELEMENTS: Record<CardLayoutTemplate, CardLayoutElementId[]> = {
  weapon: ['name', 'art', 'enchant_1', 'enchant_2', 'enchant_3', 'type', 'description'],
  hand: ['name', 'cost', 'art', 'description', 'type'],
}

export const STYLE_LAB_CARD_SKINS: Record<CardLayoutTemplate, string> = {
  weapon: weaponCardSkin,
  hand: handCardSkin,
}

export const STYLE_LAB_PREVIEW_MODES: StyleLabPreviewMode[] = [
  'battle',
  'map',
  'shop',
  'reward',
  'event',
  'weapon_select',
  'inventory',
  'card_layout',
]

const MODE_LABELS: Record<StyleLabPreviewMode, string> = {
  battle: '战斗预览',
  map: '地图预览',
  shop: '商店预览',
  reward: '奖励预览',
  event: '事件预览',
  weapon_select: '武器选择预览',
  inventory: '背包预览',
  card_layout: '卡牌布局',
}

let cachedCardLayoutState: CardLayoutState | null = null
let selectedCardLayoutElement: CardLayoutElementId = 'name'

export function resolveStyleLabPreviewTitle(mode: StyleLabPreviewMode): string {
  return MODE_LABELS[mode]
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createPreviewRun() {
  const runRng = createSeededRng(20260302)
  let run = createRunState(undefined, runRng)
  run = completeNode(run, run.currentNodeId)
  return {
    ...run,
    act: 2 as const,
    gold: 188,
    playerHp: 43,
    playerMaxHp: 82,
  }
}

function createPreviewInventoryRun() {
  const runRng = createSeededRng(20260321)
  let run = createRunState(undefined, runRng)
  run = completeNode(run, run.currentNodeId)
  run = {
    ...run,
    act: 2 as const,
    gold: 188,
    playerHp: 43,
    playerMaxHp: 82,
    materials: {
      ...run.materials,
      iron_ingot: 3,
      steel_ingot: 2,
      elemental_essence: 2,
      war_essence: 1,
      guard_essence: 1,
    },
  }
  run = addWeaponToInventory(run, 'iron_longsword')
  run = addWeaponToInventory(run, 'iron_staff')
  if (run.weaponInventory[0]) {
    run = equipWeapon(run, run.weaponInventory[0].uid)
  }
  return run
}

function createPreviewBattle() {
  const materials = {
    ...EMPTY_MATERIAL_BAG,
    iron_ingot: 1,
    elemental_essence: 1,
    war_essence: 1,
  }

  let battle = createBattleState(
    ['goblin_shaman', 'thorn_vine'],
    createStarterDeck(),
    'steel_longsword',
    materials,
    ['flame', 'bless'],
  )
  battle = startTurn(battle)

  return {
    ...battle,
    turn: 4,
    player: {
      ...battle.player,
      hp: 41,
      maxHp: 82,
      armor: 12,
      strength: 2,
      mana: 3,
      maxMana: 3,
      thorns: 3,
      barrier: 5,
      charge: 1,
    },
    enemies: battle.enemies.map((enemy, index) => {
      if (index === 0) {
        return {
          ...enemy,
          hp: Math.max(1, enemy.hp - 8),
          armor: 6,
          burn: 2,
          weakened: 1,
        }
      }
      return {
        ...enemy,
        hp: Math.max(1, enemy.hp - 4),
        poison: 4,
      }
    }),
    turnTracking: {
      ...battle.turnTracking,
      enchantEvents: ['烈焰触发', '祝福触发'],
    },
  }
}

export function createDefaultCardLayout(template: CardLayoutTemplate): CardLayoutConfig {
  const canvas = { width: 340, height: 500 }
  if (template === 'weapon') {
    return {
      canvas,
      elements: {
        // Weapon card defaults from latest JSON layout
        name: { x: 34, y: 43, width: 225, height: 20, fontSize: 18 },
        cost: { x: 270, y: 24, width: 44, height: 44, fontSize: 16 }, // hidden in weapon template
        art: { x: 54, y: 80, width: 230, height: 200, fontSize: 12 },
        description: { x: 38, y: 359, width: 260, height: 85, fontSize: 13 },
        type: { x: 190, y: 305, width: 80, height: 30, fontSize: 18 },
        enchant_1: { x: 37, y: 300, width: 30, height: 30, fontSize: 16 },
        enchant_2: { x: 89, y: 300, width: 30, height: 30, fontSize: 16 },
        enchant_3: { x: 142, y: 300, width: 30, height: 30, fontSize: 16 },
      },
    }
  }
  return {
    canvas,
    elements: {
      // Hand card defaults from latest JSON layout
      name: { x: 47, y: 14, width: 258, height: 40, fontSize: 22 },
      cost: { x: 32, y: 69, width: 40, height: 40, fontSize: 30 },
      art: { x: 49, y: 73, width: 240, height: 215, fontSize: 12 },
      description: { x: 38, y: 343, width: 267, height: 105, fontSize: 14 },
      type: { x: 145, y: 273, width: 49, height: 49, fontSize: 23 },
      enchant_1: { x: 32, y: 296, width: 42, height: 42, fontSize: 16 }, // hidden in hand template
      enchant_2: { x: 80, y: 296, width: 42, height: 42, fontSize: 16 }, // hidden in hand template
      enchant_3: { x: 128, y: 296, width: 42, height: 42, fontSize: 16 }, // hidden in hand template
    },
  }
}

function safeParseInt(raw: string, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

export function clampCardLayoutElement(rect: CardLayoutRect, bounds: CardLayoutCanvas): CardLayoutRect {
  const width = Math.max(20, Math.min(bounds.width, Math.round(rect.width)))
  const height = Math.max(20, Math.min(bounds.height, Math.round(rect.height)))
  const x = Math.max(0, Math.min(bounds.width - width, Math.round(rect.x)))
  const y = Math.max(0, Math.min(bounds.height - height, Math.round(rect.y)))
  const fontSize = Math.max(8, Math.min(48, Math.round(rect.fontSize)))
  return { x, y, width, height, fontSize }
}

export function serializeCardLayoutConfig(template: CardLayoutTemplate, layout: CardLayoutConfig): string {
  return JSON.stringify(
    {
      template,
      canvas: layout.canvas,
      elements: layout.elements,
    },
    null,
    2,
  )
}

function readCardLayoutState(): CardLayoutState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CARD_LAYOUT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CardLayoutState>
    const activeTemplate = parsed.activeTemplate === 'weapon' || parsed.activeTemplate === 'hand'
      ? parsed.activeTemplate
      : 'weapon'

    const layouts: Record<CardLayoutTemplate, CardLayoutConfig> = {
      weapon: createDefaultCardLayout('weapon'),
      hand: createDefaultCardLayout('hand'),
    }

    for (const template of ['weapon', 'hand'] as const) {
      const candidate = parsed.layouts?.[template]
      if (!candidate) continue
      const base = createDefaultCardLayout(template)
      const canvas = {
        width: safeParseInt(String(candidate.canvas?.width ?? base.canvas.width), base.canvas.width),
        height: safeParseInt(String(candidate.canvas?.height ?? base.canvas.height), base.canvas.height),
      }
      const nextElements: CardLayoutConfig['elements'] = {
        name: base.elements.name,
        cost: base.elements.cost,
        art: base.elements.art,
        description: base.elements.description,
        type: base.elements.type,
        enchant_1: base.elements.enchant_1,
        enchant_2: base.elements.enchant_2,
        enchant_3: base.elements.enchant_3,
      }
      for (const id of CARD_LAYOUT_ELEMENT_ORDER) {
        const current = candidate.elements?.[id]
        if (!current) continue
        nextElements[id] = clampCardLayoutElement(
          {
            x: safeParseInt(String(current.x), base.elements[id].x),
            y: safeParseInt(String(current.y), base.elements[id].y),
            width: safeParseInt(String(current.width), base.elements[id].width),
            height: safeParseInt(String(current.height), base.elements[id].height),
            fontSize: safeParseInt(String(current.fontSize ?? base.elements[id].fontSize), base.elements[id].fontSize),
          },
          canvas,
        )
      }
      layouts[template] = { canvas, elements: nextElements }
    }

    return { activeTemplate, layouts }
  } catch {
    return null
  }
}

function ensureCardLayoutState(): CardLayoutState {
  if (cachedCardLayoutState) return cachedCardLayoutState
  const stored = readCardLayoutState()
  if (stored) {
    cachedCardLayoutState = stored
    return stored
  }
  cachedCardLayoutState = {
    activeTemplate: 'weapon',
    layouts: {
      weapon: createDefaultCardLayout('weapon'),
      hand: createDefaultCardLayout('hand'),
    },
  }
  return cachedCardLayoutState
}

function persistCardLayoutState(state: CardLayoutState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CARD_LAYOUT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage write failures
  }
}

function setRectOnLayout(
  state: CardLayoutState,
  template: CardLayoutTemplate,
  elementId: CardLayoutElementId,
  patch: Partial<CardLayoutRect>,
): void {
  const layout = state.layouts[template]
  const current = layout.elements[elementId]
  layout.elements[elementId] = clampCardLayoutElement({ ...current, ...patch }, layout.canvas)
}

function getElementPreviewText(template: CardLayoutTemplate, elementId: CardLayoutElementId): string {
  if (elementId === 'name') return '灰烬回响'
  if (elementId === 'cost') return '2⚡'
  if (elementId === 'enchant_1') return '火'
  if (elementId === 'enchant_2') return '雷'
  if (elementId === 'enchant_3') return '冰'
  if (elementId === 'description') {
    if (template === 'hand') return '【稀有】造成8点伤害，若目标灼烧则再造成4点伤害。'
    return '【传说】强化本回合普攻；若目标已灼烧则追加一次穿甲。'
  }
  if (elementId === 'type') return template === 'hand' ? '战技' : '长剑·武器'
  return '插画区域'
}

function renderWeaponSelectLab(previewContainer: HTMLElement): void {
  const state = ensureCardLayoutState()
  const layout = state.layouts.weapon
  const el = layout.elements
  const enchants: Array<keyof CardLayoutConfig['elements']> = ['enchant_1', 'enchant_2', 'enchant_3']

  const renderWeaponCard = (title: string, typeLabel: string, description: string, cta: string): string => {
    const enchantHtml = enchants
      .map((id, index) => {
        const rect = el[id]
        const glyph = ['火', '雷', '冰'][index]
        return `
          <div class="style-lab-preview-field style-lab-preview-enchant" style="left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;font-size:${rect.fontSize}px;">
            ${glyph}
          </div>
        `
      })
      .join('')

    return `
      <div class="style-lab-weapon-choice-card">
        <div class="style-lab-card-surface style-lab-weapon-card-surface" style="width:${layout.canvas.width}px;height:${layout.canvas.height}px;background-image:url('${STYLE_LAB_CARD_SKINS.weapon}')">
          <div class="style-lab-preview-field style-lab-preview-name" style="left:${el.name.x}px;top:${el.name.y}px;width:${el.name.width}px;height:${el.name.height}px;font-size:${el.name.fontSize}px;">${title}</div>
          <div class="style-lab-preview-field style-lab-preview-art" style="left:${el.art.x}px;top:${el.art.y}px;width:${el.art.width}px;height:${el.art.height}px;font-size:${el.art.fontSize}px;">武器插画</div>
          ${enchantHtml}
          <div class="style-lab-preview-field style-lab-preview-type" style="left:${el.type.x}px;top:${el.type.y}px;width:${el.type.width}px;height:${el.type.height}px;font-size:${el.type.fontSize}px;">${typeLabel}</div>
          <div class="style-lab-preview-field style-lab-preview-description" style="left:${el.description.x}px;top:${el.description.y}px;width:${el.description.width}px;height:${el.description.height}px;font-size:${el.description.fontSize}px;">${description}</div>
        </div>
        <button class="btn" disabled>${cta}</button>
      </div>
    `
  }

  previewContainer.innerHTML = `
    <div class="style-lab-weapon-select">
      <h3>选择起始武器</h3>
      <p class="style-lab-subtitle">此预览仅用于检查开局武器选择页的卡面布局样式。</p>
      <div class="style-lab-weapon-select-grid">
        ${renderWeaponCard('铁制长剑', '长剑·战技', '【基础】普攻后提升本回合战技伤害。', '选择长剑')}
        ${renderWeaponCard('铁制法杖', '法杖·法术', '【基础】释放法术时获得额外法力回复。', '选择法杖')}
      </div>
    </div>
  `
}

function applyBattleHandCardStyle(previewContainer: HTMLElement): void {
  const state = ensureCardLayoutState()
  const layout = state.layouts.hand
  const scale = 0.33
  const cardWidth = Math.round(layout.canvas.width * scale)
  const cardHeight = Math.round(layout.canvas.height * scale)
  const cardRadius = Math.max(4, Math.round(8 * scale))

  previewContainer.classList.add('style-lab-battle-preview')
  previewContainer.querySelectorAll<HTMLElement>('.card').forEach((cardEl) => {
    cardEl.style.width = `${cardWidth}px`
    cardEl.style.minHeight = `${cardHeight}px`
    cardEl.style.height = `${cardHeight}px`
    cardEl.style.padding = '0'
    cardEl.style.border = 'none'
    cardEl.style.backgroundImage = `url('${STYLE_LAB_CARD_SKINS.hand}')`
    cardEl.style.backgroundSize = 'cover'
    cardEl.style.backgroundRepeat = 'no-repeat'
    cardEl.style.backgroundPosition = 'center'
    cardEl.style.position = 'relative'
    cardEl.style.overflow = 'hidden'
    cardEl.style.borderRadius = `${cardRadius}px`

    const nameEl = cardEl.querySelector<HTMLElement>('.card-name')
    const costEl = cardEl.querySelector<HTMLElement>('.card-cost')
    const descEl = cardEl.querySelector<HTMLElement>('.card-desc')

    const applyField = (el: HTMLElement | null, rect: CardLayoutRect) => {
      if (!el) return
      el.style.position = 'absolute'
      el.style.left = `${Math.round(rect.x * scale)}px`
      el.style.top = `${Math.round(rect.y * scale)}px`
      el.style.width = `${Math.round(rect.width * scale)}px`
      el.style.height = `${Math.round(rect.height * scale)}px`
      el.style.fontSize = `${Math.max(7, Math.round(rect.fontSize * scale))}px`
      el.style.margin = '0'
      el.style.lineHeight = '1.25'
      el.style.overflow = 'hidden'
      el.style.zIndex = '1'
      el.style.color = '#f0f4fb'
      el.style.textShadow = '1px 1px 0 rgba(0,0,0,0.65)'
    }

    applyField(nameEl, layout.elements.name)
    applyField(costEl, layout.elements.cost)
    applyField(descEl, layout.elements.description)
  })
}

function applySceneCardFaceStyle(
  previewContainer: HTMLElement,
  cardSelector: string,
  buttonSelector?: string,
): void {
  const state = ensureCardLayoutState()
  const layout = state.layouts.hand
  const scale = 0.46
  const cardWidth = Math.round(layout.canvas.width * scale)
  const cardHeight = Math.round(layout.canvas.height * scale)
  const cardRadius = Math.max(4, Math.round(8 * scale))

  const applyField = (el: HTMLElement | null, rect: CardLayoutRect) => {
    if (!el) return
    el.style.position = 'absolute'
    el.style.left = `${Math.round(rect.x * scale)}px`
    el.style.top = `${Math.round(rect.y * scale)}px`
    el.style.width = `${Math.round(rect.width * scale)}px`
    el.style.height = `${Math.round(rect.height * scale)}px`
    el.style.fontSize = `${Math.max(7, Math.round(rect.fontSize * scale))}px`
    el.style.margin = '0'
    el.style.lineHeight = '1.25'
    el.style.overflow = 'hidden'
    el.style.zIndex = '2'
    el.style.color = '#f0f4fb'
    el.style.textShadow = '1px 1px 0 rgba(0,0,0,0.65)'
  }

  previewContainer.querySelectorAll<HTMLElement>(cardSelector).forEach((cardEl) => {
    cardEl.style.width = `${cardWidth}px`
    cardEl.style.minHeight = `${cardHeight}px`
    cardEl.style.height = `${cardHeight}px`
    cardEl.style.padding = '0'
    cardEl.style.border = 'none'
    cardEl.style.backgroundImage = `url('${STYLE_LAB_CARD_SKINS.hand}')`
    cardEl.style.backgroundSize = 'cover'
    cardEl.style.backgroundRepeat = 'no-repeat'
    cardEl.style.backgroundPosition = 'center'
    cardEl.style.position = 'relative'
    cardEl.style.overflow = 'hidden'
    cardEl.style.borderRadius = `${cardRadius}px`

    const nameEl = cardEl.querySelector<HTMLElement>('.card-name')
    const costEl = cardEl.querySelector<HTMLElement>('.card-cost')
    const descEl = cardEl.querySelector<HTMLElement>('.card-desc')
    applyField(nameEl, layout.elements.name)
    applyField(costEl, layout.elements.cost)
    applyField(descEl, layout.elements.description)

    let artEl = cardEl.querySelector<HTMLElement>('.style-lab-preview-card-art')
    if (!artEl) {
      artEl = document.createElement('div')
      artEl.className = 'style-lab-preview-card-art'
      cardEl.appendChild(artEl)
    }
    artEl.style.left = `${Math.round(layout.elements.art.x * scale)}px`
    artEl.style.top = `${Math.round(layout.elements.art.y * scale)}px`
    artEl.style.width = `${Math.round(layout.elements.art.width * scale)}px`
    artEl.style.height = `${Math.round(layout.elements.art.height * scale)}px`
    artEl.style.fontSize = `${Math.max(7, Math.round(layout.elements.art.fontSize * scale))}px`

    if (buttonSelector) {
      const btn = cardEl.querySelector<HTMLElement>(buttonSelector)
      if (btn) {
        btn.style.position = 'absolute'
        btn.style.left = '50%'
        btn.style.bottom = '6px'
        btn.style.transform = 'translateX(-50%)'
        btn.style.zIndex = '3'
      }
    }
  })
}

function renderCardLayoutLab(previewContainer: HTMLElement): void {
  const state = ensureCardLayoutState()
  const template = state.activeTemplate
  const layout = state.layouts[template]
  const visibleElements = CARD_LAYOUT_VISIBLE_ELEMENTS[template]
  if (!visibleElements.includes(selectedCardLayoutElement)) {
    selectedCardLayoutElement = visibleElements[0]
  }

  const templateButtons = ([
    { id: 'weapon' as const, label: '武器选择卡' },
    { id: 'hand' as const, label: '手牌卡面' },
  ])
    .map((item) => `
      <button class="btn btn-small style-lab-template-btn ${template === item.id ? 'active' : ''}" data-template-id="${item.id}">
        ${item.label}
      </button>
    `)
    .join('')

  const elementsHtml = visibleElements
    .map((elementId) => {
      const rect = layout.elements[elementId]
      const selectedClass = selectedCardLayoutElement === elementId ? 'selected' : ''
      return `
        <div
          class="style-lab-card-element style-lab-card-element-${elementId} ${selectedClass}"
          data-layout-element-id="${elementId}"
          style="left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;"
        >
          <div class="style-lab-card-element-label">${CARD_LAYOUT_ELEMENT_LABELS[elementId]}</div>
          <div class="style-lab-card-element-content" style="font-size:${rect.fontSize}px;">${getElementPreviewText(template, elementId)}</div>
        </div>
      `
    })
    .join('')

  const controlsHtml = visibleElements
    .map((elementId) => {
      const rect = layout.elements[elementId]
      return `
        <div class="style-lab-layout-row" data-control-element-id="${elementId}">
          <div class="style-lab-layout-row-title">${CARD_LAYOUT_ELEMENT_LABELS[elementId]}</div>
          <label>X <input type="number" data-field="x" data-element-id="${elementId}" value="${rect.x}" /></label>
          <label>Y <input type="number" data-field="y" data-element-id="${elementId}" value="${rect.y}" /></label>
          <label>W <input type="number" data-field="width" data-element-id="${elementId}" value="${rect.width}" /></label>
          <label>H <input type="number" data-field="height" data-element-id="${elementId}" value="${rect.height}" /></label>
          <label>F <input type="number" data-field="fontSize" data-element-id="${elementId}" value="${rect.fontSize}" /></label>
        </div>
      `
    })
    .join('')

  const initialExport = serializeCardLayoutConfig(template, layout)

  previewContainer.innerHTML = `
    <div class="style-lab-card-layout">
      <div class="style-lab-layout-toolbar">
        <div class="style-lab-layout-toolbar-group">
          ${templateButtons}
        </div>
        <div class="style-lab-layout-toolbar-group">
          <button class="btn btn-small" id="btn-layout-reset">重置模板</button>
          <button class="btn btn-small" id="btn-layout-save">保存布局</button>
          <button class="btn btn-small" id="btn-layout-export">复制JSON</button>
        </div>
        <div class="style-lab-layout-hint" id="layout-status">拖拽卡面元素或输入数值微调，保存后会写入本地缓存。</div>
      </div>

      <div class="style-lab-layout-workspace">
        <div class="style-lab-card-canvas-wrap">
          <div
            class="style-lab-card-surface"
            id="style-lab-card-surface"
            style="width:${layout.canvas.width}px;height:${layout.canvas.height}px;background-image:url('${STYLE_LAB_CARD_SKINS[template]}')"
          >
            ${elementsHtml}
          </div>
        </div>

        <div class="style-lab-layout-panel">
          <div class="style-lab-layout-panel-title">元素坐标</div>
          ${controlsHtml}
          <div class="style-lab-layout-panel-title">导出结果</div>
          <textarea id="layout-export-text" readonly>${initialExport}</textarea>
        </div>
      </div>
    </div>
  `

  const statusEl = previewContainer.querySelector<HTMLElement>('#layout-status')
  const exportTextEl = previewContainer.querySelector<HTMLTextAreaElement>('#layout-export-text')
  const cardSurfaceEl = previewContainer.querySelector<HTMLElement>('#style-lab-card-surface')

  const updateExportText = () => {
    if (!exportTextEl) return
    exportTextEl.value = serializeCardLayoutConfig(template, layout)
  }

  const setStatus = (message: string) => {
    if (statusEl) statusEl.textContent = message
  }

  previewContainer.querySelectorAll<HTMLElement>('[data-template-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const nextTemplate = el.dataset.templateId as CardLayoutTemplate
      state.activeTemplate = nextTemplate
      selectedCardLayoutElement = 'name'
      renderCardLayoutLab(previewContainer)
    })
  })

  previewContainer.querySelector('#btn-layout-reset')?.addEventListener('click', () => {
    state.layouts[template] = createDefaultCardLayout(template)
    persistCardLayoutState(state)
    setStatus('已重置当前模板布局。')
    renderCardLayoutLab(previewContainer)
  })

  previewContainer.querySelector('#btn-layout-save')?.addEventListener('click', () => {
    persistCardLayoutState(state)
    updateExportText()
    setStatus('布局已保存到本地。')
  })

  previewContainer.querySelector('#btn-layout-export')?.addEventListener('click', async () => {
    const json = serializeCardLayoutConfig(template, layout)
    updateExportText()
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(json)
        setStatus('JSON 已复制到剪贴板。')
        return
      } catch {
        // noop
      }
    }
    setStatus('当前环境无法自动复制，请手动复制右侧 JSON。')
  })

  previewContainer.querySelectorAll<HTMLInputElement>('input[data-field][data-element-id]').forEach((input) => {
    input.addEventListener('change', () => {
      const elementId = input.dataset.elementId as CardLayoutElementId
      const field = input.dataset.field as keyof CardLayoutRect
      const raw = input.value
      const current = layout.elements[elementId]
      setRectOnLayout(state, template, elementId, {
        [field]: safeParseInt(raw, current[field]),
      })
      persistCardLayoutState(state)
      setStatus(`已更新 ${CARD_LAYOUT_ELEMENT_LABELS[elementId]} 的 ${field}。`)
      renderCardLayoutLab(previewContainer)
    })
  })

  if (!cardSurfaceEl) return

  let dragging:
    | {
      pointerId: number
      elementId: CardLayoutElementId
      startX: number
      startY: number
      initialRect: CardLayoutRect
    }
    | null = null

  cardSurfaceEl.querySelectorAll<HTMLElement>('[data-layout-element-id]').forEach((el) => {
    el.addEventListener('click', () => {
      selectedCardLayoutElement = el.dataset.layoutElementId as CardLayoutElementId
      renderCardLayoutLab(previewContainer)
    })
  })

  cardSurfaceEl.addEventListener('pointerdown', (event: PointerEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-layout-element-id]')
    if (!target) return
    const elementId = target.dataset.layoutElementId as CardLayoutElementId
    selectedCardLayoutElement = elementId
    const initialRect = { ...layout.elements[elementId] }
    dragging = {
      pointerId: event.pointerId,
      elementId,
      startX: event.clientX,
      startY: event.clientY,
      initialRect,
    }
    cardSurfaceEl.setPointerCapture(event.pointerId)
    event.preventDefault()
  })

  cardSurfaceEl.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return
    const dx = event.clientX - dragging.startX
    const dy = event.clientY - dragging.startY
    const nextRect = clampCardLayoutElement(
      {
        ...dragging.initialRect,
        x: dragging.initialRect.x + dx,
        y: dragging.initialRect.y + dy,
      },
      layout.canvas,
    )
    layout.elements[dragging.elementId] = nextRect

    const node = cardSurfaceEl.querySelector<HTMLElement>(`[data-layout-element-id="${dragging.elementId}"]`)
    if (node) {
      node.style.left = `${nextRect.x}px`
      node.style.top = `${nextRect.y}px`
    }
    const row = previewContainer.querySelector<HTMLElement>(`[data-control-element-id="${dragging.elementId}"]`)
    if (row) {
      const xInput = row.querySelector<HTMLInputElement>('input[data-field="x"]')
      const yInput = row.querySelector<HTMLInputElement>('input[data-field="y"]')
      if (xInput) xInput.value = String(nextRect.x)
      if (yInput) yInput.value = String(nextRect.y)
    }
    updateExportText()
  })

  const stopDrag = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return
    if (cardSurfaceEl.hasPointerCapture(event.pointerId)) {
      cardSurfaceEl.releasePointerCapture(event.pointerId)
    }
    persistCardLayoutState(state)
    setStatus(`已拖拽 ${CARD_LAYOUT_ELEMENT_LABELS[dragging.elementId]}。`)
    dragging = null
    renderCardLayoutLab(previewContainer)
  }

  cardSurfaceEl.addEventListener('pointerup', stopDrag)
  cardSurfaceEl.addEventListener('pointercancel', stopDrag)
}

export function renderStyleLab(
  container: HTMLElement,
  mode: StyleLabPreviewMode,
  callbacks: GameCallbacks,
): void {
  const modeButtons = STYLE_LAB_PREVIEW_MODES
    .map((key) => `
      <button class="btn btn-small style-lab-tab ${mode === key ? 'active' : ''}" data-preview-mode="${key}">
        ${MODE_LABELS[key]}
      </button>
    `)
    .join('')

  container.innerHTML = `
    <div class="scene-style-lab">
      <div class="style-lab-header">
        <div>
          <h2>🧪 样式测试工坊</h2>
          <p class="style-lab-subtitle">点击不同场景，快速检查布局、字体和组件样式。</p>
        </div>
        <button class="btn btn-small" id="btn-style-lab-back">返回首页</button>
      </div>
      <div class="style-lab-tabs">
        ${modeButtons}
      </div>
      <div class="style-lab-preview-shell">
        <div class="style-lab-preview-title">当前预览：${resolveStyleLabPreviewTitle(mode)}</div>
        <div id="style-lab-preview" class="style-lab-preview"></div>
      </div>
    </div>
  `

  container.querySelector('#btn-style-lab-back')?.addEventListener('click', () => {
    callbacks.onCloseStyleLab()
  })

  container.querySelectorAll<HTMLElement>('[data-preview-mode]').forEach((el) => {
    el.addEventListener('click', () => {
      const nextMode = el.dataset.previewMode as StyleLabPreviewMode
      callbacks.onSetStyleLabMode(nextMode)
    })
  })

  const previewContainer = container.querySelector<HTMLElement>('#style-lab-preview')
  if (!previewContainer) return
  previewContainer.classList.remove('style-lab-battle-preview')

  if (mode === 'battle') {
    renderBattle(previewContainer, createPreviewBattle(), callbacks)
    applyBattleHandCardStyle(previewContainer)
    return
  }

  if (mode === 'map') {
    renderMap(previewContainer, createPreviewRun(), callbacks)
    return
  }

  if (mode === 'shop') {
    const run = createPreviewRun()
    renderShop(
      previewContainer,
      run,
      generateShopOffersByAct(2, createSeededRng(11)),
      generateShopMaterialOffersByAct(2, createSeededRng(13)),
      callbacks,
    )
    applySceneCardFaceStyle(previewContainer, '.shop-card', '.btn-shop-buy')
    return
  }

  if (mode === 'reward') {
    renderReward(
      previewContainer,
      getRewardCardsByAct('elite_battle', 2, createSeededRng(17)),
      { steel_ingot: 1, elemental_essence: 1 },
      'steel_longsword',
      callbacks,
      2,
      null,
    )
    applySceneCardFaceStyle(previewContainer, '.reward-card')
    return
  }

  if (mode === 'event') {
    renderEvent(previewContainer, rollEventByAct(2, createSeededRng(23)), callbacks.onEventChoose)
    return
  }

  if (mode === 'weapon_select') {
    renderWeaponSelectLab(previewContainer)
    return
  }

  if (mode === 'inventory') {
    renderInventory(previewContainer, createPreviewInventoryRun(), callbacks)
    return
  }

  renderCardLayoutLab(previewContainer)
}
