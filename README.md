# Quoridor

A browser-based implementation of the Quoridor board game, built with Next.js 16, React 19, and TypeScript.

## The Game

Quoridor is a 2–4 player abstract strategy game played on a 9×9 board. Each player has one pawn and a set of walls. The objective is to be the first player to reach the opposite side of the board.

- **Blue** starts at row 9 and must reach row 1
- **Red** starts at row 1 and must reach row 9
- **Green** (3–4 players) starts at the centre and must reach column 1
- **Purple** (4 players only) starts at the centre and must reach column 9

On each turn a player either moves their pawn one square (orthogonally) or places a wall that spans two squares. A pawn blocked by another pawn may jump over it. Walls cannot cross each other or overlap.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript 5**
- **CSS Modules**

## Running locally

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
bun test
```

Tests live in `tests/` and use bun's native test runner. They cover all pure game-logic functions in `src/lib/gameLogic.ts` and the localStorage helpers in `src/lib/localStorage.ts`.

## Architecture

```
src/
  types/game.ts          — shared TypeScript types (incl. AI request/response)
  lib/
    gameLogic.ts         — pure game logic (no DOM, no side effects)
    localStorage.ts      — persistence helpers
  hooks/
    useGameReducer.ts    — useReducer wrapping all game state
    useResponsiveBoard.ts — responsive board sizing
  components/
    Square/              — single board square (button + pawn image)
    WallElement/         — clickable/placed wall overlay
    WallBar/             — horizontal wall quota bar (top/bottom)
    WallBarHorizon/      — vertical wall quota bar (left/right)
    SquaresContainer/    — 81 squares + 128 wall overlays
    Board/               — full board layout with wall bars
    InfoPanel/           — round counter, player info, controls
    QuoridorGame.tsx     — root client component, wires everything
  app/
    page.tsx             — renders QuoridorGame
    layout.tsx           — HTML shell
    globals.css          — minimal reset + body styles
    api/ai-move/
      route.ts           — POST handler: computes valid moves, calls LLM, returns decision
```

Game state lives entirely in a single `useReducer`. All logic (move validation, wall placement, win detection) is in pure functions in `gameLogic.ts`.

## 1-player (vs AI) mode

Click **1 player (vs AI)** to play against an LLM-powered opponent. Human plays **blue**, AI plays **red**.

The AI is powered by any OpenAI-compatible endpoint (OpenRouter, Ollama, etc.). Configure it via `.env`:

```bash
cp .env.example .env
# fill in AI_API_URL, AI_API_KEY, AI_MODEL
```

### Recommended models

| Provider | Model | Notes |
|----------|-------|-------|
| OpenRouter (free) | `meta-llama/llama-3.2-3b-instruct:free` | Fast, no cost |
| OpenRouter (free) | `google/gemma-2-9b-it:free` | Better reasoning |
| Ollama (M1 Mac) | `qwen2.5:3b` | Best structured-JSON output, ~2 GB |
| Ollama (M1 Mac) | `llama3.2` | Good balance, ~2 GB |
| Ollama (M1 Mac) | `gemma2:2b` | Smallest footprint, ~1.6 GB |

For Ollama, set `AI_API_URL=http://localhost:11434/v1/chat/completions` and `AI_API_KEY=ollama`.

The AI receives the full board state (positions, walls, remaining wall counts), computes all valid moves server-side, and prompts the model to return a JSON decision. If the model hallucinates an invalid move, the server falls back to a valid one automatically.

## API testing (Bruno)

A Bruno collection is provided in `tests/bruno/` for the `/api/ai-move` endpoint.

```bash
# install Bruno CLI
bun add -g @usebruno/cli

# run all requests against the local dev server
bun x @usebruno/cli run tests/bruno --env local
```

See `tests/bruno/README.md` for endpoint contract details and per-request documentation.
