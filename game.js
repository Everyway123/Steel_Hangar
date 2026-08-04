// ============================================================
//  СТАЛЕВИЙ АНГАР — танкові бої з прокачкою у стилі WoT
//  Ангар → короткий бій (3-5 хв) → срібло і досвід → прокачка
//  Прогрес зберігається у localStorage автоматично.
// ============================================================
'use strict';

// ---------- Гілка танків ----------
const CLS_COLOR = { 'ЛТ': '#6fd3ff', 'СТ': '#39ff88', 'ВТ': '#ffd23f', 'ПТ': '#c07eff' };

const TANKS = {
  // Розвідники (ЛТ)
  kadet:    { name: 'Т-10 «Кадет»',      cls: 'ЛТ', tier: 1, hp: 12, dmg: 2,  fireCd: 550,  speed: 1.75,  armor: 0, bulletSpeed: 6.0,  size: 32,
              prev: null,       research: 0,     cost: 0,     desc: 'Навчальний танк. З нього починається кожен герой.' },
  sokil:    { name: 'Т-25 «Сокіл»',      cls: 'ЛТ', tier: 2, hp: 15, dmg: 2,  fireCd: 420,  speed: 2.2,  armor: 0, bulletSpeed: 7.0,  size: 32,
              prev: 'kadet',    research: 250,   cost: 600,   desc: 'Швидкий розвідник. Літає по карті, жалить і тікає.' },
  pryvyd:   { name: 'Т-50 «Привид»',     cls: 'ЛТ', tier: 3, hp: 18, dmg: 3,  fireCd: 380,  speed: 2.45,  armor: 0, bulletSpeed: 7.5,  size: 32,
              prev: 'sokil',    research: 700,   cost: 2000,  desc: 'Найшвидший танк гри. Вороги бачать лише пил.' },
  // Універсали (СТ)
  veteran:  { name: 'Т-34 «Ветеран»',    cls: 'СТ', tier: 3, hp: 22, dmg: 3,  fireCd: 500,  speed: 1.7,  armor: 1, bulletSpeed: 7.0,  size: 34,
              prev: 'sokil',    research: 600,   cost: 1800,  desc: 'Легендарний універсал. Надійний у будь-якій ситуації.' },
  bars:     { name: 'Т-44 «Барс»',       cls: 'СТ', tier: 4, hp: 28, dmg: 4,  fireCd: 480,  speed: 2.0,  armor: 1, bulletSpeed: 7.5,  size: 35,
              prev: 'veteran',  research: 1400,  cost: 4500,  desc: 'Швидкий, точний, злий. Танк для тих, хто все вміє.' },
  shkval:   { name: 'Т-62 «Шквал»',      cls: 'СТ', tier: 5, hp: 36, dmg: 5,  fireCd: 460,  speed: 1.85,  armor: 2, bulletSpeed: 8.0,  size: 36,
              prev: 'bars',     research: 3000,  cost: 10000, desc: 'Вершина СТ: тисне темпом і не пробачає помилок.' },
  // Гілка важких (ВТ)
  bastion:  { name: 'КВ-1 «Бастіон»',    cls: 'ВТ', tier: 4, hp: 34, dmg: 4,  fireCd: 620,  speed: 1.2, armor: 2, bulletSpeed: 7.0,  size: 38,
              prev: 'veteran',  research: 1400,  cost: 4500,  desc: 'Важка броня. Снаряди рикошетять, вороги плачуть.' },
  molot:    { name: 'ІС-7 «Молот»',      cls: 'ВТ', tier: 5, hp: 48, dmg: 5,  fireCd: 660,  speed: 1.1, armor: 3, bulletSpeed: 7.5,  size: 40,
              prev: 'bastion',  research: 3000,  cost: 10000, desc: 'Сталева фортеця на гусеницях. Але це ще не вершина...' },
  mamont:   { name: 'КВ-5 «Мамонт»',     cls: 'ВТ', tier: 6, hp: 68, dmg: 6,  fireCd: 700,  speed: 1.0, armor: 4, bulletSpeed: 7.5,  size: 42,
              prev: 'molot',    research: 6500,  cost: 24000, desc: 'Ходяча стіна. Половина снарядів просто відскакує.' },
  tytan:    { name: 'Об.705 «Титан»',    cls: 'ВТ', tier: 7, hp: 92, dmg: 7,  fireCd: 750,  speed: 0.95, armor: 5, bulletSpeed: 8.0,  size: 44,
              prev: 'mamont',   research: 13000, cost: 50000, desc: 'Абсолютна вершина. Земля дрижить, вороги розбігаються.' },
  // Снайпери (ПТ-САУ)
  osa:      { name: 'СУ-85 «Оса»',       cls: 'ПТ', tier: 4, hp: 18, dmg: 6,  fireCd: 850,  speed: 1.45, armor: 0, bulletSpeed: 9.0,  size: 34,
              prev: 'veteran',  research: 1400,  cost: 4500,  desc: 'Снайпер. Один влучний постріл вирішує все.' },
  kobra:    { name: 'ІСУ-152 «Кобра»',   cls: 'ПТ', tier: 5, hp: 24, dmg: 9,  fireCd: 980,  speed: 1.3,  armor: 1, bulletSpeed: 10.0, size: 36,
              prev: 'osa',      research: 3000,  cost: 10000, desc: '«Бах» — і ворога більше немає.' },
  skorpion: { name: 'СУ-100 «Скорпіон»', cls: 'ПТ', tier: 6, hp: 30, dmg: 12, fireCd: 1050, speed: 1.3, armor: 1, bulletSpeed: 10.5, size: 38,
              prev: 'kobra',    research: 6500,  cost: 24000, desc: 'Жало, що пробиває все. Навіть важкі бояться.' },
  aspid:    { name: 'Об.268 «Аспід»',    cls: 'ПТ', tier: 7, hp: 38, dmg: 16, fireCd: 1150, speed: 1.2, armor: 2, bulletSpeed: 11.0, size: 40,
              prev: 'skorpion', research: 13000, cost: 50000, desc: 'Один постріл — один труп. Навіть боси здригаються.' },
};
const TREE_ORDER = ['kadet', 'sokil', 'pryvyd', 'veteran', 'bars', 'shkval',
  'bastion', 'molot', 'mamont', 'tytan', 'osa', 'kobra', 'skorpion', 'aspid'];
const BRANCH_LABEL = { 'ЛТ': 'Розвідники (ЛТ)', 'СТ': 'Універсали (СТ)', 'ВТ': 'Гілка важких (ВТ)', 'ПТ': 'Снайпери (ПТ-САУ)' };

// Модулі: 5 рівнів кожен
const MOD_MAX = 5;
const MODULES = {
  gun:    { ico: '💥', name: 'Гармата',  desc: '+15% урону за рівень' },
  armor:  { ico: '🛡', name: 'Броня',    desc: '+1 броні та +12% HP за рівень' },
  engine: { ico: '🏎', name: 'Двигун',   desc: '+8% швидкості за рівень' },
  susp:   { ico: '🔩', name: 'Ходова',   desc: 'Розгін на 12% швидший за рівень' },
  radio:  { ico: '📡', name: 'Радіо',    desc: '+6% срібла за бій за рівень' },
};
function moduleCost(tier, lvl) { return Math.round((lvl + 1) * 350 * (1 + 0.5 * (tier - 1))); }

// Екіпаж: досвід накопичується з боями, рівень 1-10, кожен рівень підсилює все
function crewLevel(ts) { return Math.min(10, Math.floor(Math.sqrt((ts.crewXp || 0) / 120))); }
function crewNextXp(lvl) { return (lvl + 1) * (lvl + 1) * 120; }

function isElite(ts) { return Object.keys(MODULES).every(k => (ts.modules[k] || 0) >= MOD_MAX); }

// Реальні характеристики танка: база × модулі × екіпаж
function tankStats(id) {
  const t = TANKS[id], ts = tankSave(id), m = ts.modules;
  const crew = crewLevel(ts);
  const crewMult = 1 + 0.015 * crew;
  return {
    id, name: t.name, cls: t.cls, tier: t.tier, size: t.size,
    hp: Math.round(t.hp * (1 + 0.12 * m.armor)),
    dmg: +(t.dmg * (1 + 0.15 * m.gun) * crewMult).toFixed(2),
    armor: t.armor + m.armor,
    speed: +(t.speed * (1 + 0.08 * m.engine) * crewMult).toFixed(2),
    fireCd: Math.round(t.fireCd * (1 - 0.01 * crew)),
    bulletSpeed: t.bulletSpeed,
    ramp: Math.round((CLS_RAMP[t.cls] || 260) * (1 - 0.10 * (m.susp || 0))),
    radioBonus: 0.06 * (m.radio || 0) + (isElite(ts) ? 0.10 : 0),
    crew, elite: isElite(ts),
  };
}


// ---------- Скіни: кожен танк має власний вигляд ----------
// hull — колір корпусу, plate — накладна деталь, barrel — довжина ствола,
// twin — два стволи, stripe — розпізнавальна смуга на башті
const SKINS = {
  kadet:    { hull: '#4f93c4', plate: 'none',   barrel: 0.60, stripe: '#a8d8ff' },
  sokil:    { hull: '#2fb7ff', plate: 'rails',  barrel: 0.72, stripe: '#d7f3ff' },
  pryvyd:   { hull: '#6fe6ff', plate: 'net',    barrel: 0.76, stripe: '#0d3b52' },
  veteran:  { hull: '#3f9e5c', plate: 'none',   barrel: 0.74, stripe: '#c8ffd8' },
  bars:     { hull: '#39ff88', plate: 'skirts', barrel: 0.80, stripe: '#0d3d24' },
  shkval:   { hull: '#00d9a0', plate: 'rails',  barrel: 0.88, stripe: '#04322a' },
  bastion:  { hull: '#c9922f', plate: 'spaced', barrel: 0.58, stripe: '#3a2a08' },
  molot:    { hull: '#ffd23f', plate: 'spaced', barrel: 0.66, stripe: '#3d2f05' },
  mamont:   { hull: '#ff9d3c', plate: 'skirts', barrel: 0.64, stripe: '#40230a' },
  tytan:    { hull: '#ff6f3c', plate: 'spaced', barrel: 0.72, stripe: '#3d1405', twin: true },
  osa:      { hull: '#a97eff', plate: 'net',    barrel: 0.94, stripe: '#241040' },
  kobra:    { hull: '#c07eff', plate: 'skirts', barrel: 1.02, stripe: '#2b1046' },
  skorpion: { hull: '#dc6bff', plate: 'net',    barrel: 1.10, stripe: '#320c46' },
  aspid:    { hull: '#ff5ce0', plate: 'spaced', barrel: 1.18, stripe: '#45063a', twin: true },
};
function skinOf(id) { return SKINS[id] || SKINS.kadet; }

// ---------- Збереження ----------
const SAVE_KEY = 'steelHangarSave1';
let save;

function defaultSave() {
  return {
    credits: 500,
    battles: 0, wins: 0, totalFrags: 0,
    current: 'kadet',
    tanks: { kadet: { researched: true, owned: true, xp: 0, modules: { gun: 0, armor: 0, engine: 0 } } },
    front: { level: 1, liberated: ['plazdarm'] },
    codex: [],
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    save = raw ? JSON.parse(raw) : defaultSave();
    if (!save.tanks || !save.tanks[save.current]) save = defaultSave();
    // стартовий танк завжди відкритий
    const k = tankSave('kadet');
    k.researched = true; k.owned = true;
    if (!save.front) save.front = { level: 1, liberated: ['plazdarm'] };
    if (!Array.isArray(save.codex)) save.codex = [];
  } catch (e) { save = defaultSave(); }
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ---------- Телеметрія (локальний лог для аналізу балансу) ----------
const LOG_KEY = 'steelHangarLog1';
function logEvent(type, data) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    arr.push(Object.assign({ t: type, ts: Date.now() }, data));
    while (arr.length > 500) arr.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(arr));
  } catch (e) {}
}
function getLog() { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; } }
function tankSave(id) {
  if (!save.tanks[id]) save.tanks[id] = { researched: false, owned: false, xp: 0, crewXp: 0, modules: {} };
  const ts = save.tanks[id];
  // міграція старих сейвів: додаємо нові поля
  if (!ts.modules) ts.modules = {};
  for (const k of Object.keys(MODULES)) if (typeof ts.modules[k] !== 'number') ts.modules[k] = 0;
  if (typeof ts.crewXp !== 'number') ts.crewXp = 0;
  return ts;
}

// ---------- Карти боїв ----------
// '.'=пусто '#'=цегла '@'=сталь '~'=вода '*'=кущі 's'=пісок 'o'=бочка 'H'=штаб
// 'P'=гравець 'E'=спавн ворогів
// mode: 'clear' — знищ усіх ворогів; 'assault' — знищ штаб, підкріплення обмежені
const MAPS = [
  { name: 'Полігон', mode: 'clear', map: [
    'E......EE......E',
    '................',
    '..##..#..#..##..',
    '..##..#..#..##..',
    '......####......',
    '.@............@.',
    '....########....',
    '....#......#....',
    '..#..x....x..#..',
    '..#...####...#..',
    '......#..#......',
    '..##..#..#..##..',
    '................',
    '.......P........',
  ]},
  { name: 'Міські руїни', mode: 'clear', map: [
    'E.....E..E.....E',
    '.####........##.',
    '.#..#..####..##.',
    '.#..#..#..#.....',
    '.......#..#..##.',
    '.###..........#.',
    '...#..@##@..###.',
    '.#..f......f..#.',
    '.#..###..###....',
    '.......##.......',
    '.###..*##*..###.',
    '...#..*..*..#...',
    '................',
    '.......P........',
  ]},
  { name: 'Річкова переправа', mode: 'clear', map: [
    'E......EE......E',
    '................',
    '..##...ii...##..',
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
  { name: 'Сталева фортеця', mode: 'clear', map: [
    'E.....E..E.....E',
    '.@.....##.....@.',
    '...##..##..##...',
    '.#.##......##.#.',
    '.#.....@@.....#.',
    '.#..##....##..#.',
    '....##.@@.##....',
    '.@............@.',
    '..####....####..',
    '..#....T.....#..',
    '..#..*####*..#..',
    '.....*#..#*.....',
    '................',
    '.......P........',
  ]},
  { name: 'Арена генерала', mode: 'clear', map: [
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
  { name: 'Пустельний рубіж', mode: 'clear', map: [
    'E......EE......E',
    '................',
    '..##..ssss..##..',
    '..##..ssss..##..',
    '....o......o....',
    '.@....####....@.',
    '......#..#......',
    '..sss.#..#.sss..',
    '..sss.o..o.sss..',
    '......####......',
    '..##........##..',
    '..##..o..o..##..',
    '......ssss......',
    '.......P........',
  ]},
  { name: 'Склад боєприпасів', mode: 'clear', map: [
    'E.....E..E.....E',
    '.##..........##.',
    '.##..o....o..##.',
    '......####......',
    '..o..........o..',
    '....########....',
    '....#.o..o.#....',
    '....#......#....',
    '....##.oo.##....',
    '..o..........o..',
    '..###..##..###..',
    '.....o....o.....',
    '................',
    '.......P........',
  ]},
  { name: 'Залізний хрест', mode: 'clear', map: [
    'E......EE......E',
    '................',
    '..##...xx...##..',
    '..##...xx...##..',
    '.......ff.......',
    '.x..f######f..x.',
    '....f.#..#.f....',
    '....f.#T.#.f....',
    '....f.#..#.f....',
    '.x..f######f..x.',
    '.......ff.......',
    '..##...xx...##..',
    '................',
    '.......P........',
  ]},
  { name: 'Крижане озеро', mode: 'clear', map: [
    'E......EE......E',
    '................',
    '..**..iiii..**..',
    '..*..iiiiii..*..',
    '....iiiiiiii....',
    '.@..iiiiiiii..@.',
    '....iiixxiii....',
    '....iiixxiii....',
    '....iiiiiiii....',
    '.#..iiiiiiii..#.',
    '..#..iiiiii..#..',
    '..**..iiii..**..',
    '................',
    '.......P........',
  ]},
  { name: 'Лінія оборони', mode: 'assault', map: [
    'E.....@HH@.....E',
    '.......##.......',
    '..T..........T..',
    '................',
    'xx.xx.xx.xx.xx.x',
    '................',
    '.####.f..f.####.',
    '......f..f......',
    '......f..f......',
    '......ff.f......',
    'x.xx.xx.xx.xx.xx',
    '................',
    '................',
    '.......P........',
  ]},
  { name: 'Штурм: Командний центр', mode: 'assault', map: [
    'E.....@HH@.....E',
    '.......##.......',
    '..##........##..',
    '..##..o..o..##..',
    '................',
    '.@....####....@.',
    '......#..#......',
    '..ss........ss..',
    '..ss..o..o..ss..',
    '....########....',
    '......s..s......',
    '..##........##..',
    '................',
    '.......P........',
  ]},
  { name: 'Штурм: Радарна база', mode: 'assault', map: [
    'E.....E..E.....E',
    '................',
    '...##.@HH@.##...',
    '...##..##..##...',
    '......o..o......',
    '................',
    '.@@..######..@@.',
    '.....#....#.....',
    '..s..#.oo.#..s..',
    '..s..#....#..s..',
    '.....##..##.....',
    '..##........##..',
    '................',
    '.......P........',
  ]},
];

// ---------- Фронтова мапа (кампанія) ----------
// Звільняй сектори від Плацдарму до Цитаделі. Кожен сектор — бій зі своїм
// модифікатором. Після Цитаделі фронт відкривається знову, але складніший.
const MOD_INFO = {
  fog:       { ico: '🌫', name: 'Туман',      desc: 'Видимість скорочена — бої впритул' },
  night:     { ico: '🌙', name: 'Нічний бій', desc: 'Темрява, видно лише навколо танка' },
  artillery: { ico: '💥', name: 'Артобстріл', desc: 'З неба падають снаряди — не стій під міткою!' },
  mines:     { ico: '☢', name: 'Мінне поле', desc: 'Міни скрізь — дивись під гусениці' },
  frost:     { ico: '❄', name: 'Мороз',      desc: 'Всі повільніші, техніка мерзне' },
};

const FRONT_SECTORS = [
  { id: 'plazdarm',    name: 'Плацдарм',          x: 7,  y: 50, base: true, links: ['polihon', 'peredmistia'] },
  { id: 'polihon',     name: 'Полігон',           x: 21, y: 24, map: 'Полігон',              mode: 'clear',   mod: null,        reward: 400,  links: ['pisky', 'mist'] },
  { id: 'peredmistia', name: 'Передмістя',        x: 21, y: 76, map: 'Міські руїни',         mode: 'clear',   mod: null,        reward: 400,  links: ['mist', 'sklady'] },
  { id: 'pisky',       name: 'Піски',             x: 37, y: 10, map: 'Пустельний рубіж',     mode: 'clear',   mod: 'night',     reward: 700,  links: ['fort'] },
  { id: 'mist',        name: 'Міст',              x: 37, y: 50, map: 'Річкова переправа',    mode: 'clear',   mod: 'fog',       reward: 700,  links: ['fort'] },
  { id: 'sklady',      name: 'Склади',            x: 37, y: 90, map: 'Склад боєприпасів',    mode: 'clear',   mod: 'artillery', reward: 700,  links: ['radar'] },
  { id: 'fort',        name: 'Форт «Сталь»',      x: 51, y: 28, map: 'Сталева фортеця',      mode: 'clear',   mod: 'mines',     reward: 1100, links: ['ozero', 'ksh'] },
  { id: 'radar',       name: 'Радарна база',      x: 51, y: 74, map: 'Штурм: Радарна база',  mode: 'assault', mod: 'fog',       reward: 1200, links: ['liniya'] },
  { id: 'liniya',      name: 'Лінія оборони',     x: 63, y: 88, map: 'Лінія оборони',        mode: 'assault', mod: 'artillery', reward: 1700, links: ['ksh'] },
  { id: 'ozero',       name: 'Крижане озеро',     x: 63, y: 8,  map: 'Крижане озеро',        mode: 'clear',   mod: 'frost',     reward: 1500, links: ['kotel'] },
  { id: 'kotel',       name: 'Котел',             x: 76, y: 12, map: 'Залізний хрест',       mode: 'clear',   mod: null,        reward: 1800, boss: true, links: ['zavod'] },
  { id: 'ksh',         name: 'Командний центр',   x: 71, y: 56, map: 'Штурм: Командний центр', mode: 'assault', mod: 'night',   reward: 1600, links: ['zavod'] },
  { id: 'zavod',       name: 'Танковий завод',    x: 84, y: 32, map: 'Склад боєприпасів',    mode: 'assault', mod: 'artillery', reward: 2400, links: ['tsytadel'] },
  { id: 'tsytadel',    name: '☭ ЦИТАДЕЛЬ',        x: 93, y: 68, map: 'Арена генерала',       mode: 'assault', mod: 'mines',     reward: 5000, boss: true, final: true, links: [] },
];
function sectorById(id) { return FRONT_SECTORS.find(s => s.id === id); }
function frontBonus() { return 0.02 * Math.max(0, (save.front.liberated.length - 1)); }

// ---------- Вороги ----------
const ENEMY_TYPES = {
  scout:   { hp: 3,  speed: 1.65, size: 32, dmg: 2, fireCd: 1750, credits: 55,  xp: 11, color: '#6fd3ff', cls: 'ЛТ' },
  soldier: { hp: 6,  speed: 1.1, size: 34, dmg: 2, fireCd: 1400, credits: 85,  xp: 17, color: '#ff9d5c', cls: 'СТ' },
  heavy:   { hp: 12, speed: 0.75, size: 36, dmg: 3, fireCd: 1300, credits: 140, xp: 28, color: '#e06666', cls: 'ВТ' },
  rocket:  { hp: 5,  speed: 0.95, size: 34, dmg: 3, fireCd: 3300, credits: 170, xp: 32, color: '#ffd23f', cls: 'ПТ', homing: true },
  boss:    { hp: 75, speed: 0.7, size: 48, dmg: 4, fireCd: 1000,  credits: 900, xp: 220, color: '#ff4d5e', cls: 'ВТ' },
};

function buildRoster(tier, elite) {
  const pool = [];
  const count = 7 + tier;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (tier <= 2) pool.push(r < 0.6 ? 'scout' : 'soldier');
    else if (tier === 3) pool.push(r < 0.3 ? 'scout' : r < 0.72 ? 'soldier' : r < 0.88 ? 'heavy' : 'rocket');
    else pool.push(r < 0.18 ? 'scout' : r < 0.5 ? 'soldier' : r < 0.85 ? 'heavy' : 'rocket');
    // (склад хвиль важчає через scaledEnemy: більше HP і швидкості)
  }
  if (elite) pool.push('boss');
  return pool;
}

// ---------- Доктрини (перки на один бій) ----------
// Прибувають з постачанням раз на ~55 с. Звичайні — чистий бонус,
// рідкісні — сила за ціну слабкості, епічні — лише в елітних боях.
const SUPPLY_MS = 45000;              // (лишається як страховка від нульового прогресу)
// пауза між пострілами всієї ворожої армії: тиск є, але хором не розстрілюють.
// заміряно тестом enemyfire.js — ціль ~1.3 постр/с на т1 і ~3 постр/с на т4+
function enemyFireGap() {
  const tier = battle.tank.tier;
  return tier <= 2 ? 520 : tier <= 3 ? 400 : 300;
}
const SUPPLY_COST = 100;              // бойових очок на одне постачання
// очки за дії: фраг, урон, шкода ворожій базі — сила заробляється боєм
const PTS = { frag: 12, dmg: 1, hqDmg: 3, base: 25 };
const BATTLE_LIMIT_MS = 120000; // 2 хвилини — жорстка межа раунду
const MAX_WAVES = 3;            // дві хвилі підкріплень за бій, далі ростер скінченний
const PERKS = [
  // польові — прості, але відчутні
  { id: 'maroder', rar: 'common', ico: '💰', name: 'Мародер',           desc: '+60% срібла за кожен фраг до кінця бою',
    apply: p => battle.lootMult = (battle.lootMult || 1) * 1.6 },
  { id: 'cryo',    rar: 'common', ico: '❄', name: 'Кріо-снаряди',      desc: 'Твої влучання ЗАМОРОЖУЮТЬ ворога на 2 с',
    apply: p => p.cryo = true },
  { id: 'forsazh', rar: 'common', ico: '🚀', name: 'Форсаж',            desc: '+25% швидкості — літай між укриттями',
    apply: p => p.speed *= 1.25 },
  { id: 'kalibr',  rar: 'common', ico: '💥', name: 'Великий калібр',    desc: '+20% урону — снаряди б\'ють гучніше',
    apply: p => p.dmg *= 1.2 },
  // тактичні — міняють стиль гри
  { id: 'trofey',  rar: 'rare', ico: '🔧', name: 'Трофейщик',          desc: 'Кожен фраг ЛІКУЄ тебе на 2 HP',
    apply: p => p.vampire = true },
  { id: 'taran',   rar: 'rare', ico: '🥊', name: 'Таран',              desc: 'Корпус — зброя: зіткнення б\'є на 10, і +10% швидкості',
    apply: p => { p.ram = true; p.speed *= 1.1; } },
  { id: 'reactive', rar: 'rare', ico: '🛡', name: 'Реактивна броня',   desc: '+1 броня, рикошет ВІДБИВАЄ снаряд у ворога',
    apply: p => { p.armor += 1; p.reflect = true; } },
  { id: 'zatvor',  rar: 'rare', ico: '⚡', name: 'Блискавичний затвор', desc: 'Перезарядка на 30% швидша',
    apply: p => p.fireCd = Math.round(p.fireCd * 0.7) },
  // епічні — лише в елітних боях, кожна один раз
  { id: 'double', rar: 'epic', ico: '🎯', name: 'Здвоєна гармата',     desc: 'Кожен постріл — ДВА снаряди віялом', unique: true,
    apply: p => p.doubleShot = true },
  { id: 'heat',   rar: 'epic', ico: '☄', name: 'Фугасні снаряди',     desc: 'Влучання ВИБУХАЄ і ранить ворогів поруч', unique: true,
    apply: p => p.explosiveRounds = true },
  { id: 'smoke',  rar: 'epic', ico: '👻', name: 'Димова завіса',       desc: 'Після влучання по тобі — 2 с повної невразливості', unique: true,
    apply: p => p.smoke = true },
  { id: 'homing', rar: 'epic', ico: '🛰', name: 'Самонавідні ракети',  desc: 'Твої снаряди САМІ шукають ціль і довертають', unique: true,
    apply: p => p.homingRounds = true },
];

// швидкість розгону: важкий танк набирає хід повільно — відчувається вага
const CLS_RAMP = { 'ЛТ': 160, 'СТ': 260, 'ВТ': 420, 'ПТ': 300 };

// ============================================================
//  ДВИГУН БОЮ
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Світ удвічі ширший за вікно: камера їде за танком, у HUD — міні-мапа
const TILE = 40, COLS = 32, ROWS = 14;
const VIEW_COLS = 16;
const W = COLS * TILE, H = ROWS * TILE;
const VIEW_W = VIEW_COLS * TILE;   // ширина полотна = те, що видно
let camX = 0;
function updateCamera() {
  const want = player.x - VIEW_W / 2;
  camX = Math.max(0, Math.min(W - VIEW_W, want));
}
const HUD_TOP = 42, HUD_BOT = 46; // смуги HUD поза ігровим полем
const T_EMPTY = 0, T_BRICK = 1, T_STEEL = 2, T_WATER = 3, T_BUSH = 4, T_SAND = 5, T_BARREL = 6, T_HQ = 7, T_HEDGE = 8, T_FENCE = 9, T_ICE = 10, T_TURRET = 11, T_HOME = 12;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let grid, gridHp, player, enemies, bullets, particles, drops;
// у зібраному одному файлі (артефакт) <head> береться від хоста і meta viewport губиться —
// без неї телефон малює сторінку в 980px-макеті і все стискається вдвічі
if (!document.querySelector('meta[name="viewport"]')) {
  const mv = document.createElement('meta');
  mv.name = 'viewport';
  mv.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
  document.head.appendChild(mv);
}
// телефон/планшет визначаємо одразу: без підказок клавіш у HUD і з автоприцілом з першого пострілу
const IS_TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
let touchMode = IS_TOUCH; // на тачі точного керування нема — там лишається автоприціл
let spawnQueue, spawnPoints, spawnTimer, maxAlive;
let battle; // статистика поточного бою
let state = 'hangar';
let keys = {}, lastTime = 0, shakeTime = 0, freezeTimer = 0;
let pendingPerks = 0;

// ---------- Аудіо: соковиті звуки + процедурна музика ----------
let audioCtx = null, noiseBuf = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function getNoise() {
  if (!noiseBuf) {
    noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
// тон з ковзанням частоти
function beep(freq, dur, type, vol, freqEnd) {
  try {
    ensureAudio();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
// шумовий сплеск через фільтр — тіло вибухів і пострілів
function noiseBurst(dur, filterType, filterFreq, vol) {
  try {
    ensureAudio();
    const src = audioCtx.createBufferSource();
    src.buffer = getNoise();
    const f = audioCtx.createBiquadFilter();
    f.type = filterType; f.frequency.value = filterFreq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(audioCtx.destination);
    src.start(); src.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
const sfx = {
  // постріл: низький «удар» + короткий тріск пороху
  shoot: () => { beep(150, 0.12, 'sine', 0.09, 55); noiseBurst(0.06, 'highpass', 900, 0.05); },
  hit: () => { beep(120, 0.09, 'sawtooth', 0.05, 70); noiseBurst(0.05, 'bandpass', 600, 0.05); },
  // рикошет: металевий дзвін
  rico: () => { beep(1400, 0.1, 'triangle', 0.05); beep(2150, 0.14, 'triangle', 0.035); noiseBurst(0.03, 'highpass', 3000, 0.03); },
  // вибух: суб-бас + шумова хвиля
  boom: () => { beep(60, 0.5, 'sine', 0.16, 28); noiseBurst(0.45, 'lowpass', 320, 0.18); noiseBurst(0.12, 'bandpass', 900, 0.08); },
  perk: () => { beep(523, 0.12, 'square', 0.05); setTimeout(() => beep(659, 0.12, 'square', 0.05), 110); setTimeout(() => beep(784, 0.22, 'square', 0.05), 220); },
  pickup: () => { beep(880, 0.09, 'sine', 0.07); beep(1320, 0.14, 'sine', 0.04); },
  brick: () => noiseBurst(0.06, 'bandpass', 520, 0.07),
  cash: () => { beep(660, 0.08, 'sine', 0.06); setTimeout(() => beep(990, 0.12, 'sine', 0.06), 90); },
};

// ---------- Музика: акуратний темний синтвейв, генерується на льоту ----------
const music = {
  on: localStorage.getItem('shMusic') !== '0',
  started: false, step: 0, next: 0, timer: null, delay: null,
};
const NOTE = n => 55 * Math.pow(2, n / 12); // від A1
// Dm — Bb — F — C: важчий, «броньований» настрій замість неонового
const CHORDS = [
  { root: 5,  tones: [0, 3, 7, 10] },
  { root: 1,  tones: [0, 4, 7, 11] },
  { root: 8,  tones: [0, 4, 7, 12] },
  { root: 3,  tones: [0, 4, 7, 10] },
];
// бас марширує рівно — крок гусениць
const BASS_PAT = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];
const ARP_PAT  = [0, null, null, 2, null, 1, null, null, 3, null, null, 2, null, 1, null, null];

function startMusic() {
  if (music.started || !music.on) return;
  try {
    ensureAudio();
    music.delay = audioCtx.createDelay(1);
    music.delay.delayTime.value = 0.34;
    const fb = audioCtx.createGain(); fb.gain.value = 0.32;
    const wet = audioCtx.createGain(); wet.gain.value = 0.5;
    music.delay.connect(fb); fb.connect(music.delay);
    music.delay.connect(wet); wet.connect(audioCtx.destination);
    music.started = true;
    music.next = audioCtx.currentTime + 0.1;
    music.timer = setInterval(musicSchedule, 60);
  } catch (e) {}
}
function musicSchedule() {
  if (!music.on || !audioCtx) return;
  const stepDur = 60 / 104 / 4; // 104 BPM — трохи бадьоріше, маршовий крок
  while (music.next < audioCtx.currentTime + 0.25) {
    musicStep(music.step, music.next, stepDur);
    music.step = (music.step + 1) % 64;
    music.next += stepDur;
  }
}
function musicNote(freq, t, dur, type, vol, dest) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || audioCtx.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
function musicStep(i, t, stepDur) {
  const chord = CHORDS[Math.floor(i / 16) % 4];
  const s16 = i % 16;
  // бас — короткий важкий пульс (крок гусениці)
  if (BASS_PAT[s16]) musicNote(NOTE(chord.root), t, stepDur * 1.3, 'square', 0.045);
  // підбас октавою нижче на сильну долю
  if (s16 % 8 === 0) musicNote(NOTE(chord.root) / 2, t, stepDur * 3, 'triangle', 0.05);
  // мелодія — рідка, з відлунням
  const arp = ARP_PAT[s16];
  if (arp !== null) {
    const oct = Math.floor(i / 32) % 2 ? 36 : 24;
    musicNote(NOTE(chord.root + chord.tones[arp] + oct), t, stepDur * 2.2, 'triangle', 0.03, music.delay);
  }
  // «малий барабан» на 2 і 4 долю — маршовий каркас
  if (s16 === 4 || s16 === 12) noiseBurstAt(t, 0.07, 'bandpass', 1900, 0.035);
  if (s16 % 4 === 2) noiseBurstAt(t, 0.025, 'highpass', 7000, 0.01);
}
function noiseBurstAt(t, dur, type, freq, vol) {
  const src = audioCtx.createBufferSource();
  src.buffer = getNoise();
  const f = audioCtx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(audioCtx.destination);
  src.start(t); src.stop(t + dur);
}
function toggleMusic() {
  music.on = !music.on;
  localStorage.setItem('shMusic', music.on ? '1' : '0');
  if (music.on) { music.started = false; startMusic(); }
  flashMsg(music.on ? '🎵 Музика увімкнена' : '🔇 Музика вимкнена');
}

// ---------- Запуск бою ----------
// sector = об'єкт сектора фронту, або null для вільного бою
function startBattle(sector) {
  startMusic();
  const st = tankStats(save.current);
  const elite = sector ? !!sector.boss : (save.battles + 1) % 5 === 0;
  const mapDef = sector
    ? MAPS.find(m => m.name === sector.map) || MAPS[0]
    : MAPS[Math.floor(Math.random() * MAPS.length)];

  battle = {
    tank: st, elite, mapName: mapDef.name,
    mode: sector ? sector.mode : (mapDef.mode || 'clear'),
    sector: sector ? sector.id : null,
    mod: sector ? sector.mod : null,
    speedMult: sector && sector.mod === 'frost' ? 0.8 : 1,
    mines: [], strikes: [], artT: 3000,
    frags: 0, dmgDealt: 0, ricochets: 0, bossKilled: false, hqLeft: 0,
    credits: 0, xp: 0,
    supply: 0, pts: 0, ptsTotal: 0, wave: 1, waveT: 0, medkit: true, idle: 0, farmWarned: false, arcWarned: false, reinforce: 5,
    gameMs: 0, dmgTaken: 0,
    perks: [],
    tierMult: 1 + 0.3 * (st.tier - 1),
  };
  logEvent('battle_start', { tank: st.id, tier: st.tier, map: mapDef.name, mode: battle.mode, elite });

  player = {
    x: 0, y: 0, dir: 'up', size: st.size,
    maxHp: st.hp, hp: st.hp, dmg: st.dmg, armor: st.armor,
    speed: st.speed, fireCd: st.fireCd, bulletSpeed: st.bulletSpeed,
    cooldown: 0, invuln: 1500, turretAngle: -Math.PI / 2,
    accelMs: 0, ramp: st.ramp,
  };

  grid = []; gridHp = [];
  spawnPoints = []; enemies = []; bullets = []; particles = []; drops = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = []; gridHp[r] = [];
    // карта вдвічі ширша: праву половину робимо дзеркальною копією лівої.
    // Маркери 'P' і 'H' у дзеркалі прибираємо (гравець і штаб мають бути одні),
    // а спавни 'E' лишаємо — вороги приходять з обох країв
    const src = (mapDef.map[r] || '').padEnd(VIEW_COLS, '.').slice(0, VIEW_COLS);
    const mirrored = src.split('').reverse().join('').replace(/[PH]/g, '.');
    const row = (src + mirrored).padEnd(COLS, '.');
    for (let c = 0; c < COLS; c++) {
      const ch = row[c];
      let t = T_EMPTY, hp = 0;
      if (ch === '#') { t = T_BRICK; hp = 6; }   // цегла тримає 3 постріли, а не 1
      else if (ch === '@') { t = T_STEEL; hp = 6; }
      else if (ch === '~') t = T_WATER;
      else if (ch === '*') t = T_BUSH;
      else if (ch === 's') t = T_SAND;
      else if (ch === 'x') t = T_HEDGE;
      else if (ch === 'f') { t = T_FENCE; hp = 1; }
      else if (ch === 'i') t = T_ICE;
      else if (ch === 'T') { t = T_TURRET; hp = 10 + 4 * st.tier; }
      else if (ch === 'o') { t = T_BARREL; hp = 1; }
      else if (ch === 'H') { t = T_HQ; hp = 14 + 5 * st.tier; }
      else if (ch === 'P') { player.x = COLS * TILE / 2 - TILE / 2; player.y = r * TILE + TILE / 2; }
      else if (ch === 'E') spawnPoints.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
      grid[r][c] = t; gridHp[r][c] = hp;
    }
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === T_HQ) battle.hqLeft++;

  // ---- БАЗИ: на кожній карті є твоя ★ (захищай) і ворожа ☭ (руйнуй) ----
  // мур П-подібний: бік, звернений до поля, лишається відкритим,
  // інакше і вороги, і ящики замуровуються наглухо
  const putBase = (r, c, tile, hp, openSide) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    grid[r][c] = tile; gridHp[r][c] = hp;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if ((dr === 0 && dc === 0) || rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
      if (openSide === 'down' && dr === 1) continue;   // прохід знизу
      if (openSide === 'up' && dr === -1) continue;    // прохід згори
      if (grid[rr][cc] === T_EMPTY || grid[rr][cc] === T_SAND || grid[rr][cc] === T_ICE) {
        // мур навколо бази — тонший за звичайну цеглу: його призначення
        // пробивати, а не тримати. З 6 HP штурм ставав непрохідним
        grid[rr][cc] = T_BRICK; gridHp[rr][cc] = 3;
      }
    }
  };
  // прибираємо стіни, що могли б замурувати точки спавну ворогів
  const clearSpawns = () => {
    for (const p of spawnPoints) {
      const r = Math.floor(p.y / TILE), c = Math.floor(p.x / TILE);
      for (const [dr, dc] of [[0,0],[1,0],[0,1],[0,-1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
        if (grid[rr][cc] === T_BRICK) grid[rr][cc] = T_EMPTY;
      }
    }
  };
  // страховка: під гравцем ніколи не має бути стіни, і має бути куди виїхати
  const PASSABLE = [T_EMPTY, T_BUSH, T_SAND, T_ICE];
  const freePlayerSpot = () => {
    const r = Math.floor(player.y / TILE), c = Math.floor(player.x / TILE);
    if (!grid[r] || grid[r][c] === undefined) return;
    if (!PASSABLE.includes(grid[r][c])) { grid[r][c] = T_EMPTY; gridHp[r][c] = 0; }
    const around = [[-1, 0], [0, -1], [0, 1], [1, 0]]
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS);
    let open = around.filter(([rr, cc]) => PASSABLE.includes(grid[rr][cc])).length;
    for (const [rr, cc] of around) {
      if (open >= 2) break;
      if (grid[rr][cc] === T_HOME || grid[rr][cc] === T_HQ || grid[rr][cc] === T_STEEL) continue;
      if (PASSABLE.includes(grid[rr][cc])) continue;
      grid[rr][cc] = T_EMPTY; gridHp[rr][cc] = 0; open++;
    }
  };

  const baseHp = 12 + 4 * st.tier;
  // ворожа база — вгорі по центру (якщо карта не має власних штабів)
  if (battle.hqLeft === 0) {
    // штаб зсунуто вбік від колонки гравця: інакше відкритий бік муру дивиться
    // просто на спавн і бій виграється пострілом угору за 8 секунд без руху
    const pcol = Math.floor(player.x / TILE);
    const hc = Math.max(1, Math.min(COLS - 2, pcol + (pcol < COLS / 2 ? 3 : -3)));
    putBase(1, hc, T_HQ, baseHp, 'down'); // підхід знизу відкритий
    battle.hqLeft = 1;
  }
  // твоя база — ПІД спавном гравця, ніколи не на ньому:
  // якщо 'P' стоїть на нижньому ряду, підіймаємо танк на клітинку вище,
  // інакше база лягає просто під гусениці й танк замурований з першої секунди
  let prow = Math.floor(player.y / TILE);
  if (prow >= ROWS - 1) { prow = ROWS - 2; player.y = prow * TILE + TILE / 2; }
  const pr = prow + 1;
  const pc = Math.floor(player.x / TILE);
  putBase(pr, pc, T_HOME, baseHp, 'up'); // гравець заїжджає згори
  clearSpawns();
  freePlayerSpot();
  player.buffs = []; player.fragile = 1;
  battle.helper = null;
  battle.homeHp = baseHp; battle.homeMax = baseHp;
  battle.homeR = pr; battle.homeC = pc;

  // ДОТи: збираємо список турелей
  battle.turrets = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    if (grid[r][c] === T_TURRET)
      battle.turrets.push({ r, c, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, cd: 1500 + Math.random() * 800, ang: Math.PI / 2 });

  // мінне поле: розкидаємо міни по вільних клітинах подалі від спавну гравця
  if (battle.mod === 'mines') {
    let tries = 0;
    while (battle.mines.length < 11 && tries++ < 300) {
      const r = 1 + Math.floor(Math.random() * (ROWS - 2));
      const c = Math.floor(Math.random() * COLS);
      const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
      if (grid[r][c] === T_EMPTY && Math.hypot(x - player.x, y - player.y) > 140) {
        battle.mines.push({ x, y });
      }
    }
  }

  // ворожі гармати стали злішими — карта має давати де сховатись.
  // Кущі не блокують рух, але ховають танк від чужих очей і від наведення
  {
    let planted = 0, tries = 0;
    while (planted < 14 && tries++ < 400) {
      const r = 1 + Math.floor(Math.random() * (ROWS - 2));
      const c = Math.floor(Math.random() * COLS);
      if (grid[r][c] !== T_EMPTY) continue;
      const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
      if (Math.hypot(x - player.x, y - player.y) < 100) continue;
      // сховок має бути біля укриття, а не серед голого поля
      let nearWall = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
        const t = grid[rr][cc];
        if (t === T_BRICK || t === T_STEEL || t === T_BUSH) nearWall++;
      }
      if (!nearWall) continue;
      grid[r][c] = T_BUSH;
      planted++;
    }
  }

  // на кожній карті лежать дві кинуті гармати — заїдь і бий двома стволами
  dropGunEmplacements(4);

  spawnQueue = buildRoster(st.tier, elite);
  battle.totalEnemies = spawnQueue.length;
  // штаб ☭ під сталевим щитом, доки не виб'єш половину передового загону.
  // Раунд тепер має дві фази: бій за перевагу → прорив до штабу
  // гейт half і в штурмі: спроба знизити його до third дала 0/12 замість 2/12
  // і подовжила бої (105 с проти 86) — раніше відкритий штаб лише
  // провокує кидатись на нього крізь вогонь
  battle.sealGoal = Math.ceil(spawnQueue.length / 2);
  battle.hqSealed = true;
  maxAlive = Math.min(8, 5 + Math.floor(st.tier / 2)) + (elite ? 1 : 0);
  spawnTimer = 400;
  freezeTimer = 0; shakeTime = 0; pendingPerks = 0;
  keys = {};

  document.getElementById('hangarView').classList.add('hidden');
  document.getElementById('frontView').classList.add('hidden');
  document.getElementById('battleView').classList.remove('hidden');
  document.getElementById('resultOverlay').classList.add('hidden');
  document.getElementById('perkOverlay').classList.add('hidden');
  document.body.classList.add('inBattle');
  battle.introT = (mapDef.mode === 'assault' || (sector && sector.mode === 'assault')) ? 5200 : 3200;

  state = 'play';
  lastTime = performance.now();
}

// ---------- Масштабування ворогів під тір ----------
function scaledEnemy(typeName, tier) {
  const t = ENEMY_TYPES[typeName];
  const fl = (save.front && save.front.level || 1) - 1; // рівень фронту робить всіх злішими
  const wv = Math.max(0, (battle.wave || 1) - 1);       // кожна хвиля — сильніші вороги
  const hpMult = (1 + 0.18 * (tier - 1)) * (1 + 0.3 * fl) * (1 + 0.22 * wv);
  const dmgAdd = (tier <= 2 ? -1 : 0) + Math.floor((tier - 1) / 2) + fl;
  return {
    type: typeName,
    hp: Math.round(t.hp * hpMult), maxHp: Math.round(t.hp * hpMult),
    speed: t.speed * (1 + 0.06 * wv), size: t.size,
    dmg: Math.max(1, t.dmg + dmgAdd), fireCd: t.fireCd,
    credits: t.credits, xpVal: t.xp, color: t.color,
  };
}

// ---------- Колізії ----------
function solidAt(x, y, forBullet) {
  if (x < 0 || y < 0 || x >= W || y >= H) return true;
  const t = grid[Math.floor(y / TILE)][Math.floor(x / TILE)];
  if (t === T_EMPTY || t === T_BUSH || t === T_SAND || t === T_ICE) return false;
  if (t === T_WATER) return !forBullet;
  if (t === T_HEDGE) return !forBullet; // кулі летять над їжаками
  return true;
}
function tileAt(x, y) {
  const r = Math.floor(y / TILE), c = Math.floor(x / TILE);
  return grid[r] ? grid[r][c] : T_EMPTY;
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

// бос трощить цегляні стіни своєю масою
function crushBricks(x, y, size) {
  const h = size / 2 + 2;
  const r1 = Math.max(0, Math.floor((y - h) / TILE)), r2 = Math.min(ROWS - 1, Math.floor((y + h) / TILE));
  const c1 = Math.max(0, Math.floor((x - h) / TILE)), c2 = Math.min(COLS - 1, Math.floor((x + h) / TILE));
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
    if (grid[r][c] === T_BRICK) {
      grid[r][c] = T_EMPTY;
      spawnParticles(c * TILE + TILE / 2, r * TILE + TILE / 2, '#c9694a', 8);
      sfx.brick();
    }
  }
}

function crushFences(x, y, size) {
  const h = size / 2;
  const r1 = Math.max(0, Math.floor((y - h) / TILE)), r2 = Math.min(ROWS - 1, Math.floor((y + h) / TILE));
  const c1 = Math.max(0, Math.floor((x - h) / TILE)), c2 = Math.min(COLS - 1, Math.floor((x + h) / TILE));
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
    if (grid[r][c] === T_FENCE) {
      grid[r][c] = T_EMPTY;
      spawnParticles(c * TILE + TILE / 2, r * TILE + TILE / 2, '#a5814f', 10);
      sfx.brick();
    }
  }
}

function moveTank(tank, dir, dist) {
  const [dx, dy] = DIRS[dir];
  crushFences(tank.x + dx * (dist + 3), tank.y + dy * (dist + 3), tank.size);
  if (tank.type === 'boss') crushBricks(tank.x + dx * (dist + 4), tank.y + dy * (dist + 4), tank.size);
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

// ---------- Стрільба (360°, від кута башти) ----------
const DIR_ANGLE = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI };

function hasLOS(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(d / 16);
  for (let i = 1; i < steps; i++) {
    if (solidAt(x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, true)) return false;
  }
  return true;
}

function fireBullet(tank, ang, speed, dmg, fromPlayer, overWalls) {
  const off = tank.size / 2 + 8;
  bullets.push({
    x: tank.x + Math.cos(ang) * off, y: tank.y + Math.sin(ang) * off,
    dx: Math.cos(ang), dy: Math.sin(ang),
    speed, dmg, fromPlayer, over: !!overWalls,
  });
  tank.flash = 90;
  sfx.shoot();
}

function shoot(tank, isPlayer) {
  if (isPlayer) {
    const twin = player.doubleShot || player.twin;
    const angles = twin
      ? [player.turretAngle - 0.07, player.turretAngle + 0.07]
      : [player.turretAngle];
    const berserkMult = player.berserk ? 1 + 1.5 * (1 - player.hp / player.maxHp) : 1;
    for (const a of angles) {
      const homes = player.homingRounds || player.homes;
      fireBullet(tank, a, homes ? player.bulletSpeed * 0.8 : player.bulletSpeed, player.dmg * berserkMult, true);
      if (homes) bullets[bullets.length - 1].homing = 'enemy';
    }
  } else {
    // вороги стріляють у гравця з невеликим розкидом
    const distP = Math.hypot(player.x - tank.x, player.y - tank.y);
    const spread = 0.12 + Math.min(0.4, distP / 900); // впритул точні, здалеку мажуть
    const ang = Math.atan2(player.y - tank.y, player.x - tank.x) + (Math.random() - 0.5) * spread * 2;
    tank.turretAngle = ang;
    const angs = tank.twin ? [ang - 0.07, ang + 0.07] : [ang];
    for (const a of angs) {
      fireBullet(tank, a, 3.6, tank.dmg, false);
      if (tank.homes) bullets[bullets.length - 1].homing = 'player';
    }
  }
}
function bossSpreadShot(boss) {
  const ang = Math.atan2(player.y - boss.y, player.x - boss.x);
  boss.turretAngle = ang;
  for (const a of [ang - 0.35, ang, ang + 0.35]) {
    fireBullet(boss, a, 3.6, boss.dmg, false);
  }
}

// ---------- Спавн і AI ----------
function trySpawnEnemy(dt) {
  // у штурмі є підкріплення, але вони скінченні (щоб бій не тягнувся вічно)
  // у штурмі підкріплення накладались на нові хвилі: ростер + 2 хвилі + 14
  // підкріплень = під 30 ворогів за 2 хвилини. Тепер підкріплень 5
  if (battle.mode === 'assault' && !spawnQueue.length && battle.reinforce > 0) {
    battle.reinforce--;
    const tier = battle.tank.tier;
    const r = Math.random();
    spawnQueue.push(tier <= 2 ? (r < 0.6 ? 'scout' : 'soldier')
      : (r < 0.3 ? 'scout' : r < 0.75 ? 'soldier' : 'heavy'));
  }
  if (!spawnQueue.length) return;
  if (enemies.length >= maxAlive) return;
  spawnTimer -= dt;
  if (spawnTimer > 0) return;
  spawnTimer = 1000;
  const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  const e = scaledEnemy(spawnQueue.shift(), battle.tank.tier);
  // великі танки притискаємо всередину поля, щоб не застрягали біля краю
  e.x = Math.min(W - e.size / 2 - 2, Math.max(e.size / 2 + 2, pt.x));
  e.y = Math.min(H - e.size / 2 - 2, Math.max(e.size / 2 + 2, pt.y));
  e.dir = 'down';
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
    // половина ворогів суне до ТВОЄЇ БАЗИ — не можна просто відсидітись
    const homeX = battle.homeC * TILE + TILE / 2, homeY = battle.homeR * TILE + TILE / 2;
    const goHome = grid[battle.homeR] && grid[battle.homeR][battle.homeC] === T_HOME && Math.random() < 0.45;
    // трофей поруч — ворог звертає за ним: тепер це гонка, а не безкоштовний бонус
    // за трофеєм біжить лише половина ворогів і лише зблизька:
    // інакше вони вимітають карту раніше, ніж ти встигаєш доїхати
    let loot = null, ld = 170;
    if (e.looter === undefined) e.looter = Math.random() < 0.5;
    if (e.looter) for (const d of drops) {
      if (d.kind !== 'crate' && !CRATES[d.kind]) continue;
      const dd = Math.hypot(d.x - e.x, d.y - e.y);
      if (dd < ld) { ld = dd; loot = d; }
    }
    const tx = loot ? loot.x : goHome ? homeX : player.x;
    const ty = loot ? loot.y : goHome ? homeY : player.y;
    const ddx = tx - e.x, ddy = ty - e.y;
    const chase = Math.hypot(ddx, ddy) < 300 ? 0.88 : 0.72;
    if (Math.random() < chase) {
      e.wantDir = Math.abs(ddx) > Math.abs(ddy)
        ? (ddx > 0 ? 'right' : 'left')
        : (ddy > 0 ? 'down' : 'up');
    } else {
      e.wantDir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
    }
  }
  updateBuffs(e, dt);
  if (e.flash > 0) e.flash -= dt;
  if (e.slowT > 0) e.slowT -= dt;
  const eSpeed = e.speed * (tileAt(e.x, e.y) === T_SAND ? 0.7 : tileAt(e.x, e.y) === T_ICE ? 1.25 : 1) * (e.slowT > 0 ? 0.55 : 1) * (battle.speedMult || 1);
  if (!moveTank(e, e.wantDir || 'down', eSpeed)) {
    e.thinkTimer = 0;
    // застряг надовго — прориває цеглу навколо себе, щоб не стояти вічно
    e.stuck = (e.stuck || 0) + dt;
    if (e.stuck > 2500) {
      e.stuck = 0;
      const [dx, dy] = DIRS[e.wantDir || 'down'];
      const rr = Math.floor((e.y + dy * TILE * 0.7) / TILE), cc = Math.floor((e.x + dx * TILE * 0.7) / TILE);
      if (grid[rr] && grid[rr][cc] === T_BRICK) {
        grid[rr][cc] = T_EMPTY;
        spawnParticles(cc * TILE + TILE / 2, rr * TILE + TILE / 2, '#c9694a', 8);
        sfx.brick();
      }
    }
  } else { e.tread = (e.tread || 0) + eSpeed; e.stuck = 0; }

  // башта дивиться по ходу корпусу — чесно, як у гравця
  e.turretAngle = DIR_ANGLE[e.dir];

  // стріляє за тими ж правилами, що й ти: тільки по ходу корпусу (конус ±20°),
  // тільки коли бачить. Ракетник — виняток: пускає самонавідні ракети
  e.cooldown -= dt;
  if (e.cooldown <= 0) {
    const range = battle.mod === 'fog' ? 280 : 460; // у тумані бачать гірше
    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    const angP = Math.atan2(player.y - e.y, player.x - e.x);
    const facing = DIR_ANGLE[e.dir];
    const diff = Math.abs(((angP - facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    // у кущах і за димогенератором дальність виявлення різко падає
    const hidden = tileAt(player.x, player.y) === T_BUSH ? 0.45 : 1;
    const visMult = hidden * (player.lowVis ? 0.5 : 1);
    const los = dist < range * visMult && hasLOS(e.x, e.y, player.x, player.y);

    // впритул конус ширший — в упор не промахуються
    const cone = dist < 120 ? 0.8 : 0.5;

    // токен вогню: вся ворожа армія стріляє не частіше разу на ~0.5с —
    // тиск є, але п'ятеро не розстрілюють хором (класика екшн-дизайну)
    const canFire = (battle.enemyShotCd || 0) <= 0;

    if (e.homing && los && canFire) {
      // ракетник: повільна самонавідна ракета — ухиляйся або збивай!
      e.turretAngle = angP;
      fireBullet(e, facing, 3.0, e.dmg, false);
      bullets[bullets.length - 1].homing = 'player';
      e.cooldown = e.fireCd + Math.random() * 600;
      battle.enemyShotCd = enemyFireGap();
    } else if (los && diff < cone && canFire) {
      e.turretAngle = angP;
      if (e.type === 'boss') bossSpreadShot(e); else shoot(e, false);
      e.cooldown = (e.fireCd + Math.random() * 400) * (e.rapid ? 0.55 : 1);
      battle.enemyShotCd = enemyFireGap();
    } else if (canFire && grid[battle.homeR] && grid[battle.homeR][battle.homeC] === T_HOME &&
               (() => {
                 const hx = battle.homeC * TILE + TILE / 2, hy = battle.homeR * TILE + TILE / 2;
                 const hd = Math.hypot(hx - e.x, hy - e.y);
                 if (hd > 200 || !hasLOS(e.x, e.y, hx, hy)) return false;
                 const a = Math.atan2(hy - e.y, hx - e.x);
                 const df = Math.abs(((a - facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
                 if (df > 0.6) { // довертається до бази
                   e.wantDir = Math.abs(hx - e.x) > Math.abs(hy - e.y) ? (hx > e.x ? 'right' : 'left') : (hy > e.y ? 'down' : 'up');
                   e.dir = e.wantDir; e.thinkTimer = 400; e.cooldown = 500;
                   return false;
                 }
                 e.turretAngle = a;
                 fireBullet(e, a, 3.6, e.dmg, false);
                 e.cooldown = e.fireCd + Math.random() * 300;
                 battle.enemyShotCd = enemyFireGap();
                 return true;
               })()) {
      // постріл по базі гравця вже зроблено
    } else if (los) {
      // бачить — розвертається корпусом на гравця по всій дальності огляду.
      // раніше доводив ствол лише ближче 300px, тож на середній дистанції
      // вороги просто каталися повз і не стріляли зовсім
      const ddx = player.x - e.x, ddy = player.y - e.y;
      e.wantDir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
      e.dir = e.wantDir;
      e.thinkTimer = 400;
      e.cooldown = 350; // час на доведення ствола: 700 мс з'їдало половину темпу вогню
    } else if (dist < range && battle.idle > 10000) {
      // анти-кемпінг: по нерухомому гравцю б'ють навісом через стіни
      if (!battle.arcWarned) {
        battle.arcWarned = true;
        floatText(player.x, player.y - 40, '⚠ Навідник засік тебе — РУХАЙСЯ!', '#c07eff');
      }
      const ang = Math.atan2(player.y - e.y, player.x - e.x) + (Math.random() - 0.5) * 0.2;
      e.turretAngle = ang;
      fireBullet(e, ang, 3.3, e.dmg, false, true);
      e.cooldown = e.fireCd * 1.5;
    } else if (canFire && dist < range * 1.3 && diff < 1.2) {
      // чистої лінії нема, але гравець попереду — б'є в його бік і розносить
      // цеглу на шляху. Без цього у щільному лабіринті вороги мовчать увесь бій
      shoot(e, false);
      e.cooldown = e.fireCd + Math.random() * 500;
      battle.enemyShotCd = enemyFireGap();
    } else {
      e.cooldown = 250;
    }
  }
}

// ---------- Кулі ----------
function updateBullets(dt) {
  const step = dt / 16.67;
  for (const b of bullets) {
    if (b.dead) continue;

    // самонавідні ракети: плавно довертають до цілі, живуть 4.5 с
    if (b.homing) {
      b.life = (b.life === undefined ? 4500 : b.life) - dt;
      if (b.life <= 0) { b.dead = true; spawnParticles(b.x, b.y, '#ffd23f', 6); continue; }
      let tx = null, ty = null;
      if (b.homing === 'player') { tx = player.x; ty = player.y; }
      else {
        let bd = 1e9;
        for (const e of enemies) {
          if (e.dead || e.spawning > 0) continue;
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < bd) { bd = d; tx = e.x; ty = e.y; }
        }
      }
      if (tx !== null) {
        const want = Math.atan2(ty - b.y, tx - b.x);
        const cur = Math.atan2(b.dy, b.dx);
        let d = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const maxTurn = 0.055 * step;
        const na = cur + Math.max(-maxTurn, Math.min(maxTurn, d));
        b.dx = Math.cos(na); b.dy = Math.sin(na);
      }
      if (Math.random() < 0.5) {
        particles.push({ x: b.x - b.dx * 8, y: b.y - b.dy * 8, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), life: 250, color: b.homing === 'player' ? '#ff9d3c' : '#7ef0ff' });
      }
    }

    b.x += b.dx * b.speed * step;
    b.y += b.dy * b.speed * step;
    if (b.x < 0 || b.y < 0 || b.x > W || b.y > H) { b.dead = true; continue; }

    const c = Math.floor(b.x / TILE), r = Math.floor(b.y / TILE);
    const t = b.over ? T_EMPTY : (grid[r] && grid[r][c]); // навісні летять над стінами
    if (t === T_FENCE) {
      b.dead = true;
      grid[r][c] = T_EMPTY;
      spawnParticles(b.x, b.y, '#a5814f', 8);
      sfx.brick();
      continue;
    }
    if (t === T_TURRET) {
      b.dead = true;
      if (b.fromPlayer) {
        gridHp[r][c] -= b.dmg;
        battle.dmgDealt += b.dmg;
        sfx.hit();
        spawnParticles(b.x, b.y, '#8a97ad', 6);
        if (gridHp[r][c] <= 0) destroyTurret(r, c);
      }
      continue;
    }
    if (t === T_BARREL) {
      b.dead = true;
      explodeBarrel(r, c);
      continue;
    }
    if (t === T_HOME) {
      b.dead = true;
      if (!b.fromPlayer) {
        gridHp[r][c] -= b.dmg;
        battle.homeHp = gridHp[r][c];
        sfx.hit();
        shakeTime = 200;
        spawnParticles(b.x, b.y, '#39ff88', 8);
        floatText(b.x, b.y - 20, '★ БАЗА!', '#ff4d5e');
        if (gridHp[r][c] <= 0) { destroyHome(r, c); return; }
      }
      continue;
    }
    if (t === T_HQ) {
      b.dead = true;
      if (b.fromPlayer && battle.hqSealed) {
        sfx.rico();
        spawnParticles(b.x, b.y, '#8a97ad', 6);
        if (!battle.sealWarned) {
          battle.sealWarned = true;
          floatText(b.x, b.y - 22, `🛡 ЩИТ! Виб'є ${battle.sealGoal} ворогів`, '#6fd3ff');
        }
        continue;
      }
      if (b.fromPlayer) {
        gridHp[r][c] -= b.dmg;
        battle.dmgDealt += b.dmg;
        battle.pts += b.dmg * PTS.hqDmg; battle.ptsTotal += b.dmg * PTS.hqDmg;
        sfx.hit();
        spawnParticles(b.x, b.y, '#ff4d5e', 6);
        if (gridHp[r][c] <= 0) destroyHQ(r, c);
      }
      continue;
    }
    if (t === T_BRICK || t === T_STEEL) {
      b.dead = true;
      if (t === T_BRICK) {
        // цегла міцніша: гравець зносить максимум по 3, вороги — по 1,
        // щоб карта не перетворювалась на голе поле
        // карта має лишатися картою: навіть фугасом стіну не знести з одного разу
        gridHp[r][c] -= b.fromPlayer ? Math.min(2, Math.max(1, b.dmg)) : 1;
        sfx.brick();
        spawnParticles(b.x, b.y, '#c9694a', 6);
        if (gridHp[r][c] <= 0) grid[r][c] = T_EMPTY;
      } else {
        // сталь незламна — постійні укриття мають лишатися до кінця бою
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
          battle.pts += b.dmg * PTS.dmg; battle.ptsTotal += b.dmg * PTS.dmg;
          if (player.cryo) e.slowT = 2000; // кріо-снаряди
          sfx.hit();
          spawnParticles(b.x, b.y, e.color, 5);
          // фугасні снаряди: вибух зачіпає ворогів поруч
          if (player.explosiveRounds || player.heat) {
            spawnParticles(b.x, b.y, '#ff9d3c', 10);
            for (const o of enemies) {
              if (o === e || o.dead || o.spawning > 0) continue;
              if (Math.hypot(o.x - b.x, o.y - b.y) < (player.unstable ? 85 : 55)) {
                o.hp -= b.dmg * 0.4;
                battle.dmgDealt += b.dmg * 0.4;
                if (o.hp <= 0) killEnemy(o);
              }
            }
          }
          if (player.unstable && Math.hypot(player.x - b.x, player.y - b.y) < 85) {
            player.hp = Math.max(1, player.hp - 1);
            floatText(player.x, player.y - 18, '💣-1', '#ff9d3c');
          }
          if (e.hp <= 0) killEnemy(e);
          break;
        }
      }
    } else if (battle.helper && !battle.helper.dead &&
               Math.abs(b.x - battle.helper.x) < battle.helper.size / 2 &&
               Math.abs(b.y - battle.helper.y) < battle.helper.size / 2) {
      b.dead = true;
      battle.helper.hp -= b.dmg;
      battle.helper.flash = 90;
      sfx.hit();
      spawnParticles(b.x, b.y, '#6fd3ff', 5);
      if (battle.helper.hp <= 0) {
        battle.helper.dead = true;
        spawnParticles(battle.helper.x, battle.helper.y, '#6fd3ff', 22);
        floatText(battle.helper.x, battle.helper.y - 22, '🤝 помічника знищено', '#ff4d5e');
        sfx.boom();
      }
    } else if (player.invuln <= 0 &&
               Math.abs(b.x - player.x) < player.size / 2 &&
               Math.abs(b.y - player.y) < player.size / 2) {
      b.dead = true;
      // РИКОШЕТ: шанс залежить від броні — фішка важких танків
      const ricoChance = Math.min(0.45, Math.max(0, player.armor) * 0.06);
      if (Math.random() < ricoChance) {
        battle.ricochets++;
        sfx.rico();
        floatText(player.x, player.y - 24, 'РИКОШЕТ!', '#ffd23f');
        spawnParticles(b.x, b.y, '#ffd23f', 4);
        // реактивна броня: снаряд летить назад у кривдника
        if (player.reflect) {
          bullets.push({
            x: b.x, y: b.y, dx: -b.dx, dy: -b.dy,
            speed: 6, dmg: Math.max(1, player.dmg * 0.6), fromPlayer: true,
          });
        }
      } else {
        const dmg = Math.max(1, Math.round((b.dmg - Math.max(0, player.armor) * 0.7) * (player.fragile || 1)));
        player.hp -= dmg;
        battle.dmgTaken += dmg;
        player.invuln = player.smoke ? 2000 : 600; // димова завіса подовжує невразливість
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

// ---------- Вибухові бочки та штаб ----------
function explodeBarrel(r, c) {
  if (grid[r][c] !== T_BARREL) return;
  grid[r][c] = T_EMPTY;
  const bx = c * TILE + TILE / 2, by = r * TILE + TILE / 2;
  sfx.boom();
  shakeTime = 300;
  spawnParticles(bx, by, '#ff9d3c', 26);
  spawnParticles(bx, by, '#ffd23f', 14);

  const R = 85;
  // шкода танкам в радіусі — і ворогам, і гравцю!
  for (const e of enemies) {
    if (e.dead || e.spawning > 0) continue;
    if (Math.hypot(e.x - bx, e.y - by) < R) {
      e.hp -= 6;
      battle.dmgDealt += 6;
      if (e.hp <= 0) killEnemy(e);
    }
  }
  if (Math.hypot(player.x - bx, player.y - by) < R && player.invuln <= 0) {
    const dmg = Math.max(1, Math.round((5 - Math.max(0, player.armor)) * (player.fragile || 1)));
    player.hp -= dmg;
    battle.dmgTaken += dmg;
    player.invuln = 600;
    floatText(player.x, player.y - 24, '-' + dmg, '#ff4d5e');
    if (player.hp <= 0) { endBattle(false); return; }
  }
  // руйнує сусідню цеглу і підриває сусідні бочки ланцюгом
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, cc = c + dc;
    if (!grid[rr]) continue;
    if (grid[rr][cc] === T_BRICK) grid[rr][cc] = T_EMPTY;
    else if (grid[rr][cc] === T_BARREL) explodeBarrel(rr, cc);
  }
}

function destroyTurret(r, c) {
  grid[r][c] = T_EMPTY;
  battle.turrets = battle.turrets.filter(t => !(t.r === r && t.c === c));
  const bx = c * TILE + TILE / 2, by = r * TILE + TILE / 2;
  sfx.boom();
  shakeTime = 250;
  spawnParticles(bx, by, '#8a97ad', 20);
  if (!(battle.mode === 'assault' && battle.frags > 30)) {
    battle.credits += 150;
    battle.xp += 25;
  }
  floatText(bx, by, 'ДОТ ЗНИЩЕНО! +150 🪙', '#ffd23f');
}

function updateTurrets(dt) {
  for (const t of battle.turrets) {
    const dist = Math.hypot(player.x - t.x, player.y - t.y);
    t.ang = Math.atan2(player.y - t.y, player.x - t.x);
    t.cd -= dt;
    if (t.cd <= 0 && (battle.enemyShotCd || 0) <= 0 && dist < 420 && hasLOS(t.x, t.y, player.x, player.y)) {
      const ang = t.ang + (Math.random() - 0.5) * 0.2;
      bullets.push({ x: t.x + Math.cos(ang) * 24, y: t.y + Math.sin(ang) * 24, dx: Math.cos(ang), dy: Math.sin(ang), speed: 3.8, dmg: 3, fromPlayer: false });
      sfx.shoot();
      t.cd = 1500 + Math.random() * 500;
      battle.enemyShotCd = enemyFireGap();
    }
  }
}

function destroyHome(r, c) {
  grid[r][c] = T_EMPTY;
  const bx = c * TILE + TILE / 2, by = r * TILE + TILE / 2;
  sfx.boom();
  shakeTime = 600;
  spawnParticles(bx, by, '#39ff88', 45);
  battle.homeLost = true;
  endBattle(false);
}

function destroyHQ(r, c) {
  grid[r][c] = T_EMPTY;
  const bx = c * TILE + TILE / 2, by = r * TILE + TILE / 2;
  sfx.boom();
  shakeTime = 500;
  spawnParticles(bx, by, '#ff4d5e', 40);
  battle.hqLeft--;
  battle.credits += 400;
  floatText(bx, by, '☭ ВОРОЖА БАЗА ЗНИЩЕНА! +400 🪙', '#ffd23f');
  if (battle.hqLeft <= 0) endBattle(true);
}

// ---------- Події бою ----------
function killEnemy(e) {
  e.dead = true;
  sfx.boom();
  shakeTime = e.type === 'boss' ? 500 : 120;
  spawnParticles(e.x, e.y, e.color, e.type === 'boss' ? 40 : 14);

  battle.frags++;
  battle.pts += PTS.frag; battle.ptsTotal += PTS.frag;
  // анти-ферма: у штурмі після 20 фрагів нагорода за фраги вичерпана
  const farmed = battle.mode === 'assault' && battle.frags > 30;
  if (!farmed) {
    const loot = Math.round(e.credits * (battle.lootMult || 1));
    battle.credits += loot;
    battle.xp += e.xpVal;
    floatText(e.x, e.y, `+${loot} 🪙`, '#ffd23f');
  } else {
    if (!battle.farmWarned) {
      battle.farmWarned = true;
      floatText(player.x, player.y - 40, 'Інтендант порожній — добий ШТАБ!', '#ff9d5c');
    }
    floatText(e.x, e.y, '+0 🪙', '#7a8aa8');
  }
  if (e.type === 'boss') battle.bossKilled = true;
  // трофейщик: фраги лікують
  if (player.vampire && player.hp > 0) {
    player.hp = Math.min(player.maxHp, player.hp + 2);
    floatText(player.x, player.y - 30, '+2 HP', '#39ff88');
  }

  const roll = Math.random();
  if (roll < 0.14) drops.push({ x: e.x, y: e.y, kind: 'med', ttl: 9000 });
  else if (roll < 0.18) drops.push({ x: e.x, y: e.y, kind: 'star', ttl: 9000 });
  else if (roll < 0.24) drops.push({ x: e.x, y: e.y, kind: 'freeze', ttl: 9000 });

  if (battle.hqSealed && battle.frags >= battle.sealGoal) {
    battle.hqSealed = false;
    battle.waveFlash = 2200;
    sfx.cash();
    shakeTime = 300;
    floatText(player.x, player.y - 46, '🛡 ЩИТ ШТАБУ ВПАВ — ПРОРИВ!', '#ffd23f');
  }
  if (battle.mode === 'clear' && spawnQueue.length === 0 && enemies.every(x => x.dead)) endBattle(true);
}

function endBattle(victory) {
  if (state === 'results') return;
  state = 'results';

  const mult = battle.tierMult * (battle.elite ? 1.7 : 1);
  // штурм заміряно вдвічі важчим за зачистку (7/24 проти 15/24 перемог,
  // 14 смертей проти 6) — нагорода має відповідати ціні входу
  const winBonus = victory ? Math.round((battle.mode === 'assault' ? 520 : 250) * battle.tank.tier) : 0;
  const creditsEarned = Math.round((battle.credits * mult + winBonus) * (1 + (battle.tank.radioBonus || 0) + frontBonus()));

  // звільнення сектора фронту
  let sectorMsg = '';
  const sec0 = battle.sector ? sectorById(battle.sector) : null;
  if (victory && sec0) {
    const sec = sec0;
    if (!save.front.liberated.includes(battle.sector)) {
      save.front.liberated.push(battle.sector);
      save.credits += sec.reward;
      sectorMsg = `🚩 СЕКТОР «${sec.name}» ЗВІЛЬНЕНО! +${fmt(sec.reward)} 🪙`;
    } else {
      sectorMsg = `🚩 Сектор «${sec.name}» утримано`;
    }
    if (sec.final) {
      save.front.level++;
      save.front.liberated = ['plazdarm'];
      sectorMsg = `🏆 ЦИТАДЕЛЬ ВПАЛА! ФРОНТ ${save.front.level - 1} ПРОРВАНО!<br>Відкрито Фронт ${save.front.level} — вороги значно зліші, нагороди більші.`;
    }
  }
  const xpEarned = Math.round((battle.xp + (victory ? 60 * battle.tank.tier : 0)) * mult);

  save.credits += creditsEarned;
  tankSave(save.current).xp += xpEarned;
  tankSave(save.current).crewXp += xpEarned;
  save.battles++;
  if (victory) save.wins++;
  save.totalFrags += battle.frags;
  persist();

  logEvent('battle_end', {
    tank: battle.tank.id, tier: battle.tank.tier, map: battle.mapName, mode: battle.mode,
    elite: battle.elite, victory, quit: !!battle.quit,
    sec: Math.round(battle.gameMs / 1000),
    frags: battle.frags, dmg: Math.round(battle.dmgDealt), taken: Math.round(battle.dmgTaken),
    rico: battle.ricochets, medUsed: !battle.medkit,
    hpLeft: Math.max(0, Math.round(player.hp / player.maxHp * 100)),
    perks: battle.perks.map(p => p.id),
    credits: creditsEarned, xp: xpEarned,
  });

  const medals = [];
  if (battle.frags >= 6) medals.push('🏅 «Мисливець» — 6+ фрагів');
  if (battle.ricochets >= 3) medals.push('🛡 «Сталева стіна» — 3+ рикошети');
  if (victory && player.hp / player.maxHp > 0.6) medals.push('⚔ «Домінатор» — перемога з запасом HP');
  if (battle.bossKilled) medals.push('💀 «Генераловбивця» — знищено боса!');

  document.getElementById('resultTitle').textContent = victory ? '🏆 ПЕРЕМОГА!'
    : battle.homeLost ? '★ БАЗУ ВТРАЧЕНО' : battle.timeUp ? '⏱ ЧАС ВИЙШОВ' : '💥 ТАНК ЗНИЩЕНО';
  document.getElementById('resultTitle').style.color = victory ? '#ffd23f' : '#ff4d5e';
  document.getElementById('resultTable').innerHTML = `
    <tr><td>Карта</td><td>${battle.mapName}${battle.elite ? ' ☠ (елітний ×2)' : ''}</td></tr>
    <tr><td>Фраги</td><td>${battle.frags}${battle.mode === 'clear' ? ' / ' + battle.totalEnemies : ''}</td></tr>
    <tr><td>Завдано урону</td><td>${Math.round(battle.dmgDealt)}</td></tr>
    <tr><td>Рикошети</td><td>${battle.ricochets}</td></tr>
    <tr><td>Срібло</td><td>+${creditsEarned} 🪙</td></tr>
    <tr><td>Досвід танка</td><td>+${xpEarned} ⭐</td></tr>`;
  document.getElementById('medals').innerHTML =
    (sectorMsg ? `<div style="color:var(--neon);margin-bottom:6px">${sectorMsg}</div>` : '') + medals.join('<br>');
  document.getElementById('resultOverlay').classList.remove('hidden');
  if (victory) sfx.cash(); else sfx.boom();
}

function toHangar() {
  document.body.classList.remove('inBattle');
  document.getElementById('battleView').classList.add('hidden');
  // із секторного бою повертаємось на фронтову мапу, з вільного — в ангар
  if (battle && battle.sector) { showFront(); return; }
  state = 'hangar';
  document.getElementById('hangarView').classList.remove('hidden');
  renderHangar();
}

// ---------- Фронтова мапа (екран) ----------
function showFront() {
  state = 'front';
  document.body.classList.remove('inBattle');
  document.getElementById('battleView').classList.add('hidden');
  document.getElementById('hangarView').classList.add('hidden');
  document.getElementById('frontView').classList.remove('hidden');
  renderFront();
}

function frontToHangar() {
  state = 'hangar';
  document.getElementById('frontView').classList.add('hidden');
  document.getElementById('hangarView').classList.remove('hidden');
  renderHangar();
}

function sectorState(s) {
  const lib = save.front.liberated;
  if (lib.includes(s.id)) return 'lib';
  const reachable = FRONT_SECTORS.some(o => lib.includes(o.id) && o.links.includes(s.id));
  return reachable ? 'atk' : 'lock';
}

function renderFront() {
  document.getElementById('frontLvl').textContent = 'ФРОНТ ' + 'I'.repeat(Math.min(5, save.front.level)) + (save.front.level > 5 ? '+' + (save.front.level - 5) : '');
  document.getElementById('frontProg').textContent = `${save.front.liberated.length - 1}/${FRONT_SECTORS.length - 1}`;
  document.getElementById('frontBonusUi').textContent = '+' + Math.round(frontBonus() * 100) + '% срібла';

  // з'єднання
  const svg = document.getElementById('frontEdges');
  let lines = '';
  for (const s of FRONT_SECTORS) {
    for (const to of s.links) {
      const t = sectorById(to);
      const active = save.front.liberated.includes(s.id);
      lines += `<line x1="${s.x}%" y1="${s.y}%" x2="${t.x}%" y2="${t.y}%" stroke="${active ? '#39ff8866' : '#263149'}" stroke-width="2" stroke-dasharray="${active ? '' : '5,5'}"/>`;
    }
  }
  svg.innerHTML = lines;

  // сектори
  const box = document.getElementById('frontMap');
  for (const el of box.querySelectorAll('.sector')) el.remove();
  for (const s of FRONT_SECTORS) {
    const st = sectorState(s);
    const div = document.createElement('div');
    div.className = 'sector ' + st;
    div.style.left = s.x + '%';
    div.style.top = s.y + '%';
    const modStr = s.mod ? MOD_INFO[s.mod].ico + ' ' + MOD_INFO[s.mod].name : '';
    const modeStr = s.base ? '' : (s.mode === 'assault' ? '☭ штурм' : '⚔ зачистка') + (s.boss ? ' · ☠ БОС' : '');
    div.innerHTML = `
      <div class="sn">${st === 'lib' ? '✅ ' : st === 'lock' ? '🔒 ' : '⚔ '}${s.name}</div>
      ${modeStr ? `<div class="sm">${modeStr}</div>` : '<div class="sm">твій тил</div>'}
      ${modStr ? `<div class="sm">${modStr}</div>` : ''}
      ${st === 'atk' ? `<div class="sr">🪙 +${fmt(s.reward)}</div>` : ''}`;
    if (st === 'atk') div.onclick = () => startBattle(s);
    box.appendChild(div);
  }

  document.getElementById('eliteBanner2').classList.toggle('hidden', (save.battles + 1) % 5 !== 0);
}

// ---------- Тактичні переваги ----------
function openPerkMenu() {
  if (state === 'perk') return;
  showPerkCards();
}
const RAR_LABEL = { common: 'ПОЛЬОВА', rare: 'ТАКТИЧНА', epic: '★ ЕПІЧНА ★' };

function showPerkCards() {
  state = 'perk';
  // епічні доступні лише в елітних боях і кожна — один раз
  const taken = battle.perks.map(p => p.id);
  const pool = PERKS.filter(u => !(u.unique && taken.includes(u.id)))
    .filter(u => u.rar !== 'epic' || battle.elite);
  const commons = pool.filter(u => u.rar === 'common').sort(() => Math.random() - 0.5);
  const rares = pool.filter(u => u.rar === 'rare').sort(() => Math.random() - 0.5);
  const epics = pool.filter(u => u.rar === 'epic').sort(() => Math.random() - 0.5);

  const picks = [];
  if (battle.elite && epics.length) picks.push(epics[0]); // еліта завжди пропонує епік
  picks.push(...rares.slice(0, 2 - (picks.length ? 1 : 0)));
  while (picks.length < 3 && commons.length) picks.push(commons.shift());
  while (picks.length < 3 && rares.length) {
    const extra = rares.find(u => !picks.includes(u));
    if (!extra) break;
    picks.push(extra);
  }

  const box = document.getElementById('cards');
  box.innerHTML = '';
  picks.forEach((u, i) => {
    const div = document.createElement('div');
    div.className = 'card ' + u.rar;
    const tag = RAR_LABEL[u.rar] ? `<div class="rar">${RAR_LABEL[u.rar]}</div>` : '';
    div.innerHTML = `${tag}<div class="ico">${u.ico}</div><div class="nm">${u.name}</div><div class="ds">${u.desc}</div><div class="key">[${i + 1}]</div>`;
    div.onclick = () => pickPerk(u);
    box.appendChild(div);
  });
  window._perkPicks = picks;
  document.getElementById('perkOverlay').classList.remove('hidden');
}
function pickPerk(u) {
  u.apply(player);
  battle.perks.push(u);
  logEvent('perk', { id: u.id, rar: u.rar, offered: (window._perkPicks || []).map(p => p.id) });
  sfx.pickup();
  pendingPerks--;
  if (pendingPerks > 0) { showPerkCards(); return; }
  document.getElementById('perkOverlay').classList.add('hidden');
  floatText(player.x, player.y - 34, u.ico + ' ' + u.name.toUpperCase() + '!', '#ffd23f');
  state = 'play';
  player.invuln = Math.max(player.invuln, 700);
  lastTime = performance.now();
}

// ---------- Модифікатори секторів ----------
function modExplosion(x, y, R, dmgP, dmgE) {
  sfx.boom();
  shakeTime = 250;
  spawnParticles(x, y, '#ff9d3c', 22);
  for (const e of enemies) {
    if (e.dead || e.spawning > 0) continue;
    if (Math.hypot(e.x - x, e.y - y) < R) {
      e.hp -= dmgE;
      battle.dmgDealt += dmgE;
      if (e.hp <= 0) killEnemy(e);
    }
  }
  if (Math.hypot(player.x - x, player.y - y) < R && player.invuln <= 0) {
    const dmg = Math.max(1, Math.round((dmgP - Math.max(0, player.armor)) * (player.fragile || 1)));
    player.hp -= dmg;
    battle.dmgTaken += dmg;
    player.invuln = 600;
    floatText(player.x, player.y - 24, '-' + dmg, '#ff4d5e');
    if (player.hp <= 0) endBattle(false);
  }
}

function updateModifiers(dt) {
  // міни: спрацьовують і на гравцеві, і на ворогах
  if (battle.mines.length) {
    for (const m of battle.mines) {
      if (Math.hypot(m.x - player.x, m.y - player.y) < 22) { m.dead = true; modExplosion(m.x, m.y, 70, 5, 8); }
      else {
        for (const e of enemies) {
          if (e.dead || e.spawning > 0) continue;
          if (Math.hypot(m.x - e.x, m.y - e.y) < 22) { m.dead = true; modExplosion(m.x, m.y, 70, 5, 8); break; }
        }
      }
      if (state !== 'play') return;
    }
    battle.mines = battle.mines.filter(m => !m.dead);
  }

  // артобстріл: мітка попереджає, потім вибух
  if (battle.mod === 'artillery') {
    battle.artT -= dt;
    if (battle.artT <= 0) {
      battle.artT = 3200 + Math.random() * 2600;
      battle.strikes.push({
        x: Math.max(30, Math.min(W - 30, player.x + (Math.random() - 0.5) * 300)),
        y: Math.max(30, Math.min(H - 30, player.y + (Math.random() - 0.5) * 300)),
        t: 1400,
      });
    }
  }
  for (const s of battle.strikes) {
    s.t -= dt;
    if (s.t <= 0) { s.dead = true; modExplosion(s.x, s.y, 78, 5, 9); if (state !== 'play') return; }
  }
  battle.strikes = battle.strikes.filter(s => !s.dead);

  // мороз: сніжинки
  if (battle.mod === 'frost' && Math.random() < 0.25) {
    particles.push({ x: Math.random() * W, y: -5, vx: (Math.random() - 0.5) * 0.4, vy: 0.7 + Math.random() * 0.5, life: 4000, color: 'rgba(220,235,255,.7)' });
  }
}

// ---------- Ящик постачання: за нього треба доїхати під вогнем ----------
// Трофеї на карті: заїдь — і на 25 с отримуєш зброю, якої в тебе нема.
// Це «більше таких речей» — сила, яку знаходиш і мусиш дійти, а не отримуєш даром.
// ============================================================
//  25 ТРОФЕЙНИХ КОРОБОК
//  plus     — чистий бонус, брати завжди безпечно
//  tradeoff — сила за ціну; числа навмисно більші, інакше їх не братимуть
//  enemy    — чи має сенс для ворога (мародер чи ремонт бази — не має)
//  Правила безпеки: мінус НІКОЛИ не вбиває (клемп на 1 HP),
//  одночасно не більше MAX_BUFFS активних.
// ============================================================
const MAX_BUFFS = 3;

const CRATES = {
  // ---------- ЗБРОЯ (чистий плюс) ----------
  twin:    { ico: '🔫', name: 'ДРУГИЙ СТВОЛ',    kind: 'plus', rar: 1, ms: 25000, enemy: true,  desc: 'два снаряди віялом',
             on: t => t.twin = true,  off: t => t.twin = false },
  homing:  { ico: '🛰', name: 'САМОНАВЕДЕННЯ',   kind: 'plus', rar: 2, ms: 20000, enemy: true,  desc: 'снаряди довертають до цілі',
             on: t => t.homes = true, off: t => t.homes = false },
  heat:    { ico: '☄', name: 'ФУГАСИ',          kind: 'plus', rar: 2, ms: 20000, enemy: true,  desc: 'влучання вибухає по площі',
             on: t => t.heat = true,  off: t => t.heat = false },
  rapid:   { ico: '⚡', name: 'АВТОЗАРЯДЖАННЯ',  kind: 'plus', rar: 1, ms: 18000, enemy: true,  desc: 'перезарядка вдвічі швидша',
             on: t => t.rapid = true, off: t => t.rapid = false },
  ap:      { ico: '🎯', name: 'БРОНЕБІЙНІ',      kind: 'plus', rar: 1, ms: 18000, enemy: true,  desc: '+60% урону',
             on: t => t.dmg *= 1.6,   off: t => t.dmg /= 1.6 },
  cryo:    { ico: '🧊', name: 'КРІО-СНАРЯДИ',    kind: 'plus', rar: 1, ms: 20000, enemy: false, desc: 'влучання сповільнює ворога',
             on: t => t.cryo = true,  off: t => t.cryo = false },
  // ---------- ЗАХИСТ ----------
  plates:  { ico: '🛡', name: 'ДИНАМІЧНИЙ ЗАХИСТ', kind: 'plus', rar: 1, ms: 22000, enemy: true, desc: '+2 броні, більше рикошетів',
             on: t => t.armor += 2,   off: t => t.armor = Math.max(0, t.armor - 2) },
  repair:  { ico: '❤️', name: 'РЕМКОМПЛЕКТ',     kind: 'plus', rar: 1, instant: true, enemy: true, desc: '+40% міцності одразу',
             on: t => t.hp = Math.min(t.maxHp, t.hp + Math.ceil(t.maxHp * 0.4)) },
  engineer:{ ico: '🧱', name: 'ІНЖЕНЕРНИЙ НАБІР', kind: 'plus', rar: 2, instant: true, enemy: false, desc: 'відбудовує мур навколо твоєї бази ★',
             on: () => rebuildHomeWall() },
  // ---------- МОБІЛЬНІСТЬ ----------
  nitro:   { ico: '🚀', name: 'ФОРСАЖ',          kind: 'plus', rar: 1, ms: 20000, enemy: true,  desc: '+35% швидкості',
             on: t => t.speed *= 1.35, off: t => t.speed /= 1.35 },
  ghost:   { ico: '💨', name: 'ДИМОГЕНЕРАТОР',   kind: 'plus', rar: 2, ms: 16000, enemy: false, desc: 'вороги бачать тебе вдвічі гірше',
             on: t => t.lowVis = true, off: t => t.lowVis = false },
  // ---------- ТАКТИКА ----------
  xray:    { ico: '🕵', name: 'РОЗВІДКА',        kind: 'plus', rar: 2, ms: 25000, enemy: false, desc: 'бачиш ворогів крізь стіни й туман',
             on: () => battle.xray = true, off: () => battle.xray = false },
  freeze:  { ico: '❄️', name: 'ЗАМОРОЗКА',       kind: 'plus', rar: 2, instant: true, enemy: false, desc: 'усі вороги завмирають на 4 с',
             on: () => { freezeTimer = 4000; } },
  loot:    { ico: '💰', name: 'МАРОДЕР',         kind: 'plus', rar: 1, instant: true, enemy: false, desc: '+80% срібла за фраги до кінця бою',
             on: () => { battle.lootMult = (battle.lootMult || 1) * 1.8; } },
  // ---------- ПЛЮС-МІНУС ----------
  assault: { ico: '⚔', name: 'ШТУРМОВИЙ ЗАРЯД', kind: 'tradeoff', rar: 2, ms: 20000, enemy: true, desc: '×2 урону, але одразу −35% міцності',
             on: t => { t.dmg *= 2; t.hp = Math.max(1, t.hp - Math.floor(t.maxHp * 0.35)); }, off: t => t.dmg /= 2 },
  light:   { ico: '🏎', name: 'ПОЛЕГШЕНИЙ КОРПУС', kind: 'tradeoff', rar: 1, ms: 22000, enemy: true, desc: '+50% швидкості, але −2 броні',
             on: t => { t.speed *= 1.5; t.armorCut = Math.min(2, t.armor); t.armor -= t.armorCut; },
             off: t => { t.speed /= 1.5; t.armor += t.armorCut || 0; t.armorCut = 0; } },
  concrete:{ ico: '🐌', name: 'БЕТОННІ ГУСЕНИЦІ', kind: 'tradeoff', rar: 1, ms: 22000, enemy: true, desc: '+4 броні, але −40% швидкості',
             on: t => { t.armor += 4; t.speed *= 0.6; }, off: t => { t.armor = Math.max(0, t.armor - 4); t.speed /= 0.6; } },
  overheat:{ ico: '🔥', name: 'ПЕРЕГРІВ СТВОЛА', kind: 'tradeoff', rar: 2, ms: 16000, enemy: false, desc: 'перезарядка ×0.35, але кожен постріл б\'є тебе на 1',
             on: t => t.overheat = true, off: t => t.overheat = false },
  unstable:{ ico: '💣', name: 'НЕСТАБІЛЬНІ БК',  kind: 'tradeoff', rar: 2, ms: 18000, enemy: false, desc: 'величезні фугаси, але вибух ранить і тебе',
             on: t => { t.heat = true; t.unstable = true; }, off: t => { t.heat = false; t.unstable = false; } },
  vampire: { ico: '🩸', name: 'ВАМПІР',          kind: 'tradeoff', rar: 2, ms: 24000, enemy: false, desc: 'фраг лікує 4 HP, але ти отримуєш +30% урону',
             on: t => { t.vampire = true; t.fragile = 1.3; }, off: t => { t.vampire = false; t.fragile = 1; } },
  sniper:  { ico: '👁', name: 'СНАЙПЕРСЬКИЙ РЕЖИМ', kind: 'tradeoff', rar: 2, ms: 20000, enemy: false, desc: 'снаряд удвічі швидший і б\'є далі, але −45% швидкості',
             on: t => { t.bulletSpeed *= 2; t.speed *= 0.55; }, off: t => { t.bulletSpeed /= 2; t.speed /= 0.55; } },
  berserk: { ico: '😤', name: 'БЕРСЕРК',         kind: 'tradeoff', rar: 3, ms: 18000, enemy: false, desc: 'чим менше HP, тим більший урон — до ×2.5',
             on: t => t.berserk = true, off: t => t.berserk = false },
  lottery: { ico: '🎲', name: 'ЛОТЕРЕЯ',         kind: 'tradeoff', rar: 3, instant: true, enemy: false, desc: 'випадковий трофей — може бути будь-який',
             on: t => {
               const pool = CRATE_KEYS.filter(k => k !== 'lottery' && k !== 'reactor');
               applyCrate(t, pool[Math.floor(Math.random() * pool.length)], true);
             } },
  helper:  { ico: '🤝', name: 'ПОМІЧНИК',         kind: 'plus', rar: 3, instant: true, enemy: false, desc: 'дружній танк приєднується до бою до кінця раунду',
             on: () => spawnHelper() },
  reactor: { ico: '☢', name: 'РЕАКТОР',          kind: 'tradeoff', rar: 3, instant: true, enemy: false, desc: 'подвоює час усіх активних трофеїв, але забирає аптечку',
             on: t => {
               (t.buffs || []).forEach(b => b.left *= 2);
               if (t === player) battle.medkit = false;
             } },
};
const CRATE_KEYS = Object.keys(CRATES);
// ваги: рідкісні трапляються рідше, але саме вони найсоковитіші
const CRATE_WEIGHT = { 1: 5, 2: 3, 3: 1 };

// ---------- Рушій трофеїв ----------
function applyCrate(t, id, silent) {
  const def = CRATES[id];
  if (!def) return;
  if (!t.buffs) t.buffs = [];
  if (def.instant) { def.on(t); if (!silent) floatText(t.x, t.y - 30, `${def.ico} ${def.name}!`, '#ffd23f'); return; }
  const same = t.buffs.find(b => b.id === id);
  if (same) { same.left = Math.max(same.left, def.ms); return; }
  // більше MAX_BUFFS не тримаємо: інакше комбінації нікому не перевірити
  while (t.buffs.length >= MAX_BUFFS) removeBuff(t, t.buffs[0].id);
  t.buffs.push({ id, left: def.ms });
  def.on(t);
  if (t.hp !== undefined) t.hp = Math.max(1, t.hp); // мінус не має вбивати
  if (!silent) floatText(t.x, t.y - 30, `${def.ico} ${def.name}!`, def.kind === 'tradeoff' ? '#c07eff' : '#ffd23f');
}

function removeBuff(t, id) {
  const i = (t.buffs || []).findIndex(b => b.id === id);
  if (i < 0) return;
  t.buffs.splice(i, 1);
  const def = CRATES[id];
  if (def && def.off) def.off(t);
}

function updateBuffs(t, dt) {
  if (!t.buffs || !t.buffs.length) return;
  for (const b of t.buffs.slice()) {
    b.left -= dt;
    if (b.left <= 0) removeBuff(t, b.id);
  }
  t.buffIco = t.buffs.length ? CRATES[t.buffs[t.buffs.length - 1].id].ico : null;
}

function rollCrate(forEnemyToo) {
  const pool = [];
  for (const k of CRATE_KEYS) {
    if (forEnemyToo && !CRATES[k].enemy) continue;
    const w = CRATE_WEIGHT[CRATES[k].rar] || 1;
    for (let i = 0; i < w; i++) pool.push(k);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function dropGunEmplacements(n) {
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const spot = findOpenSpot(150, 520);
    if (!spot) continue;
    let kind = rollCrate();
    for (let tries = 0; used.has(kind) && tries < 12; tries++) kind = rollCrate();
    used.add(kind);
    drops.push({ x: spot.x, y: spot.y, kind, ttl: BATTLE_LIMIT_MS });
    if (save.codex && !save.codex.includes(kind)) { save.codex.push(kind); persist(); }
  }
}

// інженерний набір: відбудовує П-подібний мур навколо твоєї бази
function rebuildHomeWall() {
  const r0 = battle.homeR, c0 = battle.homeC;
  if (r0 === undefined) return;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === -1 || (dr === 0 && dc === 0)) continue;
    const rr = r0 + dr, cc = c0 + dc;
    if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (grid[rr][cc] === T_EMPTY || grid[rr][cc] === T_SAND || grid[rr][cc] === T_ICE) {
      grid[rr][cc] = T_BRICK; gridHp[rr][cc] = 6;
      spawnParticles(cc * TILE + TILE / 2, rr * TILE + TILE / 2, '#c9694a', 6);
    }
  }
}

// вільна клітина не в глухому куті і на цікавій відстані від гравця
function findOpenSpot(minD, maxD) {
  let best = null, bestScore = -1;
  for (let i = 0; i < 60; i++) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 2));
    const c = Math.floor(Math.random() * COLS);
    if (grid[r][c] !== T_EMPTY && grid[r][c] !== T_SAND && grid[r][c] !== T_ICE) continue;
    let open = 0;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
      const t = grid[rr][cc];
      if (t === T_EMPTY || t === T_SAND || t === T_ICE || t === T_BUSH) open++;
    }
    if (open < 2) continue;
    const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
    if (drops.some(d => Math.hypot(d.x - x, d.y - y) < 90)) continue;
    const d = Math.hypot(x - player.x, y - player.y);
    const score = d > minD && d < maxD ? d : -1;
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  return best;
}

function dropSupplyCrate() {
  let best = null, bestScore = -1;
  for (let i = 0; i < 60; i++) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 2));
    const c = Math.floor(Math.random() * COLS);
    if (grid[r][c] !== T_EMPTY && grid[r][c] !== T_SAND && grid[r][c] !== T_ICE) continue;
    // має бути хоча б два вільні сусіди — інакше це глухий кут
    let open = 0;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
      const t = grid[rr][cc];
      if (t === T_EMPTY || t === T_SAND || t === T_ICE || t === T_BUSH) open++;
    }
    if (open < 2) continue;
    const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
    const d = Math.hypot(x - player.x, y - player.y);
    // не під носом і не на іншому кінці карти — цікава дистанція
    const score = d > 110 && d < 420 ? d : -1;
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  if (!best) best = { x: W / 2, y: H / 2 };
  drops.push({ x: best.x, y: best.y, kind: 'crate', ttl: 30000 });
  sfx.perk();
  floatText(best.x, best.y - 26, '📦 ПОСТАЧАННЯ!', '#ffd23f');
}

// ---------- Аптечка (одна на бій, клавіша E) ----------
function useMedkit() {
  if (state !== 'play' || !battle.medkit || player.hp >= player.maxHp) return;
  battle.medkit = false;
  player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp / 2));
  sfx.pickup();
  floatText(player.x, player.y - 30, '🔧 РЕМОНТ +50%', '#39ff88');
}


// ---------- ПОМІЧНИК: дружній бот-танк ----------
// Баланс: 60% твоїх HP, 70% урону, без рикошету, живе до кінця раунду,
// одночасно лише ОДИН. Він тисне і відтягує вогонь, але не виграє бій за тебе.
function spawnHelper() {
  if (battle.helper && !battle.helper.dead) { battle.helper.hp = battle.helper.maxHp; return; }
  const spot = findOpenSpot(60, 220) || { x: player.x, y: player.y - TILE };
  const hp = Math.max(6, Math.round(player.maxHp * 0.6));
  const h = {
    x: spot.x, y: spot.y, size: 32, dir: 'up', turretAngle: -Math.PI / 2,
    hp, maxHp: hp, dmg: player.dmg * 0.7, speed: player.speed * 0.95,
    fireCd: Math.round(player.fireCd * 1.3), cooldown: 600, thinkTimer: 0,
    ally: true, dead: false, spawning: 0, tread: 0, flash: 0, cls: 'СТ',
  };
  battle.helper = h;
  floatText(h.x, h.y - 26, '🤝 ПОМІЧНИК У БОЮ!', '#39ff88');
  sfx.cash();
}

function updateHelper(dt) {
  const h = battle.helper;
  if (!h || h.dead) return;
  if (h.flash > 0) h.flash -= dt;
  h.thinkTimer -= dt;
  // ціль — найближчий живий ворог
  let tgt = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead || e.spawning > 0) continue;
    const d = Math.hypot(e.x - h.x, e.y - h.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  if (h.thinkTimer <= 0) {
    h.thinkTimer = 320 + Math.random() * 500;
    const tx = tgt ? tgt.x : player.x, ty = tgt ? tgt.y : player.y;
    const dx = tx - h.x, dy = ty - h.y;
    h.wantDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  if (!moveTank(h, h.wantDir || 'up', h.speed * (battle.speedMult || 1))) h.thinkTimer = 0;
  else h.tread += h.speed;
  h.turretAngle = DIR_ANGLE[h.dir];
  h.cooldown -= dt;
  if (tgt && bd < 460 && h.cooldown <= 0) {
    const ang = Math.atan2(tgt.y - h.y, tgt.x - h.x);
    const diff = Math.abs(((ang - DIR_ANGLE[h.dir] + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const clear = hasLOS(h.x, h.y, tgt.x, tgt.y);
    // б'є, коли ворог у секторі: чисту лінію в лабіринті чекати марно —
    // без цього помічник просто катався й не стріляв жодного разу
    if (diff < (clear ? 0.7 : 0.5)) {
      h.turretAngle = clear ? ang : DIR_ANGLE[h.dir];
      fireBullet(h, h.turretAngle, 6, h.dmg, true);
      h.cooldown = h.fireCd;
    }
  }
}

// ---------- Дропи, частинки ----------
function updateDrops(dt) {
  for (const d of drops) {
    d.ttl -= dt;
    if (d.ttl <= 0) {
      d.dead = true;
      if (d.kind === 'crate') { battle.crateOut = false; battle.pts += SUPPLY_COST * 0.6; }
      continue;
    }
    // ворог теж бігає за трофеями — хто перший, того й сила
    for (const e of enemies) {
      if (e.dead || e.spawning > 0) continue;
      if (Math.abs(d.x - e.x) > 26 || Math.abs(d.y - e.y) > 26) continue;
      d.dead = true;
      if (CRATES[d.kind]) {
        if (CRATES[d.kind].enemy) {
          applyCrate(e, d.kind, true);
          e.buffIco = CRATES[d.kind].ico;
          floatText(d.x, d.y, `${CRATES[d.kind].ico} ВОРОГ ЗАБРАВ!`, '#ff4d5e');
        } else {
          floatText(d.x, d.y, '💥 ворог знищив трофей', '#ff9d5c');
        }
      } else if (d.kind === 'med') {
        e.hp = Math.min(e.maxHp, e.hp + Math.ceil(e.maxHp * 0.35));
        floatText(d.x, d.y, '💊 ворог полікувався', '#ff9d5c');
      } else if (d.kind === 'crate') {
        battle.crateOut = false;
        floatText(d.x, d.y, '📦 ПОСТАЧАННЯ ВТРАЧЕНО!', '#ff4d5e');
      } else {
        floatText(d.x, d.y, 'ворог забрав', '#ff9d5c');
      }
      sfx.pickup();
      break;
    }
    if (d.dead) continue;

    if (Math.abs(d.x - player.x) < 28 && Math.abs(d.y - player.y) < 28) {
      d.dead = true;
      sfx.pickup();
      if (d.kind === 'med') { player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.3)); floatText(d.x, d.y, '+HP', '#ff8c69'); }
      else if (d.kind === 'star') { battle.credits += 120; floatText(d.x, d.y, '+120 🪙', '#ffd23f'); }
      else if (d.kind === 'freeze') { freezeTimer = 4000; floatText(d.x, d.y, 'ЗАМОРОЗКА!', '#6fd3ff'); }
      else if (CRATES[d.kind]) { sfx.perk(); applyCrate(player, d.kind); }
      else if (d.kind === 'crate') {
        battle.crateOut = false;
        pendingPerks++;
        sfx.perk();
        // ящик треба прибрати ДО виходу з функції: інакше фільтр наприкінці
        // не виконається, мертвий ящик лишиться в масиві і підбереться знову
        drops = drops.filter(x => !x.dead);
        openPerkMenu();
        return;
      }
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
  updateBuffs(player, dt);
  if (player.flash > 0) player.flash -= dt;
  player.cooldown -= dt;
  let dir = null;
  if (keys.up) dir = 'up';
  else if (keys.down) dir = 'down';
  else if (keys.left) dir = 'left';
  else if (keys.right) dir = 'right';
  // інерція: танк набирає хід поступово, важкі — повільніше
  if (dir) { player.accelMs = Math.min(600, player.accelMs + dt); battle.idle = 0; }
  else { player.accelMs = 0; battle.idle += dt; }
  const accel = 0.35 + 0.65 * Math.min(1, player.accelMs / player.ramp);

  // пісок сповільнює наполовину, мороз — усіх на 20%
  const sandMult = tileAt(player.x, player.y) === T_SAND ? 0.7 : 1;
  const dist = player.speed * sandMult * accel * (battle.speedMult || 1) * dt / 16.67;
  const onIce = tileAt(player.x, player.y) === T_ICE;
  if (dir && moveTank(player, dir, dist)) {
    player.tread = (player.tread || 0) + dist;
    player.glide = onIce ? dist : 0;
  } else if (!dir && onIce && player.glide > 0.06) {
    // лід: танк ковзає за інерцією
    moveTank(player, player.dir, player.glide);
    player.glide *= 0.955;
  } else if (!dir) {
    player.glide = 0;
  }

  // куди дивиться корпус — туди й стріляємо; м'яке доведення ±20° прощає дрібні промахи
  // (на тачі — автоприціл, бо там нема точного керування)
  player.turretAngle = keys.fire && touchMode
    ? autoAngle()
    : coneAssist(DIR_ANGLE[player.dir]);

  if (keys.fire && player.cooldown <= 0) {
    shoot(player, true);
    player.cooldown = player.fireCd * (player.overheat ? 0.35 : player.rapid ? 0.5 : 1);
    // перегрів ствола: платиш здоров'ям за темп, але ніколи не вмираєш від цього
    if (player.overheat) { player.hp = Math.max(1, player.hp - 1); floatText(player.x, player.y - 18, '🔥-1', '#ff9d3c'); }
  }

  // таран: корпус б'є ворогів при зіткненні
  if (player.ram) {
    player.ramCd = (player.ramCd || 0) - dt;
    if (player.ramCd <= 0) {
      for (const e of enemies) {
        if (e.dead || e.spawning > 0) continue;
        if (Math.abs(e.x - player.x) < (e.size + player.size) / 2 + 5 &&
            Math.abs(e.y - player.y) < (e.size + player.size) / 2 + 5) {
          e.hp -= 10;
          battle.dmgDealt += 10;
          player.ramCd = 1000;
          shakeTime = 150;
          sfx.boom();
          spawnParticles((e.x + player.x) / 2, (e.y + player.y) / 2, '#ffd23f', 10);
          floatText(e.x, e.y - 20, '🥊 ТАРАН!', '#ff9d5c');
          if (player.unstable && Math.hypot(player.x - b.x, player.y - b.y) < 85) {
            player.hp = Math.max(1, player.hp - 1);
            floatText(player.x, player.y - 18, '💣-1', '#ff9d3c');
          }
          if (e.hp <= 0) killEnemy(e);
          break;
        }
      }
    }
  }
}

// доведення в конусі: якщо в межах ±20° від обраного напрямку є видимий ворог —
// ствол чіпляється за нього; якщо ні — стріляємо рівно куди натиснуто
function coneAssist(base) {
  let best = base, bestDiff = 0.35;
  const maxDist = battle.mod === 'fog' ? 300 : 500;
  const consider = (x, y, size) => {
    const d = Math.hypot(x - player.x, y - player.y);
    if (d > maxDist) return;
    const ang = Math.atan2(y - player.y, x - player.x);
    const diff = Math.abs(((ang - base + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    // впритул конус у 20° — це лише 12 px убік, а корпуси торкаються аж до 33 px:
    // ворог, у який ти впираєшся бортом, має бути в межах доводки
    const halfW = (player.size + (size || 34)) / 2;
    const limit = d > 1 ? Math.max(bestDiff, Math.min(0.9, Math.asin(Math.min(1, halfW / d)))) : bestDiff;
    if (diff < limit && diff < bestDiff + 0.55 && hasLOS(player.x, player.y, x, y)) { bestDiff = Math.min(bestDiff, diff); best = ang; }
  };
  for (const e of enemies) if (!e.dead && !(e.spawning > 0)) consider(e.x, e.y, e.size);
  if (battle.mode === 'assault') {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      if (grid[r][c] === T_HQ) consider(c * TILE + TILE / 2, r * TILE + TILE / 2, TILE);
  }
  return best;
}

function autoAngle() {
  const t = nearestTarget();
  return t ? Math.atan2(t.y - player.y, t.x - player.x) : DIR_ANGLE[player.dir];
}

function nearestTarget() {
  let best = null, bestD = Infinity, bestLOS = null, bestLOSD = Infinity;
  const consider = (x, y) => {
    const d = Math.hypot(x - player.x, y - player.y);
    if (d < bestD) { bestD = d; best = { x, y }; }
    if (d < bestLOSD && hasLOS(player.x, player.y, x, y)) { bestLOSD = d; bestLOS = { x, y }; }
  };
  for (const e of enemies) {
    if (!e.dead && !(e.spawning > 0)) consider(e.x, e.y);
  }
  if (battle.mode === 'assault') {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      if (grid[r][c] === T_HQ) consider(c * TILE + TILE / 2, r * TILE + TILE / 2);
  }
  return bestLOS || best;
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
  } else if (t === T_SAND) {
    ctx.fillStyle = '#5a4a2e';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(220,190,120,.25)';
    ctx.fillRect(x + ((r * 7 + c * 13) % 20), y + ((r * 11 + c * 5) % 24), 4, 4);
    ctx.fillRect(x + ((r * 3 + c * 17) % 28), y + ((r * 13 + c * 7) % 30), 3, 3);
    ctx.fillRect(x + ((r * 19 + c * 3) % 32), y + ((r * 5 + c * 11) % 18), 3, 3);
  } else if (t === T_BARREL) {
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(x, y, TILE, TILE);
    const puls = 0.85 + Math.sin(performance.now() / 300 + r * 2 + c) * 0.15;
    ctx.save();
    ctx.shadowColor = '#ff9d3c';
    ctx.shadowBlur = 10 * puls;
    const bg = ctx.createRadialGradient(x + 14, y + 14, 3, x + 20, y + 20, 16);
    bg.addColorStop(0, '#ff9d5c');
    bg.addColorStop(1, '#a83b1e');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 13, 0, 7);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 20); ctx.lineTo(x + 31, y + 20);
    ctx.stroke();
    ctx.fillStyle = '#0e1320';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☢', x + 20, y + 20);
  } else if (t === T_HEDGE) {
    // протитанковий їжак: сталевий хрест, кулі летять над ним
    ctx.strokeStyle = '#5c687e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + TILE - 8, y + TILE - 8);
    ctx.moveTo(x + TILE - 8, y + 8); ctx.lineTo(x + 8, y + TILE - 8);
    ctx.stroke();
    ctx.strokeStyle = '#aab6cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + TILE - 8, y + TILE - 8);
    ctx.moveTo(x + TILE - 8, y + 8); ctx.lineTo(x + 8, y + TILE - 8);
    ctx.stroke();
  } else if (t === T_FENCE) {
    // дерев'яний паркан: трощиться корпусом і кулями
    ctx.fillStyle = '#7a5a33';
    ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
    ctx.fillStyle = '#5c421f';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i * 9, y + 4, 2, TILE - 8);
    ctx.fillStyle = '#9c7a4b';
    ctx.fillRect(x + 2, y + 10, TILE - 4, 3);
    ctx.fillRect(x + 2, y + TILE - 14, TILE - 4, 3);
  } else if (t === T_ICE) {
    // лід: ковзко!
    ctx.fillStyle = '#8ec6e8';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x + ((r * 11 + c * 7) % 18), y + ((r * 5 + c * 13) % 22), 12, 2);
    ctx.fillRect(x + ((r * 3 + c * 17) % 24), y + ((r * 13 + c * 3) % 28), 8, 2);
    ctx.strokeStyle = 'rgba(120,170,210,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + ((r * 7 + c) % 30), y);
    ctx.lineTo(x + ((c * 9 + r) % 30), y + TILE);
    ctx.stroke();
  } else if (t === T_TURRET) {
    // ворожий ДОТ
    ctx.fillStyle = '#2a3245';
    ctx.fillRect(x, y, TILE, TILE);
    const tur = battle.turrets && battle.turrets.find(tt => tt.r === r && tt.c === c);
    const cx = x + TILE / 2, cy = y + TILE / 2;
    ctx.fillStyle = '#4a5670';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a97ad'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 7); ctx.stroke();
    // дуло за ціллю
    if (tur) {
      ctx.strokeStyle = '#c3cddf'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(tur.ang) * 19, cy + Math.sin(tur.ang) * 19);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff4d5e';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
    // смужка HP
    const maxHp = 10 + 4 * battle.tank.tier;
    const frac = Math.max(0, gridHp[r][c] / maxHp);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(x + 2, y - 7, TILE - 4, 5);
    ctx.fillStyle = frac > 0.5 ? '#39ff88' : frac > 0.25 ? '#ffd23f' : '#ff4d5e';
    ctx.fillRect(x + 2, y - 7, (TILE - 4) * frac, 5);
  } else if (t === T_HOME) {
    // ТВОЯ БАЗА — захищай!
    ctx.fillStyle = '#12281c';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    const pl = 0.7 + Math.sin(performance.now() / 350) * 0.3;
    ctx.save();
    ctx.shadowColor = '#39ff88';
    ctx.shadowBlur = 14 * pl;
    ctx.fillStyle = '#39ff88';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + TILE / 2, y + TILE / 2 + 1);
    ctx.restore();
    const hf = Math.max(0, gridHp[r][c] / (battle.homeMax || 1));
    ctx.fillStyle = '#05070c';
    ctx.fillRect(x + 2, y - 7, TILE - 4, 5);
    ctx.fillStyle = hf > 0.5 ? '#39ff88' : hf > 0.25 ? '#ffd23f' : '#ff4d5e';
    ctx.fillRect(x + 2, y - 7, (TILE - 4) * hf, 5);
  } else if (t === T_HQ) {
    ctx.fillStyle = '#2a1a22';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#ff4d5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    const puls = 0.7 + Math.sin(performance.now() / 250) * 0.3;
    ctx.save();
    ctx.shadowColor = '#ff4d5e';
    ctx.shadowBlur = 14 * puls;
    ctx.fillStyle = '#ff4d5e';
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☭', x + TILE / 2, y + TILE / 2 + 1);
    ctx.restore();
    // смужка міцності штабу
    const maxHp = battle.homeMax || (12 + 4 * battle.tank.tier);
    const frac = Math.max(0, gridHp[r][c] / maxHp);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(x + 2, y - 7, TILE - 4, 5);
    ctx.fillStyle = frac > 0.5 ? '#39ff88' : frac > 0.25 ? '#ffd23f' : '#ff4d5e';
    ctx.fillRect(x + 2, y - 7, (TILE - 4) * frac, 5);
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
  drawHull(g, s, color, o);
  drawTurretGun(g, s, color, o);
}

function drawHull(g, s, color, o = {}) {
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

  // накладні деталі — саме вони роблять кожен танк упізнаваним
  const plate = o.plate || 'none';
  if (plate === 'spaced') {            // рознесена броня: плити по бортах
    g.fillStyle = shade(color, -30);
    g.strokeStyle = 'rgba(0,0,0,.45)';
    g.lineWidth = 1;
    for (const side of [-1, 1]) for (const yy of [-0.22, 0.02, 0.26]) {
      g.beginPath();
      g.roundRect(side * hw * 0.72 - s * 0.055, s * yy, s * 0.11, s * 0.16, 2);
      g.fill(); g.stroke();
    }
  } else if (plate === 'skirts') {     // бортові екрани вздовж гусениць
    g.fillStyle = shade(color, -45);
    for (const side of [-1, 1]) {
      g.beginPath();
      g.roundRect(side * (s / 2 - s * 0.30) - s * 0.045, -s * 0.36, s * 0.09, s * 0.72, 3);
      g.fill();
    }
  } else if (plate === 'rails') {      // поручні десанту
    g.strokeStyle = 'rgba(255,255,255,.35)';
    g.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * hw * 0.8, -s * 0.12);
      g.lineTo(side * hw * 0.8, s * 0.24);
      g.stroke();
    }
  } else if (plate === 'net') {        // маскувальна сітка
    g.strokeStyle = 'rgba(255,255,255,.18)';
    g.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(-hw, s * (i * 0.14));
      g.lineTo(hw, s * (i * 0.14 + 0.09));
      g.stroke();
    }
  }
}

function drawTurretGun(g, s, color, o = {}) {
  const cls = o.cls || 'СТ';
  // довжина і товщина дула — характер класу
  const bl = s * (o.barrel || (cls === 'ПТ' ? 0.85 : cls === 'ВТ' ? 0.62 : 0.7));
  const bw = cls === 'ВТ' ? 3.4 : cls === 'ПТ' ? 2.9 : 2.3;

  // маска гармати
  g.fillStyle = shade(color, -70);
  g.beginPath();
  g.roundRect(-bw - 2, -s * 0.3, (bw + 2) * 2, s * 0.18, 2);
  g.fill();

  // дуло з металевим градієнтом і дульним гальмом
  const bgrad = g.createLinearGradient(-bw, 0, bw, 0);
  bgrad.addColorStop(0, '#7c869c');
  bgrad.addColorStop(0.5, '#e2e9f5');
  bgrad.addColorStop(1, '#5e677b');
  g.fillStyle = bgrad;
  const barrels = o.twin ? [-bw * 1.7, bw * 1.7] : [0];
  for (const bx of barrels) {
    g.fillStyle = bgrad;
    g.fillRect(bx - bw, -bl, bw * 2, bl - s * 0.12);
    g.fillStyle = '#39445e';
    g.beginPath();
    g.roundRect(bx - bw - 1.6, -bl, (bw + 1.6) * 2, 7, 2);
    g.fill();
  }

  const tg2 = (r, cx, cy) => {
    const grd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.3, r * 0.15, cx, cy, r * 1.25);
    grd.addColorStop(0, shade(color, 75));
    grd.addColorStop(1, shade(color, -40));
    return grd;
  };

  if (cls === 'ПТ') {
    // рубка ПТ-САУ: скошена трапеція замість круглої башти
    g.beginPath();
    g.moveTo(-s * 0.22, s * 0.3);
    g.lineTo(-s * 0.14, -s * 0.22);
    g.lineTo(s * 0.14, -s * 0.22);
    g.lineTo(s * 0.22, s * 0.3);
    g.closePath();
    const lg = g.createLinearGradient(0, -s * 0.22, 0, s * 0.3);
    lg.addColorStop(0, shade(color, 55));
    lg.addColorStop(1, shade(color, -45));
    g.fillStyle = lg;
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(-s * 0.1, -s * 0.16, s * 0.2, 2.5);
  } else if (cls === 'ВТ') {
    // масивна широка башта важкого
    const tr = s * 0.26;
    g.beginPath();
    g.roundRect(-tr, s * 0.02 - tr * 0.85, tr * 2, tr * 1.7, tr * 0.55);
    g.fillStyle = tg2(tr, 0, s * 0.02);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.45)';
    g.lineWidth = 1.2;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.beginPath();
    g.arc(tr * 0.35, s * 0.02 + tr * 0.3, tr * 0.26, 0, 7);
    g.fill();
    g.fillStyle = shade(color, -55);
    g.fillRect(-tr * 0.7, s * 0.02 + tr * 0.5, tr * 1.4, 2.5);
  } else {
    // кругла башта ЛТ (менша) та СТ
    const tr = cls === 'ЛТ' ? s * 0.17 : s * 0.21;
    g.beginPath();
    g.arc(0, s * 0.02, tr, 0, 7);
    g.fillStyle = tg2(tr, 0, s * 0.02);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.beginPath();
    g.arc(tr * 0.3, s * 0.02 + tr * 0.3, tr * 0.28, 0, 7);
    g.fill();
    // антена СТ
    if (cls === 'СТ') {
      g.strokeStyle = 'rgba(220,230,245,.5)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-tr * 0.7, s * 0.02 + tr * 0.5);
      g.lineTo(-tr * 1.4, s * 0.02 + tr * 1.3);
      g.stroke();
    }
  }

  // розпізнавальна смуга на башті — свій колір у кожного танка
  if (o.stripe) {
    g.save();
    g.globalAlpha = 0.85;
    g.fillStyle = o.stripe;
    g.fillRect(-s * 0.055, -s * 0.16, s * 0.11, s * 0.34);
    g.restore();
  }

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
  if (t.spawning > 0 && Math.floor(t.spawning / 100) % 2) return;
  let alpha = 1;
  if (isPlayer && player.invuln > 0 && Math.floor(player.invuln / 100) % 2) alpha = 0.45;
  if (freezeTimer > 0 && !isPlayer) alpha = 0.6;

  const cls = isPlayer ? battle.tank.cls : (t.cls || 'СТ');
  const sk = isPlayer ? skinOf(battle.tank.id) : null;
  const skOpt = sk ? { plate: sk.plate, barrel: sk.barrel, twin: sk.twin, stripe: sk.stripe } : {};
  // корпус — крутиться з напрямком руху
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[t.dir]);
  ctx.globalAlpha = alpha;
  drawHull(ctx, t.size, color, Object.assign({ tread: t.tread || 0, cls }, skOpt));
  ctx.restore();

  // башта — крутиться незалежно, за прицілом (у ПТ рубка жорстко по корпусу)
  const ta = cls === 'ПТ' ? DIR_ANGLE[t.dir] : (t.turretAngle !== undefined ? t.turretAngle : DIR_ANGLE[t.dir]);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(ta + Math.PI / 2);
  ctx.globalAlpha = alpha;
  drawTurretGun(ctx, t.size, color, Object.assign({ flash: t.flash || 0, cls }, skOpt));
  ctx.restore();
  ctx.globalAlpha = 1;

  if (!isPlayer && t.buffIco) {
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(t.buffIco, t.x, t.y - t.size / 2 - 16);
  }
  if (!isPlayer && t.hp < t.maxHp) {
    const w = t.size, frac = Math.max(0, t.hp / t.maxHp);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(t.x - w / 2, t.y - t.size / 2 - 10, w, 5);
    ctx.fillStyle = frac > 0.5 ? '#39ff88' : frac > 0.25 ? '#ffd23f' : '#ff4d5e';
    ctx.fillRect(t.x - w / 2, t.y - t.size / 2 - 10, w * frac, 5);
  }
  if ((freezeTimer > 0 || t.slowT > 0) && !isPlayer) {
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('❄', t.x, t.y - t.size / 2 - 14);
  }
}

function draw() {
  updateCamera();
  // фон усього полотна (включно зі смугами HUD)
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, VIEW_W, H + HUD_TOP + HUD_BOT);

  ctx.save();
  ctx.translate(-camX, HUD_TOP); // світ зсувається під камеру
  if (shakeTime > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(camX - 10, -10, VIEW_W + 20, H + 20);

  // малюємо лише те, що в кадрі
  const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const c1 = Math.min(COLS - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
  for (let r = 0; r < ROWS; r++)
    for (let c = c0; c <= c1; c++)
      if (grid[r][c] !== T_BUSH) drawTile(r, c);

  for (const d of drops) {
    if (d.ttl < 3000 && Math.floor(d.ttl / 200) % 2) continue;
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (d.kind === 'crate') {
      const pl = 0.7 + Math.sin(performance.now() / 250) * 0.3;
      ctx.save();
      ctx.shadowColor = '#ffd23f';
      ctx.shadowBlur = 16 * pl;
      ctx.font = '26px monospace';
      ctx.fillText('📦', d.x, d.y);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,210,63,' + (0.35 + pl * 0.4) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(d.x, d.y, 20 + pl * 5, 0, 7); ctx.stroke();
    } else {
      if (CRATES[d.kind]) {
        const cd = CRATES[d.kind];
        const pg = 0.6 + Math.sin(performance.now() / 300) * 0.4;
        ctx.save();
        ctx.shadowColor = cd.kind === 'tradeoff' ? '#c07eff' : '#ffd23f';
        ctx.shadowBlur = 14 * pg;
        ctx.fillText(cd.ico, d.x, d.y);
        ctx.restore();
        // фіолетова рамка = трофей з ціною
        ctx.strokeStyle = cd.kind === 'tradeoff' ? 'rgba(192,126,255,.75)' : 'rgba(255,210,63,.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(d.x - 14, d.y - 14, 28, 28);
      } else {
        ctx.fillText(d.kind === 'med' ? '💊' : d.kind === 'star' ? '⭐' : '❄️', d.x, d.y);
      }
    }
  }

  // міни (ледь помітні — дивись уважно!)
  for (const m of battle.mines) {
    ctx.globalAlpha = 0.75;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff4d5e';
    ctx.fillText('☢', m.x, m.y);
    ctx.globalAlpha = 1;
  }

  // помічник — блакитний, з підписом, щоб не сплутати з ворогом
  if (battle.helper && !battle.helper.dead) {
    const h = battle.helper;
    drawTank(h, '#6fd3ff', false);
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6fd3ff';
    ctx.fillText('🤝 свій', h.x, h.y - h.size / 2 - 16);
  }

  // корпус у кольорі свого танка, але під ним завжди зелене кільце «це ти»
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#39ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size * 0.62, 0, 7);
  ctx.stroke();
  ctx.restore();
  drawTank(player, skinOf(battle.tank.id).hull, true);
  for (const e of enemies) if (!e.dead) drawTank(e, e.color, false);

  for (const b of bullets) {
    // світний трейл (навісні — фіолетові)
    const tg = ctx.createLinearGradient(b.x, b.y, b.x - b.dx * 16, b.y - b.dy * 16);
    tg.addColorStop(0, b.over ? 'rgba(192,126,255,.8)' : b.fromPlayer ? 'rgba(57,255,136,.7)' : 'rgba(255,77,94,.7)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = tg;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.dx * 16, b.y - b.dy * 16);
    ctx.stroke();
    ctx.save();
    if (b.homing) {
      // ракета: витягнутий корпус з полум'ям
      const col = b.homing === 'player' ? '#ff9d3c' : '#7ef0ff';
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.dy, b.dx));
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(-8, -3, 14, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, 0, 2.2, 0, 7);
      ctx.fill();
    } else {
      // ядро снаряда
      ctx.shadowColor = b.over ? '#c07eff' : b.fromPlayer ? '#39ff88' : '#ff4d5e';
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.over ? '#dfc2ff' : b.fromPlayer ? '#8dffc0' : '#ff9aa5';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === T_BUSH) drawBush(r, c);

  // кільце перезарядки навколо танка гравця
  if (state === 'play' || state === 'perk') {
    const ready = player.cooldown <= 0;
    if (!ready) {
      const frac = 1 - player.cooldown / player.fireCd;
      ctx.strokeStyle = 'rgba(255,210,63,.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size / 2 + 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
  }

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

  // мітки артобстрілу — тікай з-під них!
  for (const s of battle.strikes) {
    const blink = Math.floor(s.t / 120) % 2;
    ctx.strokeStyle = blink ? '#ff4d5e' : '#ffd23f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 26 * (s.t / 1400) + 8, 0, 7);
    ctx.stroke();
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff4d5e';
    ctx.fillText('⌖', s.x, s.y);
  }

  // нічний бій: темрява, видно лише навколо танка
  if (battle.mod === 'night') {
    const ng = ctx.createRadialGradient(player.x, player.y, 70, player.x, player.y, 210);
    ng.addColorStop(0, 'rgba(2,4,10,0)');
    ng.addColorStop(1, 'rgba(2,4,10,0.9)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, H);
  }
  // туман: серпанок
  if (battle.mod === 'fog') {
    ctx.fillStyle = 'rgba(170,190,210,0.15)';
    ctx.fillRect(0, 0, W, H);
  }
  // мороз: холодний відтінок
  if (battle.mod === 'frost') {
    ctx.fillStyle = 'rgba(150,200,255,0.07)';
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
  drawHud(); // поверх усього, без тремтіння екрана
  drawMinimap();
}

// Міні-мапа: карта вдвічі ширша за екран, тож потрібен огляд усього поля
function drawMinimap() {
  if (!battle || (state !== 'play' && state !== 'perk')) return;
  const mw = 148, mh = Math.round(mw * H / W), mx = VIEW_W - mw - 8, my = HUD_TOP + 8;
  const sx = mw / W, sy = mh / H;
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = '#05070c';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#263149';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);

  // стіни — блідими блоками, щоб читалася форма карти
  ctx.fillStyle = 'rgba(120,140,175,.35)';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = grid[r][c];
    if (t !== T_BRICK && t !== T_STEEL) continue;
    ctx.fillRect(mx + c * TILE * sx, my + r * TILE * sy, TILE * sx, TILE * sy);
  }
  const dot = (x, y, col, r2) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx + x * sx, my + y * sy, r2, 0, 7); ctx.fill(); };
  // бази
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] === T_HQ) dot(c * TILE + 20, r * TILE + 20, '#ff4d5e', 3);
    if (grid[r][c] === T_HOME) dot(c * TILE + 20, r * TILE + 20, '#39ff88', 3);
  }
  for (const d of drops) dot(d.x, d.y, CRATES[d.kind] ? '#ffd23f' : '#6fd3ff', 2);
  for (const e of enemies) if (!e.dead && !(e.spawning > 0)) dot(e.x, e.y, '#ff9d5c', 2.2);
  if (battle.helper && !battle.helper.dead) dot(battle.helper.x, battle.helper.y, '#6fd3ff', 2.2);
  dot(player.x, player.y, '#39ff88', 3);
  // рамка того, що зараз видно на екрані
  ctx.strokeStyle = 'rgba(57,255,136,.6)';
  ctx.strokeRect(mx + camX * sx, my, VIEW_W * sx, mh);
  ctx.restore();
  ctx.globalAlpha = 1;

  // статус під міні-мапою: щит штабу і активні трофеї — тут є місце,
  // а у верхній смузі вони налазили на таймер
  // підкладка, щоб текст читався поверх карти
  const lines = (battle.hqLeft > 0 ? 1 : 0) + ((player.buffs && player.buffs.length) || 0);
  if (lines) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(mx - 40, my + mh + 5, mw + 40, lines * 16 + 6);
    ctx.restore();
  }
  let ly = my + mh + 14;
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px monospace';
  if (battle.hqLeft > 0) {
    ctx.fillStyle = battle.hqSealed ? '#6fd3ff' : '#ffd23f';
    ctx.fillText(battle.hqSealed
      ? `🛡 щит штабу ${Math.min(battle.frags, battle.sealGoal)}/${battle.sealGoal}`
      : '☭ ШТАБ ВІДКРИТИЙ', mx + mw, ly);
    ly += 16;
  }
  if (player.buffs && player.buffs.length) {
    ctx.fillStyle = '#ffd23f';
    for (const b of player.buffs) {
      ctx.fillText(`${CRATES[b.id].ico} ${CRATES[b.id].name} ${Math.ceil(b.left / 1000)}с`, mx + mw, ly);
      ly += 15;
    }
  }
  ctx.restore();
}

// HUD малюється прямо на полі бою — все в одному екрані
function drawHud() {
  if (!battle) return;
  const BOT_Y = HUD_TOP + H; // початок нижньої смуги
  ctx.save();
  ctx.textBaseline = 'middle';

  // ---- верхня панель (над полем) ----
  ctx.fillStyle = '#101725';
  ctx.fillRect(0, 0, VIEW_W, HUD_TOP);
  ctx.strokeStyle = '#263149';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, HUD_TOP - 0.5); ctx.lineTo(VIEW_W, HUD_TOP - 0.5); ctx.stroke();

  const midY = HUD_TOP / 2;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd23f';
  const homeAlive = grid[battle.homeR] && grid[battle.homeR][battle.homeC] === T_HOME;
  const homeFrac = homeAlive ? Math.max(0, gridHp[battle.homeR][battle.homeC] / battle.homeMax) : 0;
  ctx.fillStyle = homeFrac < 0.4 ? '#ff4d5e' : '#39ff88';
  const left = `★ ${Math.round(homeFrac * 100)}%   ☭ ${battle.hqLeft}`;
  const modIco = battle.mod ? '  ' + MOD_INFO[battle.mod].ico : '';
  ctx.fillText(`⚔ ${battle.frags}  ${left}${modIco}`, 10, midY);

  // взяті доктрини — праворуч від лічильників
  if (battle.perks.length) {
    ctx.font = '15px monospace';
    ctx.fillStyle = '#8fa2c4';
    ctx.fillText(battle.perks.map(p => p.ico).join('').slice(0, 8), 190, midY);
  }

  // центр: час до кінця бою + таймер постачання
  const msLeft = Math.max(0, SUPPLY_MS - battle.supply);
  const sec = Math.ceil(msLeft / 1000);
  const leftMs = Math.max(0, BATTLE_LIMIT_MS - battle.gameMs);
  const mm = Math.floor(leftMs / 60000), ss = Math.floor((leftMs % 60000) / 1000);
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = leftMs < 30000 ? '#ff4d5e' : '#d7e0f0';
  ctx.fillText(`⏱ ${mm}:${String(ss).padStart(2, '0')}`, VIEW_W / 2 - 42, midY);
  // прогрес до наступного постачання (заробляється боєм)
  const pf = Math.min(1, battle.pts / SUPPLY_COST);
  const bx = VIEW_W / 2 + 18, bw = 66;
  ctx.fillStyle = '#05070c';
  ctx.fillRect(bx, midY - 6, bw, 12);
  ctx.fillStyle = battle.crateOut ? '#ffd23f' : '#39ff88';
  ctx.fillRect(bx, midY - 6, bw * (battle.crateOut ? 1 : pf), 12);
  ctx.strokeStyle = '#263149'; ctx.lineWidth = 1;
  ctx.strokeRect(bx, midY - 6, bw, 12);
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8fa2c4';
  ctx.fillText(battle.crateOut ? '📦 на карті!' : '📦', bx + bw + 6, midY);

  // номер хвилі
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = battle.waveFlash > 0 ? '#ff4d5e' : '#8fa2c4';
  ctx.fillText('🌊 ' + battle.wave, 160, midY);

  // праворуч: аптечка
  ctx.textAlign = 'right';
  ctx.fillStyle = battle.medkit ? '#39ff88' : '#3a4661';
  ctx.fillText(battle.medkit ? (IS_TOUCH ? '🔧 аптечка' : '🔧 аптечка [E]') : '🔧 —', VIEW_W - 12, midY);

  // ---- нижня панель: HP (під полем) ----
  ctx.fillStyle = '#101725';
  ctx.fillRect(0, BOT_Y, VIEW_W, HUD_BOT);
  ctx.strokeStyle = '#263149';
  ctx.beginPath(); ctx.moveTo(0, BOT_Y + 0.5); ctx.lineTo(VIEW_W, BOT_Y + 0.5); ctx.stroke();

  const frac = Math.max(0, player.hp / player.maxHp);
  const barY = BOT_Y + 13, barH = 18;
  ctx.fillStyle = '#05070c';
  ctx.fillRect(12, barY, VIEW_W - 24, barH);
  ctx.fillStyle = frac > 0.5 ? '#39ff88' : frac > 0.25 ? '#ffd23f' : '#ff4d5e';
  ctx.fillRect(12, barY, (VIEW_W - 24) * frac, barH);
  ctx.strokeStyle = '#263149';
  ctx.strokeRect(12, barY, VIEW_W - 24, barH);
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = frac > 0.35 ? '#05070c' : '#d7e0f0';
  ctx.fillText(`${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp} HP`, VIEW_W / 2, barY + barH / 2);

  // ---- ЗАЧИСТКА: коли лишилось ≤3 вороги — вказівники, щоб не шукати їх по карті ----
  if (battle.mode === 'clear' && state === 'play') {
    const alive = enemies.filter(e => !e.dead && !(e.spawning > 0));
    if (alive.length && alive.length + spawnQueue.length <= 3) {
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
      for (const e of alive) {
        const ex = e.x - camX, ey = HUD_TOP + e.y;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,210,63,' + (0.3 + pulse * 0.4) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, 24 + pulse * 6, 0, 7);
        ctx.stroke();
        ctx.restore();
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d > 150) {
          const ang = Math.atan2(ey - (HUD_TOP + player.y), ex - (player.x - camX));
          ctx.save();
          ctx.translate(player.x - camX + Math.cos(ang) * 46, HUD_TOP + player.y + Math.sin(ang) * 46);
          ctx.rotate(ang);
          ctx.globalAlpha = 0.5 + pulse * 0.4;
          ctx.fillStyle = '#ffd23f';
          ctx.beginPath();
          ctx.moveTo(12, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // ---- ШТУРМ: постійний вказівник на штаб, щоб ціль не загубилась ----
  if (battle.hqLeft > 0 && state === 'play') {
    // найближчий штаб
    let hx = null, hy = null, bd = 1e9;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== T_HQ) continue;
      const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
      const d = Math.hypot(x - player.x, y - player.y);
      if (d < bd) { bd = d; hx = x; hy = y; }
    }
    if (hx !== null) {
      const px = player.x - camX, py = HUD_TOP + player.y;
      const tx = hx - camX, ty = HUD_TOP + hy;
      const ang = Math.atan2(ty - py, tx - px);
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);

      // пульсуюче кільце навколо штабу
      ctx.save();
      ctx.strokeStyle = 'rgba(255,77,94,' + (0.35 + pulse * 0.45) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tx, ty, 26 + pulse * 8, 0, 7);
      ctx.stroke();
      ctx.restore();

      // стрілка біля танка, якщо штаб далеко
      if (bd > 130) {
        ctx.save();
        ctx.translate(px + Math.cos(ang) * 48, py + Math.sin(ang) * 48);
        ctx.rotate(ang);
        ctx.globalAlpha = 0.55 + pulse * 0.45;
        ctx.fillStyle = '#ff4d5e';
        ctx.beginPath();
        ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ---- великий відлік перед постачанням (у полі) ----
  if (sec <= 5 && msLeft > 0 && state === 'play') {
    const pulse = 1 - (msLeft % 1000) / 1000;
    ctx.font = `bold ${Math.round(36 + pulse * 12)}px monospace`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle = '#ffd23f';
    ctx.shadowColor = '#ffd23f';
    ctx.shadowBlur = 18;
    ctx.fillText(`📦 ${sec}`, VIEW_W / 2, HUD_TOP + 90);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // ---- банер нової хвилі ----
  if (battle.waveFlash > 0) {
    const a = Math.min(1, battle.waveFlash / 600);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4d5e';
    ctx.font = 'bold 30px monospace';
    ctx.shadowColor = '#ff4d5e'; ctx.shadowBlur = 18;
    ctx.fillText('🌊 ХВИЛЯ ' + battle.wave, VIEW_W / 2, HUD_TOP + 70);
    ctx.shadowBlur = 0;
    ctx.font = '13px monospace';
    ctx.fillStyle = '#d7e0f0';
    ctx.fillText('вороги міцніші та швидші', VIEW_W / 2, HUD_TOP + 94);
    ctx.globalAlpha = 1;
  }

  // ---- вступний банер ----
  if (battle.introT > 0) {
    const a = Math.min(1, battle.introT / 700);
    const cy = HUD_TOP + H / 2;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(5,7,12,.78)';
    ctx.fillRect(0, cy - 58, VIEW_W, 116);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 21px monospace';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 16;
    ctx.fillText('☭ ЗНИЩ ВОРОЖУ БАЗУ — ЗАХИСТИ СВОЮ ★', VIEW_W / 2, cy - 16);
    ctx.shadowBlur = 0;
    ctx.font = '15px monospace';
    ctx.fillStyle = '#d7e0f0';
    ctx.fillText(battle.mapName + (battle.elite ? '  ·  ☠ ЕЛІТНИЙ БІЙ' : ''), VIEW_W / 2, cy + 16);
    ctx.fillStyle = '#8fa2c4';
    ctx.font = '13px monospace';
    let sub = battle.mode === 'assault' ? 'Підкріплення йдуть — прорвися і знеси ☭ штаб' : '';
    if (battle.mod) sub = (sub ? sub + '  ·  ' : '') + MOD_INFO[battle.mod].ico + ' ' + MOD_INFO[battle.mod].name;
    if (sub) ctx.fillText(sub, VIEW_W / 2, cy + 40);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- Ігровий цикл ----------
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  if (state !== 'play') { if (state === 'perk' || state === 'results' || state === 'pause') draw(); return; }

  if (shakeTime > 0) shakeTime -= dt;
  if (freezeTimer > 0) freezeTimer -= dt;
  if (battle.enemyShotCd > 0) battle.enemyShotCd -= dt;
  battle.gameMs += dt;
  if (battle.introT > 0) battle.introT -= dt;

  // жорстка межа раунду: час вийшов — бій завершується підсумком
  if (battle.gameMs >= BATTLE_LIMIT_MS) {
    // у штурмі це поразка (штаб не взято), у зачистці — рахуємо за фрагами
    const won = battle.mode === 'clear' && spawnQueue.length === 0 && enemies.every(e => e.dead);
    battle.timeUp = true;
    endBattle(won);
    return;
  }

  // ---- ХВИЛІ: кожні 40 с ворог присилає злішу хвилю ----
  battle.waveT += dt;
  // поле зачищене — не змушуємо чекати таймер: наступна хвиля йде одразу
  const fieldClear = spawnQueue.length === 0 && enemies.every(e => e.dead);
  if ((battle.waveT >= 40000 || (fieldClear && battle.waveT > 2500)) && battle.wave < MAX_WAVES) {
    battle.waveT = 0;
    battle.wave++;
    battle.waveFlash = 2200;
    // хвиля має ПРИВОДИТИ ворогів. Раніше лічильник крутився вхолосту:
    // напис «ХВИЛЯ 3» був, а підкріплення не приходило зовсім
    const reinf = buildRoster(battle.tank.tier, false).slice(0, 3 + battle.tank.tier);
    spawnQueue.push(...reinf);
    battle.totalEnemies += reinf.length;
    sfx.boom();
    shakeTime = 250;
    floatText(player.x, player.y - 46, `⚠ ХВИЛЯ ${battle.wave}: +${reinf.length} ворогів!`, '#ff4d5e');
  }
  if (battle.waveFlash > 0) battle.waveFlash -= dt;

  // ---- ПОСТАЧАННЯ: заробляється боєм, і його треба ПІДІБРАТИ ----
  if (battle.pts >= SUPPLY_COST && !battle.crateOut) {
    battle.pts -= SUPPLY_COST;
    battle.crateOut = true;
    dropSupplyCrate();
  }

  updateModifiers(dt);
  if (state !== 'play') return;
  updateTurrets(dt);
  updateHelper(dt);
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
    const branch = BRANCH_LABEL[t.cls];
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
  renderAnalytics();
}

// ---------- Аналітика: сама рахує статистику з локального логу ----------
function renderAnalytics() {
  const box = document.getElementById('statsContent');
  const all = getLog().filter(e => e.t === 'battle_end');
  const quits = all.filter(e => e.quit).length;
  const ends = all.filter(e => !e.quit);
  if (!ends.length) {
    box.innerHTML = '<p style="color:var(--dim);font-size:12px">Зіграй перший бій — і тут з\'явиться твоя статистика: вінрейт, улюблені танки, доктрини, динаміка.</p>';
    return;
  }
  const wins = ends.filter(e => e.victory).length;
  const avg = f => Math.round(ends.reduce((s, e) => s + (e[f] || 0), 0) / ends.length);
  const last10 = ends.slice(-10);
  const w10 = last10.filter(e => e.victory).length;

  // по танках
  const byTank = {};
  for (const e of ends) {
    const b = byTank[e.tank] = byTank[e.tank] || { n: 0, w: 0 };
    b.n++; if (e.victory) b.w++;
  }
  const tankRows = Object.entries(byTank)
    .sort((a, b) => b[1].n - a[1].n).slice(0, 5)
    .map(([id, s]) => `<div class="statRow"><span>${(TANKS[id] || { name: id }).name}</span><span class="val">${s.w}/${s.n} (${Math.round(s.w / s.n * 100)}%)</span></div>`)
    .join('');

  // улюблені доктрини
  const perkCount = {};
  for (const e of getLog().filter(e => e.t === 'perk')) perkCount[e.id] = (perkCount[e.id] || 0) + 1;
  const topPerks = Object.entries(perkCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, n]) => {
      const p = PERKS.find(p => p.id === id);
      return (p ? p.ico + ' ' + p.name : id) + ' ×' + n;
    }).join(' · ') || '—';

  // останні бої
  const recent = ends.slice(-5).reverse().map(e =>
    `<div style="font-size:11px;color:${e.victory ? 'var(--neon)' : 'var(--danger)'}">${e.victory ? '🏆' : '💥'} ${(TANKS[e.tank] || { name: e.tank }).name} · ${e.map} · ${e.sec}с · ${e.frags} фрагів</div>`
  ).join('');

  box.innerHTML = `
    <div class="statRow"><span>Боїв у логу</span><span class="val">${ends.length}${quits ? ' (+' + quits + ' виходів)' : ''}</span></div>
    <div class="statRow"><span>Вінрейт</span><span class="val">${Math.round(wins / ends.length * 100)}% (останні ${last10.length}: ${Math.round(w10 / last10.length * 100)}%)</span></div>
    <div class="statRow"><span>Сер. бій</span><span class="val">${avg('sec')}с</span></div>
    <div class="statRow"><span>Сер. фраги / отримано</span><span class="val">${avg('frags')} / ${avg('taken')}</span></div>
    <div class="statRow"><span>Рикошетів всього</span><span class="val">${ends.reduce((s, e) => s + (e.rico || 0), 0)}</span></div>
    <div class="branchLabel">Танки (вінрейт)</div>
    ${tankRows}
    <div class="branchLabel">Улюблені доктрини</div>
    <div style="font-size:11px;color:var(--gold)">${topPerks}</div>
    <div class="branchLabel">Останні бої</div>
    ${recent}`;
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
  document.getElementById('tankTitle').textContent =
    `${t.name} · ${t.cls} · Тір ${t.tier}` + (st.elite ? ' · ⚜ ЕЛІТНИЙ' : '');

  const crewNow = ts.crewXp || 0;
  const crewNext = crewNextXp(st.crew);
  const crewPct = st.crew >= 10 ? 100 : Math.round(crewNow / crewNext * 100);
  document.getElementById('tankStats').innerHTML = `
    <p style="color:var(--dim);font-size:12px;margin:8px 0">${t.desc}</p>
    <div class="statRow"><span>❤️ Міцність</span><span class="val">${st.hp} HP</span></div>
    <div class="statRow"><span>💥 Урон за постріл</span><span class="val">${Math.round(st.dmg * 10) / 10}</span></div>
    <div class="statRow"><span>🛡 Броня (рикошет ${Math.round(Math.min(0.45, st.armor * 0.06) * 100)}%)</span><span class="val">${st.armor}</span></div>
    <div class="statRow"><span>🏎 Швидкість</span><span class="val">${st.speed}</span></div>
    <div class="statRow"><span>🔫 Перезарядка</span><span class="val">${(st.fireCd / 1000).toFixed(2)} с</span></div>
    <div class="statRow"><span>👥 Екіпаж: рівень ${st.crew}${st.crew >= 10 ? ' (МАКС)' : ''}</span><span class="val">${st.crew >= 10 ? '★' : crewPct + '%'}</span></div>
    <div class="statRow"><span>📡 Бонус срібла</span><span class="val">+${Math.round(st.radioBonus * 100)}%</span></div>
    <div class="statRow"><span>⭐ Досвід танка</span><span class="val">${fmt(ts.xp)}</span></div>
    <p style="color:var(--dim);font-size:11px;margin-top:6px">Екіпаж росте з кожним боєм: +1.5% урону і швидкості, −1% перезарядки за рівень. Усі модулі 5/5 → танк стає ЕЛІТНИМ (+10% срібла).</p>`;

  drawPreview(st);

  renderCodex();

  const modBox = document.getElementById('modList');
  modBox.innerHTML = '';
  for (const key of Object.keys(MODULES)) {
    const m = MODULES[key], lvl = ts.modules[key];
    const row = document.createElement('div');
    row.className = 'modRow';
    if (lvl >= MOD_MAX) {
      row.innerHTML = `<span>${m.ico} ${m.name} <span class="pips">${'●'.repeat(MOD_MAX)}</span></span><span style="color:var(--neon)">МАКС</span>`;
    } else {
      const cost = moduleCost(t.tier, lvl);
      row.innerHTML = `
        <span>${m.ico} ${m.name} <span class="pips">${'●'.repeat(lvl)}${'○'.repeat(MOD_MAX - lvl)}</span><br>
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

// Кодекс: знайдені трофеї відкриваються назавжди — колекція між боями
function renderCodex() {
  const box = document.getElementById('codexList');
  if (!box) return;
  const found = save.codex || [];
  document.getElementById('codexCount').textContent = `(${found.length}/${CRATE_KEYS.length} знайдено)`;
  box.innerHTML = CRATE_KEYS.map(k => {
    const c = CRATES[k];
    const has = found.includes(k);
    return has
      ? `<div class="cdx found ${c.kind}" title="${c.desc}"><span class="ci">${c.ico}</span>${c.name}</div>`
      : `<div class="cdx unknown" title="Ще не знайдено">
           <span class="ci">❔</span>???</div>`;
  }).join('');
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
  const sk = skinOf(st.id);
  drawTankShape(g, st.size, sk.hull, { cls: st.cls, plate: sk.plate, barrel: sk.barrel, twin: sk.twin, stripe: sk.stripe });
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
// Класика: куди дивиться танк — туди й стріляє
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'fire',
};

function pauseGame() {
  state = 'pause';
  // keys НЕ скидаємо: якщо гравець тримає Пробіл, після паузи новий keydown
  // не прийде і пушка мовчатиме, доки не відпустити й натиснути знову
  document.getElementById('pauseOverlay').classList.remove('hidden');
}
function resumeGame() {
  document.getElementById('pauseOverlay').classList.add('hidden');
  state = 'play';
  lastTime = performance.now();
}
function quitBattle() {
  document.getElementById('pauseOverlay').classList.add('hidden');
  if (battle) battle.quit = true;
  endBattle(false);
}

document.addEventListener('keydown', e => {
  if (KEYMAP[e.code] && state === 'play') { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyE' && state === 'play') useMedkit();
  if (e.code === 'KeyM') toggleMusic();
  if (e.code === 'Enter' && state === 'results') toHangar();
  if (e.code === 'Escape') {
    if (state === 'play') pauseGame();
    else if (state === 'pause') resumeGame();
    else if (state === 'front') frontToHangar();
  }
  if (e.code === 'Enter' && state === 'pause') resumeGame();
  if (e.code === 'KeyQ' && state === 'pause') quitBattle();
  if (state === 'perk' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const idx = +e.code.slice(-1) - 1;
    const picks = window._perkPicks || [];
    if (picks[idx]) pickPerk(picks[idx]);
  }
});
document.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });

document.getElementById('battleBtn').onclick = () => { startMusic(); showFront(); };
document.getElementById('freeBattleBtn').onclick = () => { startMusic(); startBattle(null); };
document.getElementById('backHangarBtn').onclick = frontToHangar;
document.getElementById('resumeBtn').onclick = resumeGame;
document.getElementById('quitBtn').onclick = quitBattle;
document.getElementById('toHangarBtn').onclick = toHangar;
document.getElementById('musicBtn').onclick = toggleMusic;
document.getElementById('logBtn').onclick = async () => {
  const log = getLog();
  if (!log.length) { flashMsg('Лог порожній — зіграй хоча б один бій!'); return; }
  const text = JSON.stringify(log);
  // на claude.ai — нативне збереження файлу; інакше буфер обміну або файл
  if (window.claude && window.claude.downloads) {
    try {
      await window.claude.downloads.save({ filename: 'steel-hangar-log.json', data: text });
      flashMsg(`📊 Лог збережено файлом (${log.length} подій) — кинь його в чат для аналізу!`);
      return;
    } catch (e) {
      if (e && e.code === 'declined') return;
      // інші помилки — падаємо на запасні варіанти
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    flashMsg(`📊 Лог скопійовано (${log.length} подій) — встав його в чат для аналізу!`);
  } catch (e) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = 'steel-hangar-log.json';
    a.click();
    flashMsg(`📊 Лог завантажено файлом (${log.length} подій)`);
  }
};
document.getElementById('logClearBtn').onclick = () => {
  localStorage.removeItem(LOG_KEY);
  flashMsg('Лог очищено');
};
document.getElementById('resetBtn').onclick = () => {
  if (confirm('Точно скинути ВЕСЬ прогрес? Усі танки й срібло зникнуть!')) {
    save = defaultSave();
    persist();
    renderHangar();
  }
};

// ---------- СЕНСОРНЕ КЕРУВАННЯ: аналоговий джойстик ----------
const stick = document.getElementById('stick');
const knob = document.getElementById('stickKnob');
let stickId = null, stickCx = 0, stickCy = 0;
const STICK_R = 52; // радіус ходу ручки

function clearMoveKeys() { keys.up = keys.down = keys.left = keys.right = false; }

function setStick(px, py) {
  let dx = px - stickCx, dy = py - stickCy;
  const d = Math.hypot(dx, dy);
  const max = STICK_R;
  if (d > max) { dx = dx / d * max; dy = dy / d * max; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  clearMoveKeys();
  if (d < 14) return; // мертва зона — стоїмо
  // напрямок за домінантною віссю (танк їздить по 4 напрямках)
  if (Math.abs(dx) > Math.abs(dy)) keys[dx > 0 ? 'right' : 'left'] = true;
  else keys[dy > 0 ? 'down' : 'up'] = true;
}

function stickStart(e) {
  const t = e.changedTouches[0];
  stickId = t.identifier;
  const r = stick.getBoundingClientRect();
  stickCx = r.left + r.width / 2;
  stickCy = r.top + r.height / 2;
  stick.classList.add('on');
  touchMode = true;
  setStick(t.clientX, t.clientY);
  e.preventDefault();
}
function stickMove(e) {
  if (stickId === null) return;
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    setStick(t.clientX, t.clientY);
    e.preventDefault();
  }
}
function stickEnd(e) {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = null;
    stick.classList.remove('on');
    knob.style.transform = '';
    clearMoveKeys();
    e.preventDefault();
  }
}
stick.addEventListener('touchstart', stickStart, { passive: false });
stick.addEventListener('touchmove', stickMove, { passive: false });
stick.addEventListener('touchend', stickEnd, { passive: false });
stick.addEventListener('touchcancel', stickEnd, { passive: false });

const fireBtn = document.getElementById('fireBtn');
fireBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.fire = true; touchMode = true; }, { passive: false });
fireBtn.addEventListener('touchend', e => { e.preventDefault(); keys.fire = false; }, { passive: false });
fireBtn.addEventListener('touchcancel', e => { keys.fire = false; }, { passive: false });
document.getElementById('medBtn').addEventListener('touchstart', e => { e.preventDefault(); useMedkit(); }, { passive: false });
document.getElementById('pauseBtn').addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame();
}, { passive: false });

// на тачі картки доктрин і кнопки оверлеїв мають реагувати на дотик одразу
document.addEventListener('touchend', () => { /* дозволяє click після touch */ }, { passive: true });

// ---------- Старт ----------
const GAME_VERSION = 'v26 · баланс штурму за даними повного прогону';
loadSave();
document.getElementById('verTag').textContent = GAME_VERSION;
renderHangar();
requestAnimationFrame(loop);

// хук для автотестів
window.addEventListener('blur', () => { keys = {}; });
window._dbg = { get: () => ({ state, battle, player, enemies, bullets, drops, spawnQueue, save, keys, grid }), killEnemy };
