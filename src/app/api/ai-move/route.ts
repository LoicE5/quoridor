import { NextRequest, NextResponse } from 'next/server'
import type { AIMoveRequest, AIMoveResponse, AIMoveDecision, WallOrientation } from '@/types/game'
import {
  isValidPawnMove,
  isValidVerticalWall,
  isValidHorizontalWall,
  buildInitialSquares,
  getVerticalWallSquares,
  getHorizontalWallSquares
} from '@/lib/gameLogic'
import type { PlayerColor, SquareState } from '@/types/game'

// ── Square reconstruction ─────────────────────────────────────────────────────
// Rebuilds the squares array from positions + placedWalls when the client
// omits it or sends an empty array.

function ensureSquares(req: AIMoveRequest): SquareState[] {
  if(Array.isArray(req.squares) && req.squares.length === 81) return req.squares

  const squares = buildInitialSquares()

  for(const [color, pos] of Object.entries(req.positions)) {
    if(pos >= 1 && pos <= 81) squares[pos - 1].occupiedBy = color as PlayerColor
  }

  for(const wall of req.placedWalls) {
    if(wall.orientation === 'vertical') {
      const { firstSquare, secondSquare } = getVerticalWallSquares(wall.id, wall.rowOrColumn)
      if(firstSquare >= 1 && firstSquare <= 81) squares[firstSquare - 1].hasWallRight = true
      if(secondSquare >= 1 && secondSquare <= 81) squares[secondSquare - 1].hasWallRight = true
    } else {
      const { firstSquare, secondSquare } = getHorizontalWallSquares(wall.id, wall.rowOrColumn)
      if(firstSquare >= 1 && firstSquare <= 81) squares[firstSquare - 1].hasWallBottom = true
      if(secondSquare >= 1 && secondSquare <= 81) squares[secondSquare - 1].hasWallBottom = true
    }
  }

  return squares
}

// ── Valid-move computation ────────────────────────────────────────────────────

function computeValidPawnMoves(req: AIMoveRequest): number[] {
  const squares = ensureSquares(req)
  const { positions, currentPlayer } = req
  const from = positions[currentPlayer]
  if(!from || from < 1 || from > 81) return []
  const candidates = [from - 9, from + 9, from - 1, from + 1]
  return candidates.filter(t =>
    t >= 1 && t <= 81 && isValidPawnMove(currentPlayer, t, squares, positions)
  )
}

type WallOption = { orientation: WallOrientation; wallId: number; rowOrColumn: number }

function computeValidWalls(req: AIMoveRequest): WallOption[] {
  if(req.wallCounts[req.currentPlayer] <= 0) return []

  const valid: WallOption[] = []

  for(let col = 1; col <= 8; col++) {
    for(let id = 1; id <= 8; id++) {
      if(isValidVerticalWall(id, col, req.placedWalls)) {
        valid.push({ orientation: 'vertical', wallId: id, rowOrColumn: col })
      }
    }
  }

  for(let row = 1; row <= 8; row++) {
    for(let id = 1; id <= 8; id++) {
      if(isValidHorizontalWall(id, row, req.placedWalls)) {
        valid.push({ orientation: 'horizontal', wallId: id, rowOrColumn: row })
      }
    }
  }

  return valid
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(req: AIMoveRequest, pawnMoves: number[], wallOptions: WallOption[]): string {
  const { positions, currentPlayer, wallCounts } = req

  const goals: Record<string, string> = {
    blue: 'reach row 1 (squares 1–9, top edge)',
    red: 'reach row 9 (squares 73–81, bottom edge)',
    green: 'reach column 1 (squares 1,10,19,28,37,46,55,64,73, left edge)',
    purple: 'reach column 9 (squares 9,18,27,36,45,54,63,72,81, right edge)'
  }

  const opponentPositions = Object.entries(positions)
    .filter(([c]) => c !== currentPlayer)
    .map(([c, p]) => `${c} at square ${p}`)
    .join(', ')

  // Limit walls in prompt to keep context small (prefer walls near opponents)
  const limitedWalls = wallOptions.slice(0, 30)

  const wallsStr = wallOptions.length === 0
    ? 'none (no walls remaining)'
    : JSON.stringify(limitedWalls)

  return `You are playing Quoridor as ${currentPlayer.toUpperCase()}.
Board: 9×9 grid, squares 1-81 left-to-right top-to-bottom. Row 1 is top, row 9 is bottom.
Your goal: ${goals[currentPlayer]}.

Current state:
- Your position (${currentPlayer}): square ${positions[currentPlayer]}
- Opponents: ${opponentPositions}
- Your walls remaining: ${wallCounts[currentPlayer]}

Valid pawn moves (target squares): ${JSON.stringify(pawnMoves)}
Valid wall placements (showing up to 30): ${wallsStr}

Rules: Moving onto an opponent's starting row's square wins immediately. Walls block movement permanently.

Respond with ONLY a JSON object, no other text:
{"type":"move","target":<number>}
or
{"type":"wall","orientation":"vertical"|"horizontal","wallId":<1-8>,"rowOrColumn":<1-8>}

Pick the move that best advances you toward your goal and/or blocks opponents.`
}

// ── Fallback move (used when LLM is unavailable) ─────────────────────────────

function fallbackMove(
  req: AIMoveRequest,
  pawnMoves: number[]
): AIMoveDecision {
  const { currentPlayer } = req
  // Pick the pawn move that best advances toward goal
  const scored = pawnMoves.map(sq => {
    let score = 0
    if(currentPlayer === 'red')    score = sq          // maximize sq# → row 9
    if(currentPlayer === 'blue')   score = 82 - sq     // minimize sq# → row 1
    if(currentPlayer === 'green')  score = -(sq % 9 === 0 ? 9 : sq % 9)   // minimize column
    if(currentPlayer === 'purple') score = sq % 9 === 0 ? 9 : sq % 9      // maximize column
    return { sq, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return { type: 'move', target: scored[0].sq }
}

// ── LLM call ─────────────────────────────────────────────────────────────────

async function callLLM(prompt: string): Promise<string> {
  const url = process.env.AI_API_URL
  const key = process.env.AI_API_KEY
  const model = process.env.AI_MODEL

  if(!url || !key || !model) {
    throw new Error('AI_API_URL, AI_API_KEY, and AI_MODEL must be set in .env')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    })
  })

  const rawBody = await res.text()

  if(!res.ok) {
    throw new Error(`LLM request failed (${res.status}): ${rawBody}`)
  }

  const data = JSON.parse(rawBody) as {
    choices?: { message?: { content?: string | null; reasoning?: string } }[]
  }

  const message = data.choices?.[0]?.message
  // Some reasoning models return content: null with answer only in reasoning field
  const content = message?.content || message?.reasoning || ''
  if(!content) throw new Error(`LLM returned empty response. Full data: ${JSON.stringify(data)}`)
  return content.trim()
}

// ── Response parser / validator ───────────────────────────────────────────────

function parseDecision(
  raw: string,
  pawnMoves: number[],
  wallOptions: WallOption[]
): AIMoveDecision {
  // Strip reasoning blocks (<think>...</think>) emitted by reasoning models
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')
  // Strip markdown code fences if present
  const cleaned = withoutThink.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()

  // Extract first JSON object
  const match = cleaned.match(/\{[\s\S]*?\}/)
  if(!match) throw new Error(`No JSON object found in: ${raw}`)

  const obj = JSON.parse(match[0]) as Record<string, unknown>

  if(obj.type === 'move') {
    const target = Number(obj.target)
    if(!pawnMoves.includes(target)) {
      // Fallback: pick first valid pawn move
      if(pawnMoves.length === 0) throw new Error('No valid pawn moves available')
      return { type: 'move', target: pawnMoves[0] }
    }
    return { type: 'move', target }
  }

  if(obj.type === 'wall') {
    const orientation = obj.orientation as WallOrientation
    const wallId = Number(obj.wallId)
    const rowOrColumn = Number(obj.rowOrColumn)

    if(orientation !== 'vertical' && orientation !== 'horizontal') {
      throw new Error(`Invalid wall orientation: ${orientation}`)
    }

    const isValid = wallOptions.some(w =>
      w.orientation === orientation && w.wallId === wallId && w.rowOrColumn === rowOrColumn
    )

    if(!isValid) {
      // Fallback: place first valid wall if available, otherwise move
      if(wallOptions.length > 0) {
        const w = wallOptions[0]
        return { type: 'wall', orientation: w.orientation, wallId: w.wallId, rowOrColumn: w.rowOrColumn }
      }
      if(pawnMoves.length > 0) return { type: 'move', target: pawnMoves[0] }
      throw new Error('No valid moves available')
    }

    return { type: 'wall', orientation, wallId, rowOrColumn }
  }

  throw new Error(`Unknown action type: ${obj.type}`)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<AIMoveResponse>> {
  let body: AIMoveRequest

  try {
    body = await req.json() as AIMoveRequest
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const pawnMoves = computeValidPawnMoves(body)
    const wallOptions = computeValidWalls(body)

    if(pawnMoves.length === 0 && wallOptions.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid moves available' }, { status: 422 })
    }

    let move: AIMoveDecision
    try {
      const prompt = buildPrompt(body, pawnMoves, wallOptions)
      const raw = await callLLM(prompt)
      move = parseDecision(raw, pawnMoves, wallOptions)
    } catch (llmErr) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr)
      console.warn('[ai-move] LLM unavailable, using fallback:', msg.slice(0, 120))
      if(pawnMoves.length === 0) throw llmErr  // no fallback possible, surface the error
      move = fallbackMove(body, pawnMoves)
    }

    return NextResponse.json({ ok: true, move })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai-move] error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
