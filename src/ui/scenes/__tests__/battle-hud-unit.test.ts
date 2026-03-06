import { describe, expect, it } from 'vitest'
import { buildBattleHudSections, partitionHudStatuses } from '../battle'

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
})
