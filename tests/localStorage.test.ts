import { describe, it, expect, beforeEach } from 'bun:test'
import { readNumberOfPlayers, readNumberOfWalls, writeNumberOfPlayers, writeNumberOfWalls } from '../src/lib/localStorage'

// Provide a minimal localStorage shim for the bun test environment
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val },
  removeItem: (key: string) => { delete store[key] }
}

// @ts-expect-error — patching global for tests
globalThis.window = { localStorage: localStorageMock }

beforeEach(() => {
  for(const k of Object.keys(store)) delete store[k]
})

describe('readNumberOfPlayers', () => {
  it('defaults to 2 when nothing stored', () => {
    expect(readNumberOfPlayers()).toBe(2)
  })

  it('reads back a valid stored value', () => {
    store['numberOfPlayers'] = '3'
    expect(readNumberOfPlayers()).toBe(3)
  })

  it('falls back to 2 for invalid value', () => {
    store['numberOfPlayers'] = 'abc'
    expect(readNumberOfPlayers()).toBe(2)
  })
})

describe('readNumberOfWalls', () => {
  it('defaults to 10 when nothing stored', () => {
    expect(readNumberOfWalls()).toBe(10)
  })

  it('reads back 5 when stored', () => {
    store['numberOfWalls'] = '5'
    expect(readNumberOfWalls()).toBe(5)
  })

  it('defaults to 10 for invalid value', () => {
    store['numberOfWalls'] = 'bad'
    expect(readNumberOfWalls()).toBe(10)
  })
})

describe('writeNumberOfPlayers', () => {
  it('persists the value', () => {
    writeNumberOfPlayers(4)
    expect(store['numberOfPlayers']).toBe('4')
  })
})

describe('writeNumberOfWalls', () => {
  it('persists the value', () => {
    writeNumberOfWalls(5)
    expect(store['numberOfWalls']).toBe('5')
  })
})
