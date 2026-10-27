import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Usage } from '../types'

const EMPTY: Usage = { fiveHour: null, week: null, context: null }
const usage = atom({ plugin: 'usage-band', key: 'usage' } as const, EMPTY)

function windowOf(limits: SessionRateLimit[], kind: string): Usage['fiveHour'] {
  const found = limits.find(limit => limit.kind === kind)
  return found ? { percent: found.percentUsed, resetsAt: found.resetsAt } : null
}

function toUsage(context: SessionContextUsage, limits: SessionRateLimit[]): Usage {
  return {
    fiveHour: windowOf(limits, 'five_hour'),
    week: windowOf(limits, 'seven_day'),
    context: { percent: context.percent, tokens: context.tokens, window: context.window },
  }
}

// "in 2h 10m", "in 3d 4h"
function untilReset(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  const left = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return ` (resets in ${left})`
}

// Stoplight on how much of a window is used: plenty left, middle, running out.
function stoplight(percentUsed: number): 'success' | 'warning' | 'error' {
  if (percentUsed >= 80) return 'error'
  if (percentUsed >= 50) return 'warning'
  return 'success'
}

function kilo(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}k` : `${tokens}`
}

function line(current: Usage, now: number): string {
  const five = current.fiveHour
    ? `5h ${Math.round(current.fiveHour.percent)}%${untilReset(current.fiveHour.resetsAt, now)}`
    : '5h —'
  const week = current.week
    ? `1wk ${Math.round(current.week.percent)}%${untilReset(current.week.resetsAt, now)}`
    : '1wk —'
  const ctx = current.context
  const context = ctx && ctx.percent !== undefined
    ? `Context ${ctx.percent}% (${kilo(ctx.tokens ?? 0)}/${kilo(ctx.window)})`
    : ctx ? `Context — (${kilo(ctx.window)} window)` : 'Context —'
  return `${five} · ${week} · ${context}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const { context, rateLimits } = await $.session.usage()
    const current = toUsage(context, rateLimits)
    await update($, usage, () => current)
    // The status line too: some surfaces (Remote Control) draw no band.
    $.ui.status(line(current, await $.clock.now()))
    return result
  })

  on('session.measure', async ($, e, next) => {
    const current = toUsage(e.context, e.rateLimits)
    await update($, usage, () => current)
    $.ui.status(line(current, await $.clock.now()))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const current = await read($, usage)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    const ctx = current.context
    const contextValue = ctx && ctx.percent !== undefined
      ? `${ctx.percent}% (${kilo(ctx.tokens ?? 0)}/${kilo(ctx.window)})`
      : ctx ? `— (${kilo(ctx.window)} window)` : '—'
    const windowPart = (label: string, w: Usage['fiveHour']) => (
      <Text>
        <Text color="suggestion" weight="bold">{label} </Text>
        {w
          ? <Text color={stoplight(w.percent)} weight="bold">{Math.round(w.percent)}%</Text>
          : <Text dimColor>—</Text>}
        <Text dimColor>{w ? untilReset(w.resetsAt, now) : ''}</Text>
      </Text>
    )
    return (
      <Box>
        <Text>
          {windowPart('5h', current.fiveHour)}
          <Text dimColor> · </Text>
          {windowPart('1wk', current.week)}
          <Text dimColor> · </Text>
          <Text color="suggestion" weight="bold">Context </Text>
          {ctx && ctx.percent !== undefined
            ? <Text color={stoplight(ctx.percent)} weight="bold">{contextValue}</Text>
            : <Text dimColor>{contextValue}</Text>}
        </Text>
      </Box>
    )
  })
}
