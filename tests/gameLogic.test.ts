import { describe, it, expect } from 'bun:test'
import {
  buildInitialSquares,
  getInitialPositions,
  getWinLines,
  getActiveColors,
  isValidPawnMove,
  resolveJumpTarget,
  getVerticalWallSquares,
  getHorizontalWallSquares,
  isValidVerticalWall,
  isValidHorizontalWall,
  checkWin,
  getNextPlayer,
  computeWallPosition,
  getDirectionFromDiff,
  capitalizeFirst,
  isWallOrientation
} from '../src/lib/gameLogic'
import type { SquareState, PlayerPositions, PlacedWall } from '../src/types/game'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeSquares(): SquareState[] {
  return buildInitialSquares()
}

function makePositions(overrides: Partial<PlayerPositions> = {}): PlayerPositions {
  return { ...getInitialPositions(), ...overrides }
}

// ─── buildInitialSquares ──────────────────────────────────────────────────────

describe('buildInitialSquares', () => {
  it('returns 81 squares', () => {
    expect(buildInitialSquares()).toHaveLength(81)
  })

  it('indexes from 1 to 81', () => {
    const squares = buildInitialSquares()
    expect(squares[0].index).toBe(1)
    expect(squares[80].index).toBe(81)
  })

  it('all squares start unoccupied with no walls', () => {
    const squares = buildInitialSquares()
    for(const sq of squares) {
      expect(sq.occupiedBy).toBeNull()
      expect(sq.hasWallRight).toBe(false)
      expect(sq.hasWallBottom).toBe(false)
    }
  })
})

// ─── getInitialPositions ──────────────────────────────────────────────────────

describe('getInitialPositions', () => {
  it('blue starts at 77', () => expect(getInitialPositions().blue).toBe(77))
  it('red starts at 5', () => expect(getInitialPositions().red).toBe(5))
  it('green starts at 45', () => expect(getInitialPositions().green).toBe(45))
  it('purple starts at 37', () => expect(getInitialPositions().purple).toBe(37))
})

// ─── getWinLines ─────────────────────────────────────────────────────────────

describe('getWinLines', () => {
  const wl = getWinLines()

  it('blue wins on row 1 (squares 1-9)', () => {
    expect(wl.blue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('red wins on row 9 (squares 73-81)', () => {
    expect(wl.red).toEqual([73, 74, 75, 76, 77, 78, 79, 80, 81])
  })

  it('green wins on column 1', () => {
    expect(wl.green).toEqual([1, 10, 19, 28, 37, 46, 55, 64, 73])
  })

  it('purple wins on column 9', () => {
    expect(wl.purple).toEqual([9, 18, 27, 36, 45, 54, 63, 72, 81])
  })

  it("initial positions are not in their own win lines (no false starts)", () => {
    const pos = getInitialPositions()
    expect(wl.blue.includes(pos.blue)).toBe(false)
    expect(wl.red.includes(pos.red)).toBe(false)
    expect(wl.green.includes(pos.green)).toBe(false)
    expect(wl.purple.includes(pos.purple)).toBe(false)
  })
})

// ─── getActiveColors ─────────────────────────────────────────────────────────

describe('getActiveColors', () => {
  it('2 players → [blue, red]', () => {
    expect(getActiveColors(2)).toEqual(['blue', 'red'])
  })
  it('3 players → [blue, red, green]', () => {
    expect(getActiveColors(3)).toEqual(['blue', 'red', 'green'])
  })
  it('4 players → [blue, red, green, purple]', () => {
    expect(getActiveColors(4)).toEqual(['blue', 'red', 'green', 'purple'])
  })
})

// ─── isValidPawnMove ─────────────────────────────────────────────────────────

describe('isValidPawnMove', () => {
  it('allows moving north', () => {
    const pos = makePositions({ blue: 77 })
    expect(isValidPawnMove('blue', 68, makeSquares(), pos)).toBe(true)
  })

  it('allows moving south', () => {
    const pos = makePositions({ blue: 10 })
    expect(isValidPawnMove('blue', 19, makeSquares(), pos)).toBe(true)
  })

  it('allows moving east', () => {
    const pos = makePositions({ blue: 10 })
    expect(isValidPawnMove('blue', 11, makeSquares(), pos)).toBe(true)
  })

  it('allows moving west', () => {
    const pos = makePositions({ blue: 11 }) // col 2, row 2
    expect(isValidPawnMove('blue', 10, makeSquares(), pos)).toBe(true)
  })

  it('rejects diagonal moves', () => {
    const pos = makePositions({ blue: 50 })
    expect(isValidPawnMove('blue', 40, makeSquares(), pos)).toBe(false) // diff -10
    expect(isValidPawnMove('blue', 42, makeSquares(), pos)).toBe(false) // diff -8
    expect(isValidPawnMove('blue', 60, makeSquares(), pos)).toBe(false) // diff +10
  })

  it('rejects large jumps', () => {
    const pos = makePositions({ blue: 50 })
    expect(isValidPawnMove('blue', 32, makeSquares(), pos)).toBe(false) // -18
  })

  it('prevents wrapping east from col 9', () => {
    const pos = makePositions({ blue: 9 }) // col 9 (9 % 9 === 0)
    expect(isValidPawnMove('blue', 10, makeSquares(), pos)).toBe(false)
  })

  it('prevents wrapping west from col 1', () => {
    const pos = makePositions({ blue: 10 }) // col 1 (10 % 9 === 1)
    expect(isValidPawnMove('blue', 9, makeSquares(), pos)).toBe(false)
  })

  it('prevents moving north past row 1', () => {
    const pos = makePositions({ blue: 5 }) // row 1
    expect(isValidPawnMove('blue', -4, makeSquares(), pos)).toBe(false)
  })

  it('prevents moving south past row 9', () => {
    const pos = makePositions({ blue: 77 }) // row 9
    expect(isValidPawnMove('blue', 86, makeSquares(), pos)).toBe(false)
  })

  it('blocked by wall on right (east move)', () => {
    const squares = makeSquares()
    squares[9].hasWallRight = true // sq10 has wall right
    const pos = makePositions({ blue: 10 })
    expect(isValidPawnMove('blue', 11, squares, pos)).toBe(false)
  })

  it('blocked by wall on left (west move)', () => {
    const squares = makeSquares()
    squares[9].hasWallRight = true // sq10 has wall right means wall between 10 and 11
    const pos = makePositions({ blue: 11 })
    expect(isValidPawnMove('blue', 10, squares, pos)).toBe(false)
  })

  it('blocked by wall below (south move)', () => {
    const squares = makeSquares()
    squares[9].hasWallBottom = true // sq10 has wall below
    const pos = makePositions({ blue: 10 })
    expect(isValidPawnMove('blue', 19, squares, pos)).toBe(false)
  })

  it('blocked by wall above (north move)', () => {
    const squares = makeSquares()
    squares[9].hasWallBottom = true // sq10 has wall below = wall between sq10 and sq19
    const pos = makePositions({ blue: 19 })
    expect(isValidPawnMove('blue', 10, squares, pos)).toBe(false)
  })
})

// ─── resolveJumpTarget ───────────────────────────────────────────────────────

describe('resolveJumpTarget', () => {
  it('resolves north jump', () => expect(resolveJumpTarget(50, 'north')).toBe(32))
  it('resolves south jump', () => expect(resolveJumpTarget(32, 'south')).toBe(50))
  it('resolves east jump', () => expect(resolveJumpTarget(10, 'east')).toBe(12))
  it('resolves west jump', () => expect(resolveJumpTarget(12, 'west')).toBe(10))

  it('returns null when jump goes out of bounds north', () => {
    expect(resolveJumpTarget(5, 'north')).toBeNull() // 5 - 18 < 1
  })

  it('returns null when jump goes out of bounds south', () => {
    expect(resolveJumpTarget(77, 'south')).toBeNull() // 77 + 18 > 81
  })

  it('prevents east wrap from col 8', () => {
    expect(resolveJumpTarget(8, 'east')).toBeNull() // col 8 + 2 = col 10 (wraps)
  })

  it('prevents east from col 9', () => {
    expect(resolveJumpTarget(9, 'east')).toBeNull()
  })

  it('prevents west wrap from col 2', () => {
    expect(resolveJumpTarget(2, 'west')).toBeNull() // col 2 - 2 = col 0 (wraps)
  })

  it('prevents west from col 1', () => {
    expect(resolveJumpTarget(1, 'west')).toBeNull()
  })
})

// ─── getVerticalWallSquares ───────────────────────────────────────────────────

describe('getVerticalWallSquares', () => {
  it('col 1 wallId 1 → squares 1 and 10', () => {
    expect(getVerticalWallSquares(1, 1)).toEqual({ firstSquare: 1, secondSquare: 10 })
  })

  it('col 2 wallId 3 → squares 20 and 29', () => {
    // firstSquare = 2 + 9*(3-1) = 2+18 = 20, secondSquare = 29
    expect(getVerticalWallSquares(3, 2)).toEqual({ firstSquare: 20, secondSquare: 29 })
  })

  it('col 8 wallId 8 → squares 71 and 80', () => {
    // firstSquare = 8 + 9*7 = 71, secondSquare = 80
    expect(getVerticalWallSquares(8, 8)).toEqual({ firstSquare: 71, secondSquare: 80 })
  })
})

// ─── getHorizontalWallSquares ─────────────────────────────────────────────────

describe('getHorizontalWallSquares', () => {
  it('row 1 wallId 1 → squares 1 and 2', () => {
    expect(getHorizontalWallSquares(1, 1)).toEqual({ firstSquare: 1, secondSquare: 2 })
  })

  it('row 3 wallId 2 → squares 20 and 21', () => {
    // firstSquare = 2 + 9*(3-1) = 20, secondSquare = 21
    expect(getHorizontalWallSquares(2, 3)).toEqual({ firstSquare: 20, secondSquare: 21 })
  })

  it('row 8 wallId 8 → squares 71 and 72', () => {
    // firstSquare = 8 + 9*7 = 71, secondSquare = 72
    expect(getHorizontalWallSquares(8, 8)).toEqual({ firstSquare: 71, secondSquare: 72 })
  })
})

// ─── isValidVerticalWall ─────────────────────────────────────────────────────

describe('isValidVerticalWall', () => {
  it('allows placing a wall on empty board', () => {
    expect(isValidVerticalWall(1, 1, [])).toBe(true)
  })

  it('rejects adjacent wall below (same column)', () => {
    const placed: PlacedWall[] = [{ id: 2, orientation: 'vertical', rowOrColumn: 1 }]
    expect(isValidVerticalWall(1, 1, placed)).toBe(false)
  })

  it('rejects adjacent wall above (same column)', () => {
    const placed: PlacedWall[] = [{ id: 1, orientation: 'vertical', rowOrColumn: 1 }]
    expect(isValidVerticalWall(2, 1, placed)).toBe(false)
  })

  it('allows non-adjacent wall on same column', () => {
    const placed: PlacedWall[] = [{ id: 1, orientation: 'vertical', rowOrColumn: 1 }]
    expect(isValidVerticalWall(3, 1, placed)).toBe(true)
  })

  it('rejects crossing horizontal wall', () => {
    // vertical (wallId=2, col=3) crosses horizontal (id=3, rowOrColumn=2)
    const placed: PlacedWall[] = [{ id: 3, orientation: 'horizontal', rowOrColumn: 2 }]
    expect(isValidVerticalWall(2, 3, placed)).toBe(false)
  })

  it('allows non-crossing horizontal wall', () => {
    const placed: PlacedWall[] = [{ id: 4, orientation: 'horizontal', rowOrColumn: 2 }]
    expect(isValidVerticalWall(2, 3, placed)).toBe(true)
  })
})

// ─── isValidHorizontalWall ────────────────────────────────────────────────────

describe('isValidHorizontalWall', () => {
  it('allows placing a wall on empty board', () => {
    expect(isValidHorizontalWall(1, 1, [])).toBe(true)
  })

  it('rejects adjacent wall to the right (same row)', () => {
    const placed: PlacedWall[] = [{ id: 2, orientation: 'horizontal', rowOrColumn: 1 }]
    expect(isValidHorizontalWall(1, 1, placed)).toBe(false)
  })

  it('rejects adjacent wall to the left (same row)', () => {
    const placed: PlacedWall[] = [{ id: 1, orientation: 'horizontal', rowOrColumn: 1 }]
    expect(isValidHorizontalWall(2, 1, placed)).toBe(false)
  })

  it('allows non-adjacent wall on same row', () => {
    const placed: PlacedWall[] = [{ id: 1, orientation: 'horizontal', rowOrColumn: 1 }]
    expect(isValidHorizontalWall(3, 1, placed)).toBe(true)
  })

  it('rejects crossing vertical wall', () => {
    // horizontal (wallId=3, row=2) crosses vertical (id=2, col=3)
    const placed: PlacedWall[] = [{ id: 2, orientation: 'vertical', rowOrColumn: 3 }]
    expect(isValidHorizontalWall(3, 2, placed)).toBe(false)
  })
})

// ─── checkWin ─────────────────────────────────────────────────────────────────

describe('checkWin', () => {
  it('returns null when no player is on their win line', () => {
    expect(checkWin(getInitialPositions(), 2)).toBeNull()
  })

  it('detects blue win (row 1)', () => {
    const pos = makePositions({ blue: 4 })
    expect(checkWin(pos, 2)).toBe('blue')
  })

  it('detects red win (row 9)', () => {
    const pos = makePositions({ red: 75 })
    expect(checkWin(pos, 2)).toBe('red')
  })

  it('detects green win (column 1) in 3-player game', () => {
    const pos = makePositions({ green: 28 })
    expect(checkWin(pos, 3)).toBe('green')
  })

  it('detects purple win (column 9) in 4-player game', () => {
    const pos = makePositions({ purple: 54 })
    expect(checkWin(pos, 4)).toBe('purple')
  })

  it('ignores inactive players in 2-player game', () => {
    // green at column-1 win square but only 2 players active
    const pos = makePositions({ green: 1 })
    expect(checkWin(pos, 2)).toBeNull()
  })

  it('ignores purple in 3-player game', () => {
    const pos = makePositions({ purple: 9 })
    expect(checkWin(pos, 3)).toBeNull()
  })
})

// ─── getNextPlayer ────────────────────────────────────────────────────────────

describe('getNextPlayer', () => {
  it('blue → red in 2p', () => expect(getNextPlayer('blue', 2)).toBe('red'))
  it('red → blue in 2p', () => expect(getNextPlayer('red', 2)).toBe('blue'))

  it('blue → red in 3p', () => expect(getNextPlayer('blue', 3)).toBe('red'))
  it('red → green in 3p', () => expect(getNextPlayer('red', 3)).toBe('green'))
  it('green → blue in 3p', () => expect(getNextPlayer('green', 3)).toBe('blue'))

  it('blue → red in 4p', () => expect(getNextPlayer('blue', 4)).toBe('red'))
  it('red → green in 4p', () => expect(getNextPlayer('red', 4)).toBe('green'))
  it('green → purple in 4p', () => expect(getNextPlayer('green', 4)).toBe('purple'))
  it('purple → blue in 4p', () => expect(getNextPlayer('purple', 4)).toBe('blue'))
})

// ─── computeWallPosition ─────────────────────────────────────────────────────

describe('computeWallPosition', () => {
  it('index 1 returns 1.11%', () => {
    expect(computeWallPosition(1)).toBe('1.11%')
  })

  it('index 2 returns ~11.1%', () => {
    expect(computeWallPosition(2)).toStartWith('11.1')
  })

  it('index 8 returns 77.7%', () => {
    // (8-1)*10*1.11 = 77.7
    expect(computeWallPosition(8)).toBe('77.7%')
  })
})

// ─── getDirectionFromDiff ─────────────────────────────────────────────────────

describe('getDirectionFromDiff', () => {
  it('+9 → south', () => expect(getDirectionFromDiff(9)).toBe('south'))
  it('-9 → north', () => expect(getDirectionFromDiff(-9)).toBe('north'))
  it('+1 → east', () => expect(getDirectionFromDiff(1)).toBe('east'))
  it('-1 → west', () => expect(getDirectionFromDiff(-1)).toBe('west'))
  it('other → null', () => expect(getDirectionFromDiff(5)).toBeNull())
})

// ─── capitalizeFirst ─────────────────────────────────────────────────────────

describe('capitalizeFirst', () => {
  it('capitalizes first letter', () => expect(capitalizeFirst('blue')).toBe('Blue'))
  it('handles already capitalized', () => expect(capitalizeFirst('Blue')).toBe('Blue'))
  it('handles empty string', () => expect(capitalizeFirst('')).toBe(''))
})

// ─── isWallOrientation ────────────────────────────────────────────────────────

describe('isWallOrientation', () => {
  it('accepts "vertical"', () => expect(isWallOrientation('vertical')).toBe(true))
  it('accepts "horizontal"', () => expect(isWallOrientation('horizontal')).toBe(true))
  it('rejects unknown', () => expect(isWallOrientation('diagonal')).toBe(false))
  it('rejects empty string', () => expect(isWallOrientation('')).toBe(false))
})
