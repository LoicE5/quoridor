import Image from 'next/image'
import type { PlayerColor } from '@/types/game'
import styles from './Square.module.css'

type SquareProps = {
  index: number
  occupiedBy: PlayerColor | null
  onClick: () => void
}

export default function Square({ index, occupiedBy, onClick }: SquareProps) {
  return (
    <button
      id={`sq${index}`}
      className={styles.square}
      onClick={onClick}
    >
      {occupiedBy && (
        <Image
          src={`/${occupiedBy}_circle.png`}
          alt={`${occupiedBy} pawn`}
          fill
          sizes="10vw"
        />
      )}
    </button>
  )
}
