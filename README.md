# usage-band

A Claude Code mod that keeps your usage in view. One dim line above the prompt
(and in the status line) shows how much of the 5-hour window and the weekly
window you have used, when each one resets, and how full the context window is:

    5h 23% (resets 2:35 PM) · 1wk 41% (resets Thu 9:00 AM) · Context 62% (124k/200k)

The 5h, 1wk and context percentages are stoplight-coloured: green while under half is
used, yellow from 50%, red from 80%.

It updates after every turn and whenever a usage window moves by a whole point.
In a session the desktop app hosts, a phone or iPad watching over Remote
Control draws neither the band nor the status line, so there the same line is
also written into the chat at the end of every turn (shown, not sent to the
model). A session started in a terminal does not get that line.
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
