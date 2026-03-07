import type { PlayerColor, PlayerCount, WallCount } from '@/types/game'
import { capitalizeFirst } from '@/lib/gameLogic'
import styles from './InfoPanel.module.css'

type InfoPanelProps = {
  currentPlayer: PlayerColor
  currentRound: number
  numberOfPlayers: PlayerCount
  numberOfWalls: WallCount
  onSetPlayers: (count: PlayerCount) => void
  onToggleWalls: () => void
}

export default function InfoPanel({
  currentPlayer,
  currentRound,
  numberOfPlayers,
  numberOfWalls,
  onSetPlayers,
  onToggleWalls
}: InfoPanelProps) {
  const invertedWallCount: WallCount = numberOfWalls === 10 ? 5 : 10

  return (
    <header className={styles.infoWrapper}>
      <h1>Round {currentRound}</h1>
      <p>
        <b>It&apos;s {capitalizeFirst(currentPlayer)} to play</b>
        {' | Selected mode : '}
        <i>{numberOfPlayers} players</i>
      </p>
      <div className={styles.buttonsWrapper}>
        <button onClick={() => onSetPlayers(1)}>1 player (vs AI)</button>
        {' '}
        <button onClick={() => onSetPlayers(2)}>2 players</button>
        {' '}
        <button onClick={() => onSetPlayers(3)}>3 players</button>
        {' '}
        <button onClick={() => onSetPlayers(4)}>4 players</button>
      </div>
      <button className={styles.wallsSet} onClick={onToggleWalls}>
        Set {invertedWallCount} walls per player
      </button>
    </header>
  )
}
