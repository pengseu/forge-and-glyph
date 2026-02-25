export function renderTitle(
  container: HTMLElement,
  onStart: () => void,
): void {
  container.innerHTML = `
    <div class="scene-title">
      <h1>锻铸与咒印</h1>
      <p class="subtitle">Forge & Glyph</p>
      <button class="btn" id="btn-start">开始冒险</button>
    </div>
  `
  container.querySelector('#btn-start')!.addEventListener('click', onStart)
}
