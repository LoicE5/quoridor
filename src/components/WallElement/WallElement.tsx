import type { WallOrientation } from '@/types/game'
import styles from './WallElement.module.css'

type WallElementProps = {
  orientation: WallOrientation
  rowOrColumn: number
  topLeft: string
  isPlaced: boolean
  onClick: () => void
}

export default function WallElement({
  orientation,
  rowOrColumn,
  topLeft,
  isPlaced,
  onClick
}: WallElementProps) {
  const orientationClass = orientation === 'vertical'
    ? styles.verticalWall
    : styles.horizontalWall

  const rowColClass = orientation === 'vertical'
    ? styles[`column${rowOrColumn}` as keyof typeof styles]
    : styles[`row${rowOrColumn}` as keyof typeof styles]

  const positionStyle = orientation === 'vertical'
    ? { top: topLeft }
    : { left: topLeft }

  return (
    <div
      className={`${orientationClass} ${rowColClass ?? ''} ${isPlaced ? styles.stayVisible : ''}`}
      style={positionStyle}
      onClick={isPlaced ? undefined : onClick}
    />
  )
}
