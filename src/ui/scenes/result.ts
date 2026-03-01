export function resolveResultTurns(stats: import('../../game/types').GameState['stats']): number {
  const battleTurns = (stats.runReport?.battles ?? []).reduce((sum, battle) => sum + battle.turns, 0)
  return battleTurns > 0 ? battleTurns : stats.turns
}

export function buildResultLogText(
  result: 'victory' | 'defeat',
  stats: import('../../game/types').GameState['stats'],
): string {
  const isVictory = result === 'victory'
  const totalTurns = resolveResultTurns(stats)
  const report = stats.runReport
  const snapshot = stats.finalSnapshot
  const duration = report?.durationSec ?? 0
  const lines: string[] = []

  lines.push(isVictory ? '胜利！' : '战败...')
  if (!isVictory) {
    lines.push(`失败原因: ${resolveFailureReason(result, stats)}`)
  }
  lines.push(`回合数: ${totalTurns}`)
  lines.push(`本局时长: ${duration}s`)
  if (isVictory) {
    lines.push(`剩余HP: ${stats.remainingHp}`)
  }
  if (snapshot) {
    lines.push(`金币: ${snapshot.gold} · 卡组: ${snapshot.deckSize}`)
  }

  lines.push('路线')
  if ((report?.path.length ?? 0) === 0) {
    lines.push('无')
  } else {
    report!.path.forEach((p, i) => lines.push(`${i + 1}. ${p.nodeType} (${p.nodeId})`))
  }

  lines.push('背包')
  lines.push('武器')
  if (!snapshot || snapshot.weapons.length === 0) {
    lines.push('无')
  } else {
    snapshot.weapons.forEach((w) => {
      lines.push(w.enchantments.length > 0 ? `${w.defId} [${w.enchantments.join(', ')}]` : w.defId)
    })
  }

  lines.push('材料')
  if (!snapshot) {
    lines.push('无')
  } else {
    Object.entries(snapshot.materials).forEach(([k, v]) => lines.push(`${k}: ${v}`))
  }

  lines.push('每场战斗')
  if ((report?.battles.length ?? 0) === 0) {
    lines.push('无战斗记录')
  } else {
    report!.battles.forEach((b, i) => {
      lines.push(`战斗${i + 1} · ${b.nodeType} · ${b.enemyIds.join(', ')} · ${b.result ?? 'unknown'} · ${b.turns}回合`)
      b.logs.forEach(log => lines.push(`- [T${log.turn}] ${log.actor}: ${log.message}`))
    })
  }

  lines.push('全局日志')
  if ((report?.logs.length ?? 0) === 0) {
    lines.push('无')
  } else {
    report!.logs.forEach((log) => lines.push(log))
  }

  return lines.join('\n')
}

export function resolveFailureReason(
  result: 'victory' | 'defeat',
  stats: import('../../game/types').GameState['stats'],
): string {
  if (result === 'victory') return '无'
  if (stats.remainingHp <= 0) return 'HP归零'
  return '战斗失败'
}

export function renderResult(
  container: HTMLElement,
  result: 'victory' | 'defeat',
  stats: import('../../game/types').GameState['stats'],
  onRestart: () => void,
): void {
  const isVictory = result === 'victory'
  const totalTurns = resolveResultTurns(stats)
  const report = stats.runReport
  const snapshot = stats.finalSnapshot
  const duration = report?.durationSec ?? 0
  const battleCount = report?.battles.length ?? 0
  const avgBattleTurns = battleCount > 0 ? (totalTurns / battleCount).toFixed(1) : '0.0'
  const failureReason = resolveFailureReason(result, stats)
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
        <p>回合数: ${totalTurns}</p>
        <p>本局时长: ${duration}s</p>
        ${isVictory ? `<p>剩余HP: ${stats.remainingHp}</p>` : ''}
        ${!isVictory ? `<p>失败原因: ${failureReason}</p>` : ''}
        ${snapshot ? `<p>金币: ${snapshot.gold} · 卡组: ${snapshot.deckSize}</p>` : ''}
      </div>
      <div class="result-report">
        <h3>摘要</h3>
        <ul>
          <li>战斗场次: ${battleCount}</li>
          <li>平均每战回合: ${avgBattleTurns}</li>
          <li>路线节点数: ${report?.path.length ?? 0}</li>
        </ul>
        <details>
          <summary>展开详细日志</summary>
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
        </details>
      </div>
      <button class="btn" id="btn-export-log">保存日志</button>
      <button class="btn" id="btn-restart">再来一局</button>
    </div>
  `
  container.querySelector('#btn-export-log')?.addEventListener('click', () => {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return
    const content = buildResultLogText(result, stats)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `run-log-${stamp}.txt`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  })
  container.querySelector('#btn-restart')!.addEventListener('click', onRestart)
}
