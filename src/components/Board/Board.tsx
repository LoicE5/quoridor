import type { PlacedWall, PlayerColor, PlayerCount, SquareState, WallId, WallOrientation } from '@/types/game'
import WallBar from '@/components/WallBar/WallBar'
import WallBarHorizon from '@/components/WallBarHorizon/WallBarHorizon'
import SquaresContainer from '@/components/SquaresContainer/SquaresContainer'
import styles from './Board.module.css'

type BoardProps = {
  squares: SquareState[]
  placedWalls: PlacedWall[]
  wallCounts: Record<PlayerColor, number>
  numberOfPlayers: PlayerCount
  boardSize: string
  onSquareClick: (index: number) => void
  onWallClick: (orientation: WallOrientation, wallId: WallId, rowOrColumn: number) => void
}

export default function Board({
  squares,
  placedWalls,
  wallCounts,
  numberOfPlayers,
  boardSize,
  onSquareClick,
  onWallClick
}: BoardProps) {
  return (
    <div
      className={styles.global}
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Purple walls — left side, absolutely positioned */}
      <WallBarHorizon
        playerId="walls4"
        wallsRemaining={wallCounts.purple}
        isVisible={numberOfPlayers >= 4}
      />
      {/* Red walls — top */}
      <WallBar playerId="walls1" wallsRemaining={wallCounts.red} />
      {/* Board squares and wall overlays */}
      <SquaresContainer
        squares={squares}
        placedWalls={placedWalls}
        onSquareClick={onSquareClick}
        onWallClick={onWallClick}
      />
      {/* Blue walls — bottom */}
      <WallBar playerId="walls2" wallsRemaining={wallCounts.blue} />
      {/* Green walls — right side, absolutely positioned */}
      <WallBarHorizon
        playerId="walls3"
        wallsRemaining={wallCounts.green}
        isVisible={numberOfPlayers >= 3}
        isRight
      />
    </div>
  )
}
