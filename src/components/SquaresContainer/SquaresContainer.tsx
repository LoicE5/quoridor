import type { PlacedWall, PlayerColor, SquareState, WallId, WallOrientation } from '@/types/game'
import { computeWallPosition } from '@/lib/gameLogic'
import Square from '@/components/Square/Square'
import WallElement from '@/components/WallElement/WallElement'
import styles from './SquaresContainer.module.css'

type SquaresContainerProps = {
  squares: SquareState[]
  placedWalls: PlacedWall[]
  onSquareClick: (index: number) => void
  onWallClick: (orientation: WallOrientation, wallId: WallId, rowOrColumn: number) => void
}

function isWallPlaced(
  placedWalls: PlacedWall[],
  orientation: WallOrientation,
  wallId: WallId,
  rowOrColumn: number
): boolean {
  return placedWalls.some(w =>
    w.orientation === orientation && w.id === wallId && w.rowOrColumn === rowOrColumn
  )
}

export default function SquaresContainer({
  squares,
  placedWalls,
  onSquareClick,
  onWallClick
}: SquaresContainerProps) {
  const verticalWalls: React.ReactNode[] = []
  const horizontalWalls: React.ReactNode[] = []

  // Generate vertical walls: outer loop = columns (1-8), inner loop = wallIds (1-8)
  for(let column = 1; column <= 8; column++) {
    for(let wallId = 1; wallId <= 8; wallId++) {
      const topLeft = computeWallPosition(wallId)
      const placed = isWallPlaced(placedWalls, 'vertical', wallId, column)
      verticalWalls.push(
        <WallElement
          key={`v-${column}-${wallId}`}
          orientation="vertical"
          rowOrColumn={column}
          topLeft={topLeft}
          isPlaced={placed}
          onClick={() => onWallClick('vertical', wallId, column)}
        />
      )
    }
  }

  // Generate horizontal walls: outer loop = rows (1-8), inner loop = wallIds (1-8)
  for(let row = 1; row <= 8; row++) {
    for(let wallId = 1; wallId <= 8; wallId++) {
      const topLeft = computeWallPosition(wallId)
      const placed = isWallPlaced(placedWalls, 'horizontal', wallId, row)
      horizontalWalls.push(
        <WallElement
          key={`h-${row}-${wallId}`}
          orientation="horizontal"
          rowOrColumn={row}
          topLeft={topLeft}
          isPlaced={placed}
          onClick={() => onWallClick('horizontal', wallId, row)}
        />
      )
    }
  }

  return (
    <div className={styles.squaresContainer}>
      {squares.map(sq => (
        <Square
          key={sq.index}
          index={sq.index}
          occupiedBy={sq.occupiedBy as PlayerColor | null}
          onClick={() => onSquareClick(sq.index)}
        />
      ))}
      {verticalWalls}
      {horizontalWalls}
    </div>
  )
}
