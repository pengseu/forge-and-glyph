import { describe, expect, it } from 'vitest'
import {
  buildBattleBottomZoneHtml,
  buildBattleEnemySlotHtml,
  buildBattleEnemyStatusItemHtml,
  buildBattleEnemyStatusDetailHtml,
  resolveBattleEnemyStatusIconSrc,
  resolveBattleEnemyIntentIconSrc,
  resolveBattleEnemyIntentSemanticIconSrc,
  buildBattleHandCardInnerHtml,
  buildBattleHudSections,
  partitionHudStatuses,
  resolveBattleCardTargetSide,
  resolveBattleHandCardTypeClass,
  resolveFlatHandLayout,
  buildBattleMaterialButtonHtml,
  buildBattlePlayerStatusBadgeHtml,
  buildBattleEnchantMetaText,
  buildBattleEnchantFeedbackText,
  resolveEnemyIntentDetailTitle,
} from '../battle'

describe('battle hud helpers', () => {
  it('should keep danger statuses in main row and move others to sub row', () => {
    const { main, sub } = partitionHudStatuses([
      { key: 'poison', html: '<span>☠️2</span>', danger: true },
      { key: 'weakened', html: '<span>😵1</span>', danger: true },
      { key: 'charge', html: '<span>⚡蓄3</span>', danger: false },
    ])

    expect(main).toHaveLength(2)
    expect(sub).toHaveLength(1)
    expect(main[0].key).toBe('poison')
    expect(sub[0].key).toBe('charge')
  })

  it('should output hud-main and hud-sub wrappers with grouped blocks', () => {
    const html = buildBattleHudSections({
      hpBarHtml: '<div class="hp-bar">60/60</div>',
      armorHtml: '<span>🛡️2</span>',
      staminaHtml: '<span>⚡3/3</span>',
      manaHtml: '<span>◆2/2</span>',
      enemyCountHtml: '<span>👾2</span>',
      weaponHtml: '<span>⚔️铁制长剑</span>',
      turnHtml: '<span>回合1</span>',
      dangerStatusHtml: '<span class="status-badge status-debuff">☠️2</span>',
      trialHtml: '<span>试炼: 烈焰</span>',
      enchantHtml: '<span>🔮 bless</span>',
      enchantFeedbackHtml: '<span>触发: 共鸣</span>',
      subStatusHtml: '<span class="status-badge">⚡蓄3</span>',
      helpHtml: '<button id="btn-status-help">?</button>',
    })

    expect(html).toContain('class="hud-main"')
    expect(html).toContain('class="hud-sub"')
    expect(html).toContain('class="hud-group hud-group--vitals"')
    expect(html).toContain('class="hud-group hud-group--resources"')
    expect(html).toContain('class="hud-group hud-group--combat"')
  })



  it('should render enchant meta text without orb icon prefixes', () => {
    expect(buildBattleEnchantMetaText(['flame', 'thunder'])).toBe('附魔：烈焰 / 雷电')
    expect(buildBattleEnchantMetaText([])).toBe('')
  })

  it('should render enchant feedback text as readable trigger copy', () => {
    expect(buildBattleEnchantFeedbackText(['烈焰触发', '雷电弹射'])).toBe('效果触发：烈焰触发 · 雷电弹射')
    expect(buildBattleEnchantFeedbackText([])).toBe('')
  })

  it('should resolve human-readable enemy intent detail titles', () => {
    expect(resolveEnemyIntentDetailTitle('18', '将造成 18 点伤害')).toBe('攻击')
    expect(resolveEnemyIntentDetailTitle('10护 / 18伤', '将先获得 10 护甲，再造成 18 伤害')).toBe('护甲 / 攻击')
    expect(resolveEnemyIntentDetailTitle('召唤×2', '将尝试召唤 2 个单位')).toBe('召唤')
  })
  it('should build enemy slot html with lighter top area and tooltip details', () => {
    const html = buildBattleEnemySlotHtml({
      idx: 0,
      enemyName: '蘑菇怪',
      spriteSrc: '/assets/characters/enemies/mushroom_creature.png',
      hp: 18,
      maxHp: 38,
      hpPercent: 47.36,
      armor: 2,
      intentText: '🗡️ 8',
      intentHint: '将造成 8 点伤害',
      intentClass: 'intent-attack',
      intentToneClass: 'enemy-intent--attack',
      passiveText: '⚡闪避：单次≤4伤害无效',
      enemyStatusHtml: '<span class="status-badge">🔥2</span><span class="status-badge status-debuff">😵1</span>',
      enemyStatusDetailHtml: '<div class="enemy-detail-status">灼烧</div>',
      intentDetailTitle: '攻击',
      justDied: false,
    })

    expect(html).toContain('class="enemy-vitals"')
    expect(html).toContain('class="hp-bar enemy-hp-bar"')
    expect(html).toContain('class="enemy-intent-icon"')
    expect(html).toContain('/assets/ui/battle/intent-attack.png')
    expect(html).toContain('class="enemy-meta enemy-meta--armor"')
    expect(html).toContain('class="enemy-meta-icon"')
    expect(html).toContain('/assets/icon/护甲.webp')
    expect(html).toContain('class="status-row enemy-status-row enemy-status-row--bottom enemy-status-paper"')
    expect(html).toContain('class="enemy-name"')
    expect(html).toContain('class="enemy-tooltip enemy-detail-panel"')
    expect(html).toContain('class="enemy-detail-title"')
    expect(html).toContain('class="enemy-detail-vitals"')
    expect(html).toContain('class="enemy-detail-hp-icon"')
    expect(html).toContain('/assets/icon/敌人血量.png')
    expect(html).toContain('生命')
    expect(html).toContain('class="enemy-detail-armor-icon"')
    expect(html).toContain('class="enemy-detail-intent"')
    expect(html).toContain('title="攻击｜将造成 8 点伤害"')
    expect(html).toContain('enemy-detail-intent-title--attack')
    expect(html).toContain('enemy-detail-intent-title')
    expect(html).toContain('攻击')
    expect(html).toContain('class="enemy-detail-status-list"')
    expect(html).not.toContain('enemy-hp-frame')
    expect(html).not.toContain('enemy-nameplate')
    expect(html).toContain('将造成 8 点伤害')
    expect(html).toContain('闪避：单次≤4伤害无效')
    expect(html).not.toContain('enemy-intent-hint')
  })


  it('should resolve enemy status icons from public assets icon directory', () => {
    expect(resolveBattleEnemyStatusIconSrc('strength')).toBe('/assets/icon/力量.webp')
    expect(resolveBattleEnemyStatusIconSrc('burn')).toBe('/assets/icon/灼烧.webp')
    expect(resolveBattleEnemyStatusIconSrc('freeze')).toBe('/assets/icon/冰冻.webp')
    expect(resolveBattleEnemyStatusIconSrc('unknown')).toBe('')
  })

  it('should build enemy status item html with icon and optional stack', () => {
    const stacked = buildBattleEnemyStatusItemHtml('burn', 2)
    const noStack = buildBattleEnemyStatusItemHtml('freeze', 0)

    expect(stacked).toContain('enemy-status-item')
    expect(stacked).toContain('/assets/icon/灼烧.webp')
    expect(stacked).toContain('enemy-status-count')
    expect(stacked).toContain('>2</span>')
    expect(noStack).toContain('/assets/icon/冰冻.webp')
    expect(noStack).not.toContain('enemy-status-count')
  })


  it('should resolve enemy intent icons from resized battle intent assets', () => {
    expect(resolveBattleEnemyIntentIconSrc('enemy-intent--attack')).toBe('/assets/ui/battle/intent-attack.png')
    expect(resolveBattleEnemyIntentIconSrc('enemy-intent--defend')).toBe('/assets/ui/battle/intent-defend.png')
    expect(resolveBattleEnemyIntentIconSrc('enemy-intent--debuff')).toBe('/assets/ui/battle/intent-debuff.png')
  })



  it('should build battle material button html with material artwork and hide used state from bag flow', () => {
    const html = buildBattleMaterialButtonHtml('iron_ingot', 2, false)

    expect(html).toContain('battle-material-btn')
    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).not.toContain('📦')
    expect(html).toContain('×2')
  })

  it('should build player extra status badge with artwork when mapped', () => {
    const html = buildBattlePlayerStatusBadgeHtml('strength', '3')

    expect(html).toContain('hud-status-chip')
    expect(html).toContain('/assets/icon/力量.webp')
    expect(html).toContain('3')
  })

  it('should resolve summon semantic intent icon from battle assets', () => {
    const html = buildBattleEnemySlotHtml({
      idx: 1,
      enemyName: '地精王',
      spriteSrc: '/assets/characters/enemies/goblin_king.png',
      hp: 40,
      maxHp: 40,
      hpPercent: 100,
      armor: 0,
      intentText: '召唤',
      intentHint: '将召唤新的敌方单位',
      intentClass: 'intent-buff',
      intentToneClass: 'enemy-intent--summon',
      passiveText: '',
      enemyStatusHtml: '',
      enemyStatusDetailHtml: '',
      justDied: false,
    })

    expect(html).toContain('/assets/ui/battle/intent-summon.png')
  })
  it('should resolve additional semantic intent icons from resized battle assets', () => {
    expect(resolveBattleEnemyIntentSemanticIconSrc('buff')).toBe('/assets/ui/battle/intent-buff.png')
    expect(resolveBattleEnemyIntentSemanticIconSrc('control')).toBe('/assets/ui/battle/intent-control.png')
    expect(resolveBattleEnemyIntentSemanticIconSrc('combo')).toBe('/assets/ui/battle/intent-combo.png')
    expect(resolveBattleEnemyIntentSemanticIconSrc('summon')).toBe('/assets/ui/battle/intent-summon.png')
    expect(resolveBattleEnemyIntentSemanticIconSrc('heal')).toBe('/assets/ui/battle/intent-heal.png')
  })

  it('should build enemy status detail html with icon label and count', () => {
    const stacked = buildBattleEnemyStatusDetailHtml('poison', 3)
    const noStack = buildBattleEnemyStatusDetailHtml('freeze', 0)

    expect(stacked).toContain('enemy-detail-status')
    expect(stacked).toContain('/assets/icon/中毒.webp')
    expect(stacked).toContain('中毒')
    expect(stacked).toContain('enemy-detail-status-count')
    expect(noStack).toContain('/assets/icon/冰冻.webp')
    expect(noStack).toContain('冻结')
    expect(noStack).not.toContain('enemy-detail-status-count')
  })




  it('should build battle hand card inner html with dedicated body blocks for hover expansion', () => {
    const html = buildBattleHandCardInnerHtml({
      name: '火花',
      costLabel: '✦1',
      costType: 'mana',
      description: '造成4点伤害，施加1层灼烧',
    })

    expect(html).toContain('class="battle-card-body"')
    expect(html).toContain('class="battle-card-head"')
    expect(html).toContain('class="battle-card-divider"')
    expect(html).toContain('class="battle-card-desc card-desc"')
    expect(html).toContain('火花')
    expect(html).toContain('✦1')
  })

  it('should resolve flat hand layout within 600px and overlap only when needed', () => {
    const compact = resolveFlatHandLayout(4)
    const crowded = resolveFlatHandLayout(8)

    expect(compact.maxWidth).toBe(600)
    expect(compact.cards).toHaveLength(4)
    expect(compact.cards[0]?.left).toBe(0)
    expect(compact.cards[1]?.left).toBeGreaterThan(compact.cards[0]!.left)
    expect(crowded.cards[7]?.left).toBeLessThanOrEqual(600 - crowded.cardWidth)
    expect(crowded.step).toBeLessThan(compact.step)
  })



  it('should send self-armor cards toward player side instead of enemy side', () => {
    expect(resolveBattleCardTargetSide([{ type: 'armor', value: 5 }])).toBe('player')
    expect(resolveBattleCardTargetSide([{ type: 'damage', value: 6 }])).toBe('enemy')
    expect(resolveBattleCardTargetSide([{ type: 'damage', value: 5 }, { type: 'armor', value: 2 }])).toBe('enemy')
    expect(resolveBattleCardTargetSide([{ type: 'conditional_damage_vs_vulnerable', base: 3, vulnerableDamage: 7 }])).toBe('enemy')
  })

  it('should classify block-like battle cards as defend tone', () => {
    expect(resolveBattleHandCardTypeClass([{ type: 'armor', value: 5 }], 'combat', 'block')).toBe('card--defend')
    expect(resolveBattleHandCardTypeClass([{ type: 'damage', value: 6 }], 'combat', 'slash')).toBe('card--attack')
    expect(resolveBattleHandCardTypeClass([{ type: 'damage', value: 4 }, { type: 'burn', value: 1 }], 'spell', 'spark')).toBe('card--skill')
  })

  it('should build bottom zone html with materials pocket hand stage and action cluster', () => {    const html = buildBattleBottomZoneHtml({
      cardsHtml: '<div class="card">火花</div>',
      materialsHtml: '<button class="battle-material-btn">木枝</button>',
      drawPileCount: 12,
      discardPileCount: 3,
      normalAttackDisabled: false,
      normalAttackText: '⚔️ 普攻',
      endTurnText: '⏭️ 结束回合',
    })

    expect(html).toContain('class="materials-pocket"')
    expect(html).toContain('class="hand-stage"')
    expect(html).toContain('class="action-cluster"')
    expect(html).not.toContain('battle-material-bar')
    expect(html).toContain('抽牌堆: 12')
    expect(html).toContain('弃牌堆: 3')
  })
})
