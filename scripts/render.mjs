#!/usr/bin/env node
// 逐帧渲染：把一个"可 seek 的 HTML 动效页"渲成 MP4 / 静帧 / 总览图，或做确定性检查。
// 不录屏，所以不会掉帧；同一份 HTML 渲多少次结果都一样。
//
// 页面约定（assets/template.html 已实现）：
//   window.__motion = { width, height, duration, fps?, ready?: Promise, seek(t): void | Promise }
//   渲染时网址会带 ?render=1，页面应隐藏控制条、停止自动播放。
//
// 用法：
//   node render.mjs page.html -o out.mp4                    全片
//   node render.mjs page.html -o preview.mp4 --scale 0.5    半分辨率快速预览
//   node render.mjs page.html -o out.mp4 --audio voice.mp3  混入配音/音乐
//   node render.mjs page.html -o out.mp4 --from 3 --to 8    只渲一段
//   node render.mjs page.html -o out.mp4 --blur 4           4 个子帧做运动模糊（慢 4 倍）
//   node render.mjs page.html --stills 0,2.5,9 -o stills/   指定时间点出静帧
//   node render.mjs page.html --contact 12 -o sheet.png     均匀抽约 12 帧拼成总览图（不能整除时补满网格）
//   node render.mjs page.html --check                       确定性检查（乱序重渲比对像素）
//   node render.mjs page.html --check --check-at 0.5,1.2,2.4  在指定时间点检查（短片把动作最密的时刻填进来）
//   node render.mjs page.html -o out.mp4 --fast             用 JPEG 中间帧，带颗粒/噪点的画面快很多（画质略降，适合预览）
//   node render.mjs page.html --param format=square -o sq.mp4  给页面传网址参数（多画幅等），可重复
//   node render.mjs page.html --serve                       只起本地服务器，在浏览器里预览（ES 模块、fetch、视频素材都能用）
//
// 本地文件会通过脚本自带的静态服务器（以 HTML 所在目录为根）加载，而不是 file://，
// 这样 <script type="module">、import map、fetch('cues.json')、<video> 拖动都正常。
//
// 依赖：Node 18+、ffmpeg（PATH 里）、playwright（在本目录 npm install 后 npx playwright install chromium）。
// 也可以用本机 Chrome：--channel chrome，或 --chromium /path/to/chrome

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const opts = { params: [], fps: null, from: 0, to: null, scale: 1, blur: 1, shutter: 0.5, crf: 18, preset: "medium", gl: "default" };
let input = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  switch (a) {
    case "-o": case "--out": opts.out = next(); break;
    case "--fps": opts.fps = +next(); break;
    case "--from": opts.from = +next(); break;
    case "--to": opts.to = +next(); break;
    case "--scale": opts.scale = +next(); break;
    case "--blur": opts.blur = Math.max(1, Math.round(+next())); break;
    case "--shutter": opts.shutter = +next(); break;
    case "--audio": opts.audio = next(); break;
    case "--stills": opts.stills = next().split(",").map(Number); break;
    case "--contact": opts.contact = Math.max(2, +next()); break;
    case "--check": opts.check = true; break;
    case "--check-at": opts.checkAt = next().split(",").map(Number); break;
    case "--fast": opts.fast = true; break;
    case "--crf": opts.crf = +next(); break;
    case "--preset": opts.preset = next(); break;
    case "--channel": opts.channel = next(); break;
    case "--chromium": opts.chromium = next(); break;
    case "--gl": opts.gl = next(); break;  // default | swiftshader
    case "--param": opts.params.push(next()); break;
    case "--serve": opts.serve = true; break;
    case "--port": opts.port = +next(); break;
    case "-h": case "--help": usage(0); break;
    default:
      if (a.startsWith("-")) { console.error(`未知参数：${a}`); usage(1); }
      input = a;
  }
}
function usage(code) {
  // 只打印文件开头那一段连续注释
  const lines = fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1);
  const head = [];
  for (const l of lines) { if (!l.startsWith("//")) break; head.push(l.replace(/^\/\/ ?/, "")); }
  console.log(head.join("\n"));
  process.exit(code);
}
if (!input) usage(1);
if (!opts.check && !opts.serve && !opts.out) { console.error("缺少 -o 输出路径"); process.exit(1); }

// ---------- 依赖 ----------
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("找不到 playwright。请在 scripts/ 目录执行：\n  npm install\n  npx playwright install chromium\n（或者用 --channel chrome 调用本机已装的 Chrome，但仍需 npm install）");
  process.exit(1);
}
const needFfmpeg = !opts.check && !opts.stills && !opts.serve;
if (needFfmpeg || opts.contact) {
  const ok = await new Promise(r => { const p = spawn("ffmpeg", ["-version"]); p.on("error", () => r(false)); p.on("exit", c => r(c === 0)); });
  if (!ok) { console.error("找不到 ffmpeg，请先安装（macOS：brew install ffmpeg）"); process.exit(1); }
}

// ---------- 打开页面 ----------
let server = null;
let url;
if (/^https?:\/\//.test(input)) url = new URL(input);
else {
  const file = path.resolve(input);
  if (!fs.existsSync(file)) { console.error(`找不到文件：${file}`); process.exit(1); }
  server = await serveDir(path.dirname(file), opts.port || 0);
  url = new URL(`http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(file))}`);
}
if (opts.serve) {
  console.log(`预览地址：${url.href}\n（Ctrl+C 结束）`);
  await new Promise(() => {});
}
url.searchParams.set("render", "1");
for (const kv of opts.params) {
  const k = kv.split("=")[0], v = kv.slice(k.length + 1);
  url.searchParams.set(k, v);
}

// --disable-partial-raster：关掉局部重绘，否则同一帧在不同"上一帧"之后渲出来抗锯齿会差 1–2 个像素
// --force-color-profile=srgb：不跟随显示器色彩配置（Mac 上不加会偏色）
const launchArgs = ["--disable-partial-raster", "--force-color-profile=srgb", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars", "--font-render-hinting=none"];
if (opts.gl === "swiftshader") launchArgs.push("--use-angle=swiftshader");
const browser = await chromium.launch({
  headless: true,
  args: launchArgs,
  ...(opts.channel ? { channel: opts.channel } : {}),
  ...(opts.chromium ? { executablePath: opts.chromium } : {}),
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: opts.scale });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", e => { pageErrors.push(e.message); console.error("[页面报错]", e.message); });
page.on("console", m => { if (m.type() === "error") console.error("[console.error]", m.text()); });

await page.goto(url.href, { waitUntil: "load" });
try {
  await page.waitForFunction(() => window.__motion && typeof window.__motion.seek === "function", null, { timeout: 30000 });
} catch {
  console.error("页面没有暴露 window.__motion.seek(t)。请按 assets/template.html 的第 6 节实现渲染协议。");
  await browser.close(); process.exit(1);
}
const meta = await page.evaluate(async () => {
  const m = window.__motion;
  if (m.ready) await m.ready;
  await document.fonts.ready;
  return { width: m.width, height: m.height, duration: m.duration, fps: m.fps || null };
});
for (const k of ["width", "height", "duration"]) {
  if (!(meta[k] > 0)) { console.error(`window.__motion.${k} 无效：${meta[k]}`); await browser.close(); process.exit(1); }
}
await page.setViewportSize({ width: meta.width, height: meta.height });

const fps = opts.fps || meta.fps || 30;
const from = Math.max(0, opts.from);
const to = Math.min(meta.duration, opts.to ?? meta.duration);
const outW = Math.round(meta.width * opts.scale), outH = Math.round(meta.height * opts.scale);

async function seek(t) {
  await page.evaluate(async t => {
    await window.__motion.seek(t);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
}
async function shot(t, fast = false) {
  await seek(t);
  return fast ? page.screenshot({ type: "jpeg", quality: 92 }) : page.screenshot({ type: "png" });
}
const fmtT = t => t.toFixed(3).replace(/\.?0+$/, "") || "0";

function ffmpeg(args) {
  const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => p.on("exit", c => (c === 0 ? res() : rej(new Error(`ffmpeg 退出码 ${c}`)))));
  const write = buf => new Promise(r => (p.stdin.write(buf) ? r() : p.stdin.once("drain", r)));
  return { write, end: () => { p.stdin.end(); return done; } };
}

const t0 = Date.now();
try {
  if (opts.check) await runCheck();
  else if (opts.stills) await runStills(opts.stills);
  else if (opts.contact) await runContact(opts.contact);
  else await runVideo();
} finally {
  await browser.close();
  if (server) server.close();
}
if (pageErrors.length) console.error(`注意：渲染期间页面报错 ${pageErrors.length} 次，见上方日志。`);
console.log(`用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ---------- 模式 ----------
async function runVideo() {
  const N = opts.blur;
  const frames = Math.max(1, Math.round((to - from) * fps));    // 区间 [from, to)，不重复末帧
  const vf = [];
  if (N > 1) vf.push(`tmix=frames=${N}`, `select=not(mod(n+1\\,${N}))`, `setpts=N/(${fps}*TB)`);
  vf.push("scale=trunc(iw/2)*2:trunc(ih/2)*2", "format=yuv420p");
  const args = ["-f", "image2pipe", "-c:v", opts.fast ? "mjpeg" : "png", "-framerate", String(fps * N), "-i", "-"];
  if (opts.audio) args.push("-ss", String(from), "-i", opts.audio);
  args.push("-vf", vf.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", opts.preset, "-crf", String(opts.crf));
  if (opts.audio) args.push("-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k");
  args.push("-t", String(frames / fps), "-movflags", "+faststart", opts.out);
  fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });

  console.log(`渲染 ${outW}×${outH} @${fps}fps，${fmtT(from)}–${fmtT(to)}s，共 ${frames} 帧${N > 1 ? `（每帧 ${N} 子帧运动模糊）` : ""}`);
  const ff = ffmpeg(args);
  let lastPct = -1;
  for (let i = 0; i < frames; i++) {
    const ti = from + i / fps;
    for (let j = 0; j < N; j++) {
      const t = N > 1 ? ti + (j / N) * opts.shutter / fps : ti;
      await ff.write(await shot(t, opts.fast));
    }
    const pct = Math.floor(((i + 1) / frames) * 10) * 10;
    if (pct !== lastPct && pct % 10 === 0) { process.stdout.write(`${pct}% `); lastPct = pct; }
  }
  await ff.end();
  console.log(`\n已输出 ${opts.out}`);
}

async function runStills(times) {
  fs.mkdirSync(opts.out, { recursive: true });
  for (const t of times) {
    const file = path.join(opts.out, `t${fmtT(t)}s.png`);
    fs.writeFileSync(file, await shot(Math.min(t, meta.duration)));
    console.log(file);
  }
}

async function runContact(n) {
  const ratio = meta.height / meta.width;
  // 优先选能整除 n 的列数（正好 n 格），实在不合适再补满网格
  const target = Math.sqrt(n * ratio);
  const divs = [];
  for (let c = 2; c <= n; c++) if (n % c === 0) divs.push(c);
  let cols = divs.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
  if (!cols || Math.abs(cols - target) > target * 0.5) cols = Math.max(2, Math.round(target));
  const rows = Math.ceil(n / cols);
  const total = cols * rows;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "contact-"));
  const times = [];
  for (let k = 0; k < total; k++) {
    const t = from + ((k + 0.5) / total) * (to - from);
    times.push(t);
    fs.writeFileSync(path.join(tmp, `${String(k).padStart(3, "0")}.png`), await shot(t));
  }
  const thumbW = Math.min(480, Math.round(outW / 2) * 2);
  await ffmpeg(["-i", path.join(tmp, "%03d.png"), "-vf", `scale=${thumbW}:-2,tile=${cols}x${rows}:padding=8:margin=8:color=0x222222`, "-frames:v", "1", opts.out]).end();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`总览图 ${cols}×${rows}：${opts.out}`);
  console.log("从左到右、从上到下的时间点：" + times.map(fmtT).join("s, ") + "s");
}

async function runCheck() {
  const d = to - from;
  const times = opts.checkAt?.length
    ? opts.checkAt.map(t => Math.min(Math.max(t, 0), meta.duration))
    : [0, 0.15, 0.3, 0.45, 0.6, 0.8, 0.999].map(p => from + p * d);
  const a = [];
  for (const t of times) a.push(await shot(t));
  // 乱序再渲一遍：如果画面依赖播放历史，这里会露馅
  const order = times.map((_, k) => k).sort((x, y) => ((x * 7 + 3) % times.length) - ((y * 7 + 3) % times.length));
  const b = [];
  for (const k of order) b[k] = await shot(times[k]);
  let bad = 0;
  times.forEach((t, k) => {
    const same = a[k].equals(b[k]);
    if (!same) bad++;
    console.log(`${same ? "✓" : "✗"} t=${fmtT(t)}s ${same ? "两次一致" : "两次不一致：画面依赖播放历史（帧间状态、Math.random、计时器或 CSS 过渡）"}`);
  });
  const first = await shot(from), end = await shot(to);
  console.log(`首帧与末端时刻 ${first.equals(end) ? "相同（可无缝循环）" : "不同（如果要做循环片，需要让首尾一致）"}`);
  if (bad) { console.error(`确定性检查未通过：${bad}/${times.length}`); process.exitCode = 2; }
  else console.log("确定性检查通过");
}

// ---------- 本地静态服务器（支持 Range，视频拖动需要） ----------
function serveDir(root, port) {
  const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg",
    ".wav": "audio/wav", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
    ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".hdr": "application/octet-stream", ".wasm": "application/wasm" };
  const srv = http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
    if (rel === "/favicon.ico") { res.writeHead(204).end(); return; }
    const file = path.join(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404).end("not found"); return; }
      const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
      if (range) {
        const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : st.size - 1;
        res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": st.size, "Cache-Control": "no-store" });
        fs.createReadStream(file).pipe(res);
      }
    });
  });
  return new Promise(r => srv.listen(port, "127.0.0.1", () => r(srv)));
}
