/*
 * Збирає index.html + game.js в один самодостатній файл steel-hangar.html.
 *
 *   node tools/bundle.js
 *
 * Потрібен, бо гра має жити не лише в репозиторії: цей файл можна кинути на
 * будь-який статичний хостинг чи відкрити з диска — жодних зовнішніх запитів.
 * Після кожної зміни index.html або game.js його треба перезібрати, інакше
 * опублікована копія тихо відстає від репозиторію.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'steel-hangar.html');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

const style = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
let body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
body = body.replace(/\s*<script src="game\.js"><\/script>\s*/, '\n');

const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'СТАЛЕВИЙ АНГАР'])[1];

const out = `<title>${title}</title>
<style>
${style}
</style>
${body}
<script>
${js}
</script>
`;

fs.writeFileSync(OUT, out);
console.log(`зібрано ${path.relative(ROOT, OUT)} — ${(out.length / 1024).toFixed(0)} KB`);

// найчастіша помилка збирача — лишити посилання на зовнішній файл
const leftovers = out.match(/<(?:script src|link[^>]*href)="(?!data:|https?:)[^"]+"/g);
if (leftovers) {
  console.error('⚠ лишились зовнішні посилання:', leftovers.join(', '));
  process.exit(1);
}
