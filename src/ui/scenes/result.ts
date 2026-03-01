export function renderResult(
  container: HTMLElement,
  result: 'victory' | 'defeat',
  stats: import('../../game/types').GameState['stats'],
  onRestart: () => void,
): void {
  const isVictory = result === 'victory'
  const report = stats.runReport
  const snapshot = stats.finalSnapshot
  const duration = report?.durationSec ?? 0
  const routeHtml = (report?.path ?? [])
    .map((p, i) => `<li>${i + 1}. ${p.nodeType} (${p.nodeId})</li>`)
    .join('')
  const battleHtml = (report?.battles ?? [])
    .map((b, i) => {
      const logs = b.logs
        .map(log => `<li>[T${log.turn}] ${log.actor}: ${log.message}</li>`)
        .join('')
      return `
        <details class="result-battle">
          <summary>战斗${i + 1} · ${b.nodeType} · ${b.enemyIds.join(', ')} · ${b.result ?? 'unknown'} · ${b.turns}回合</summary>
          <ul>${logs}</ul>
        </details>
      `
    })
    .join('')
  const materialsHtml = snapshot
    ? Object.entries(snapshot.materials).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')
    : ''
  const weaponsHtml = snapshot
    ? snapshot.weapons.map(w => `<li>${w.defId}${w.enchantments.length ? ` [${w.enchantments.join(', ')}]` : ''}</li>`).join('')
    : ''
  const globalLogs = (report?.logs ?? []).map(l => `<li>${l}</li>`).join('')

  container.innerHTML = `
    <div class="scene-result">
      <div class="${isVictory ? 'result-victory' : 'result-defeat'}">
        ${isVictory ? '胜利！' : '战败...'}
      </div>
      <div class="result-stats">
        <p>回合数: ${stats.turns}</p>
        <p>本局时长: ${duration}s</p>
        ${isVictory ? `<p>剩余HP: ${stats.remainingHp}</p>` : ''}
        ${snapshot ? `<p>金币: ${snapshot.gold} · 卡组: ${snapshot.deckSize}</p>` : ''}
      </div>
      <div class="result-report">
        <h3>路线</h3>
        <ul>${routeHtml || '<li>无</li>'}</ul>
        <h3>背包</h3>
        <p>武器</p>
        <ul>${weaponsHtml || '<li>无</li>'}</ul>
        <p>材料</p>
        <ul>${materialsHtml || '<li>无</li>'}</ul>
        <h3>每场战斗</h3>
        ${battleHtml || '<p>无战斗记录</p>'}
        <h3>全局日志</h3>
        <ul>${globalLogs || '<li>无</li>'}</ul>
      </div>
      <button class="btn" id="btn-restart">再来一局</button>
    </div>
  `
  container.querySelector('#btn-restart')!.addEventListener('click', onRestart)
}
