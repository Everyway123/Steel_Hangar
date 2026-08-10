<div align="center">

# ⚙ STEEL HANGAR · СТАЛЕВИЙ АНГАР

### Battle City grew up, went to war, and started counting its silver.

**A tank game about the twenty minutes you have left in the evening.**
Two-minute battles. A hangar that remembers everything. A research tree with fourteen tanks.
No install, no account, no dependencies — one HTML file and one JS file.

`vanilla JS` · `zero dependencies` · `~190 KB total` · `runs from file://` · `desktop + mobile`

<img src="docs/battle.png" width="620" alt="Battle: two allied tanks, a twin-barrel buff running, HQ shield at 6/8">

</div>

---

<div align="center">

## ▶ [**PLAY IN YOUR BROWSER**](https://everyway123.github.io/game1/)

[![Play](https://img.shields.io/badge/▶_play_now-free-39ff88?style=for-the-badge&labelColor=0a0e14)](https://everyway123.github.io/game1/)
[![No dependencies](https://img.shields.io/badge/dependencies-zero-2fb7ff?style=for-the-badge&labelColor=0a0e14)](#under-the-hood)
[![Vanilla JS](https://img.shields.io/badge/built_with-vanilla_JS-ffd23f?style=for-the-badge&labelColor=0a0e14)](#under-the-hood)

</div>

## The pitch

You get a scrappy tier-1 trainer and a silver balance that barely covers a gun upgrade.
Ahead of you: fourteen sectors, an enemy HQ behind a steel shield, and a research tree
that ends in a monster with two barrels.

Every battle is **under two minutes**. Every battle moves something in the hangar.
Close the tab whenever — it all saves itself.

> The game is in **Ukrainian**. The controls are arrows and spacebar; you'll be fine.

## Play it

**[everyway123.github.io/game1](https://everyway123.github.io/game1/)** — click and you're in a battle.
Nothing to install, no account, no ads. Works on a phone.

Or run it locally:

```bash
git clone https://github.com/Everyway123/game1.git
open game1/index.html          # that's it
```

No build step. No `npm install`. Open the file.

## What's in it

<table>
<tr><td width="50%">

### 🌳 Fourteen tanks, four branches
Scouts, mediums, heavies, tank destroyers — up to tier 7.
Earn tank XP to research the next one, silver to buy it,
crew XP that quietly makes everything better.
Every module maxed → the tank goes **ELITE**.

</td><td width="50%">

### 🎁 Twenty-five field crates
Fifteen are pure upgrades. **Ten cost you something.**
Twin barrel, homing shells, HEAT, autoloader —
or Berserk (damage climbs as you bleed),
Overheat (fires twice as fast, hurts you every shot),
Lottery (could be anything).

</td></tr>
<tr><td>

### 🛡 A round with an arc
The enemy HQ sits behind a **steel shield** until you've broken
half their forward group. So a round isn't a flat grind —
it's a fight for advantage, then a breakthrough.

</td><td>

### 🗺 Maps twice as wide as your screen
The camera follows your tank; a minimap keeps the whole
battlefield in view. Bushes hide you. Barrels chain-explode.
Ice makes you drift. Walls take three shots, not one.

</td></tr>
<tr><td>

### 🤝 Allied pilots
A rare crate brings a friendly tank into the fight —
60% of your health, 70% of your damage, and it draws fire.
Find a second one and you're rolling three deep.

</td><td>

### 🎼 A soundtrack with no audio files
Cinematic organ, generated live in WebAudio: a 4.2-second
convolution reverb built at runtime, additive organ pipes
instead of a sawtooth, an eighth-note ostinato and a slow
sixteen-bar crescendo. Denser in battle than in the hangar.

</td></tr>
</table>

---

<div align="center">

### The hangar remembers everything

<img src="docs/hangar.png" width="760" alt="Hangar: research tree, tank stats, modules, trophy codex">

### Fourteen sectors from the Bridgehead to the ☭ Citadel

<img src="docs/front.png" width="760" alt="Front campaign map with sectors and battle modifiers">

### Fourteen tanks, fourteen silhouettes

<img src="docs/tanks.png" width="820" alt="All 14 tank skins: spaced armour, side skirts, camo nets, twin barrels">

</div>

---

## Details worth the scroll

**Every battle logs itself.** Frags, damage taken, ricochets, doctrines picked, seconds
elapsed, map, mode — straight to `localStorage`, exportable as JSON from the hangar.
The analytics panel reads it back: win rate by tank, by map, last ten battles.

**Balance here is measured, not vibed.** Assault mode was tuned after 24 controlled battles
per mode on an identical tank — 63% wins in Clear against 29% in Assault, so the reward went
up rather than the difficulty down. Enemy fire rate was set by counting shots per second with
a probe, not by ear. The music got rebalanced because an `AnalyserNode` showed the sub pedal
was drowning the organ at 43 Hz.

**Five battlefield modifiers.** Fog, night, artillery bombardment, minefields, deep frost —
each attached to specific campaign sectors.

**Enemies want the loot too.** They'll break off and drive for a crate, and a buffed enemy
wears its icon overhead. See a 🛰 above a red tank and start moving: that one's shells follow you.

---

## Controls

| | Keyboard | Phone |
|---|---|---|
| Move | `WASD` / arrows | analog stick |
| Fire | `Space` — it goes where you're facing | big 💥 button, with auto-aim |
| Repair kit | `E` | 🔧 |
| Pause | `Esc` | ⏸ |
| Music | `M` | — |

On a phone the hangar collapses to one column, **INTO BATTLE** sticks to the bottom of the
screen, and the campaign becomes a vertical list instead of a map.

<div align="center">
<img src="docs/mobile.png" width="270" alt="Mobile: analog stick, big fire button, playfield centred">
</div>

---

## Under the hood

Two files. `index.html` is the hangar, the campaign map and the overlays;
`game.js` is everything else — about 3 800 lines of it. Canvas 2D for rendering,
WebAudio for every sound (all synthesised, no samples), `localStorage` for saves
with migration for older ones.

No framework, no bundler, no assets folder. The tanks are drawn with paths and gradients,
the explosions are particles, the reverb is a noise buffer with a power-law decay.

```
game1/
├── index.html      hangar UI, campaign map, overlays, styles
├── game.js         game loop, AI, rendering, audio, save
└── docs/           screenshots
```

## Contributing

Bug reports welcome — especially with an exported battle log attached, that's the whole
point of the logging. If you want to add a tank, a map or a crate, they're all plain data
near the top of `game.js` (`TANKS`, `MAPS`, `CRATES`) — adding one is a few lines.

---

<div align="center">

**[🇺🇦 Опис українською →](README.uk.md)**

Built with [Claude Code](https://claude.com/claude-code).

</div>
