# Changelog

Every entry here is a change you can feel in a battle. Balance numbers are
measured with headless playtests, not estimated — where a number appears, it
came from a run.

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
