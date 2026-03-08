# Quoridor AI API — Bruno Collection

Bruno API collection for the `/api/ai-move` endpoint.

## Prerequisites

- [Bruno](https://www.usebruno.com/) desktop app **or** `@usebruno/cli` (`bun add -g @usebruno/cli`)
- The Next.js dev server running (`bun run dev`)
- A valid `.env` file at the project root (see `.env.example`)

## Structure

```
tests/bruno/
  bruno.json              — collection manifest
  environments/
    local.bru             — baseUrl = http://localhost:3000
  ai-move/
    valid-pawn-move.bru        — happy path (opening position)
    no-walls-remaining.bru     — AI has no walls, forces pawn move
    missing-env-vars.bru       — documents 500 behaviour when .env absent
    invalid-json-body.bru      — malformed body → 400
    red-near-win.bru           — AI one step from winning row
```

## Running via CLI

```bash
# from the project root
bun x @usebruno/cli run tests/bruno --env local
```

## Endpoint contract

```
POST /api/ai-move
Content-Type: application/json
```

### Request body

| Field           | Type                        | Description                       |
|-----------------|-----------------------------|-----------------------------------|
| `positions`     | `Record<color, number>`     | Current square for each player    |
| `placedWalls`   | `PlacedWall[]`              | All walls on the board            |
| `wallCounts`    | `Record<color, number>`     | Walls remaining per player        |
| `currentPlayer` | `"blue"\|"red"\|...`        | The player the AI controls        |
| `numberOfPlayers` | `1\|2\|3\|4`             | Active player count               |
| `squares`       | `SquareState[]`             | Full board squares (wall flags)   |

### Success response (200)

```json
{ "ok": true, "move": { "type": "move", "target": 68 } }
{ "ok": true, "move": { "type": "wall", "orientation": "vertical", "wallId": 3, "rowOrColumn": 5 } }
```

### Error responses

| Status | Condition                                  |
|--------|--------------------------------------------|
| 400    | Body is not valid JSON                     |
| 422    | No valid moves exist for the current state |
| 500    | LLM call failed or env vars missing        |

Error body: `{ "ok": false, "error": "<message>" }`
