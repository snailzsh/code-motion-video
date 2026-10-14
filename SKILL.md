---
name: code-motion-video
description: 用代码做动效视频：把画面写成单文件 HTML（DOM / SVG / Canvas / GSAP / Three.js），再逐帧渲染成 MP4，不录屏、不掉帧，可混入配音。覆盖产品发布片、Logo 演绎与片头、动态字体与金句、UI 形变循环、科普讲解、配音驱动的竖屏讲史与知识短视频、数据故事、3D 产品与场景、像素与游戏演出。方法提炼自 awesome-opus5-5-videos 合集 700 多条 Claude Opus 5.5 动效案例。只要用户想做动画或动效视频、片头片尾、motion graphics、讲解动画、把一段配音做成画面、用 HTML 或代码做视频、把网页动画导出成 MP4，或者拿到一条网上的动效 prompt 想复刻、改写、判断该用哪种，都应使用本 skill，即使用户没提到"代码"。不适用于需要真人或写实镜头的片子（用视频生成模型），也不适用于只剪辑已有素材。
---

# 代码动效视频

用代码写画面，逐帧渲染出片。

这套方法来自对 [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) 700 多条案例的拆解。结论很一致：好片子和"抽奖"片子的差别，几乎都在动手写代码之前。

下面命令里的 `$SKILL` 指本 skill 所在的目录（SKILL.md 所在的文件夹），`page.html` 等文件放在用户的项目目录。`references/`、`assets/` 也都指本 skill 目录下的文件夹。

## 五条原则

1. **一个视觉主意贯穿全片。** 例如"一根柱子每折一次长高一倍""整片发生在 logo 的句点里"。没有这个主意，模型就会回落成功能幻灯片或特效大杂烩。
2. **数字代替形容词。** "惊艳""Apple 级""go all out"无法执行；时长、画幅、hex 色值、字号、缓动曲线、停留秒数可以执行。
3. **每一帧只由时间 t 决定。** 这是逐帧渲染、不掉帧、渲多少次都一样的前提。
4. **先出静帧，再渲全片。** 4–6 张关键静帧确认构图和文字；渲完看总览图，修最差的 3 处。
5. **事实不编。** 产品功能、数字、年份、引语都要有来源；拿不准就不上屏，或者标"约"。

## 工作流

### 1. 定规格

从用户的话里提取规格，缺的用下表缺省值，并在导演稿里写明。用户在场时最多问 1–3 个关键问题，通常是：发在哪、有没有配音、有没有素材或事实来源。

**有配音的片子，这一步就先把时间轴做出来**（见下文「配音驱动的片子」）：先跑 `build_cues.py` 拿到每句的起止时间，第 3 步的分镜表才有时间码可填。

| 项 | 缺省 |
|---|---|
| 画幅 | 抖音、视频号、小红书：1080×1920；X：1080×1080；B 站、YouTube：1920×1080；播客（小宇宙、Apple Podcasts）的视频版：1080×1080 |
| 帧率 | 30 |
| 时长 | 有配音按配音；没有配音时：Logo 4–8s，发布片 15–30s，讲解 30–90s |
| 节奏 | 有配音以配音为时钟；没有配音按 120 BPM（一拍 0.5s）排 |
| 声音 | 有配音用配音；片头片尾、Logo 默认要有一记声音标识（音效或短乐句），用户没给就合成占位并说明 |
| 配色 | 底色 + 主文字 + 辅助色 + 一个强调色（只给英雄物） |
| 字体 | 中文 PingFang SC / Noto Sans CJK SC；数字用等宽数字 |

### 2. 选型

读 `references/choose.md`。按用途选片型，片型决定结构骨架和时长分配；再按画面需求选技术栈。两条默认规则：
- 能 2D 就不上 3D，3D 只在要讲空间关系时才值得；
- 文字永远放 DOM 层。

### 3. 写导演稿

按 `references/brief.md` 的模板，在项目目录写 `brief.md`，至少包括：
- 一句话视觉主意
- 锁定文案（逐字）
- 分镜表：时间 | 画面 | 文字 | 动作 | 怎么接下一镜
- 视觉系统：hex 色值、字体、字号
- 动效参数
- 禁止清单
- 验收清单

片型对应的配方在 `references/recipes.md`。有配音时，分镜表按句建行（模板里有配音版的列）。

用户在场时，先把导演稿给他确认再动手。不在场就按导演稿继续，交付时说明做了哪些假设。

用户给的是一句话 prompt（比如"做一个 15 秒炫技视频，go all out"）时，不要直接照做。先把它扩写成导演稿，`references/brief.md` 第 4 节有示例。

### 4. 搭骨架、出静帧

复制 `assets/template.html` 到项目目录再改。它本身就是一条能渲染的 12 秒竖屏样片，配置、旁白时间轴、工具函数（缓动、弹簧、种子随机）和渲染协议都已写好。

先把每个场景的定格状态做对，然后：

```
node $SKILL/scripts/render.mjs page.html --check
node $SKILL/scripts/render.mjs page.html --stills 1.5,4,8,11 -o stills/
```

`--check` 默认在全片 7 个时间点抽检。短片（10 秒以内）的动作往往挤在前几秒，用 `--check-at 0.5,1.2,2.4` 把动作最密的时刻填进去。

用 Read 打开静帧检查：
- 文字有没有截断或重叠；
- 层级是否一眼可读；
- 竖屏有没有压到平台界面区。

### 5. 写动画

按 `references/craft.md` 做运动：
- 下一镜从上一镜的物体长出来；
- 入场快进慢停；
- 同组元素错开 2–4 帧；
- 高潮前蓄力 0.3–0.5s；
- 结尾静止 1s。

技术约束（禁止项、各动画库怎么接、素材怎么嵌）见 `references/determinism.md`。

### 6. 渲染与验收

```
node $SKILL/scripts/render.mjs page.html --contact 12 -o sheet.png        # 总览图，挑最差的 3 处修
node $SKILL/scripts/render.mjs page.html -o preview.mp4 --scale 0.5 --fast  # 快速预览
node $SKILL/scripts/render.mjs page.html -o final.mp4 --audio voice.wav   # 正式出片（--blur 4 加运动模糊）
```

按 `references/determinism.md` 第 7 节的清单验收。

交付：
- MP4、源 HTML（连同 vendor、字体等素材）
- 导演稿、总览图
- 复现命令（写进导演稿最后一节）
- 说明做了哪些假设、遗留了哪些取舍

## 配音驱动的片子（讲史、科普、口播配画面）

时间轴以旁白为准，不以拍子为准：

1. 逐句合成配音（一句一个文件）。
2. 拼成音轨并生成时间轴，响度会自动标准化到 -14 LUFS：
   ```
   python3 $SKILL/scripts/build_cues.py --lines script.txt --clips clips/ --out-audio voice.wav --out-cues cues.json
   ```
   金句后要多停一会儿，用 `--gap-after 3:0.8`。
3. 画面动作挂在每句开始的时间点上。

时间规则、竖屏版式、讲史与科普的视觉系统、混音命令都在 `references/voiceover.md`。

## 参考原合集

`references/examples.md` 按片型列了 39 条值得看的案例，并说明为什么值得看。

要检索更多，或看某条 prompt 全文（运行时从 GitHub 拉取）：

```
python3 $SKILL/scripts/find_examples.py --category explainer --full
python3 $SKILL/scripts/find_examples.py --tech threejs --q camera
python3 $SKILL/scripts/find_examples.py --show gdgtify-130294
```

引用或改写别人的 prompt 时，保留原作者署名和原帖链接。

## 首次使用

需要 Node 18+ 和 ffmpeg。在 `$SKILL/scripts/` 目录执行一次：

```
npm install
npx playwright install chromium
```

本机装了 Chrome 的，可以跳过第二步，渲染时加 `--channel chrome`。

预览可以直接用浏览器打开 HTML。如果页面用了 ES 模块、fetch 或视频素材，用 `node $SKILL/scripts/render.mjs page.html --serve` 起一个本地服务器再打开。

## 文件索引

| 文件 | 什么时候读 |
|---|---|
| `references/choose.md` | 第 2 步：该不该用代码做、选片型、选技术栈 |
| `references/brief.md` | 第 3 步：导演稿模板、各部分写到什么粒度、低效写法对照、扩写示例 |
| `references/recipes.md` | 第 3 步：10 种片型的配方 |
| `references/craft.md` | 第 5 步：转场、缓动、节奏、镜头、文字、配色、声音、打击反馈、3D、质感与颗粒、像素 |
| `references/determinism.md` | 第 4–6 步：渲染协议、禁止项、GSAP / Three.js / 视频素材接法、验收清单、排错 |
| `references/voiceover.md` | 有配音时 |
| `references/examples.md` | 需要参考案例时 |
| `assets/template.html` | 起手模板兼样片 |
| `scripts/render.mjs` | 渲染 MP4、静帧、总览图、确定性检查、本地预览 |
| `scripts/build_cues.py` | 逐句配音 → 音轨 + 时间轴 |
| `scripts/find_examples.py` | 检索原合集 |
