# 锻铸与咒印 (Forge & Glyph)

Deck-building roguelike card game. Browser-based, TypeScript + Vite + Vitest.

## Tech Stack
- **Runtime**: Vite 7 dev server, vanilla TS (no framework)
- **Test**: `npx vitest --run`
- **Build**: `npx tsc --noEmit` for type check, `npx vite build` for production
- **Style**: Retro pixel art, Press Start 2P font

## Architecture

```
src/
  game/           # Pure logic, no DOM. All functions are immutable (return new state).
    types.ts      # All interfaces: CardEffect (25 variants), PlayerState, EnemyState,
                  #   BattleState (with TurnTracking), RunState, GameState, MapNode
    cards.ts      # ALL_CARDS (28 cards), getCardDef(), STARTER_DECK_RECIPE (15 cards)
    enemies.ts    # 4 enemies: goblin_scout, forest_wolf, mushroom_creature, goblin_king
    combat.ts     # createBattleState, startTurn, playCard, endPlayerTurn, drawCards, canPlayCard
    effects.ts    # applyCardEffects — handles all 25 CardEffect types
    campfire.ts   # UPGRADE_TABLE (per-card unique upgrades), getEffectiveCardDef, restoreHp
    reward.ts     # Rarity-weighted reward selection with node-type guarantees
    weapons.ts    # longsword / longsword_upgraded
    run.ts        # RunState management (deck, map, weapons, HP persistence)
    map.ts        # 9-node map generation (5 normal, 2 elite, 1 boss, 1 campfire)
  ui/
    renderer.ts   # render() dispatcher by scene, GameCallbacks interface
    animations.ts # showDamageFloat, shakeEnemy, screenShake, enemyDeathFade
    scenes/       # Each scene renders to container innerHTML + binds events
      title.ts, map.ts, battle.ts, reward.ts, campfire.ts, result.ts
  main.ts         # Entry point. Holds gameState + prevBattle, wires all callbacks to update()
  style.css       # All styles + animations (float-up, shake, screen-shake, death-fade, intent-pulse)
```

## Key Design Decisions
- **Immutable state**: All game logic returns new objects, never mutates. Spread operator everywhere.
- **CardInstance.upgraded**: `boolean`. Upgrade effects are looked up via `UPGRADE_TABLE[cardId]` in campfire.ts.
- **TurnTracking**: `BattleState.turnTracking` tracks combatCardsPlayedThisTurn, enemyDamagedThisTurn, damageTakenThisTurn, bonusManaNextTurn. Reset each turn in `startTurn()`.
- **Player buffs**: poisonOnAttack (permanent), buffNextCombatDouble, buffNextSpellDamage/Mana (one-shot).
- **Visual feedback**: battle.ts receives `prevState` to diff HP/armor changes and trigger animations.
- **Reward rarity**: normal→common guaranteed, elite→rare, boss→epic. Weighted random + dedup.

## Resource System
- **Stamina** (3/turn): combat cards
- **Mana** (2/turn): spell cards
- **Free**: no cost
- Armor clears each turn. Burn ticks down by 1/turn. Poison persists.

## Common Modifications
- **Add a card**: Add to `ALL_CARDS` in cards.ts, add upgrade in `UPGRADE_TABLE` in campfire.ts
- **Add an enemy**: Add to `ENEMIES` in enemies.ts, reference enemyId in map.ts
- **Add a CardEffect type**: Add variant to `CardEffect` union in types.ts, handle in effects.ts switch
- **Change starter deck**: Edit `STARTER_DECK_RECIPE` in cards.ts
