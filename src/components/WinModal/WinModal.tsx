import type { PlayerColor } from '@/types/game'
import { capitalizeFirst } from '@/lib/gameLogic'
import styles from './WinModal.module.css'

type WinModalProps = {
  winner: PlayerColor
  onPlayAgain: () => void
}

export default function WinModal({ winner, onPlayAgain }: WinModalProps) {
  return (
    <dialog open className={styles.dialog}>
      <p>{capitalizeFirst(winner)} won the game!</p>
      <button onClick={onPlayAgain}>Play Again</button>
    </dialog>
  )
}
