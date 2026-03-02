export function getTitleActionButtons(): Array<{ id: 'btn-start' | 'btn-style-lab'; label: string }> {
  return [
    { id: 'btn-start', label: '开始冒险' },
    { id: 'btn-style-lab', label: '样式测试' },
  ]
}

export function renderTitle(
  container: HTMLElement,
  onStart: () => void,
  onOpenStyleLab: () => void,
): void {
  const actions = getTitleActionButtons()

  container.innerHTML = `
    <div class="scene-title">
      <h1>锻铸与咒印</h1>
      <p class="subtitle">Forge & Glyph</p>
      <div class="title-actions">
        <button class="btn" id="${actions[0].id}">${actions[0].label}</button>
        <button class="btn btn-secondary" id="${actions[1].id}">${actions[1].label}</button>
      </div>
    </div>
  `
  container.querySelector('#btn-start')!.addEventListener('click', onStart)
  container.querySelector('#btn-style-lab')!.addEventListener('click', onOpenStyleLab)
}
