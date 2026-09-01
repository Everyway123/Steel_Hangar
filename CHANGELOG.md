# Changelog

Every entry here is a change you can feel in a battle. Balance numbers are
measured with headless playtests, not estimated — where a number appears, it
came from a run.

## v36 — the music finally has a tune

The soundtrack had harmony but no **theme**. The lead voice walked the chord
tones through a single eight-step pattern that repeated identically every bar,
so however the chords moved underneath, the melody was wallpaper. The bass hit
the root on every other eighth and never moved; the drums played kick-on-1-and-3
for the entire battle.

Each of the six tracks now has a written **four-bar motif** — semitone offsets
relative to the chord root, so it transposes with the harmony and never goes
sour — with rests, phrasing, and a longer note wherever a rest follows. Under
it: a bass line with octave jumps instead of a pedal, sixteenth-note arpeggios
on the battle tracks (the classic chiptune shimmer that was missing entirely),
velocity accents on the strong beats, and a snare fill closing every fourth bar
so the rhythm breathes instead of ticking like a metronome.

Verified two ways, because "sounds better" is not a measurement: the motifs are
checked structurally (32 steps, at least three distinct bars out of four, real
rests, four or more distinct pitches), and an `AnalyserNode` listens to the
battle track for real — 7 distinct dominant frequencies across 150–2000 Hz,
against 1 before.

## v35 — three lives, and the round finally doubled

Rounds were 38.9 s and every attempt to stretch them made things worse. The
measurements said why, and I had been reading them without seeing it: **the
round ended when the player died**, in nine battles out of sixteen. Everything
that made enemies more dangerous therefore made rounds *shorter*.

So the fix is not enemy tuning at all — it is the part of the original Battle
City that actually fits this game: **three lives**. Death still costs
everything you were carrying (all field crates are stripped) and respawns you
on your own base with a 2.5 s shield, but it no longer ends the battle at the
thirty-second mark.

That immediately bought the headroom every earlier attempt lacked, so enemy
toughness could finally go up instead of down:

| | round | wins | lost battles |
|---|---|---|---|
| v34, no lives | 38.9 s | 44% | 9/16 |
| lives, enemy HP ×1.9 | 62.5 s | 94% | 1/16 |
| lives, HP ×2.4 | 81.7 s | 63% | 6/16 |
| lives, HP ×2.8 | 93.5 s | 19% | 11/16 |
| **lives, HP ×2.55** | **83.0 s** | **69%** | **3/16** |

Rounds went from 38.9 s to 83.0 s — more than double — and the enemy is
tougher than at any point before, not weaker.

**The wingman picks its target by your position, not its own.** Its hunting
radius (420 px) was larger than its leash (300 px), so it oscillated between
the two: measured 43% of a battle spent more than 380 px away from you. It now
only engages enemies within 360 px **of you**, so it fights in your fight.
Measured after: 0–12% of the time far, over five consecutive runs.

Two flaky checks in my own suite were fixed honestly rather than loosened. One
measured the ally's mobility with no enemies and no crates nearby — where it
correctly *holds position* — and then blamed the AI for standing still. The
other is the leash test above, which was right to complain.

## v34 — the pillboxes had never fired, and tanks moved like crabs

**The enemy pillboxes have been silent since the day they were added.**
`hasLOS` takes its first sample 16 px from the origin — inside the pillbox's
own tile, which is solid. So a pillbox's line of sight was false *always*, in
every direction, and not one of them ever fired a shot. Sight is now measured
from the muzzle. Two smaller causes on top: v32's spawn-clearing wiped
turrets next to spawn points (the pillboxes flank the enemy HQ, which sits
near the top spawns — so I was demolishing them myself), and the survivors
shared the army-wide fire budget, so with a dozen tanks alive their turn
never came. A pillbox now keeps its own cadence.

**Tanks moved unnaturally, and it was my own fix.** v32 made the corner-slide
validate exactly the point it moved to — correct, but the move became purely
*lateral*: a tank pressing right into a wall slid straight up or down with no
forward progress, which reads as crabbing along the wall. The slip is now
diagonal, as it was always meant to be: forward *and* sideways, validated at
that same point. This is what made enemies look dumb, too — they navigate
mazes constantly. Measured on an identical 16-battle run: deaths 10/16 → 3/16,
wins 38% → 81%.

**Your wingman is violet.** It was `#6fd3ff`, which is exactly the scout
enemy's colour — friend and foe were the same shade. Violet is the one free
slot in the palette (you are green, enemies are warm), plus a pulsing ring
under the hull so it reads instantly in a crowd.

**The campaign map fills the screen.** It was a 960×540 island at the top of
the page: on a large monitor half the screen was empty and the sector labels
were 11 px. Same treatment as the hangar — full viewport height, text scaling
with the display.

**Round length: measured, and here is the honest answer.** Rounds are 38.9 s
and I could not stretch them further without breaking the game. Four levers
were tried against a controlled 16-battle run:

| change | round | wins | deaths |
|---|---|---|---|
| roster 15+2×tier | 45.8 s | 38% | 10/16 |
| after the movement fix | 37.5 s | 81% | 3/16 |
| enemy HP ×2.0 | 35.5 s | 6% | 15/16 |
| HP ×1.9 + slower army fire | **38.9 s** | 44% | 9/16 |
| HP ×2.7 + slower still | 39.1 s | 6% | 15/16 |

The pattern is the same every time: **a round ends when the player dies, so
anything that raises enemy lethality makes rounds shorter, not longer.** More
bodies and tougher bodies both do that. What worked — longer time-to-kill paid
for with a slower army-wide fire rate — gains 16% of length and saturates
immediately after. Getting to 90 s honestly needs either roughly twice the
tanks per round (about 55, which was rejected as a mob) or a round with a
clock rather than a kill count. Defense mode already is the latter: five waves
of 22 s each, ~110 s.

**`node tools/balance.js`** now lives in the repository alongside the tests —
that table is reproducible, and the bot uses the game's own pathfinding so the
measurement reflects the balance rather than the bot's incompetence.

## v33 — the wingman got a brain

v32 fixed the ally's *stats* and left its head alone, so it still earned the
name it was given. It drove at the **nearest** enemy across the whole map,
abandoning you; it moved in one cardinal direction and, on hitting a wall,
re-picked that same direction and ground against it; it drove past crates
while enemies actively looted the field; and in Defense it never noticed the
base it was supposed to hold.

It now has priorities — **grab the crate → don't drift from you → cover the
base in Defense → shoot the nearest enemy** — and a real route: breadth-first
search over the tile grid. The field is 16×14, so recomputing a path a few
times a second costs nothing. Firing target is computed separately from the
movement target, so it shoots while driving for loot.

Two of my own mistakes, both caught by measurement rather than guessed:

- The first priority order put "stay near the player" above the crate, so the
  ally was turned around *on approach* — it closed to 56 px and went back.
  The crate now comes first, but only when it is near both the ally and you.
- The cheap fix (turn perpendicular for 600 ms when blocked) only half-worked:
  the ally still stalled 78–158 px from a crate behind a wall in 2 runs out of
  5. Greedy movement cannot route around an obstacle at all; that is what the
  BFS is for. Six consecutive runs now pass 8/8.

**The regression suite lives in the repository now.** It had been sitting in a
temporary directory and vanished with a container restart — precisely when the
AI had just changed. `node tests/regression.js` runs eight blocks and 64
checks, each guarding a bug that was once real. `node tools/bundle.js` builds
the standalone `steel-hangar.html` and fails loudly if any external reference
survives; that script had been ephemeral too, which is why the single-file
build silently lagged behind the repository.

## v32 — you can be killed again, and the star means something

**Tanks no longer get stuck.** Three separate causes, all real:

- `moveTank`'s corner-slide validated one position and then moved the tank to
  a *different* one, so it could slide into a wall. A tank overlapping a wall
  had every direction rejected — stuck forever, and its shells died against
  that same wall the instant they spawned, which reads as "my gun stopped
  firing".
- Spawn points were cleared of **brick** only, but the enemy HQ fortress is
  built from **steel** — a spawn inside the fortress stayed walled, so enemies
  were born inside it.
- The boss hull was 48px on a 40px tile. It could not fit through a
  single-tile gap anywhere on any map. Now 38px — still the largest tank,
  but it drives. Measured 180–254px of travel per run across four maps.

There is also a last-resort escape: a tank already overlapping a wall may move
in any direction that does not make the overlap worse, so no future bug can
trap anyone permanently.

**Difficulty now sees your build, not just your tier.** Modules and crew were
worth ×2.6 survivability (30 s → 79 s standing still on an elite Т-62), while
enemy strength keyed off tank tier alone — so a maxed tank was effectively
immortal, and the game compensated with *quantity*: 22 in the roster plus four
waves of seven, **50 tanks against one player** at tier 5.

Enemies now scale with `playerPower()` — how much stronger your build is than
a bare tank of the same tier (1.0 fresh, capped at 2.0). Against an elite Т-62
a standard enemy is 19 HP / 7 damage instead of 10 / 4. With danger coming from
quality, the roster was cut to 30 total. Measured over 16 battles: **50% wins,
60.7 s, 12.8 frags, and 8 deaths — against 2 deaths before.**

Elite survivability standing still: **79 s → 41 s**. A bare tank is 24 s, so
progression is still worth ×1.7 — it just stops being immunity.

**Tank destroyers were a bad deal, and now they aren't.** At tier 5 the Кобра
paid 2.3× survivability for 1.2× damage — strictly worse than playing a heavy,
which is exactly what it felt like. The whole ПТ line was rebalanced around
its own promise ("one bang and the enemy is gone"): **one shot kills a standard
enemy, two kill a heavy.** 15–17 DPS against 6.5–9.3 for heavies, paid for with
18–43 effective HP against 39–131. A real glass cannon instead of a bad trade.

**The ★ makes your tank stronger.** It used to hand out 120 silver and change
nothing about the fight. As in the original Battle City, stars now stack over a
battle: faster shell → +30% damage → **second barrel** → +15% damage each after.

**Your wingman is a medium now.** It had a light tank's hull (32px) and 60% of
your health, so it died before it could pull any fire. Now 34px, 75% of your
health, 80% of your damage — and it picks up crates and stars, applying them to
**you**. Enemies were looting the field while your own ally drove past.

## v31 — one-screen hangar, no dead ends

**The hangar fits on one screen.** The research tree used to be a column of
fourteen tall rows — by itself longer than a laptop screen, so "INTO BATTLE"
sat below the fold. The tree is now four horizontal branch rows of compact
chips: all fourteen tanks visible at once. Modules, the trophy codex and the
analytics panel became tabs instead of three stacked panels. Verified at
1440×900, 1280×720 and 1024×768: no page scroll, the battle button always
on screen.

**Free XP — branch ends are no longer traps.** Т-50 "Привид", Т-62 "Шквал",
Об.705 "Титан" and Об.268 "Аспід" sit at the ends of their branches: nothing
researches from them. XP earned there simply vanished. A 25-battle bot run
found it the hard way — it bought Привид on battle 3 and then banked
**9 833 ⭐ over twelve battles with nowhere to spend it**. Now XP from a tank
with nothing left to research goes into a shared **free XP** pool that pays
for any research, and can top up a shortfall on a normal one. The tree marks
branch ends with 🏁 *before* you buy, and locked tanks name the tank you
actually need instead of showing a bare padlock.

**Measured income, for the record.** 16 battles with zero spending:
1 662 🪙 per battle on average (2 436 for a win, 888 for a loss). Silver is
not the bottleneck — a tier-2 tank pays for itself in about one battle. The
long-term sink is modules: maxing all five on a tier-1 tank costs 26 250 🪙.

## v30 — Defense

A third round type, and the half of the request that was missing: enemies
that come **for your ★**, not past it.

- The field starts empty; every tank arrives with a wave
- Five waves, each bigger: `4 + tier + wave×2`. Measured 7 → 9 → 11 → 13 → 15
- 85% of enemies drive at your base, against 62% in a normal battle
- No enemy HQ and no shield — there is exactly one thing to hold
- Win by breaking the last wave; lose if the base falls
- Two campaign sectors: "Оборона: Депо" and "Оборона: Переправа"

## v29 — a roster you can actually finish

The previous pass over-corrected. Rounds went 62 s → 104 s and frags
15.9 → 28.3, but wins collapsed 75% → 17% — with only 3 deaths in 12. The bot
was not dying, it was **running out of clock**: seven battles timed out with
the tank alive at up to 96% HP.

The mistake was conflating two different things: on-screen **density**, which
makes a battle feel busy, and total **roster**, which decides whether you can
finish. They are separate now — up to 13 enemies alive at once, but the roster
cut from `22 + 3×tier` to `12 + 2×tier`, and the round limit raised to 140 s.
Result: 88 s average, 50% wins, 18.8 frags.

## v28 — one screen, a fortress, and music that reads the round

**Map.** COLS 32 → 16. The whole battlefield is in one screen: no camera, no
scrolling, no mirrored maps. The minimap was replaced by a small corner panel.

**Why rounds were short.** A probe showed the bot flattening the enemy HQ in
33 seconds, walking around the entire roster the moment the shield dropped —
the HQ was a shortcut, not an objective. It is a fortress now: steel sides and
corners, one breachable face, two gun emplacements covering it, double HP.

**Harder to kill you — arithmetically.** Survival standing still was measured
at 28 s on tier 3, reached by multiplying two things: more enemies × a shorter
army-wide reload (520/400/300 → 380/300/220 ms). An allied tank rolls out with
you and pulls fire; that is what keeps those numbers fair.

**Six soundtracks instead of one organ** — hangar, battle, wave, low health,
breakthrough, boss. Tracks swap only on a bar boundary; reverb follows the
track. All synthesised live, no audio files.

## v27 and earlier

Twenty-five field crates (fifteen pure, ten with a cost), fourteen unique tank
skins, enemies that break off to grab loot, five battlefield modifiers, the
campaign map, the battle log and the analytics panel, mobile support with an
analog stick, MIT license, GitHub Pages, SEO and PWA packaging.
