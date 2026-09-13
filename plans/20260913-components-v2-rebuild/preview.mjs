// Run after npm run build: node plans/20260913-components-v2-rebuild/preview.mjs
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildNowPlayingCard } from '../../dist/music/now-playing-card.js';
import { buildQueueEmbed } from '../../dist/commands/music/queue.js';
import { buildRadioEmbed, buildRadioSelectMenu } from '../../dist/music/radio.js';
import { buildBotInfoEmbed, inviteButton } from '../../dist/bot-info.js';
import { overviewEmbed } from '../../dist/commands/utility/help.js';
import { loadCommands } from '../../dist/utils/command-loader.js';
import { embed, privateReply, EMBED_COLORS } from '../../dist/utils/embed.js';

const song = { info: { title: 'Một buổi tối cùng nhau', author: 'Nghệ sĩ minh họa', duration: 225000, artworkUrl: 'https://example.com/cover.png' }, requester: { username: 'Người nghe' } };
const player = { guildId: 'preview', paused: false, volume: 80, position: 65000, repeatMode: 'off', queue: { current: song, tracks: [{ info: { title: 'Những ngày dịu dàng', duration: 189000 } }, { info: { title: 'Sau cơn mưa', duration: 204000 } }] } };
const client = { user: { username: 'MusicBot', displayAvatarURL: () => 'https://example.com/avatar.png' }, ws: { ping: 42 }, uptime: 3723000, guilds: { cache: { size: 2, reduce: () => 15 } } };
const { commands } = await loadCommands(resolve('dist/commands'));
const cards = [
  ['Đang phát', buildNowPlayingCard(player)], ['Hàng đợi', buildQueueEmbed(player)],
  ['Radio', buildRadioEmbed().addActionRows(buildRadioSelectMenu())],
  ['Trợ giúp', overviewEmbed([...commands.values()])],
  ['Thông tin bot', buildBotInfoEmbed(client, '!', commands.size).addActionRows(inviteButton('999'))],
  ['Thông báo', embed('⏸️ Đã tạm dừng nhạc. Dùng `/resume` để phát tiếp.', undefined, 'Tạm dừng')],
  ['Lỗi', embed('🚫 Bạn cần vào một kênh thoại trước đã!', EMBED_COLORS.error, 'Phát nhạc')],
];
const data = JSON.stringify(cards.map(([title, card]) => ({ title, payload: privateReply(card) }))).replaceAll('<', '\\u003c');
const html = String.raw`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MusicBot · Components V2</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#17171f;color:#dbdee1;font:15px/1.5 system-ui,sans-serif}header{padding:32px max(20px,calc((100% - 1120px)/2));border-bottom:1px solid #35353e}h1{font-size:26px;margin:0 0 8px}header p{margin:0;color:#b5bac1;max-width:850px}main{max-width:1160px;margin:auto;padding:28px 20px;columns:2 480px;column-gap:24px}article{break-inside:avoid;margin-bottom:28px}.label{color:#949ba4;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px}.card{background:#23232f;border:1px solid #383842;border-left:4px solid var(--accent);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;overflow-wrap:anywhere}.text{white-space:pre-wrap;min-width:0}h3{font-size:19px;line-height:1.3;margin:0 0 6px;color:#f2f3f5}h3:last-child{margin:0}.small{font-size:12px;color:#aeb4be}code{font:13px ui-monospace,monospace;background:#16161e;border-radius:4px;padding:2px 4px}a{color:#9badff}hr{width:100%;border:0;border-top:1px solid #393942;margin:2px 0}.space{height:2px}.section{display:flex;gap:16px}.section>div:first-child{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}.thumb{width:76px;height:76px;flex-shrink:0;background:#343444;border-radius:8px;display:grid;place-items:center;font-size:30px}.gallery{aspect-ratio:16/8;background:linear-gradient(130deg,#27253d,#4e4472,#29364b);border-radius:8px;display:grid;place-content:center;text-align:center;color:#d3cdec;gap:12px}.gallery b{font-size:36px}.gallery small{font-size:11px;letter-spacing:.16em}.row{display:flex;flex-wrap:wrap;gap:6px}button,select{font:600 13px system-ui;border:0;border-radius:5px;padding:9px 10px;color:#fff;background:#41414d;opacity:1}button.primary{background:#5865f2}button.danger{background:#da373c}select{width:100%;font-weight:400}details{margin-top:8px;color:#949ba4;font-size:12px}pre{overflow:auto;max-height:260px;background:#111118;padding:12px;color:#b5bac1}summary{cursor:pointer}
</style><header><h1>MusicBot · Components V2</h1><p>Bản xem trước bố cục từ payload của các hàm dựng thẻ. Dữ liệu minh họa, ảnh thay thế, nút không tương tác. Đây không phải ảnh chụp Discord; kích thước và cách xuống dòng thực tế do Discord quyết định.</p></header><main id="cards"></main>
<script>
const cards=DATA;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(s){return escape(s).replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^-# (.+)$/gm,'<span class="small">$1</span>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\x60([^\x60]+)\x60/g,'<code>$1</code>').replace(/\[([^\]]+)\]\([^\n]+?\)/g,'<a>$1</a>');}
function render(c){switch(c.type){case 17:return '<div class="card" style="--accent:#'+c.accent_color.toString(16).padStart(6,'0')+'">'+c.components.map(render).join('')+'</div>';case 10:return '<div class="text">'+markdown(c.content)+'</div>';case 9:return '<div class="section"><div>'+c.components.map(render).join('')+'</div><div class="thumb" role="img" aria-label="Ảnh thu nhỏ thay thế">♫</div></div>';case 12:return '<div class="gallery" role="img" aria-label="Vị trí ảnh bìa"><b>♫</b><small>ẢNH BÌA TỪ NGUỒN PHÁT</small></div>';case 14:return c.divider===false?'<div class="space"></div>':'<hr>';case 1:return '<div class="row">'+c.components.map(render).join('')+'</div>';case 2:return '<button disabled class="'+(c.style===1?'primary':c.style===4?'danger':'')+'">'+escape((c.emoji?.name||'')+' '+c.label)+'</button>';case 3:return '<select disabled aria-label="Chọn đài"><option>'+escape(c.placeholder)+'</option>'+c.options.map(o=>'<option>'+escape(o.label)+'</option>').join('')+'</select>';default:return '';}}
document.querySelector('#cards').innerHTML=cards.map(c=>'<article><p class="label">'+escape(c.title)+'</p>'+c.payload.components.map(render).join('')+'<details><summary>Payload Components V2</summary><pre>'+escape(JSON.stringify(c.payload,null,2))+'</pre></details></article>').join('');
</script></html>`;
writeFileSync(new URL('preview.html', import.meta.url), html.replace('DATA', data));
console.log(`Generated ${cards.length} card previews from production builders.`);
