export type Usage = {
  fiveHour: { percent: number; resetsAt?: string } | null
  week: { percent: number; resetsAt?: string } | null
  context: { percent?: number; tokens?: number; window: number } | null
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { usage: Usage }
  }
}
