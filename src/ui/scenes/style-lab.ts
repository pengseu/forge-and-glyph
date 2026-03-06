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

export function normalizeStyleLabScenePreset(scene: string | null | undefined): StyleLabScenePreset {
  const found = STYLE_LAB_SCENE_OPTIONS.find((option) => option.id === scene)
  return found ? found.id : 'title'
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
            <button class="btn btn-primary btn-lg">⚔️ 开始冒险</button>
            <button class="btn btn-md">🎨 样式工坊</button>
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
  if (scene === 'battle') {
    return `
      <div class="style-lab-scene style-lab-scene--battle">
        <div class="mock-player-bar">顶部状态栏</div>
        <div class="mock-battle-main">
          <div class="mock-player-zone">玩家区</div>
          <div class="mock-enemy-zone">
            <div class="mock-enemy"></div>
            <div class="mock-enemy"></div>
            <div class="mock-enemy"></div>
          </div>
        </div>
        <div class="mock-material-bar">材料条</div>
        <div class="mock-hand-bar">手牌区</div>
      </div>
    `
  }
  if (scene === 'map') {
    return `
      <div class="style-lab-scene style-lab-scene--map">
        <div class="mock-player-bar">地图顶部栏</div>
        <div class="mock-map-canvas">
          <div class="mock-map-node">⚔️</div>
          <div class="mock-map-node">❓</div>
          <div class="mock-map-node">🛒</div>
          <div class="mock-map-node">👑</div>
        </div>
      </div>
    `
  }
  if (scene === 'reward') {
    return `
      <div class="style-lab-scene style-lab-scene--reward">
        <section class="panel">
          <div class="panel-title">🎉 战斗胜利</div>
          <div class="mock-three-cards">
            <div class="card card--showcase card--attack"></div>
            <div class="card card--showcase card--skill"></div>
            <div class="card card--showcase card--power"></div>
          </div>
        </section>
      </div>
    `
  }
  if (scene === 'campfire') {
    return `
      <div class="style-lab-scene style-lab-scene--campfire">
        <div class="mock-header">🔥 篝火休憩</div>
        <div class="mock-art-box">篝火图</div>
        <div class="mock-three-panels">
          <section class="panel">休息</section>
          <section class="panel">升级卡牌</section>
          <section class="panel">继续旅程</section>
        </div>
      </div>
    `
  }
  if (scene === 'shop') {
    return `
      <div class="style-lab-scene style-lab-scene--shop">
        <div class="mock-player-bar">🏪 旅途商店 · 余额 999</div>
        <div class="mock-tab-row"><span>🃏卡牌</span><span>📦材料</span><span>🔧服务</span></div>
        <div class="mock-grid-five">
          <div class="mock-item-box"></div><div class="mock-item-box"></div><div class="mock-item-box"></div><div class="mock-item-box"></div><div class="mock-item-box"></div>
        </div>
      </div>
    `
  }
  if (scene === 'inventory') {
    return `
      <div class="style-lab-scene style-lab-scene--inventory">
        <section class="panel mock-full-panel">
          <div class="panel-title">📌 背包</div>
          <div class="mock-two-col">
            <div class="mock-list-col">列表</div>
            <div class="mock-detail-col">详情</div>
          </div>
        </section>
      </div>
    `
  }
  if (scene === 'forge') {
    return `
      <div class="style-lab-scene style-lab-scene--forge">
        <div class="mock-header">⚒️ 锻造</div>
        <div class="mock-two-col">
          <section class="panel">配方</section>
          <section class="panel">材料槽</section>
        </div>
      </div>
    `
  }
  if (scene === 'enchant') {
    return `
      <div class="style-lab-scene style-lab-scene--enchant">
        <div class="mock-header">🔮 附魔台</div>
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
          <div class="panel-title">❓ 随机事件</div>
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
  return `
    <div class="style-lab-scene style-lab-scene--result">
      <section class="panel mock-event-panel">
        <div class="panel-title">🏁 结算</div>
        <div class="panel-body">本局统计与路线摘要</div>
      </section>
    </div>
  `
}

export function renderStyleLab(
  container: HTMLElement,
  onBack: () => void,
): void {
  const defaultScene: StyleLabScenePreset = 'title'
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
        切换上方场景标签，快速检查各场景在当前主题下的布局与氛围。
      </footer>
    </div>
  `

  container.querySelector('#btn-style-lab-back')?.addEventListener('click', onBack)

  const preview = container.querySelector<HTMLElement>('#style-lab-preview')
  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('.style-lab-tab'))
  if (!preview || tabs.length === 0) return

  const switchTo = (sceneRaw: string | null | undefined): void => {
    const scene = normalizeStyleLabScenePreset(sceneRaw)
    preview.innerHTML = renderScenePreview(scene)
    tabs.forEach((tab) => {
      const active = tab.dataset.scenePreset === scene
      tab.classList.toggle('is-active', active)
      tab.setAttribute('aria-selected', active ? 'true' : 'false')
    })
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTo(tab.dataset.scenePreset))
  })
}
