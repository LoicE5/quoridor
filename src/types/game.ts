export type PlayerColor = 'blue' | 'red' | 'green' | 'purple'
export type PlayerCount = 1 | 2 | 3 | 4
export type WallCount = 5 | 10
export type WallOrientation = 'vertical' | 'horizontal'
export type WallId = number

export type PlacedWall = {
  id: WallId
  orientation: WallOrientation
  rowOrColumn: number
}

export type SquareState = {
  index: number
  hasWallRight: boolean
  hasWallBottom: boolean
  occupiedBy: PlayerColor | null
}

export type PlayerPositions = Record<PlayerColor, number>

// ── AI types ──────────────────────────────────────────────────────────────────

export type AIPawnMove = { type: 'move'; target: number }

export type AIWallMove = {
  type: 'wall'
  orientation: WallOrientation
  wallId: WallId
  rowOrColumn: number
}

export type AIMoveDecision = AIPawnMove | AIWallMove

export type AIMoveRequest = {
  positions: PlayerPositions
  placedWalls: PlacedWall[]
  wallCounts: Record<PlayerColor, number>
  currentPlayer: PlayerColor
  numberOfPlayers: PlayerCount
  squares: SquareState[]
}

export type AIMoveResponse =
  | { ok: true; move: AIMoveDecision }
  | { ok: false; error: string }

// ── Game state ────────────────────────────────────────────────────────────────

export type GameState = {
  squares: SquareState[]
  placedWalls: PlacedWall[]
  playerPositions: PlayerPositions
  wallCounts: Record<PlayerColor, number>
  currentPlayer: PlayerColor
  currentRound: number
  numberOfPlayers: PlayerCount
  numberOfWalls: WallCount
  prizeDrawResult: { winner: PlayerColor; isDone: boolean } | null
  winResult: { winner: PlayerColor | null }
}
