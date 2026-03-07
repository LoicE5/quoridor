'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { PlayerCount, WallCount, WallId, WallOrientation } from '@/types/game'
import { useGameReducer } from '@/hooks/useGameReducer'
import { useResponsiveBoard } from '@/hooks/useResponsiveBoard'
import Board from '@/components/Board/Board'
import InfoPanel from '@/components/InfoPanel/InfoPanel'
import PrizeDrawModal from '@/components/PrizeDrawModal/PrizeDrawModal'
import WinModal from '@/components/WinModal/WinModal'
import styles from './QuoridorGame.module.css'

export default function QuoridorGame() {
  const [mounted, setMounted] = useState(false)
  const [state, dispatch] = useGameReducer()
  const boardSize = useResponsiveBoard()

  useEffect(() => setMounted(true), [])

  if(!mounted) return null

  function handleSetPlayers(count: PlayerCount) {
    if(count === 1) {
      alert('Coming soon!')
      return
    }
    dispatch({ type: 'SET_NUMBER_OF_PLAYERS', count })
  }

  function handleToggleWalls() {
    const newCount: WallCount = state.numberOfWalls === 10 ? 5 : 10
    dispatch({ type: 'SET_NUMBER_OF_WALLS', count: newCount })
  }

  function handleSquareClick(index: number) {
    dispatch({ type: 'MOVE_PAWN', color: state.currentPlayer, targetSquare: index })
  }

  function handleWallClick(orientation: WallOrientation, wallId: WallId, rowOrColumn: number) {
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
      {state.prizeDrawResult && !state.prizeDrawResult.isDone && (
        <PrizeDrawModal
          winner={state.prizeDrawResult.winner}
          onAcknowledge={() => {
            if(state.prizeDrawResult) {
              dispatch({
                type: 'PRIZE_DRAW_COMPLETE',
                startingPlayer: state.prizeDrawResult.winner
              })
            }
          }}
        />
      )}
      {state.winResult.winner && (
        <WinModal
          winner={state.winResult.winner}
          onPlayAgain={() => dispatch({ type: 'ACKNOWLEDGE_WIN' })}
        />
      )}
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
