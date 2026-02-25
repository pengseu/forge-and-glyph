import type { CardDef, NodeType } from './types'
import { ALL_CARDS } from './cards'

export function selectRandomCards(count: number): CardDef[] {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getRewardCards(nodeType: NodeType): CardDef[] {
  if (nodeType === 'boss_battle') {
    // Boss战斗返回特定卡牌
    return [ALL_CARDS[ALL_CARDS.length - 1]] // 返回最后一张卡作为特殊奖励
  }
  if (nodeType === 'campfire') {
    return [] // 篝火节点无卡牌奖励
  }
  return selectRandomCards(3)
}
