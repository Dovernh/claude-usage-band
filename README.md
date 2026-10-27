# usage-band

A Claude Code mod that keeps your usage in view. One dim line above the prompt
(and in the status line) shows how much of the 5-hour window and the weekly
window you have used, when each one resets, and how full the context window is:

    5h 23% (resets in 2h 10m) · 1wk 41% (resets in 3d 4h) · Context 62% (124k/200k)

The 5h, 1wk and context percentages are stoplight-coloured: green while under half is
used, yellow from 50%, red from 80%.

It updates after every turn and whenever a usage window moves by a whole point.
The 5-hour and weekly figures come from a Claude subscription; on API billing
they show as "—".

## Install

At the prompt of a terminal session:

```
/plugin install usage-band --marketplace Dovernh/claude-usage-band
```

From a shell:

```
claude plugin install usage-band --marketplace Dovernh/claude-usage-band
```

In the desktop app, where `/plugin` does not run: click + next to the prompt
box, then Plugins, Add marketplace with `Dovernh/claude-usage-band`, then Add
plugin.
