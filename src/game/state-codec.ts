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
  return {
    ...run,
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
    run: payload.run ? deserializeRunState(payload.run) : null,
  }
}

