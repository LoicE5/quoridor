'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { PlayerCount, WallCount, WallId, WallOrientation, AIMoveResponse } from '@/types/game'
import { useGameReducer } from '@/hooks/useGameReducer'
import { useResponsiveBoard } from '@/hooks/useResponsiveBoard'
import { capitalizeFirst } from '@/lib/gameLogic'
import Board from '@/components/Board/Board'
import InfoPanel from '@/components/InfoPanel/InfoPanel'
import styles from './QuoridorGame.module.css'

const AI_COLOR = 'red' as const

export default function QuoridorGame() {
  const [mounted, setMounted] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [state, dispatch] = useGameReducer()
  const boardSize = useResponsiveBoard()
  const aiRequestInFlight = useRef(false)

  useEffect(() => setMounted(true), [])

  // Prize draw alert
  useEffect(() => {
    if(!mounted) return
    if(state.prizeDrawResult && !state.prizeDrawResult.isDone) {
      const winner = state.prizeDrawResult.winner
      alert(`Prize Draw! ${capitalizeFirst(winner)} starts the game!`)
      dispatch({ type: 'PRIZE_DRAW_COMPLETE', startingPlayer: winner })
    }
  }, [mounted, state.prizeDrawResult, dispatch])

  // Win alert
  useEffect(() => {
    if(!mounted) return
    if(state.winResult.winner) {
      const winner = state.winResult.winner
      alert(`${capitalizeFirst(winner)} won the game!`)
      dispatch({ type: 'ACKNOWLEDGE_WIN' })
    }
  }, [mounted, state.winResult, dispatch])

  // AI turn trigger (1-player mode)
  useEffect(() => {
    if(!mounted) return
    if(state.numberOfPlayers !== 1) return
    if(!state.prizeDrawResult?.isDone) return
    if(state.winResult.winner !== null) return
    if(state.currentPlayer !== AI_COLOR) return
    if(aiRequestInFlight.current) return

    aiRequestInFlight.current = true
    setAiThinking(true)

    fetch('/api/ai-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: state.playerPositions,
        placedWalls: state.placedWalls,
        wallCounts: state.wallCounts,
        currentPlayer: state.currentPlayer,
        numberOfPlayers: state.numberOfPlayers,
        squares: state.squares
      })
    })
      .then(r => r.json() as Promise<AIMoveResponse>)
      .then(res => {
        if(!res.ok) {
          alert(`AI error: ${res.error}`)
          return
        }
        const { move } = res
        if(move.type === 'move') {
          dispatch({ type: 'MOVE_PAWN', color: AI_COLOR, targetSquare: move.target })
        } else {
          if(move.orientation === 'vertical') {
            dispatch({ type: 'PLACE_VERTICAL_WALL', wallId: move.wallId, column: move.rowOrColumn })
          } else {
            dispatch({ type: 'PLACE_HORIZONTAL_WALL', wallId: move.wallId, row: move.rowOrColumn })
          }
        }
      })
      .catch(err => {
        alert(`AI request failed: ${err instanceof Error ? err.message : String(err)}`)
      })
      .finally(() => {
        aiRequestInFlight.current = false
        setAiThinking(false)
      })
  }, [mounted, state.numberOfPlayers, state.prizeDrawResult, state.winResult, state.currentPlayer, state.playerPositions, state.placedWalls, state.wallCounts, state.squares, dispatch])

  if(!mounted) return null

  const isVsAI = state.numberOfPlayers === 1

  function handleSetPlayers(count: PlayerCount) {
    dispatch({ type: 'SET_NUMBER_OF_PLAYERS', count })
  }

  function handleToggleWalls() {
    const newCount: WallCount = state.numberOfWalls === 10 ? 5 : 10
    dispatch({ type: 'SET_NUMBER_OF_WALLS', count: newCount })
  }

  function handleSquareClick(index: number) {
    if(isVsAI && state.currentPlayer === AI_COLOR) return
    dispatch({ type: 'MOVE_PAWN', color: state.currentPlayer, targetSquare: index })
  }

  function handleWallClick(orientation: WallOrientation, wallId: WallId, rowOrColumn: number) {
    if(isVsAI && state.currentPlayer === AI_COLOR) return
    if(orientation === 'vertical') {
      dispatch({ type: 'PLACE_VERTICAL_WALL', wallId, column: rowOrColumn })
    } else {
      dispatch({ type: 'PLACE_HORIZONTAL_WALL', wallId, row: rowOrColumn })
    }
  }

  return (
    <>
      <InfoPanel
        currentPlayer={state.currentPlayer}
        currentRound={state.currentRound}
        numberOfPlayers={state.numberOfPlayers}
        numberOfWalls={state.numberOfWalls}
        aiThinking={aiThinking}
        onSetPlayers={handleSetPlayers}
        onToggleWalls={handleToggleWalls}
      />
      <Board
        squares={state.squares}
        placedWalls={state.placedWalls}
        wallCounts={state.wallCounts}
        numberOfPlayers={state.numberOfPlayers}
        boardSize={boardSize}
        onSquareClick={handleSquareClick}
        onWallClick={handleWallClick}
      />
      <footer className={styles.credits}>
        Made with love by<br />Lo&iuml;c Etienne
      </footer>
      <aside>
        <a
          href="https://github.com/LoicE5/Quoridor"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          <Image src="/github_logo.png" alt="My github profile" width={30} height={30} />
        </a>
      </aside>
      <div className={styles.backgroundDiv} />
    </>
  )
}
