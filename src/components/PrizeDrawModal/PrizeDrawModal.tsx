import type { PlayerColor } from '@/types/game'
import { capitalizeFirst } from '@/lib/gameLogic'
import styles from './PrizeDrawModal.module.css'

type PrizeDrawModalProps = {
  winner: PlayerColor
  onAcknowledge: () => void
}

export default function PrizeDrawModal({ winner, onAcknowledge }: PrizeDrawModalProps) {
  return (
    <dialog open className={styles.dialog}>
      <p>Prize Draw!</p>
      <p><strong>{capitalizeFirst(winner)}</strong> starts the game!</p>
      <button onClick={onAcknowledge}>Start Game</button>
    </dialog>
  )
}
