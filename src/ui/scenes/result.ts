export function renderResult(
  container: HTMLElement,
  result: 'victory' | 'defeat',
  stats: { turns: number; remainingHp: number },
  onRestart: () => void,
): void {
  const isVictory = result === 'victory'
  container.innerHTML = `
    <div class="scene-result">
      <div class="${isVictory ? 'result-victory' : 'result-defeat'}">
        ${isVictory ? '胜利！' : '战败...'}
      </div>
      <div class="result-stats">
        <p>回合数: ${stats.turns}</p>
        ${isVictory ? `<p>剩余HP: ${stats.remainingHp}</p>` : ''}
      </div>
      <button class="btn" id="btn-restart">再来一局</button>
    </div>
  `
  container.querySelector('#btn-restart')!.addEventListener('click', onRestart)
}
