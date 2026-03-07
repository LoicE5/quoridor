import type {
  PlayerColor,
  PlayerCount,
  PlayerPositions,
  PlacedWall,
  SquareState,
  WallId,
  WallOrientation
} from '@/types/game'

export function buildInitialSquares(): SquareState[] {
  return Array.from({ length: 81 }, (_, i) => ({
    index: i + 1,
    hasWallRight: false,
    hasWallBottom: false,
    occupiedBy: null
  }))
}

export function getInitialPositions(): PlayerPositions {
  return { blue: 77, red: 5, green: 45, purple: 37 }
}

export function getWinLines(): Record<PlayerColor, number[]> {
  return {
    blue: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    red: [73, 74, 75, 76, 77, 78, 79, 80, 81],
    green: [1, 10, 19, 28, 37, 46, 55, 64, 73],
    purple: [9, 18, 27, 36, 45, 54, 63, 72, 81]
  }
}

export function getActiveColors(numberOfPlayers: PlayerCount): PlayerColor[] {
  const colors: PlayerColor[] = ['blue', 'red']
  if(numberOfPlayers >= 3) colors.push('green')
  if(numberOfPlayers >= 4) colors.push('purple')
  return colors
}

export function isValidPawnMove(
  color: PlayerColor,
  target: number,
  squares: SquareState[],
  positions: PlayerPositions
): boolean {
  const from = positions[color]
  const diff = target - from

  if(Math.abs(diff) !== 1 && Math.abs(diff) !== 9) return false

  // Bounds check for east/west to prevent row wrapping
  if(diff === 1 && from % 9 === 0) return false   // already at col 9
  if(diff === -1 && from % 9 === 1) return false  // already at col 1
  // Bounds check for north/south
  if(diff === -9 && from <= 9) return false
  if(diff === 9 && from > 72) return false

  const currentSq = squares.at(from - 1) as SquareState
  const targetSq = squares.at(target - 1) as SquareState

  // Wall blocking for the first step
  if(diff === 1 && currentSq.hasWallRight) return false    // east blocked
  if(diff === -1 && targetSq.hasWallRight) return false    // west blocked
  if(diff === 9 && currentSq.hasWallBottom) return false   // south blocked
  if(diff === -9 && targetSq.hasWallBottom) return false   // north blocked

  return true
}

export function resolveJumpTarget(
  from: number,
  direction: 'north' | 'south' | 'east' | 'west'
): number | null {
  const deltas = { north: -9, south: 9, east: 1, west: -1 }
  const delta = deltas[direction]
  const destination = from + 2 * delta

  if(destination < 1 || destination > 81) return null

  // Prevent row wrapping for east/west jumps
  if(direction === 'east' && from % 9 === 8) return null  // col 8 + 2 would wrap
  if(direction === 'east' && from % 9 === 0) return null  // col 9 can't go east
  if(direction === 'west' && from % 9 === 2) return null  // col 2 - 2 would wrap
  if(direction === 'west' && from % 9 === 1) return null  // col 1 can't go west

  return destination
}

export function getVerticalWallSquares(
  wallId: WallId,
  column: number
): { firstSquare: number; secondSquare: number } {
  const firstSquare = column + 9 * (wallId - 1)
  return { firstSquare, secondSquare: firstSquare + 9 }
}

export function getHorizontalWallSquares(
  wallId: WallId,
  row: number
): { firstSquare: number; secondSquare: number } {
  const firstSquare = wallId + 9 * (row - 1)
  return { firstSquare, secondSquare: firstSquare + 1 }
}

export function isValidVerticalWall(
  wallId: WallId,
  column: number,
  placedWalls: PlacedWall[]
): boolean {
  const isVertical = (w: PlacedWall) => w.orientation === 'vertical'

  // No adjacent same-column wall (above or below)
  const hasAdjacentAbove = placedWalls.some(w =>
    isVertical(w) && w.rowOrColumn === column && w.id === wallId - 1
  )
  const hasAdjacentBelow = placedWalls.some(w =>
    isVertical(w) && w.rowOrColumn === column && w.id === wallId + 1
  )

  // No crossing horizontal wall: horizontal wall with id=column, row=wallId
  const hasCrossingHorizontal = placedWalls.some(w =>
    w.orientation === 'horizontal' && w.id === column && w.rowOrColumn === wallId
  )

  return !hasAdjacentAbove && !hasAdjacentBelow && !hasCrossingHorizontal
}

export function isValidHorizontalWall(
  wallId: WallId,
  row: number,
  placedWalls: PlacedWall[]
): boolean {
  const isHorizontal = (w: PlacedWall) => w.orientation === 'horizontal'

  // No adjacent same-row wall (left or right)
  const hasAdjacentLeft = placedWalls.some(w =>
    isHorizontal(w) && w.rowOrColumn === row && w.id === wallId - 1
  )
  const hasAdjacentRight = placedWalls.some(w =>
    isHorizontal(w) && w.rowOrColumn === row && w.id === wallId + 1
  )

  // No crossing vertical wall: vertical wall with id=row, column=wallId
  const hasCrossingVertical = placedWalls.some(w =>
    w.orientation === 'vertical' && w.id === row && w.rowOrColumn === wallId
  )

  return !hasAdjacentLeft && !hasAdjacentRight && !hasCrossingVertical
}

export function checkWin(positions: PlayerPositions): PlayerColor | null {
  const winLines = getWinLines()
  const colors: PlayerColor[] = ['blue', 'red', 'green', 'purple']

  for(const color of colors) {
    if(winLines[color].includes(positions[color])) return color
  }
  return null
}

export function getNextPlayer(
  current: PlayerColor,
  numberOfPlayers: PlayerCount
): PlayerColor {
  if(current === 'blue') return 'red'
  if(current === 'red') return numberOfPlayers >= 3 ? 'green' : 'blue'
  if(current === 'green') return numberOfPlayers >= 4 ? 'purple' : 'blue'
  return 'blue' // purple → blue
}

export function computeWallPosition(index: WallId): string {
  if(index === 1) return '1.11%'
  return `${(index - 1) * 10 * 1.11}%`
}

export function getDirectionFromDiff(
  diff: number
): 'north' | 'south' | 'east' | 'west' | null {
  if(diff === 9) return 'south'
  if(diff === -9) return 'north'
  if(diff === 1) return 'east'
  if(diff === -1) return 'west'
  return null
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Used in WallOrientation type guard
export function isWallOrientation(value: string): value is WallOrientation {
  return value === 'vertical' || value === 'horizontal'
}
