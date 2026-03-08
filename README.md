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
  types/game.ts          — shared TypeScript types
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
```

Game state lives entirely in a single `useReducer`. All logic (move validation, wall placement, win detection) is in pure functions in `gameLogic.ts`.

## 1-player (vs AI) mode

Not yet implemented. Clicking the "1 player (vs AI)" button shows an alert. The `PlayerCount` type includes `1` for forward compatibility.
