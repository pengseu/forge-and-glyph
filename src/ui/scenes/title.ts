import { toWebpAsset } from '../../assets'
import { buildCycleTierOptions } from '../../game/secret-cycle'

interface BuildTitleHtmlInput {
  hasAutoSave: boolean
  hasSecretCycleUnlocked: boolean
  highestUnlockedTier: number
  selectedCycleTier: number
}

export function buildTitleHtml(input: BuildTitleHtmlInput): string {
  const cyclePanelHtml = input.hasSecretCycleUnlocked
    ? `
      <section class="title-cycle-panel">
        <div class="title-cycle-kicker">轮回层级</div>
        <div class="title-cycle-list">
          ${buildCycleTierOptions(input.highestUnlockedTier).map((option) => `
            <button
              class="title-cycle-item ${option.unlocked ? '' : 'is-locked'} ${input.selectedCycleTier === option.tier ? 'is-selected' : ''}"
              data-cycle-tier="${option.tier}"
              ${option.unlocked ? '' : 'disabled'}
            >
              <span class="title-cycle-label">${option.label}</span>
              <span class="title-cycle-hint">${option.unlocked ? '已可进入' : option.unlockHint ?? ''}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `
    : `
      <section class="title-cycle-panel title-cycle-panel--sealed">
        <div class="title-cycle-kicker">？？？？</div>
        <div class="title-cycle-warning">不要进来</div>
        <p class="title-cycle-copy">门还没有为你打开。？？？？还没有允许你靠近。</p>
      </section>
    `

  return `
    <div class="scene-title">
      <div class="title-bg">
        <img src="${toWebpAsset('/assets/scenes/title-forest.png')}" alt="森林背景" loading="lazy" />
      </div>
      <div class="title-content">
        <h1>锻铸与咒印</h1>
        <p class="subtitle">Forge & Glyph</p>
        <div class="title-actions">
          <button class="btn btn-primary btn-lg" id="btn-start">开始冒险</button>
          <button class="btn btn-md" id="btn-style-lab">样式工坊</button>
          <button class="btn btn-ghost btn-sm" id="btn-continue" ${input.hasAutoSave ? '' : 'disabled'}>继续冒险</button>
          <button class="btn btn-ghost btn-sm" id="btn-test-mode" style="background: rgba(255,0,0,0.1);">测试模式</button>
        </div>
        ${cyclePanelHtml}
      </div>
      <div class="title-leaves"></div>
    </div>
  `
}

export function renderTitle(
  container: HTMLElement,
  onStart: () => void,
  onContinue: () => void,
  onOpenStyleLab: () => void,
  _onLoadSlot: (slot: 1 | 2 | 3) => void,
  _onToggleChallenge: () => void,
  _onToggleSkipTutorial: () => void,
  _onToggleMute: () => void,
  _onSetAudioVolume: (channel: 'master' | 'sfx' | 'bgm', value: number) => void,
  _onResetGuides: () => void,
  onSelectCycleTier: (tier: number) => void,
  hasAutoSave: boolean,
  _slots: Array<{ slot: 1 | 2 | 3; savedAt: number | null; act: 1 | 2 | 3 | null; hp: number | null; gold: number | null }>,
  highestUnlockedTier: number,
  hasSecretCycleUnlocked: boolean,
  _challengeUnlocked: boolean,
  _challengeEnabled: boolean,
  _skipTutorial: boolean,
  _muted: boolean,
  _masterVolume: number,
  _sfxVolume: number,
  _bgmVolume: number,
  selectedCycleTier: number,
  onTestMode?: () => void,
): void {
  container.innerHTML = buildTitleHtml({
    hasAutoSave,
    hasSecretCycleUnlocked,
    highestUnlockedTier,
    selectedCycleTier,
  })
  container.querySelector('#btn-start')!.addEventListener('click', onStart)
  container.querySelector('#btn-continue')?.addEventListener('click', onContinue)
  container.querySelector('#btn-style-lab')?.addEventListener('click', onOpenStyleLab)
  container.querySelector('#btn-test-mode')?.addEventListener('click', () => {
    if (onTestMode) onTestMode()
  })
  container.querySelectorAll<HTMLElement>('[data-cycle-tier]').forEach((el) => {
    el.addEventListener('click', () => {
      const raw = Number(el.dataset.cycleTier ?? 0)
      if (!Number.isFinite(raw)) return
      onSelectCycleTier(raw)
    })
  })
}
