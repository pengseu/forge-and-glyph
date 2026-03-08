import type { GameState, RunState } from './types'

export type SerializedRunState = Omit<RunState, 'visitedNodes'> & {
  visitedNodes: string[]
}

export type SerializedGameState = Omit<GameState, 'run'> & {
  run: SerializedRunState | null
}

function serializeRunState(run: RunState): SerializedRunState {
  return {
    ...run,
    visitedNodes: [...run.visitedNodes],
  }
}

function deserializeRunState(run: SerializedRunState): RunState {
  const runLike = run as unknown as SerializedRunState & {
    cycleTier?: number
    secretState?: RunState['secretState']
  }
  return {
    ...run,
    cycleTier: Math.max(0, Math.floor(Number(runLike.cycleTier ?? 0))),
    secretState: runLike.secretState
      ? {
          hiddenRouteEntered: !!runLike.secretState.hiddenRouteEntered,
          pendingStage: runLike.secretState.pendingStage ?? 'none',
        }
      : { hiddenRouteEntered: false, pendingStage: 'none' },
    visitedNodes: new Set(run.visitedNodes ?? []),
  }
}

export function serializeGameState(state: GameState): SerializedGameState {
  return {
    ...state,
    run: state.run ? serializeRunState(state.run) : null,
  }
}

export function deserializeGameState(payload: SerializedGameState): GameState {
  return {
    ...payload,
    selectedCycleTier: Math.max(0, Math.floor(Number((payload as Partial<GameState>).selectedCycleTier ?? 0))),
    highestUnlockedCycleTier: Math.max(0, Math.floor(Number((payload as Partial<GameState>).highestUnlockedCycleTier ?? 0))),
    run: payload.run ? deserializeRunState(payload.run) : null,
  }
}

