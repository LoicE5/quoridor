import styles from './WallBarHorizon.module.css'

type WallBarHorizonProps = {
  playerId: string
  wallsRemaining: number
  isVisible: boolean
  isRight?: boolean
}

export default function WallBarHorizon({
  playerId,
  wallsRemaining,
  isVisible,
  isRight
}: WallBarHorizonProps) {
  return (
    <div
      id={playerId}
      className={styles.wallsHorizonContainer}
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
        right: isRight ? 0 : undefined
      }}
    >
      {Array.from({ length: wallsRemaining }, (_, i) => (
        <div key={i} className={styles.wallsListHorizon} />
      ))}
    </div>
  )
}
