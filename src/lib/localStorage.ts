import type { PlayerCount, WallCount } from '@/types/game'

function toPlayerCount(value: unknown): PlayerCount {
  const n = Number(value)
  if(n === 1 || n === 2 || n === 3 || n === 4) return n
  return 2
}

function toWallCount(value: unknown): WallCount {
  const n = Number(value)
  return n === 5 ? 5 : 10
}

export function readNumberOfPlayers(): PlayerCount {
  if(typeof window === 'undefined') return 2
  return toPlayerCount(window.localStorage.getItem('numberOfPlayers'))
}

export function readNumberOfWalls(): WallCount {
  if(typeof window === 'undefined') return 10
  return toWallCount(window.localStorage.getItem('numberOfWalls'))
}

export function writeNumberOfPlayers(count: PlayerCount): void {
  if(typeof window === 'undefined') return
  window.localStorage.setItem('numberOfPlayers', String(count))
}

export function writeNumberOfWalls(count: WallCount): void {
  if(typeof window === 'undefined') return
  window.localStorage.setItem('numberOfWalls', String(count))
}
