# 可渲染的技术规范、常见坑、验收清单

逐帧渲染的前提只有一个：**画面上每个值都只由时间 t 决定。** 满足了它，就能按任意顺序、任意次数取任意一帧，结果都一样。这样不掉帧、能加运动模糊、能只重渲一段、能多画幅导出。

## 目录
1. 渲染协议
2. 禁止项和替代写法
3. 各种动画库怎么接
4. 随机、物理、粒子
5. 素材：字体、图片、视频
6. 运动模糊、多画幅、性能
7. 验收清单
8. 排错

---

## 1. 渲染协议

页面需要暴露：

```js
window.__motion = {
  width: 1080, height: 1920, fps: 30, duration: 12,
  ready: Promise,            // 字体、图片、模型、视频都加载完后 resolve
  seek(t) { render(t); },    // 可以返回 Promise（例如要等 <video> 跳转完成）
};
```

- 渲染器会在网址后加 `?render=1`。页面看到它，就要隐藏控制条、不启动自动播放循环。**自动播放的 rAF 循环如果还在跑，会覆盖 seek 设好的画面。**
- 本地文件通过 render.mjs 自带的静态服务器加载（以 HTML 所在目录为根）。所以 ES 模块、import map、`fetch('cues.json')`、`<video>` 拖动都能用。预览时用 `node $SKILL/scripts/render.mjs page.html --serve`。
- 舞台尺寸固定为输出尺寸（如 1080×1920）。预览时用 CSS transform 缩放适配窗口，渲染时不缩放。模板第 6 节已经写好。

---

## 2. 禁止项和替代写法

| 不要用 | 为什么 | 改用 |
|---|---|---|
| CSS `transition`、自己跑的 CSS `animation` | 按真实时间走，不受 seek 控制 | JS 在 render(t) 里直接写样式；非要用 CSS 动画，就暂停它并设 `animation-delay: -t s` |
| `setTimeout` / `setInterval` | 同上 | 用 `prog(t, a, b)` 算进度 |
| `Date.now()`、`performance.now()` 写在 render 里 | 同上 | 只用参数 t |
| `Math.random()` | 每次都不一样 | 模板里的 `rand(i, seed)`：同一个 i 永远同一个值 |
| 帧间累积（`x += v`） | 依赖播放历史，跳帧就错 | 闭式公式；或者加载时预计算整段，seek 时查表 |
| 在 seek 里创建或删除元素 | 慢，且容易泄漏状态 | 启动时建好，render 里只改属性和显隐 |
| 给被镜头缩放的元素加 `will-change` | 文字会糊 | 不加 |
| 改了 `ctx.globalAlpha` 等状态不还原 | 后面画的东西突然跳出 | `ctx.save()` / `ctx.restore()` 成对用 |

用 `node $SKILL/scripts/render.mjs page.html --check` 验证：它按乱序把几个时间点各渲两遍，逐像素比对。

---

## 3. 各种动画库怎么接

**GSAP**：所有补间放进一条暂停的时间线，由 seek 驱动。不要在时间线外单独 `gsap.to()`，那样的补间会按真实时间自己播。
```js
const tl = gsap.timeline({ paused: true });
tl.to("#a", { x: 900, duration: 1.2, ease: "expo.out" }, 0.2);
window.__motion = { ..., seek(t) { tl.seek(t, false); } };
```
gsap.min.js 下载到本地，和 HTML 放在一起。

**Web Animations API**：`anim.pause()`，然后在 seek 里设 `anim.currentTime = t * 1000`。

**Lottie**：`anim.goToAndStop(t * 1000, false)`。

**Three.js**：
```html
<script type="importmap">{ "imports": { "three": "./vendor/three.module.js" } }</script>
<script type="module">
import * as THREE from "three";
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
function render(t) { /* 由 t 摆好相机和物体 */ renderer.render(scene, camera); }
window.__motion = { width: W, height: H, duration: D, ready: loadAll(), seek: render };
</script>
```
- 锁定版本：把 `three.module.js` 下载到本地，不要渲染时从 CDN 拉。
- 动画混合器用 `mixer.setTime(t)`，不用 `THREE.Clock`。
- 像素比设为 1，尺寸设为输出尺寸，否则输出发虚或发糊。
- 无头环境 WebGL 不可用或黑屏时，渲染加 `--gl swiftshader`（软件渲染，慢但稳定）。

**Canvas 2D**：canvas 的 width/height 直接设成输出像素。每帧先清屏，再完整重画。

---

## 4. 随机、物理、粒子

- **随机**：`rand(i, seed)` 按粒子编号取值。粒子的出生时间、方向、速度都由编号算出来，位置用"出生后经过的时间"代入运动公式算。
- **物理**：
  - 简单运动用解析解（抛物线、阻尼振动）。
  - 复杂模拟在页面加载时用固定步长（如 1/240 秒）跑完整段，把每帧状态存进数组，seek 时直接查表。
  - 不要在 seek 里从 0 重新模拟，太慢。
- **粒子池**：启动时预分配，render 里只算位置，不新建对象。

---

## 5. 素材：字体、图片、视频

- **字体**：
  - 系统字体（PingFang SC、Noto Sans CJK SC）在同一台机器上是稳定的，换机器可能变。
  - 要跨机器一致，就把字体文件放进项目，用 `@font-face` 引入，并把它加进 `ready`。
  - 中文字体动辄十几 MB，可以用 fonttools 按用到的字裁剪：
    ```
    pip install fonttools brotli
    pyftsubset NotoSansSC-Bold.otf --text-file=script.txt --output-file=fonts/title.woff2 --flavor=woff2
    ```
    - 没装 brotli 时 woff2 会报错，可以改用 `--flavor=woff`（不需要额外依赖），或者直接输出 .otf。
    - `.ttc` 是字体集（如 Linux 上的 NotoSansCJK-Bold.ttc），要加 `--font-number=N` 选其中一个（简体中文通常是 2，不确定就挨个试）。
  - 模板里有用 `document.fonts.load()` 等字体的写法注释，自定义字体要照那样接进 `ready`。
- **图片**：放在 HTML 同目录或子目录，等 `img.decode()` 完成后再 resolve `ready`。
- **视频素材**：
  - 先重编码成全关键帧，跳转才准：
    ```
    ffmpeg -i clip.mp4 -c:v libx264 -g 1 -crf 18 -an clip_i.mp4
    ```
  - seek 里设 `video.currentTime = t - 片段起点`，并等待 `seeked` 事件后再返回（seek 返回 Promise）。
  - 最稳的办法是把视频抽成 JPEG 序列（`ffmpeg -i clip.mp4 -q:v 2 frames/%04d.jpg`），按帧号换图片。
- **AI 生成的角色图**：让它生成纯绿底，自己抠图。直接要求透明底，经常得到假的棋盘格背景。

---

## 6. 运动模糊、多画幅、性能

- **运动模糊**：`--blur 4` 表示每帧取 4 个子帧平均，快速甩动用 8。渲染时间按倍数增加，所以只在终版加。开模糊时，计数器、文字这类要清晰的东西，不要随子帧时间变化（按整帧时间取值）。
- **多画幅**：
  - 布局写成画幅的函数，场景列表共用。
  - 页面读网址参数，如 `?format=square`，渲染时用 `--param format=square` 传入。
  - 竖版要重新构图，不是把横版裁一刀。
- **性能参考**：1080×1920 的干净 DOM/SVG 页面每帧约 0.1 秒，12 秒的片子渲染约 40 秒。
  - 单帧明显慢（>0.3 秒）时，先查大面积的 CSS `filter: blur()`、`backdrop-filter`，以及上千个 SVG 节点。
  - 满屏颗粒、噪点会让 PNG 中间帧很大、编码很慢，加 `--fast` 改用 JPEG 中间帧，速度能快好几倍。
  - 改样片时用 `--scale 0.5 --fast` 和 `--from/--to` 只渲一段；`--blur` 只在终版加。

---

## 7. 验收清单

1. **确定性**：`--check` 通过。短片（10 秒以内）加 `--check-at`，把动作最密的几个时刻填进去，默认抽检点可能全落在动作之外。
2. **静帧**：每个场景的定格时刻各出一张（`--stills`），用 Read 打开看：
   - 文字截断、重叠；
   - 层级是否一眼可读；
   - 竖屏有没有压到平台界面区（见 voiceover.md 第 5 节）。
3. **总览图**：`--contact 12`，从节奏和构图上挑最差的 3 处修。
4. **时长和帧数**：
   ```
   ffprobe -v error -show_entries stream=nb_frames,duration -of compact out.mp4
   ```
5. **意外冻结**（应该只在结尾）：
   ```
   ffmpeg -i out.mp4 -vf freezedetect=n=0.001:d=0.8 -map 0:v -f null - 2>&1 | grep freeze_
   ```
   - 结尾报出的冻结起点比代码里的静止时刻早 0.3–0.5 秒是正常的：缓推的尾巴每帧移动不到 1 像素。不用去修。
   - 中途报冻结，多半是停留段没有缓推，或者缓推用了两头慢的缓动（见 craft.md 第 3 节）。
6. **响度**（有声时）：配音片目标约 -14 LUFS（build_cues.py 已自动处理）；只有音效的短片头不强求 -14，峰值到 -1 dB 左右即可。命令见 voiceover.md 第 7 节。
7. **撞脸**：落版、结尾帧单独当一个 Logo 看，配色加构图像不像某个知名品牌。
8. **事实**：数字、年份、引文、产品功能逐条对照来源。
9. **看成片**：检查最终 MP4 解码出来的画面，不是浏览器里的预览。

交付：MP4、源 HTML（含 vendor、字体等）、导演稿、总览图、复现命令，并写明遗留的取舍。

---

## 8. 排错

| 现象 | 常见原因 | 处理 |
|---|---|---|
| `--check` 不一致 | 帧间状态、Math.random、CSS 过渡、rAF 循环没关 | 按第 2 节逐项排查；确认 `?render=1` 时没有启动播放循环 |
| 第一帧空白或字体不对 | 字体、图片没加载完就开渲 | 把它们加进 `ready` |
| 出现方块字 | 机器上没有该字体 | 用 @font-face 引入字体文件 |
| WebGL 黑屏 | 无头浏览器没有 GPU | `--gl swiftshader`；`preserveDrawingBuffer: true` |
| 3D 输出发虚 | 像素比或渲染尺寸不等于输出尺寸 | `setPixelRatio(1)`，`setSize(W, H)` |
| 颜色和预览不一样 | 显示器色彩配置 | 渲染器已强制 sRGB；预览时注意显示器差异 |
| 文字发糊 | `will-change`、非整数缩放 | 去掉 `will-change`；关键文字落在整数像素上 |
| 视频素材跳帧 | 关键帧太稀、没等 `seeked` | 全关键帧重编码，或改用 JPEG 序列 |
| 音画不同步 | cues 和音轨不是同一次生成的 | 重新跑 build_cues.py，两者一起更新 |
| 成片声音很小 | 逐句 TTS 拼出来偏轻 | 用 build_cues.py（默认标准化到 -14 LUFS），或按 voiceover.md 第 7 节处理 |
| 冻结检测在中途报警 | 停留段没有运动，或缓推两端太慢 | 停留段加匀速缓推，见 craft.md 第 3 节 |
| 渲染很慢 | 大面积滤镜、节点太多、开了运动模糊 | 预览用 `--scale 0.5`；终版再加模糊 |
