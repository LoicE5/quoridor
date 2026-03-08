'use client'

import { useReducer } from 'react'
import type { GameState, PlayerColor, PlayerCount, WallCount, WallId } from '@/types/game'
import {
  buildInitialSquares,
  getInitialPositions,
  getActiveColors,
  isValidPawnMove,
  getDirectionFromDiff,
  resolveJumpTarget,
  getVerticalWallSquares,
  getHorizontalWallSquares,
  isValidVerticalWall,
  isValidHorizontalWall,
  checkWin,
  getNextPlayer
} from '@/lib/gameLogic'
import {
  readNumberOfPlayers,
  readNumberOfWalls,
  writeNumberOfPlayers,
  writeNumberOfWalls
} from '@/lib/localStorage'

type GameAction =
  | { type: 'MOVE_PAWN'; color: PlayerColor; targetSquare: number }
  | { type: 'PLACE_VERTICAL_WALL'; wallId: WallId; column: number }
  | { type: 'PLACE_HORIZONTAL_WALL'; wallId: WallId; row: number }
  | { type: 'PRIZE_DRAW_COMPLETE'; startingPlayer: PlayerColor }
  | { type: 'ACKNOWLEDGE_WIN' }
  | { type: 'SET_NUMBER_OF_PLAYERS'; count: PlayerCount }
  | { type: 'SET_NUMBER_OF_WALLS'; count: WallCount }

function initializeState(): GameState {
  const numberOfPlayers = readNumberOfPlayers()
  const numberOfWalls = readNumberOfWalls()

  const squares = buildInitialSquares()
  const positions = getInitialPositions()

  // Set occupied squares for active players
  squares.at(76)!.occupiedBy = 'blue'    // sq77
  squares.at(4)!.occupiedBy = 'red'      // sq5
  if(numberOfPlayers >= 3) squares.at(44)!.occupiedBy = 'green'   // sq45
  if(numberOfPlayers >= 4) squares.at(36)!.occupiedBy = 'purple'  // sq37

  // Prize draw: randomly select starting player from active players
  const activeColors = getActiveColors(numberOfPlayers)
  const winner = activeColors.at(Math.floor(Math.random() * activeColors.length)) as PlayerColor

  return {
    squares,
    placedWalls: [],
    playerPositions: positions,
    wallCounts: {
      blue: numberOfWalls,
      red: numberOfWalls,
      green: numberOfWalls,
      purple: numberOfWalls
    },
    currentPlayer: 'blue',
    currentRound: 1,
    numberOfPlayers,
    numberOfWalls,
    prizeDrawResult: { winner, isDone: false },
    winResult: { winner: null }
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch(action.type) {
    case 'MOVE_PAWN': {
      if(!state.prizeDrawResult?.isDone) return state
      if(state.winResult.winner !== null) return state
      if(state.currentPlayer !== action.color) return state

      const from = state.playerPositions[action.color]
      const target = action.targetSquare
      const diff = target - from

      if(!isValidPawnMove(action.color, target, state.squares, state.playerPositions)) {
        return state
      }

      const targetSq = state.squares.at(target - 1)!

      let destination = target
      if(targetSq.occupiedBy !== null) {
        const direction = getDirectionFromDiff(diff)
        if(!direction) return state
        const jumped = resolveJumpTarget(from, direction)
        if(jumped === null) return state
        destination = jumped
      }

      const newSquares = state.squares.map(sq => ({ ...sq }))
      newSquares.at(from - 1)!.occupiedBy = null
      newSquares.at(destination - 1)!.occupiedBy = action.color

      const newPositions = { ...state.playerPositions, [action.color]: destination }
      const winner = checkWin(newPositions, state.numberOfPlayers)

      return {
        ...state,
        squares: newSquares,
        playerPositions: newPositions,
        currentPlayer: winner
          ? state.currentPlayer
          : getNextPlayer(state.currentPlayer, state.numberOfPlayers),
        currentRound: state.currentRound + 1,
        winResult: { winner }
      }
    }

    case 'PLACE_VERTICAL_WALL': {
      if(!state.prizeDrawResult?.isDone) return state
      if(state.winResult.winner !== null) return state
      if(state.wallCounts[state.currentPlayer] <= 0) return state
      if(!isValidVerticalWall(action.wallId, action.column, state.placedWalls)) return state

      const { firstSquare, secondSquare } = getVerticalWallSquares(action.wallId, action.column)

      const newSquares = state.squares.map(sq => {
        if(sq.index === firstSquare || sq.index === secondSquare) {
          return { ...sq, hasWallRight: true }
        }
        return sq
      })

      const newPlacedWalls = [
        ...state.placedWalls,
        { id: action.wallId, orientation: 'vertical' as const, rowOrColumn: action.column }
      ]

      const newWallCounts = {
        ...state.wallCounts,
        [state.currentPlayer]: state.wallCounts[state.currentPlayer] - 1
      }

      return {
        ...state,
        squares: newSquares,
        placedWalls: newPlacedWalls,
        wallCounts: newWallCounts,
        currentPlayer: getNextPlayer(state.currentPlayer, state.numberOfPlayers),
        currentRound: state.currentRound + 1
      }
    }

    case 'PLACE_HORIZONTAL_WALL': {
      if(!state.prizeDrawResult?.isDone) return state
      if(state.winResult.winner !== null) return state
      if(state.wallCounts[state.currentPlayer] <= 0) return state
      if(!isValidHorizontalWall(action.wallId, action.row, state.placedWalls)) return state

      const { firstSquare, secondSquare } = getHorizontalWallSquares(action.wallId, action.row)

      const newSquares = state.squares.map(sq => {
        if(sq.index === firstSquare || sq.index === secondSquare) {
          return { ...sq, hasWallBottom: true }
        }
        return sq
      })

      const newPlacedWalls = [
        ...state.placedWalls,
        { id: action.wallId, orientation: 'horizontal' as const, rowOrColumn: action.row }
      ]

      const newWallCounts = {
        ...state.wallCounts,
        [state.currentPlayer]: state.wallCounts[state.currentPlayer] - 1
      }

      return {
        ...state,
        squares: newSquares,
        placedWalls: newPlacedWalls,
        wallCounts: newWallCounts,
        currentPlayer: getNextPlayer(state.currentPlayer, state.numberOfPlayers),
        currentRound: state.currentRound + 1
      }
    }

    case 'PRIZE_DRAW_COMPLETE': {
      return {
        ...state,
        currentPlayer: action.startingPlayer,
        prizeDrawResult: state.prizeDrawResult
          ? { ...state.prizeDrawResult, isDone: true }
          : null
      }
    }

    case 'ACKNOWLEDGE_WIN': {
      return initializeState()
    }

    case 'SET_NUMBER_OF_PLAYERS': {
      writeNumberOfPlayers(action.count)
      return initializeState()
    }

    case 'SET_NUMBER_OF_WALLS': {
      writeNumberOfWalls(action.count)
      return initializeState()
    }

    default:
      return state
  }
}

export function useGameReducer() {
  return useReducer(gameReducer, null, () => initializeState())
}
