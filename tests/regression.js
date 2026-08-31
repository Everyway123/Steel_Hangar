/*
 * Регресія «Сталевого Ангара».
 *
 *   node tests/regression.js            — усе
 *   node tests/regression.js stuck ally — лише названі блоки
 *
 * Потрібен playwright і хромів бінарник. У цьому середовищі:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers, запуск через executablePath.
 *
 * Кожен блок ловить конкретну помилку, яка колись була справжньою, — тому
 * назви описують поведінку гри, а не назви функцій.
 */
const { chromium } = require('playwright');
const path = require('path');

const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const EXE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

let ok = 0, fail = 0;
const t = (name, cond, extra) => {
  cond ? ok++ : fail++;
  console.log(`  ${cond ? '✅' : '❌'} ${name}${extra ? '  ' + extra : ''}`);
};

async function fresh(browser, { turbo = true } = {}) {
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(GAME);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(400);
  if (turbo) {
    await page.evaluate(`{ let t = performance.now();
      window.requestAnimationFrame = cb => setTimeout(() => cb(t += 25), 4); }`);
  }
  return { page, errs };
}

// ─────────────────────────────────────────────────────────────────────────────
const BLOCKS = {};

// Танк не має застрягати назавжди. Колись moveTank перевіряв одну позицію,
// а зсував танк в іншу — той заїжджав у стіну, і далі canMoveTo відхиляв УСІ
// напрямки. Тоді ж і кулі гасли об власну стіну одразу після пострілу.
BLOCKS.stuck = async browser => {
  const { page, errs } = await fresh(browser);
  await page.evaluate(() => startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null }));
  await page.waitForTimeout(300);

  const esc = await page.evaluate(() => {
    const p = player;
    const r = Math.floor(p.y / TILE), c = Math.floor(p.x / TILE);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (grid[rr] && grid[rr][cc] !== undefined) grid[rr][cc] = T_BRICK;
    }
    const before = blockedCorners(p.x, p.y, p.size);
    let moved = 0;
    for (let i = 0; i < 120; i++) if (moveTank(p, 'up', 2)) moved++;
    return { before, after: blockedCorners(p.x, p.y, p.size), moved };
  });
  t('замурований танк виповзає, а не блокується намертво', esc.moved > 0 && esc.after < esc.before,
    `кутів у стіні ${esc.before} → ${esc.after}, рухів ${esc.moved}`);

  const clean = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      moveTank(player, ['up', 'right', 'down', 'left'][i % 4], 3);
      worst = Math.max(worst, blockedCorners(player.x, player.y, player.size));
    }
    return worst;
  });
  t('вільний рух ніколи не заводить у стіну', clean === 0, `максимум кутів ${clean}`);

  const eng = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    const r0 = battle.homeR, c0 = battle.homeC;
    grid[r0][c0 - 1] = T_EMPTY;
    player.x = (c0 - 1) * TILE + TILE / 2;
    player.y = r0 * TILE + TILE / 2;
    rebuildHomeWall();
    return blockedCorners(player.x, player.y, player.size);
  });
  t('інженерний мур не мурує цеглу під танком', eng === 0, `кутів у стіні ${eng}`);

  const shot = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    bullets.length = 0;
    player.cooldown = 0;
    shoot(player, true);
    const born = bullets.length;
    for (let i = 0; i < 3; i++) updateBullets(16.67);
    return { born, alive: bullets.filter(b => !b.dead).length };
  });
  t('постріл народжує кулю, що летить', shot.born > 0 && shot.alive > 0,
    `народилось ${shot.born}, летить ${shot.alive}`);

  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Спавн ворогів чистився лише від цегли, а фортеця штабу зі СТАЛІ — ворог
// народжувався всередині неї і не міг ані їхати, ані стріляти.
BLOCKS.spawn = async browser => {
  const { page, errs } = await fresh(browser);
  for (const m of ['Полігон', 'Арена генерала', 'Міські руїни', 'Штурм: Радарна база']) {
    const r = await page.evaluate(mm => {
      startBattle({ id: null, name: 't', map: mm, mode: 'assault', mod: null });
      let walled = 0;
      for (const p of spawnPoints) {
        const tile = grid[Math.floor(p.y / TILE)][Math.floor(p.x / TILE)];
        if (tile === T_BRICK || tile === T_STEEL || tile === T_TURRET) walled++;
      }
      return { walled, pts: spawnPoints.length, map: battle.mapName };
    }, m);
    t(`${r.map}: жоден спавн не в стіні`, r.walled === 0, `замурованих ${r.walled}/${r.pts}`);
  }

  const live = await page.evaluate(async () => {
    startBattle({ id: null, name: 't', map: 'Штурм: Радарна база', mode: 'assault', mod: null });
    let worst = 0, checked = 0;
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 25));
      for (const e of enemies) {
        if (e.dead || e.spawning > 0) continue;
        checked++;
        worst = Math.max(worst, blockedCorners(e.x, e.y, e.size));
      }
    }
    return { worst, checked };
  });
  t('за бій жоден ворог не сидить у стіні', live.worst === 0,
    `максимум кутів ${live.worst}, перевірок ${live.checked}`);

  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Корпус боса був 48 px при клітині 40 — він не пролазив у жоден однотайловий
// прохід на жодній карті і застрягав назавжди.
BLOCKS.boss = async browser => {
  const { page, errs } = await fresh(browser);
  const size = await page.evaluate(() => ENEMY_TYPES.boss.size);
  t('корпус боса пролазить у прохід', size < 40, `size ${size} при TILE 40`);

  for (const m of ['Полігон', 'Міські руїни', 'Арена генерала']) {
    const r = await page.evaluate(async mm => {
      startBattle({ id: null, name: 't', map: mm, mode: 'clear', mod: null });
      spawnQueue.length = 0; enemies.length = 0;
      spawnQueue.push('boss'); spawnTimer = 0;
      for (let i = 0; i < 40; i++) { trySpawnEnemy(25); await new Promise(r => setTimeout(r, 5)); }
      const b = enemies.find(e => e.type === 'boss');
      if (!b) return { none: true };
      b.spawning = 0;
      const s = { x: b.x, y: b.y };
      let worst = 0;
      for (let i = 0; i < 200; i++) {
        await new Promise(r => setTimeout(r, 12));
        if (b.dead) break;
        worst = Math.max(worst, blockedCorners(b.x, b.y, b.size));
      }
      return { dist: Math.hypot(b.x - s.x, b.y - s.y), worst, map: battle.mapName };
    }, m);
    if (r.none) { t(`${m}: бос з'явився`, false); continue; }
    t(`${r.map}: бос їздить і не в стіні`, r.dist > 40 && r.worst === 0,
      `проїхав ${r.dist.toFixed(0)}px, кутів у стіні ${r.worst}`);
  }
  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// ★ мала просто давати срібло. Як в оригінальному Battle City вона має
// підсилювати танк, і підсилення складаються.
BLOCKS.star = async browser => {
  const { page, errs } = await fresh(browser);
  const st = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    const snap = () => ({ bs: player.bulletSpeed, dmg: player.dmg, twin: !!player.twin });
    const a = snap(); takeStar(0, 0, '');
    const b = snap(); takeStar(0, 0, '');
    const c = snap(); takeStar(0, 0, '');
    const d = snap(); takeStar(0, 0, '');
    return { a, b, c, d, e: snap(), stars: battle.stars };
  });
  t('★ — швидший снаряд', st.b.bs > st.a.bs, `${st.a.bs.toFixed(1)} → ${st.b.bs.toFixed(1)}`);
  t('★★ — більше урону', st.c.dmg > st.b.dmg, `${st.b.dmg.toFixed(1)} → ${st.c.dmg.toFixed(1)}`);
  t('★★★ — другий ствол', st.d.twin && !st.c.twin);
  t('★ понад три — далі урон', st.e.dmg > st.d.dmg, `${st.d.dmg.toFixed(1)} → ${st.e.dmg.toFixed(1)}`);

  const twin = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    bullets.length = 0; player.cooldown = 0; shoot(player, true);
    const one = bullets.length;
    takeStar(0, 0, ''); takeStar(0, 0, ''); takeStar(0, 0, '');
    bullets.length = 0; player.cooldown = 0; shoot(player, true);
    return { one, two: bullets.length };
  });
  t('третя ★ справді стріляє двома', twin.one === 1 && twin.two === 2, `${twin.one} → ${twin.two} кулі`);
  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Союзник був ЛТ, їхав на найближчого ворога через усю карту, кидав гравця
// і проїжджав повз трофеї.
BLOCKS.ally = async browser => {
  const { page, errs } = await fresh(browser);

  const h0 = await page.evaluate(() => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    const h = (battle.helpers || [])[0];
    return h ? { size: h.size, hpR: h.maxHp / player.maxHp, dmgR: h.dmg / player.dmg } : null;
  });
  t('союзник виїжджає з першої секунди', !!h0);
  t('союзник має корпус СТ', h0 && h0.size === 34, h0 ? `size ${h0.size}` : '');
  t('союзник достатньо міцний, щоб відтягувати вогонь', h0 && h0.hpR >= 0.7,
    h0 ? `${(h0.hpR * 100).toFixed(0)}% твоїх HP` : '');

  const near = await page.evaluate(async () => {
    startBattle({ id: null, name: 't', map: 'Міські руїни', mode: 'clear', mod: null });
    const h = battle.helpers[0];
    let far = 0, n = 0, maxD = 0;
    for (let i = 0; i < 260; i++) {
      await new Promise(r => setTimeout(r, 12));
      if (h.dead) break;
      const d = Math.hypot(player.x - h.x, player.y - h.y);
      maxD = Math.max(maxD, d); n++;
      if (d > 380) far++;
    }
    return { farPct: n ? far / n : 1, maxD };
  });
  t('союзник не тікає від гравця через усю карту', near.farPct < 0.25,
    `далеко ${(near.farPct * 100).toFixed(0)}% часу, макс ${near.maxD.toFixed(0)}px`);

  const loot = await page.evaluate(async () => {
    startBattle({ id: null, name: 't', map: 'Полігон', mode: 'clear', mod: null });
    enemies.length = 0; spawnQueue.length = 0;
    const h = battle.helpers[0];
    drops.length = 0;
    // Коробка має стояти в ДОСЯЖНОМУ місці: перша ж вільна клітина може
    // виявитись замкненою кишенею, і тоді тест міряв би не розум союзника,
    // а те, чи існує маршрут узагалі (саме на цьому він і блимав).
    let spot = null;
    for (let r = 1; r < ROWS - 1 && !spot; r++) for (let c = 1; c < COLS - 1; c++) {
      const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
      const d = Math.hypot(x - h.x, y - h.y);
      if (d > 110 && d < 190 && rectFree(x, y, h.size, false) &&
          Math.hypot(x - player.x, y - player.y) < 360 && pathDir(h, x, y)) {
        spot = { x, y }; break;
      }
    }
    if (!spot) return { none: true };
    drops.push({ x: spot.x, y: spot.y, kind: 'twin', ttl: 30000, dead: false });
    const d0 = Math.hypot(spot.x - h.x, spot.y - h.y);
    const buffs0 = player.buffs.length;
    let dmin = d0;
    for (let i = 0; i < 160; i++) {
      await new Promise(r => setTimeout(r, 12));
      dmin = Math.min(dmin, Math.hypot(spot.x - h.x, spot.y - h.y));
      if (player.buffs.length > buffs0) break;
    }
    return { d0, dmin, got: player.buffs.length > buffs0 };
  });
  t('союзник ЗАБИРАЄ коробку і віддає бонус гравцю', !loot.none && loot.got,
    loot.none ? 'нема вільного місця' : `${loot.d0.toFixed(0)} → ${loot.dmin.toFixed(0)}px`);

  // без ворогів: тут міряється рухливість, а не бойова живучість — інакше
  // тест блимав, коли союзник гинув на початку і «проїхав» виходило мало
  const move = await page.evaluate(async () => {
    startBattle({ id: null, name: 't', map: 'Міські руїни', mode: 'clear', mod: null });
    enemies.length = 0; spawnQueue.length = 0;
    const h = battle.helpers[0];
    let path = 0, px = h.x, py = h.y;
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 12));
      enemies.length = 0;
      path += Math.hypot(h.x - px, h.y - py); px = h.x; py = h.y;
    }
    return path;
  });
  t('союзник їздить, а не тре об стіну', move > 300, `проїхав ${move.toFixed(0)}px`);

  const def = await page.evaluate(async () => {
    startBattle({ id: 'oborona1', name: 'Оборона: Депо', map: 'Склад боєприпасів', mode: 'defense', mod: null });
    const h = battle.helpers[0];
    const bx = battle.homeC * TILE + TILE / 2, by = battle.homeR * TILE + TILE / 2;
    let sum = 0, n = 0;
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 12));
      if (h.dead) break;
      sum += Math.hypot(h.x - bx, h.y - by); n++;
    }
    return { avg: n ? sum / n : 9999, mode: battle.mode };
  });
  t('в обороні союзник прикриває базу', def.mode === 'defense' && def.avg < 420,
    `сер. відстань до бази ${def.avg.toFixed(0)}px`);

  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Кінці гілок (Привид, Шквал, Титан, Аспід) з'їдали досвід: з них не веде
// жодне дослідження, і зароблені там ⭐ просто зникали.
BLOCKS.freexp = async browser => {
  const { page, errs } = await fresh(browser, { turbo: false });

  const tree = await page.evaluate(() =>
    Object.keys(TANKS).filter(id => isBranchEnd(id)).join(','));
  t('кінці гілок визначаються правильно', tree === 'pryvyd,shkval,tytan,aspid', tree);

  const r = await page.evaluate(() => {
    save.tanks.pryvyd = { researched: true, owned: true, xp: 0, crewXp: 0, modules: {} };
    save.current = 'pryvyd'; save.freeXp = 0;
    if (!hasOpenResearch(save.current)) save.freeXp += 500; else tankSave(save.current).xp += 500;
    return { free: save.freeXp, tankXp: tankSave('pryvyd').xp };
  });
  t('досвід із тупика йде у вільний', r.free === 500 && r.tankXp === 0,
    `вільний ${r.free}, на танку ${r.tankXp}`);

  const r2 = await page.evaluate(() => {
    save.current = 'kadet'; save.freeXp = 0; tankSave('kadet').xp = 0;
    if (!hasOpenResearch(save.current)) save.freeXp += 300; else tankSave(save.current).xp += 300;
    return { free: save.freeXp, tankXp: tankSave('kadet').xp };
  });
  t('звичайний танк копить власний досвід', r2.free === 0 && r2.tankXp === 300);

  const r3 = await page.evaluate(() => {
    save.freeXp = 250; tankSave('kadet').xp = 200;
    delete save.tanks.sokil;
    tankNodeClick('sokil');
    return { researched: tankSave('sokil').researched, free: save.freeXp, kadet: tankSave('kadet').xp };
  });
  t('вільний досвід доплачує нестачу', r3.researched && r3.kadet === 0 && r3.free === 50,
    `лишок вільного ${r3.free}`);

  const r4 = await page.evaluate(() => {
    delete save.tanks.veteran;
    save.freeXp = 10; tankSave('sokil').xp = 10; tankSave('sokil').owned = true;
    tankNodeClick('veteran');
    return { researched: tankSave('veteran').researched, free: save.freeXp, sokil: tankSave('sokil').xp };
  });
  t('нестачу не пропускає і нічого не списує', !r4.researched && r4.free === 10 && r4.sokil === 10);

  const r5 = await page.evaluate(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      credits: 500, battles: 0, wins: 0, totalFrags: 0, current: 'kadet',
      tanks: { kadet: { researched: true, owned: true, xp: 0, modules: {} } },
      front: { level: 1, liberated: ['plazdarm'] }, codex: [] }));
    loadSave();
    return save.freeXp;
  });
  t('старий сейв без freeXp мігрує, а не дає NaN', r5 === 0, `freeXp ${r5}`);

  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Ангар мусить влазити в один екран: дерево було стовпчиком із 14 високих
// рядків і саме по собі було довшим за екран ноутбука.
BLOCKS.hangar = async browser => {
  for (const s of [{ w: 1440, h: 900 }, { w: 1280, h: 720 }, { w: 1024, h: 768 }]) {
    const page = await (await browser.newContext({ viewport: { width: s.w, height: s.h } })).newPage();
    await page.goto(GAME);
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => ({
      scrollH: document.documentElement.scrollHeight,
      clientH: document.documentElement.clientHeight,
      btn: document.getElementById('battleBtn').getBoundingClientRect().bottom,
      chips: document.querySelectorAll('.chip').length,
      rows: document.querySelectorAll('.branchRow').length,
    }));
    t(`${s.w}×${s.h}: сторінка без скролу`, m.scrollH <= m.clientH + 2, `${m.scrollH}/${m.clientH}`);
    t(`${s.w}×${s.h}: «НА ФРОНТ» на екрані`, m.btn <= s.h + 1, `низ кнопки ${Math.round(m.btn)}`);
    t(`${s.w}×${s.h}: усе дерево видно`, m.chips === 14 && m.rows === 4, `${m.chips} чіпів, ${m.rows} гілок`);
    await page.close();
  }

  const { page, errs } = await fresh(browser, { turbo: false });
  const tabs = await page.evaluate(() => {
    const res = [];
    for (const name of ['codex', 'stats', 'mod']) {
      document.querySelector(`.tab[data-tab="${name}"]`).click();
      res.push({
        name,
        shown: !document.getElementById('tab-' + name).classList.contains('hidden'),
        others: [...document.querySelectorAll('.tabBody')]
          .filter(b => b.id !== 'tab-' + name && !b.classList.contains('hidden')).length,
      });
    }
    return res;
  });
  for (const r of tabs) t(`вкладка ${r.name} відкривається одна`, r.shown && r.others === 0);

  const pick = await page.evaluate(() => {
    tankSave('kadet').xp = 5000; save.credits = 9000; renderHangar();
    const chip = [...document.querySelectorAll('.chip')].find(c => c.textContent.includes('Т-25'));
    chip.click();                                   // дослідити
    const researched = tankSave('sokil').researched;
    renderHangar();
    [...document.querySelectorAll('.chip')].find(c => c.textContent.includes('Т-25')).click();
    return { researched, owned: tankSave('sokil').owned, cur: save.current };
  });
  t('клік по чіпу досліджує, потім купує й обирає',
    pick.researched && pick.owned && pick.cur === 'sokil');

  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// Усі карти мають бути прохідними зі старту: колись база гравця ставилась
// просто на його клітину і танк не міг зрушити взагалі.
BLOCKS.maps = async browser => {
  const { page, errs } = await fresh(browser, { turbo: false });
  const maps = await page.evaluate(() => MAPS.map(m => m.name));
  for (const name of maps) {
    const r = await page.evaluate(mm => {
      startBattle({ id: null, name: 't', map: mm, mode: 'clear', mod: null });
      let free = 0;
      for (const d of ['up', 'down', 'left', 'right']) {
        const [dx, dy] = DIRS[d];
        if (canMoveTo(player, player.x + dx * 6, player.y + dy * 6)) free++;
      }
      return { free, loaded: battle.mapName };
    }, name);
    t(`${r.loaded}: танк може зрушити`, r.free >= 2 && r.loaded === name,
      `вільних напрямків ${r.free}/4`);
  }
  t('без помилок сторінки', errs.length === 0, errs[0] || '');
  await page.close();
};

// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  const want = process.argv.slice(2);
  const names = want.length ? want : Object.keys(BLOCKS);
  const unknown = names.filter(n => !BLOCKS[n]);
  if (unknown.length) {
    console.error(`невідомі блоки: ${unknown.join(', ')}`);
    console.error(`доступні: ${Object.keys(BLOCKS).join(', ')}`);
    process.exit(2);
  }

  const browser = await chromium.launch({ executablePath: EXE });
  for (const n of names) {
    console.log(`\n═══ ${n} ═══`);
    try {
      await BLOCKS[n](browser);
    } catch (e) {
      fail++;
      console.log(`  ❌ блок впав: ${e.message}`);
    }
  }
  await browser.close();

  console.log(`\n${'─'.repeat(46)}\n${ok} ok, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
