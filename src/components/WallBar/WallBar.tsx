import styles from './WallBar.module.css'

type WallBarProps = {
  playerId: string
  wallsRemaining: number
}

export default function WallBar({ playerId, wallsRemaining }: WallBarProps) {
  return (
    <div id={playerId} className={styles.wallsContainer}>
      {Array.from({ length: wallsRemaining }, (_, i) => (
        <div key={i} className={styles.wallsListItem} />
      ))}
    </div>
  )
}
