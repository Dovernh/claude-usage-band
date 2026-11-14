import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'
import type { RenderSurface } from 'claude-code'

// Every hook here stands for the engine beneath the mod.
function engine(on: Parameters<TestBody>[1], surfaces: RenderSurface[], logged: string[]) {
  on('session.surfaces', () => ({ value: surfaces }))
  on('ui.log', (_, e) => { logged.push(e.text); return { value: undefined } })
  on('ui.status', () => ({ value: undefined }))
  on('clock.now', () => ({ value: Date.parse('2026-11-14T12:00:00Z') }))
  on('turn.complete', () => ({ text: '' }))
  on('session.measure', () => ({ changed: [] }))
}

const MEASURE = {
  context: { percent: 62, tokens: 124000, window: 200000 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 23, resetsAt: '2026-11-14T14:35:00Z' },
    { kind: 'seven_day', percentUsed: 41, resetsAt: '2026-11-19T09:00:00Z' },
  ],
}

const TURN = { answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' }

test('a desktop-hosted session closes each turn with the usage line', async ($, on) => {
  const logged: string[] = []
  engine(on, ['desktop', 'mobile'], logged)
  await $.session.measure(MEASURE as never)
  await $.turn.complete(TURN as never)
  expect(logged.length).toBe(1)
  expect(logged[0]).toContain('5h 23%')
  expect(logged[0]).toContain('1wk 41%')
  expect(logged[0]).toContain('Context 62% (124k/200k)')
})

test('a terminal session keeps the band and status line alone', async ($, on) => {
  const logged: string[] = []
  engine(on, ['terminal', 'mobile'], logged)
  await $.session.measure(MEASURE as never)
  await $.turn.complete(TURN as never)
  expect(logged.length).toBe(0)
})

test('a run drawing nowhere writes no line', async ($, on) => {
  const logged: string[] = []
  engine(on, [], logged)
  await $.turn.complete(TURN as never)
  expect(logged.length).toBe(0)
})
