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
  hasAutoSave: boolean,
  _slots: Array<{ slot: 1 | 2 | 3; savedAt: number | null; act: 1 | 2 | 3 | null; hp: number | null; gold: number | null }>,
  _challengeUnlocked: boolean,
  _challengeEnabled: boolean,
  _skipTutorial: boolean,
  _muted: boolean,
  _masterVolume: number,
  _sfxVolume: number,
  _bgmVolume: number,
): void {
  container.innerHTML = `
    <div class="scene-title">
      <div class="title-bg">
        <img src="/assets/scenes/title-forest.png" alt="森林背景" loading="lazy" />
      </div>
      <div class="title-content">
        <h1>锻铸与咒印</h1>
        <p class="subtitle">Forge & Glyph</p>
        <div class="title-actions">
          <button class="btn btn-primary btn-lg" id="btn-start">⚔️ 开始冒险</button>
          <button class="btn btn-md" id="btn-style-lab">🎨 样式工坊</button>
          <button class="btn btn-ghost btn-sm" id="btn-continue" ${hasAutoSave ? '' : 'disabled'}>继续冒险</button>
        </div>
      </div>
      <div class="title-leaves"></div>
    </div>
  `
  container.querySelector('#btn-start')!.addEventListener('click', onStart)
  container.querySelector('#btn-continue')?.addEventListener('click', onContinue)
  container.querySelector('#btn-style-lab')?.addEventListener('click', onOpenStyleLab)
}
