export function renderTitle(
  container: HTMLElement,
  onStart: () => void,
): void {
  container.innerHTML = `
    <div class="scene-title" style="background: url('/assets/backgrounds/title.png') center/cover no-repeat;">
      <div class="title-overlay">
        <h1>锻铸与咒印</h1>
        <p class="subtitle">Forge & Glyph</p>
        <button class="btn" id="btn-start">开始冒险</button>
      </div>
    </div>
  `
  container.querySelector('#btn-start')!.addEventListener('click', onStart)
}
