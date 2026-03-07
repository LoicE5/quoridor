# Changelog

## [Unreleased] — Next.js 16 / React 19 / TypeScript migration

### Added
- Full Next.js 16 + React 19 + TypeScript rewrite of the vanilla JS legacy project
- `src/types/game.ts` — shared types (`PlayerColor`, `GameState`, `SquareState`, `PlacedWall`, …)
- `src/lib/gameLogic.ts` — pure game logic functions (move validation, wall validation, win detection)
- `src/lib/localStorage.ts` — typed read/write helpers for `numberOfPlayers` / `numberOfWalls`
- `src/hooks/useGameReducer.ts` — single reducer managing all game state with typed action union
- `src/hooks/useResponsiveBoard.ts` — responsive `70vw` / `70vh` board sizing via `window.resize`
- Component tree: `Square`, `WallElement`, `WallBar`, `WallBarHorizon`, `SquaresContainer`, `Board`, `InfoPanel`, `PrizeDrawModal`, `WinModal`, `QuoridorGame`
- `PrizeDrawModal` — replaces the legacy `alert()` prize draw with a proper `<dialog>` element
- `WinModal` — replaces the legacy `alert() + location.reload()` win notification

### Fixed
- **`app.js:185` — `geÒtNb` typo** that broke blue's jump-over-west logic; replaced with correct numeric difference calculation
- **`app.js:233–240` — green/purple jump logic used `PSR` (red's position)** instead of the current player's position; fixed to use each player's own position
- Out-of-bounds bounds checking added for pawn moves and jumps (prevents row-wrapping on east/west moves at board edges)
- TypeScript strict typing eliminates entire classes of runtime bugs present in the original

### Changed
- Game state moved from scattered DOM mutations to a single immutable `useReducer` state
- Wall placement logic ported from DOM class checks to pure state comparisons
- All CSS class names converted to CSS Modules (camelCase)
- Player count and wall count changes now re-initialise the full game state instead of reloading the page (`location.reload()` removed)
- `<dialog open>` replaces `alert()` for prize draw and win announcements
- Background image, pawn images, and GitHub logo served from `public/` via Next.js

### Not implemented
- 1-player (vs AI) mode — clicking the button shows `alert('Coming soon!')` without changing player count
