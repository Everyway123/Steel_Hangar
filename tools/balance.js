/*
 * Контрольований замір балансу: N боїв на ОДНАКОВОМУ танку і однакових картах.
 *
 *   node tools/balance.js               — 16 боїв, зачистка
 *   node tools/balance.js 24 assault    — 24 бої, штурм
 *   node tools/balance.js 12 defense
 *
 * Виводить відсоток перемог, тривалість раунду, фраги і — головне — скільки
 * разів бот загинув. Саме ці чотири числа вирішують суперечку «довгі чи
 * короткі бої», і саме тому їх не можна оцінювати на око: кілька разів у
 * цьому проєкті «покращення» на відчуття виявлялось погіршенням у цифрах.
 *
 * Бот навмисно користується тим самим pathDir, що й союзник у грі: інакше
 * замір міряє не баланс, а те, як погано бот огинає стіни.
 */
const { chromium } = require('playwright');
const path = require('path');

const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const EXE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const N = Number(process.argv[2] || 16);
const MODE = process.argv[3] || 'clear';
const MAPS = {
  clear:   ['Полігон', 'Міські руїни', 'Арена генерала'],
  assault: ['Лінія оборони', 'Штурм: Командний центр', 'Штурм: Радарна база'],
  defense: ['Склад боєприпасів', 'Річкова переправа'],
}[MODE];

// Бот усередині сторінки: їде на найближчого ворога маршрутом, тримає вогонь,
// відходить на аптечку при малому HP.
const BOT = `
window.__bot = function () {
  if (typeof state === 'undefined' || state !== 'play' || !player || player.hp <= 0) return;
  keys.fire = true;
  let t = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead || e.spawning > 0) continue;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < bd) { bd = d; t = e; }
  }
  let gx, gy;
  if (t) { gx = t.x; gy = t.y; }
  else if (battle.hqR !== undefined) { gx = battle.hqC * TILE + TILE / 2; gy = battle.hqR * TILE + TILE / 2; }
  else { gx = W / 2; gy = H / 2; }

  window.__botT = (window.__botT || 0) + 1;
  if (window.__botT % 8 === 0 || !window.__botDir) {
    const routed = pathDir(player, gx, gy);
    const dx = gx - player.x, dy = gy - player.y;
    const greedy = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    window.__botDir = routed || greedy;
  }
  keys.up = keys.down = keys.left = keys.right = false;
  keys[window.__botDir] = true;

  if (player.hp / player.maxHp < 0.4 && battle.medkit) keys.med = true;
};`;

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(GAME);

  // однаковий танк у всіх прогонах — інакше порівнювати нема чого
  await page.evaluate(() => localStorage.setItem('steelHangarSave1', JSON.stringify({
    credits: 99999, freeXp: 0, battles: 20, wins: 10, totalFrags: 0, current: 'veteran',
    tanks: {
      kadet:   { researched: true, owned: true, xp: 0, crewXp: 0, modules: {} },
      sokil:   { researched: true, owned: true, xp: 0, crewXp: 0, modules: {} },
      veteran: { researched: true, owned: true, xp: 0, crewXp: 900,
                 modules: { gun: 2, armor: 2, engine: 2, susp: 1, radio: 1 } },
    },
    front: { level: 1, liberated: ['plazdarm'] }, codex: [] })));
  await page.reload();
  await page.waitForTimeout(400);
  await page.addScriptTag({ content: BOT });
  await page.evaluate(`{ let t = performance.now();
    window.requestAnimationFrame = cb => setTimeout(() => {
      try { window.__bot(); } catch (e) {}
      cb(t += 25);
    }, 4); }`);

  const rows = [];
  for (let i = 0; i < N; i++) {
    const map = MAPS[i % MAPS.length];
    await page.evaluate(([m, mode]) =>
      window.startBattle({ id: mode === 'defense' ? 'oborona1' : null, name: 't', map: m, mode, mod: null }),
      [map, MODE]);

    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      const st = await page.evaluate(() => window._dbg.get().state);
      if (st === 'results') break;
      if (st === 'perk') {
        await page.evaluate(() => { const c = document.querySelectorAll('#cards .card'); if (c.length) c[0].click(); });
      }
      await page.waitForTimeout(110);
    }

    const r = await page.evaluate(() => {
      const log = JSON.parse(localStorage.getItem('steelHangarLog1') || '[]');
      const end = log.filter(e => e.t === 'battle_end').pop();
      const hp = window._dbg.get().player.hp;
      const b = document.getElementById('toHangarBtn'); if (b) b.click();
      return { end, hp };
    });
    await page.waitForTimeout(180);
    await page.evaluate(() => { if (state === 'front') frontToHangar(); });

    if (r.end) {
      rows.push({ map, victory: !!r.end.victory, sec: r.end.sec, frags: r.end.frags, died: r.hp <= 0 });
      const e = rows[rows.length - 1];
      console.log(`${String(i + 1).padStart(3)}. ${map.padEnd(24)} ${e.victory ? 'WIN ' : 'LOSS'} ` +
        `${String(e.sec).padStart(3)}с  фраги ${String(e.frags).padStart(2)}${e.died ? '  💀' : ''}`);
    }
  }

  const wins = rows.filter(r => r.victory).length;
  const died = rows.filter(r => r.died).length;
  const avg = k => (rows.reduce((s, r) => s + r[k], 0) / rows.length);
  console.log(`\n${MODE.toUpperCase()}: ${wins}/${rows.length} перемог (${Math.round(wins / rows.length * 100)}%)` +
    ` | ${avg('sec').toFixed(1)}с | фраги ${avg('frags').toFixed(1)} | смертей ${died}/${rows.length}`);
  console.log(errs.length ? `⚠ ${errs[0]}` : 'помилок: 0');
  await browser.close();
})();
