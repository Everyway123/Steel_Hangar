// ============================================================
//  СТАЛЕВИЙ АНГАР — танкові бої з прокачкою у стилі WoT
//  Ангар → короткий бій (3-5 хв) → срібло і досвід → прокачка
//  Прогрес зберігається у localStorage автоматично.
// ============================================================
'use strict';

// ---------- Гілка танків ----------
const CLS_COLOR = { 'ЛТ': '#6fd3ff', 'СТ': '#39ff88', 'ВТ': '#ffd23f', 'ПТ': '#c07eff' };

const TANKS = {
  kadet:   { name: 'Т-10 «Кадет»',    cls: 'ЛТ', tier: 1, hp: 12, dmg: 2, fireCd: 500, speed: 2.6, armor: 0, bulletSpeed: 6.0, size: 32,
             prev: null,      research: 0,    cost: 0,     desc: 'Навчальний танк. З нього починається кожен герой.' },
  sokil:   { name: 'Т-25 «Сокіл»',    cls: 'ЛТ', tier: 2, hp: 15, dmg: 2, fireCd: 360, speed: 3.3, armor: 0, bulletSpeed: 7.0, size: 32,
             prev: 'kadet',   research: 250,  cost: 600,   desc: 'Швидкий розвідник. Літає по карті, жалить і тікає.' },
  veteran: { name: 'Т-34 «Ветеран»',  cls: 'СТ', tier: 3, hp: 22, dmg: 3, fireCd: 440, speed: 2.6, armor: 1, bulletSpeed: 7.0, size: 34,
             prev: 'sokil',   research: 600,  cost: 1800,  desc: 'Легендарний універсал. Надійний у будь-якій ситуації.' },
  bastion: { name: 'КВ-1 «Бастіон»',  cls: 'ВТ', tier: 4, hp: 34, dmg: 4, fireCd: 560, speed: 2.0, armor: 2, bulletSpeed: 7.0, size: 38,
             prev: 'veteran', research: 1400, cost: 4500,  desc: 'Важка броня. Снаряди рикошетять, вороги плачуть.' },
  molot:   { name: 'ІС-7 «Молот»',    cls: 'ВТ', tier: 5, hp: 48, dmg: 5, fireCd: 600, speed: 1.8, armor: 3, bulletSpeed: 7.5, size: 40,
             prev: 'bastion', research: 3000, cost: 10000, desc: 'Вершина гілки важких. Сталева фортеця на гусеницях.' },
  osa:     { name: 'СУ-85 «Оса»',     cls: 'ПТ', tier: 4, hp: 18, dmg: 6, fireCd: 780, speed: 2.2, armor: 0, bulletSpeed: 9.0, size: 34,
             prev: 'veteran', research: 1400, cost: 4500,  desc: 'Снайпер. Один влучний постріл вирішує все.' },
  kobra:   { name: 'ІСУ-152 «Кобра»', cls: 'ПТ', tier: 5, hp: 24, dmg: 9, fireCd: 900, speed: 2.0, armor: 1, bulletSpeed: 10.0, size: 36,
             prev: 'osa',     research: 3000, cost: 10000, desc: 'Топова ПТ-САУ. «Бах» — і ворога більше немає.' },
};
const TREE_ORDER = ['kadet', 'sokil', 'veteran', 'bastion', 'molot', 'osa', 'kobra'];

// Модулі: 3 рівні кожен
const MODULES = {
  gun:    { ico: '💥', name: 'Гармата',  desc: '+20% урону за рівень' },
  armor:  { ico: '🛡', name: 'Броня',    desc: '+1 броні та +15% HP за рівень' },
  engine: { ico: '🏎', name: 'Двигун',   desc: '+10% швидкості за рівень' },
};
function moduleCost(tier, lvl) { return Math.round((lvl + 1) * 350 * (1 + 0.5 * (tier - 1))); }

// Реальні характеристики танка з урахуванням модулів
function tankStats(id) {
  const t = TANKS[id], m = save.tanks[id]?.modules || { gun: 0, armor: 0, engine: 0 };
  return {
    id, name: t.name, cls: t.cls, tier: t.tier, size: t.size,
    hp: Math.round(t.hp * (1 + 0.15 * m.armor)),
    dmg: Math.round(t.dmg * (1 + 0.2 * m.gun)),
    armor: t.armor + m.armor,
    speed: +(t.speed * (1 + 0.1 * m.engine)).toFixed(2),
    fireCd: t.fireCd,
    bulletSpeed: t.bulletSpeed,
  };
}

// ---------- Збереження ----------
const SAVE_KEY = 'steelHangarSave1';
let save;

function defaultSave() {
  return {
    credits: 500,
    battles: 0, wins: 0, totalFrags: 0,
    current: 'kadet',
    tanks: { kadet: { researched: true, owned: true, xp: 0, modules: { gun: 0, armor: 0, engine: 0 } } },
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    save = raw ? JSON.parse(raw) : defaultSave();
    if (!save.tanks || !save.tanks[save.current]) save = defaultSave();
  } catch (e) { save = defaultSave(); }
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
function tankSave(id) {
  if (!save.tanks[id]) save.tanks[id] = { researched: false, owned: false, xp: 0, modules: { gun: 0, armor: 0, engine: 0 } };
  return save.tanks[id];
}

// ---------- Карти боїв ----------
// '.'=пусто '#'=цегла '@'=сталь '~'=вода '*'=кущі 'P'=гравець 'E'=спавн ворогів
const MAPS = [
  { name: 'Полігон', map: [
    'E......EE......E',
    '................',
    '..##..#..#..##..',
    '..##..#..#..##..',
    '......####......',
    '.@............@.',
    '....########....',
    '....#......#....',
    '..#..........#..',
    '..#...####...#..',
    '......#..#......',
    '..##..#..#..##..',
    '................',
    '.......P........',
  ]},
  { name: 'Міські руїни', map: [
    'E.....E..E.....E',
    '.####........##.',
    '.#..#..####..##.',
    '.#..#..#..#.....',
    '.......#..#..##.',
    '.###..........#.',
    '...#..@##@..###.',
    '.#............#.',
    '.#..###..###....',
    '.......##.......',
    '.###..*##*..###.',
    '...#..*..*..#...',
    '................',
    '.......P........',
  ]},
  { name: 'Річкова переправа', map: [
    'E......EE......E',
    '................',
    '..##........##..',
    '..##..~~~~..##..',
    '.....~~~~~~.....',
    '.~~~~~....~~~~~.',
    '..........~~....',
    '.####......####.',
    '....#..@@..#....',
    '....#......#....',
    '.**..######..**.',
    '.**..#....#..**.',
    '................',
    '.......P........',
  ]},
  { name: 'Сталева фортеця', map: [
    'E.....E..E.....E',
    '.@.....##.....@.',
    '...##..##..##...',
    '.#.##......##.#.',
    '.#.....@@.....#.',
    '.#..##....##..#.',
    '....##.@@.##....',
    '.@............@.',
    '..####....####..',
    '..#..........#..',
    '..#..*####*..#..',
    '.....*#..#*.....',
    '................',
    '.......P........',
  ]},
  { name: 'Арена генерала', map: [
    'E......EE......E',
    '................',
    '..@..........@..',
    '................',
    '....##....##....',
    '....##....##....',
    '......*..*......',
    '..@...*..*...@..',
    '................',
    '..##........##..',
    '..##..####..##..',
    '................',
    '................',
    '.......P........',
  ]},
];

// ---------- Вороги ----------
const ENEMY_TYPES = {
  scout:   { hp: 2,  speed: 2.6, size: 32, dmg: 2, fireCd: 1300, credits: 70,  xp: 14, color: '#6fd3ff' },
  soldier: { hp: 4,  speed: 1.8, size: 34, dmg: 2, fireCd: 1000, credits: 110, xp: 22, color: '#ff9d5c' },
  heavy:   { hp: 8,  speed: 1.2, size: 36, dmg: 3, fireCd: 900,  credits: 180, xp: 36, color: '#e06666' },
  boss:    { hp: 55, speed: 1.0, size: 56, dmg: 4, fireCd: 700,  credits: 900, xp: 220, color: '#ff4d5e' },
};

function buildRoster(tier, elite) {
  const pool = [];
  const count = 7 + tier;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (tier <= 2) pool.push(r < 0.6 ? 'scout' : 'soldier');
    else if (tier === 3) pool.push(r < 0.35 ? 'scout' : r < 0.8 ? 'soldier' : 'heavy');
    else pool.push(r < 0.2 ? 'scout' : r < 0.55 ? 'soldier' : 'heavy');
  }
  if (elite) pool.push('boss');
  return pool;
}

// ---------- Тактичні переваги (бонуси на один бій) ----------
const PERKS = [
  { id: 'repair', ico: '🔧', name: 'Польовий ремонт',  desc: 'Відновлює 50% HP', apply: p => p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp / 2)) },
  { id: 'ap',     ico: '💥', name: 'Гострі снаряди',   desc: '+30% урону до кінця бою', apply: p => p.dmg = Math.round(p.dmg * 1.3) || p.dmg + 1 },
  { id: 'rammer', ico: '🔫', name: 'Досилач',          desc: 'Перезарядка на 20% швидша', apply: p => p.fireCd = Math.round(p.fireCd * 0.8) },
  { id: 'boost',  ico: '🏎', name: 'Форсаж',           desc: '+20% швидкості', apply: p => p.speed *= 1.2 },
  { id: 'screen', ico: '🛡', name: 'Екрани',           desc: '+1 броня (більше рикошетів!)', apply: p => p.armor += 1 },
  { id: 'stab',   ico: '🚀', name: 'Стабілізатор',     desc: 'Снаряди летять на 30% швидше', apply: p => p.bulletSpeed *= 1.3 },
];

// ============================================================
//  ДВИГУН БОЮ
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 40, COLS = 16, ROWS = 14;
const W = COLS * TILE, H = ROWS * TILE;
const T_EMPTY = 0, T_BRICK = 1, T_STEEL = 2, T_WATER = 3, T_BUSH = 4;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let grid, gridHp, player, enemies, bullets, particles, drops;
let spawnQueue, spawnPoints, spawnTimer, maxAlive;
let battle; // статистика поточного бою
let state = 'hangar';
let keys = {}, lastTime = 0, shakeTime = 0, freezeTimer = 0;
let pendingPerks = 0;

// ---------- Звуки ----------
let audioCtx = null;
function beep(freq, dur, type, vol) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
const sfx = {
  shoot: () => beep(220, 0.08, 'square', 0.05),
  hit: () => beep(140, 0.1, 'sawtooth', 0.06),
  rico: () => { beep(700, 0.06, 'triangle', 0.08); beep(1100, 0.1, 'triangle', 0.06); },
  boom: () => { beep(90, 0.3, 'sawtooth', 0.1); beep(60, 0.4, 'triangle', 0.1); },
  perk: () => { beep(523, 0.12, 'square', 0.07); setTimeout(() => beep(659, 0.12, 'square', 0.07), 110); setTimeout(() => beep(784, 0.2, 'square', 0.07), 220); },
  pickup: () => beep(880, 0.1, 'sine', 0.08),
  brick: () => beep(320, 0.05, 'square', 0.04),
  cash: () => { beep(660, 0.08, 'sine', 0.07); setTimeout(() => beep(990, 0.12, 'sine', 0.07), 90); },
};

// ---------- Запуск бою ----------
function startBattle() {
  const st = tankStats(save.current);
  const elite = (save.battles + 1) % 5 === 0;
  const mapDef = MAPS[Math.floor(Math.random() * MAPS.length)];

  battle = {
    tank: st, elite, mapName: mapDef.name,
    frags: 0, dmgDealt: 0, ricochets: 0, bossKilled: false,
    credits: 0, xp: 0, fragStreak: 0,
    perks: [],
    tierMult: 1 + 0.3 * (st.tier - 1),
  };

  player = {
    x: 0, y: 0, dir: 'up', size: st.size,
    maxHp: st.hp, hp: st.hp, dmg: st.dmg, armor: st.armor,
    speed: st.speed, fireCd: st.fireCd, bulletSpeed: st.bulletSpeed,
    cooldown: 0, invuln: 1500,
  };

  grid = []; gridHp = [];
  spawnPoints = []; enemies = []; bullets = []; particles = []; drops = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = []; gridHp[r] = [];
    const row = (mapDef.map[r] || '').padEnd(COLS, '.');
    for (let c = 0; c < COLS; c++) {
      const ch = row[c];
      let t = T_EMPTY, hp = 0;
      if (ch === '#') { t = T_BRICK; hp = 2; }
      else if (ch === '@') { t = T_STEEL; hp = 6; }
      else if (ch === '~') t = T_WATER;
      else if (ch === '*') t = T_BUSH;
      else if (ch === 'P') { player.x = c * TILE + TILE / 2; player.y = r * TILE + TILE / 2; }
      else if (ch === 'E') spawnPoints.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
      grid[r][c] = t; gridHp[r][c] = hp;
    }
  }

  spawnQueue = buildRoster(st.tier, elite);
  battle.totalEnemies = spawnQueue.length;
  maxAlive = Math.min(5, 3 + Math.floor(st.tier / 3) + (elite ? 1 : 0));
  spawnTimer = 400;
  freezeTimer = 0; shakeTime = 0; pendingPerks = 0;
  keys = {};

  document.getElementById('hangarView').classList.add('hidden');
  document.getElementById('battleView').classList.remove('hidden');
  document.getElementById('resultOverlay').classList.add('hidden');
  document.getElementById('perkOverlay').classList.add('hidden');
  document.body.classList.add('inBattle');
  document.getElementById('uiTankName').textContent = st.name + (elite ? ' ☠' : '');
  document.getElementById('perkList').textContent = '';

  state = 'play';
  lastTime = performance.now();
}

// ---------- Масштабування ворогів під тір ----------
function scaledEnemy(typeName, tier) {
  const t = ENEMY_TYPES[typeName];
  const hpMult = 1 + 0.35 * (tier - 1);
  const dmgAdd = Math.floor((tier - 1) / 2);
  return {
    type: typeName,
    hp: Math.round(t.hp * hpMult), maxHp: Math.round(t.hp * hpMult),
    speed: t.speed, size: t.size,
    dmg: t.dmg + dmgAdd, fireCd: t.fireCd,
    credits: t.credits, xpVal: t.xp, color: t.color,
  };
}

// ---------- Колізії ----------
function solidAt(x, y, forBullet) {
  if (x < 0 || y < 0 || x >= W || y >= H) return true;
  const t = grid[Math.floor(y / TILE)][Math.floor(x / TILE)];
  if (t === T_EMPTY || t === T_BUSH) return false;
  if (t === T_WATER) return !forBullet;
  return true;
}
function rectFree(x, y, size, forBullet) {
  const h = size / 2 - 0.01;
  return !solidAt(x - h, y - h, forBullet) && !solidAt(x + h, y - h, forBullet) &&
         !solidAt(x - h, y + h, forBullet) && !solidAt(x + h, y + h, forBullet);
}
function tanksOverlap(a, b) {
  return Math.abs(a.x - b.x) < (a.size + b.size) / 2 &&
         Math.abs(a.y - b.y) < (a.size + b.size) / 2;
}
function canMoveTo(tank, nx, ny) {
  if (!rectFree(nx, ny, tank.size, false)) return false;
  const probe = { x: nx, y: ny, size: tank.size };
  if (tank !== player && tanksOverlap(probe, player)) return false;
  for (const e of enemies) {
    if (e !== tank && !e.spawning && tanksOverlap(probe, e)) return false;
  }
  return true;
}

function moveTank(tank, dir, dist) {
  const [dx, dy] = DIRS[dir];
  if (tank.dir !== dir) {
    if (dx !== 0) tank.y = snapIfFree(tank, tank.x, tank.y, 'y');
    else tank.x = snapIfFree(tank, tank.x, tank.y, 'x');
    tank.dir = dir;
  }
  const nx = tank.x + dx * dist, ny = tank.y + dy * dist;
  if (canMoveTo(tank, nx, ny)) { tank.x = nx; tank.y = ny; return true; }
  for (const step of [4, 8, 12]) {
    if (dx !== 0) {
      if (canMoveTo(tank, nx, tank.y - step)) { tank.y -= Math.min(step, dist); return true; }
      if (canMoveTo(tank, nx, tank.y + step)) { tank.y += Math.min(step, dist); return true; }
    } else {
      if (canMoveTo(tank, tank.x - step, ny)) { tank.x -= Math.min(step, dist); return true; }
      if (canMoveTo(tank, tank.x + step, ny)) { tank.x += Math.min(step, dist); return true; }
    }
  }
  return false;
}
function snapIfFree(tank, x, y, axis) {
  const half = TILE / 2;
  if (axis === 'y') {
    const sy = Math.round(y / half) * half;
    return canMoveTo(tank, x, sy) ? sy : y;
  }
  const sx = Math.round(x / half) * half;
  return canMoveTo(tank, sx, y) ? sx : x;
}

// ---------- Стрільба ----------
function shoot(tank, isPlayer) {
  const [dx, dy] = DIRS[tank.dir];
  const off = tank.size / 2 + 6;
  bullets.push({
    x: tank.x + dx * off, y: tank.y + dy * off, dx, dy,
    speed: isPlayer ? player.bulletSpeed : 5,
    dmg: isPlayer ? player.dmg : tank.dmg,
    fromPlayer: isPlayer,
  });
  tank.flash = 90;
  sfx.shoot();
}
function bossSpreadShot(boss) {
  const spread = { up: ['left', 'up', 'right'], down: ['left', 'down', 'right'], left: ['up', 'left', 'down'], right: ['up', 'right', 'down'] };
  for (const d of spread[boss.dir]) {
    const [dx, dy] = DIRS[d];
    bullets.push({ x: boss.x + dx * 34, y: boss.y + dy * 34, dx, dy, speed: 5, dmg: boss.dmg, fromPlayer: false });
  }
  boss.flash = 90;
  sfx.shoot();
}

// ---------- Спавн і AI ----------
function trySpawnEnemy(dt) {
  if (!spawnQueue.length) return;
  if (enemies.length >= maxAlive) return;
  spawnTimer -= dt;
  if (spawnTimer > 0) return;
  spawnTimer = 2100;
  const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  const e = scaledEnemy(spawnQueue.shift(), battle.tank.tier);
  e.x = pt.x; e.y = pt.y; e.dir = 'down';
  e.cooldown = 800 + Math.random() * 800;
  e.thinkTimer = 0;
  e.spawning = 900;
  enemies.push(e);
}

function updateEnemy(e, dt) {
  if (e.spawning > 0) { e.spawning -= dt; return; }
  if (freezeTimer > 0) return;

  e.thinkTimer -= dt;
  if (e.thinkTimer <= 0) {
    e.thinkTimer = 400 + Math.random() * 1200;
    const ddx = player.x - e.x, ddy = player.y - e.y;
    if (Math.random() < 0.72) {
      e.wantDir = Math.abs(ddx) > Math.abs(ddy)
        ? (ddx > 0 ? 'right' : 'left')
        : (ddy > 0 ? 'down' : 'up');
    } else {
      e.wantDir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
    }
  }
  if (e.flash > 0) e.flash -= dt;
  if (!moveTank(e, e.wantDir || 'down', e.speed)) e.thinkTimer = 0;
  else e.tread = (e.tread || 0) + e.speed;

  e.cooldown -= dt;
  if (e.cooldown <= 0) {
    const alignX = Math.abs(player.x - e.x) < 24, alignY = Math.abs(player.y - e.y) < 24;
    if (alignX || alignY || Math.random() < 0.3) {
      if (alignX) e.dir = player.y > e.y ? 'down' : 'up';
      else if (alignY) e.dir = player.x > e.x ? 'right' : 'left';
      if (e.type === 'boss') bossSpreadShot(e); else shoot(e, false);
      e.cooldown = e.fireCd + Math.random() * 400;
    } else {
      e.cooldown = 200;
    }
  }
}

// ---------- Кулі ----------
function updateBullets(dt) {
  const step = dt / 16.67;
  for (const b of bullets) {
    if (b.dead) continue;
    b.x += b.dx * b.speed * step;
    b.y += b.dy * b.speed * step;
    if (b.x < 0 || b.y < 0 || b.x > W || b.y > H) { b.dead = true; continue; }

    const c = Math.floor(b.x / TILE), r = Math.floor(b.y / TILE);
    const t = grid[r] && grid[r][c];
    if (t === T_BRICK || t === T_STEEL) {
      b.dead = true;
      if (t === T_BRICK) {
        gridHp[r][c] -= Math.max(1, b.dmg);
        sfx.brick();
        spawnParticles(b.x, b.y, '#c9694a', 6);
        if (gridHp[r][c] <= 0) grid[r][c] = T_EMPTY;
      } else {
        // сталь пробивається лише уроном 5+
        if (b.fromPlayer && b.dmg >= 5) {
          gridHp[r][c] -= b.dmg;
          spawnParticles(b.x, b.y, '#aab6cc', 8);
          if (gridHp[r][c] <= 0) grid[r][c] = T_EMPTY;
        }
        sfx.hit();
      }
      continue;
    }

    if (b.fromPlayer) {
      for (const e of enemies) {
        if (e.dead || e.spawning > 0) continue;
        if (Math.abs(b.x - e.x) < e.size / 2 && Math.abs(b.y - e.y) < e.size / 2) {
          b.dead = true;
          e.hp -= b.dmg;
          battle.dmgDealt += b.dmg;
          sfx.hit();
          spawnParticles(b.x, b.y, e.color, 5);
          if (e.hp <= 0) killEnemy(e);
          break;
        }
      }
    } else if (player.invuln <= 0 &&
               Math.abs(b.x - player.x) < player.size / 2 &&
               Math.abs(b.y - player.y) < player.size / 2) {
      b.dead = true;
      // РИКОШЕТ: шанс залежить від броні — фішка важких танків
      const ricoChance = Math.min(0.35, player.armor * 0.06);
      if (Math.random() < ricoChance) {
        battle.ricochets++;
        sfx.rico();
        floatText(player.x, player.y - 24, 'РИКОШЕТ!', '#ffd23f');
        spawnParticles(b.x, b.y, '#ffd23f', 4);
      } else {
        const dmg = Math.max(1, Math.round(b.dmg - player.armor * 0.7));
        player.hp -= dmg;
        shakeTime = 180;
        sfx.hit();
        floatText(player.x, player.y - 24, '-' + dmg, '#ff4d5e');
        spawnParticles(b.x, b.y, '#39ff88', 6);
        if (player.hp <= 0) { endBattle(false); return; }
      }
    }

    // кулі гравця збивають ворожі
    if (!b.dead && b.fromPlayer) {
      for (const ob of bullets) {
        if (ob === b || ob.dead || ob.fromPlayer) continue;
        if (Math.abs(b.x - ob.x) < 10 && Math.abs(b.y - ob.y) < 10) { b.dead = true; ob.dead = true; break; }
      }
    }
  }
  bullets = bullets.filter(b => !b.dead);
}

// ---------- Події бою ----------
function killEnemy(e) {
  e.dead = true;
  sfx.boom();
  shakeTime = e.type === 'boss' ? 500 : 120;
  spawnParticles(e.x, e.y, e.color, e.type === 'boss' ? 40 : 14);

  battle.frags++;
  battle.fragStreak++;
  battle.credits += e.credits;
  battle.xp += e.xpVal;
  if (e.type === 'boss') battle.bossKilled = true;
  floatText(e.x, e.y, `+${e.credits} 🪙`, '#ffd23f');

  const roll = Math.random();
  if (roll < 0.10) drops.push({ x: e.x, y: e.y, kind: 'med', ttl: 9000 });
  else if (roll < 0.18) drops.push({ x: e.x, y: e.y, kind: 'star', ttl: 9000 });
  else if (roll < 0.24) drops.push({ x: e.x, y: e.y, kind: 'freeze', ttl: 9000 });

  // кожні 3 фраги — тактична перевага
  if (battle.fragStreak >= 3) {
    battle.fragStreak = 0;
    pendingPerks++;
    sfx.perk();
    openPerkMenu();
  }

  if (spawnQueue.length === 0 && enemies.every(x => x.dead)) endBattle(true);
}

function endBattle(victory) {
  if (state === 'results') return;
  state = 'results';

  const mult = battle.tierMult * (battle.elite ? 2 : 1);
  const winBonus = victory ? Math.round(250 * battle.tank.tier) : 0;
  const creditsEarned = Math.round(battle.credits * mult) + winBonus;
  const xpEarned = Math.round((battle.xp + (victory ? 60 * battle.tank.tier : 0)) * mult);

  save.credits += creditsEarned;
  tankSave(save.current).xp += xpEarned;
  save.battles++;
  if (victory) save.wins++;
  save.totalFrags += battle.frags;
  persist();

  const medals = [];
  if (battle.frags >= 6) medals.push('🏅 «Мисливець» — 6+ фрагів');
  if (battle.ricochets >= 3) medals.push('🛡 «Сталева стіна» — 3+ рикошети');
  if (victory && player.hp / player.maxHp > 0.6) medals.push('⚔ «Домінатор» — перемога з запасом HP');
  if (battle.bossKilled) medals.push('💀 «Генераловбивця» — знищено боса!');

  document.getElementById('resultTitle').textContent = victory ? '🏆 ПЕРЕМОГА!' : '💥 ТАНК ЗНИЩЕНО';
  document.getElementById('resultTitle').style.color = victory ? '#ffd23f' : '#ff4d5e';
  document.getElementById('resultTable').innerHTML = `
    <tr><td>Карта</td><td>${battle.mapName}${battle.elite ? ' ☠ (елітний ×2)' : ''}</td></tr>
    <tr><td>Фраги</td><td>${battle.frags} / ${battle.totalEnemies}</td></tr>
    <tr><td>Завдано урону</td><td>${battle.dmgDealt}</td></tr>
    <tr><td>Рикошети</td><td>${battle.ricochets}</td></tr>
    <tr><td>Срібло</td><td>+${creditsEarned} 🪙</td></tr>
    <tr><td>Досвід танка</td><td>+${xpEarned} ⭐</td></tr>`;
  document.getElementById('medals').innerHTML = medals.join('<br>');
  document.getElementById('resultOverlay').classList.remove('hidden');
  if (victory) sfx.cash(); else sfx.boom();
}

function toHangar() {
  state = 'hangar';
  document.body.classList.remove('inBattle');
  document.getElementById('battleView').classList.add('hidden');
  document.getElementById('hangarView').classList.remove('hidden');
  renderHangar();
}

// ---------- Тактичні переваги ----------
function openPerkMenu() {
  if (state === 'perk') return;
  showPerkCards();
}
function showPerkCards() {
  state = 'perk';
  const picks = PERKS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  const box = document.getElementById('cards');
  box.innerHTML = '';
  picks.forEach((u, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<div class="ico">${u.ico}</div><div class="nm">${u.name}</div><div class="ds">${u.desc}</div><div class="key">[${i + 1}]</div>`;
    div.onclick = () => pickPerk(u);
    box.appendChild(div);
  });
  window._perkPicks = picks;
  document.getElementById('perkOverlay').classList.remove('hidden');
}
function pickPerk(u) {
  u.apply(player);
  battle.perks.push(u);
  sfx.pickup();
  pendingPerks--;
  if (pendingPerks > 0) { showPerkCards(); return; }
  document.getElementById('perkOverlay').classList.add('hidden');
  document.getElementById('perkList').innerHTML =
    'Бонуси бою: ' + battle.perks.map(p => p.ico + ' ' + p.name).join(', ');
  state = 'play';
  player.invuln = Math.max(player.invuln, 700);
  lastTime = performance.now();
}

// ---------- Дропи, частинки ----------
function updateDrops(dt) {
  for (const d of drops) {
    d.ttl -= dt;
    if (d.ttl <= 0) { d.dead = true; continue; }
    if (Math.abs(d.x - player.x) < 28 && Math.abs(d.y - player.y) < 28) {
      d.dead = true;
      sfx.pickup();
      if (d.kind === 'med') { player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.3)); floatText(d.x, d.y, '+HP', '#ff8c69'); }
      else if (d.kind === 'star') { battle.credits += 120; floatText(d.x, d.y, '+120 🪙', '#ffd23f'); }
      else if (d.kind === 'freeze') { freezeTimer = 4000; floatText(d.x, d.y, 'ЗАМОРОЗКА!', '#6fd3ff'); }
    }
  }
  drops = drops.filter(d => !d.dead);
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
      life: 300 + Math.random() * 400, color,
    });
  }
}
function floatText(x, y, text, color) {
  particles.push({ x, y, vx: 0, vy: -0.8, life: 1100, text, color });
}
function updateParticles(dt) {
  const step = dt / 16.67;
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * step;
    p.y += p.vy * step;
  }
  particles = particles.filter(p => p.life > 0);
}

// ---------- Гравець ----------
function updatePlayer(dt) {
  if (player.invuln > 0) player.invuln -= dt;
  if (player.flash > 0) player.flash -= dt;
  player.cooldown -= dt;
  let dir = null;
  if (keys.up) dir = 'up';
  else if (keys.down) dir = 'down';
  else if (keys.left) dir = 'left';
  else if (keys.right) dir = 'right';
  const dist = player.speed * dt / 16.67;
  if (dir && moveTank(player, dir, dist)) player.tread = (player.tread || 0) + dist;
  if (keys.fire && player.cooldown <= 0) {
    shoot(player, true);
    player.cooldown = player.fireCd;
  }
}

// ---------- Малювання ----------
function drawTile(r, c) {
  const t = grid[r][c], x = c * TILE, y = r * TILE;
  if (t === T_BRICK) {
    ctx.fillStyle = gridHp[r][c] > 1 ? '#a34a2a' : '#6e3018';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#05070c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + i * 10 + 5); ctx.lineTo(x + TILE, y + i * 10 + 5);
      ctx.stroke();
      ctx.beginPath();
      const off = (i % 2) ? 10 : 0;
      for (let j = off; j < TILE; j += 20) { ctx.moveTo(x + j, y + i * 10 - 5); ctx.lineTo(x + j, y + i * 10 + 5); }
      ctx.stroke();
    }
  } else if (t === T_STEEL) {
    ctx.fillStyle = '#8a97ad';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#c3cddf';
    ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#5c687e';
    ctx.fillRect(x + 12, y + 12, TILE - 24, TILE - 24);
  } else if (t === T_WATER) {
    ctx.fillStyle = '#123a6b';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(120,190,255,.35)';
    const ph = Math.sin(performance.now() / 400 + r + c) * 4;
    ctx.fillRect(x + 4, y + 12 + ph, 12, 3);
    ctx.fillRect(x + 22, y + 26 - ph, 12, 3);
  }
}
function drawBush(r, c) {
  const x = c * TILE, y = r * TILE;
  ctx.fillStyle = 'rgba(30,140,60,.85)';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(60,190,90,.7)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + 8 + (i * 13) % 28, y + 8 + (i * 17) % 26, 6, 0, 7);
    ctx.fill();
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g2 = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g2},${b})`;
}

function drawTankShape(g, s, color, o = {}) {
  const tread = o.tread || 0;

  // м'яка тінь під танком
  g.fillStyle = 'rgba(0,0,0,.45)';
  g.beginPath();
  g.roundRect(-s * 0.5 + 2, -s * 0.48 + 3, s, s * 0.98, s * 0.16);
  g.fill();

  // гусениці з анімованими траками
  const tw = s * 0.26;
  for (const side of [-1, 1]) {
    const cx = side * (s / 2 - tw / 2);
    g.fillStyle = '#0e1320';
    g.beginPath();
    g.roundRect(cx - tw / 2, -s / 2, tw, s, 5);
    g.fill();
    g.fillStyle = '#323e5c';
    const spacing = 7;
    const off = -(tread % spacing);
    for (let yy = -s / 2 + 3 + off; yy < s / 2 - 2; yy += spacing) {
      if (yy > -s / 2 + 1) g.fillRect(cx - tw / 2 + 2, yy, tw - 4, 2.4);
    }
    g.strokeStyle = 'rgba(255,255,255,.07)';
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(cx - tw / 2, -s / 2, tw, s, 5);
    g.stroke();
  }

  // обтічний корпус зі скошеним носом
  const hw = s * 0.33;
  g.beginPath();
  g.moveTo(-hw * 0.55, -s * 0.47);
  g.lineTo(hw * 0.55, -s * 0.47);
  g.lineTo(hw, -s * 0.26);
  g.lineTo(hw, s * 0.34);
  g.quadraticCurveTo(hw, s * 0.44, hw * 0.65, s * 0.44);
  g.lineTo(-hw * 0.65, s * 0.44);
  g.quadraticCurveTo(-hw, s * 0.44, -hw, s * 0.34);
  g.lineTo(-hw, -s * 0.26);
  g.closePath();
  const grad = g.createLinearGradient(0, -s / 2, 0, s / 2);
  grad.addColorStop(0, shade(color, 45));
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, shade(color, -55));
  g.fillStyle = grad;
  g.fill();
  // неонова окантовка корпусу
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 9;
  g.strokeStyle = 'rgba(255,255,255,.4)';
  g.lineWidth = 1.2;
  g.stroke();
  g.restore();
  // блік на носі
  g.fillStyle = 'rgba(255,255,255,.22)';
  g.fillRect(-hw * 0.5, -s * 0.43, hw, 2);

  // маска гармати
  g.fillStyle = shade(color, -70);
  g.beginPath();
  g.roundRect(-4.5, -s * 0.3, 9, s * 0.18, 2);
  g.fill();

  // дуло з металевим градієнтом і дульним гальмом
  const bl = s * 0.68;
  const bgrad = g.createLinearGradient(-3, 0, 3, 0);
  bgrad.addColorStop(0, '#7c869c');
  bgrad.addColorStop(0.5, '#e2e9f5');
  bgrad.addColorStop(1, '#5e677b');
  g.fillStyle = bgrad;
  g.fillRect(-2.6, -bl, 5.2, bl - s * 0.12);
  g.fillStyle = '#39445e';
  g.beginPath();
  g.roundRect(-4.2, -bl, 8.4, 7, 2);
  g.fill();

  // башта з об'ємним градієнтом та люком
  const tr = s * 0.21;
  const tg = g.createRadialGradient(-tr * 0.35, tr * -0.3, tr * 0.15, 0, s * 0.02, tr * 1.25);
  tg.addColorStop(0, shade(color, 75));
  tg.addColorStop(1, shade(color, -40));
  g.beginPath();
  g.arc(0, s * 0.02, tr, 0, 7);
  g.fillStyle = tg;
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,.4)';
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,.28)';
  g.beginPath();
  g.arc(tr * 0.3, s * 0.02 + tr * 0.3, tr * 0.28, 0, 7);
  g.fill();

  // спалах пострілу
  if (o.flash > 0) {
    const f = o.flash / 90;
    g.save();
    g.translate(0, -bl - 4);
    g.globalAlpha = f;
    g.fillStyle = '#fff7cc';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const rr = (i % 2 ? 4 : 12) * (0.5 + f * 0.7);
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.shadowColor = '#ffd23f';
    g.shadowBlur = 14;
    g.fillStyle = '#ffe680';
    g.beginPath();
    g.arc(0, 0, 4, 0, 7);
    g.fill();
    g.restore();
    g.globalAlpha = 1;
  }
}

function drawTank(t, color, isPlayer) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[t.dir]);
  if (t.spawning > 0 && Math.floor(t.spawning / 100) % 2) { ctx.restore(); return; }
  if (isPlayer && player.invuln > 0 && Math.floor(player.invuln / 100) % 2) ctx.globalAlpha = 0.45;
  if (freezeTimer > 0 && !isPlayer) ctx.globalAlpha = 0.6;
  drawTankShape(ctx, t.size, color, { tread: t.tread || 0, flash: t.flash || 0 });
  ctx.restore();
  ctx.globalAlpha = 1;

  if (!isPlayer && t.hp < t.maxHp) {
    const w = t.size, frac = Math.max(0, t.hp / t.maxHp);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(t.x - w / 2, t.y - t.size / 2 - 10, w, 5);
    ctx.fillStyle = frac > 0.5 ? '#39ff88' : frac > 0.25 ? '#ffd23f' : '#ff4d5e';
    ctx.fillRect(t.x - w / 2, t.y - t.size / 2 - 10, w * frac, 5);
  }
  if (freezeTimer > 0 && !isPlayer) {
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('❄', t.x, t.y - t.size / 2 - 14);
  }
}

function draw() {
  ctx.save();
  if (shakeTime > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] !== T_BUSH) drawTile(r, c);

  for (const d of drops) {
    if (d.ttl < 3000 && Math.floor(d.ttl / 200) % 2) continue;
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.kind === 'med' ? '💊' : d.kind === 'star' ? '⭐' : '❄️', d.x, d.y);
  }

  drawTank(player, '#39ff88', true); // гравець завжди зелений, щоб не плутати з ворогами
  for (const e of enemies) if (!e.dead) drawTank(e, e.color, false);

  for (const b of bullets) {
    // світний трейл
    const tg = ctx.createLinearGradient(b.x, b.y, b.x - b.dx * 16, b.y - b.dy * 16);
    tg.addColorStop(0, b.fromPlayer ? 'rgba(57,255,136,.7)' : 'rgba(255,77,94,.7)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = tg;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.dx * 16, b.y - b.dy * 16);
    ctx.stroke();
    // ядро снаряда
    ctx.save();
    ctx.shadowColor = b.fromPlayer ? '#39ff88' : '#ff4d5e';
    ctx.shadowBlur = 12;
    ctx.fillStyle = b.fromPlayer ? '#8dffc0' : '#ff9aa5';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === T_BUSH) drawBush(r, c);

  for (const p of particles) {
    if (p.text) {
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 500);
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 300);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function updateBattleHud() {
  document.getElementById('uiFrags').textContent = battle.frags;
  document.getElementById('uiEnemies').textContent = spawnQueue.length + enemies.filter(e => !e.dead).length;
  document.getElementById('uiRico').textContent = battle.ricochets;
  document.getElementById('hpBar').style.width = Math.max(0, player.hp / player.maxHp * 100) + '%';
  document.getElementById('perkBar').style.width = (battle.fragStreak / 3 * 100) + '%';
}

// ---------- Ігровий цикл ----------
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  if (state !== 'play') { if (state === 'perk' || state === 'results') draw(); return; }

  if (shakeTime > 0) shakeTime -= dt;
  if (freezeTimer > 0) freezeTimer -= dt;

  updatePlayer(dt);
  if (state !== 'play') return; // бій міг закінчитися
  trySpawnEnemy(dt);
  for (const e of enemies) if (!e.dead) updateEnemy(e, dt);
  enemies = enemies.filter(e => !e.dead);
  updateBullets(dt);
  if (state !== 'play') return;
  updateDrops(dt);
  updateParticles(dt);
  draw();
  updateBattleHud();
}

// ============================================================
//  АНГАР (UI)
// ============================================================
function fmt(n) { return n.toLocaleString('uk-UA'); }

function renderHangar() {
  document.getElementById('uiCredits').textContent = fmt(save.credits);
  document.getElementById('uiBattles').textContent = save.battles;
  document.getElementById('uiWins').textContent = save.wins;

  // дерево
  const list = document.getElementById('treeList');
  list.innerHTML = '';
  let lastBranch = '';
  for (const id of TREE_ORDER) {
    const t = TANKS[id], ts = tankSave(id);
    const branch = t.cls === 'ПТ' ? 'Гілка ПТ-САУ (снайпери)' : 'Основна гілка (до важких)';
    if (branch !== lastBranch) {
      lastBranch = branch;
      const lb = document.createElement('div');
      lb.className = 'branchLabel';
      lb.textContent = branch;
      list.appendChild(lb);
    }
    const node = document.createElement('div');
    node.className = 'tankNode' + (id === save.current ? ' sel' : '');
    const prevOwned = !t.prev || tankSave(t.prev).owned;
    let badge = '', locked = false;

    if (ts.owned) {
      badge = id === save.current ? '✅ ОБРАНО' : 'В ангарі · натисни щоб обрати';
    } else if (ts.researched) {
      badge = `Купити за ${fmt(t.cost)} 🪙`;
    } else if (prevOwned) {
      const prevXp = tankSave(t.prev).xp;
      badge = `Дослідити: ${fmt(prevXp)}/${fmt(t.research)} ⭐ (${TANKS[t.prev].name.split(' ')[0]})`;
    } else {
      badge = '🔒 спочатку попередній танк';
      locked = true;
    }
    if (locked) node.classList.add('locked');
    node.innerHTML = `
      <div>
        <div class="tn" style="color:${CLS_COLOR[t.cls]}">${t.name}</div>
        <div class="cls">${t.cls} · Тір ${t.tier}</div>
      </div>
      <div class="badge">${badge}</div>`;
    node.onclick = () => tankNodeClick(id);
    list.appendChild(node);
  }

  renderTankDetail();

  const elite = (save.battles + 1) % 5 === 0;
  document.getElementById('eliteBanner').classList.toggle('hidden', !elite);
}

function tankNodeClick(id) {
  const t = TANKS[id], ts = tankSave(id);
  if (ts.owned) {
    save.current = id;
    persist();
    renderHangar();
    return;
  }
  if (ts.researched) {
    if (save.credits >= t.cost) {
      save.credits -= t.cost;
      ts.owned = true;
      save.current = id;
      persist();
      sfx.cash();
      renderHangar();
    } else {
      flashMsg(`Не вистачає срібла: треба ${fmt(t.cost)} 🪙. Заробляй у боях!`);
    }
    return;
  }
  const prevOwned = !t.prev || tankSave(t.prev).owned;
  if (!prevOwned) { flashMsg('Спочатку відкрий попередній танк у гілці.'); return; }
  const prevTs = tankSave(t.prev);
  if (prevTs.xp >= t.research) {
    prevTs.xp -= t.research;
    ts.researched = true;
    persist();
    sfx.perk();
    flashMsg(`Досліджено: ${t.name}! Тепер купи його за срібло.`);
    renderHangar();
  } else {
    flashMsg(`Треба ще ${fmt(t.research - prevTs.xp)} ⭐ досвіду на ${TANKS[t.prev].name}. Грай на ньому в боях!`);
  }
}

function renderTankDetail() {
  const id = save.current, t = TANKS[id], ts = tankSave(id), st = tankStats(id);
  document.getElementById('tankTitle').textContent = `${t.name} · ${t.cls} · Тір ${t.tier}`;

  document.getElementById('tankStats').innerHTML = `
    <p style="color:var(--dim);font-size:12px;margin:8px 0">${t.desc}</p>
    <div class="statRow"><span>❤️ Міцність</span><span class="val">${st.hp} HP</span></div>
    <div class="statRow"><span>💥 Урон за постріл</span><span class="val">${st.dmg}</span></div>
    <div class="statRow"><span>🛡 Броня (рикошет ${Math.round(Math.min(0.35, st.armor * 0.06) * 100)}%)</span><span class="val">${st.armor}</span></div>
    <div class="statRow"><span>🏎 Швидкість</span><span class="val">${st.speed}</span></div>
    <div class="statRow"><span>🔫 Перезарядка</span><span class="val">${(st.fireCd / 1000).toFixed(2)} с</span></div>
    <div class="statRow"><span>⭐ Досвід танка</span><span class="val">${fmt(ts.xp)}</span></div>`;

  drawPreview(st);

  const modBox = document.getElementById('modList');
  modBox.innerHTML = '';
  for (const key of Object.keys(MODULES)) {
    const m = MODULES[key], lvl = ts.modules[key];
    const row = document.createElement('div');
    row.className = 'modRow';
    if (lvl >= 3) {
      row.innerHTML = `<span>${m.ico} ${m.name} <span class="pips">●●●</span></span><span style="color:var(--neon)">МАКС</span>`;
    } else {
      const cost = moduleCost(t.tier, lvl);
      row.innerHTML = `
        <span>${m.ico} ${m.name} <span class="pips">${'●'.repeat(lvl)}${'○'.repeat(3 - lvl)}</span><br>
        <span style="color:var(--dim);font-size:11px">${m.desc}</span></span>`;
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = `${fmt(cost)} 🪙`;
      btn.disabled = save.credits < cost;
      btn.onclick = () => {
        save.credits -= cost;
        ts.modules[key]++;
        persist();
        sfx.cash();
        renderHangar();
      };
      row.appendChild(btn);
    }
    modBox.appendChild(row);
  }
}

function drawPreview(st) {
  const pc = document.getElementById('tankPreview');
  const g = pc.getContext('2d');
  g.clearRect(0, 0, pc.width, pc.height);
  g.fillStyle = '#05070c';
  g.fillRect(0, 0, pc.width, pc.height);
  g.save();
  g.translate(pc.width / 2, pc.height / 2 + 6);
  g.rotate(Math.PI / 2);
  g.scale(1.6, 1.6);
  drawTankShape(g, st.size, CLS_COLOR[st.cls]);
  g.restore();
}

let msgTimer = null;
function flashMsg(text) {
  let el = document.getElementById('flashMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'flashMsg';
    el.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#121826;border:2px solid #ffd23f;color:#ffd23f;padding:10px 20px;border-radius:6px;z-index:50;font-family:inherit;font-size:14px;max-width:90%;text-align:center';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

// ---------- Ввід ----------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'fire',
};

document.addEventListener('keydown', e => {
  if (KEYMAP[e.code] && state === 'play') { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'Enter' && state === 'results') toHangar();
  if (e.code === 'Escape' && state === 'play') endBattle(false);
  if (state === 'perk' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const idx = +e.code.slice(-1) - 1;
    const picks = window._perkPicks || [];
    if (picks[idx]) pickPerk(picks[idx]);
  }
});
document.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });

document.getElementById('battleBtn').onclick = startBattle;
document.getElementById('toHangarBtn').onclick = toHangar;
document.getElementById('resetBtn').onclick = () => {
  if (confirm('Точно скинути ВЕСЬ прогрес? Усі танки й срібло зникнуть!')) {
    save = defaultSave();
    persist();
    renderHangar();
  }
};

// сенсорне керування
for (const btn of document.querySelectorAll('#dpad .tbtn')) {
  const dir = btn.dataset.dir;
  if (!dir) continue;
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[dir] = true; }, { passive: false });
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[dir] = false; }, { passive: false });
}
const fireBtn = document.getElementById('fireBtn');
fireBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.fire = true; }, { passive: false });
fireBtn.addEventListener('touchend', e => { e.preventDefault(); keys.fire = false; }, { passive: false });

// ---------- Старт ----------
loadSave();
renderHangar();
requestAnimationFrame(loop);

// хук для автотестів
window._dbg = { get: () => ({ state, battle, player, enemies, spawnQueue, save }), killEnemy };
