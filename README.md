# code-motion-video · 代码动效视频 Skill

让 Claude 用代码（HTML / SVG / Canvas / GSAP / Three.js）做动效视频，并逐帧渲染成 MP4。不录屏，不掉帧，同一份代码渲多少次结果都一样，还能和配音逐句对齐。

<p align="center">
  <img src="docs/demo.gif" width="270" alt="样片：一张纸折 42 次能到月球吗">
</p>

<p align="center"><sub>样片：直接渲染本仓库的 <code>assets/template.html</code> 得到的 12 秒竖屏科普片（<a href="docs/demo.mp4">MP4</a>）。它同时也是起手模板。</sub></p>

## 为什么做这个

网上流传着几百条"用 Claude Opus 5.5 写代码做动效视频"的 prompt，拿来照抄经常像开盲盒：
- 同一句 prompt，每次出来的东西不一样；
- 网页动画录屏会掉帧；
- 不知道自己要的片子该用哪种写法。

这个 skill 把 [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) 合集的 700 多条案例拆了一遍。结论很一致：好片子和抽奖片子的差别，几乎都在动手写代码之前。提炼出来的东西包括：

- **选型**：什么用途用什么片型、什么技术栈，什么时候根本不该用代码做
- **导演稿模板**：把"做个炫酷视频"变成可以验收的分镜，并附低效写法对照表
- **10 种片型配方**：发布片、Logo、动态字体、UI 形变、showreel、科普、配音竖屏、数据故事、3D、像素演出
- **动效手艺规则**：转场、缓动、节奏、镜头、文字、配色、声音、打击反馈
- **可渲染的技术规范和渲染脚本**：逐帧截图交给 ffmpeg 合成，支持运动模糊、混音、多画幅、确定性检查
- **配音驱动工作流**：逐句配音 → 时间轴 → 画面跟着话走（适合讲史、科普口播）
- **39 条精选案例索引**，以及全量检索脚本

## 安装

需要 **Node 18+**、**ffmpeg**（macOS：`brew install ffmpeg`）和 **Python 3**。

### Claude Code

```bash
git clone https://github.com/snailzsh/code-motion-video.git ~/.claude/skills/code-motion-video
cd ~/.claude/skills/code-motion-video/scripts
npm install
npx playwright install chromium   # 本机已装 Chrome 可跳过，渲染时加 --channel chrome
```

### skills 命令行

```bash
npx skills add snailzsh/code-motion-video
```

装好后，到 skill 目录的 `scripts/` 里同样执行一次 `npm install`。

## 怎么用

直接跟 Claude 说需求就行，例如：

- 「做一条 15 秒的产品发布片，产品是 ××，发 X」
- 「这是我的配音稿和逐句配音文件，做成竖屏讲史视频」
- 「给我的账号做一个 5 秒片头，名字叫 ××」
- 「网上看到这条 prompt，帮我判断用哪种做法，再改写一下」

Claude 会按这个顺序做：定规格 → 选型 → 写导演稿给你确认 → 出关键静帧 → 写动画 → 渲染 MP4 并自检。

### 脚本也可以单独用

```bash
cd scripts

# 渲染
node render.mjs page.html -o out.mp4                        # 全片
node render.mjs page.html -o out.mp4 --audio voice.wav      # 混入配音
node render.mjs page.html -o preview.mp4 --scale 0.5 --fast # 快速预览
node render.mjs page.html -o out.mp4 --blur 4               # 运动模糊
node render.mjs page.html --stills 1,4,8 -o stills/         # 关键静帧
node render.mjs page.html --contact 12 -o sheet.png         # 总览图
node render.mjs page.html --check                           # 确定性检查（--check-at 指定时间点）
node render.mjs page.html --serve                           # 本地预览服务器

# 逐句配音 → 一条音轨 + 时间轴
python3 build_cues.py --lines script.txt --clips clips/ --out-audio voice.wav --out-cues cues.json
python3 build_cues.py ... --gap-after 3:0.8                 # 第 3 句后多停一会儿；音轨默认标准化到 -14 LUFS

# 检索原合集（运行时从 GitHub 拉取）
python3 find_examples.py --category explainer --full
python3 find_examples.py --show gdgtify-130294
```

任何 HTML 页面只要暴露下面这个接口，就能用 `render.mjs` 渲染：

```js
window.__motion = { width, height, fps, duration, ready, seek(t) }
```

<details>
<summary>样片总览图（render.mjs --contact 生成）</summary>
<img src="docs/contact-sheet.png" alt="总览图">
</details>

## 目录结构

```
code-motion-video/
├── SKILL.md                 工作流（Claude 读这个）
├── references/
│   ├── choose.md            选型：该不该用代码 / 片型 / 技术栈
│   ├── brief.md             导演稿模板、低效写法对照、扩写示例
│   ├── recipes.md           10 种片型配方
│   ├── craft.md             动效手艺规则
│   ├── determinism.md       渲染协议、各动画库接法、验收清单、排错
│   ├── voiceover.md         配音驱动：时间轴、竖屏版式、讲史视觉系统、混音
│   └── examples.md          39 条精选案例（带作者和原帖链接）
├── assets/template.html     起手模板兼样片
├── scripts/
│   ├── render.mjs           逐帧渲染 / 静帧 / 总览图 / 检查 / 预览
│   ├── build_cues.py        逐句配音 → 音轨 + cues.json
│   ├── find_examples.py     检索原合集
│   └── package.json
└── docs/                    README 用的样片
```

## 致谢与版权

- 案例全部来自 [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos)（MIT）。原 prompt 和视频的版权归各自作者。
- 本仓库不复制原 prompt 全文，只做方法提炼和带署名的索引；需要全文时，由 `find_examples.py` 在运行时从原仓库读取。
- 引用或改写别人的 prompt 时，请保留原作者署名和原帖链接。
- 本仓库的代码与文档以 [MIT](LICENSE) 协议发布。
