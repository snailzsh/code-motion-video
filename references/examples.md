# 案例索引

从 [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) 的 700 多条里挑出的、最值得看的案例。"看点"是本 skill 对原 prompt 的概括；原 prompt 和视频版权归各自作者，点作者名可看原帖。

想看全文或找更多：`python3 $SKILL/scripts/find_examples.py --show <slug>`，或按类型、技术、关键词检索（见 SKILL.md）。

提醒：合集里约三分之一的条目只有晒图文案，没有完整 prompt；约 60 条是同一句"go all out"换个品牌名。下面只收有方法可学的。


## 写导演稿时的结构范本

| 案例 | 作者 | 看点 |
|---|---|---|
| [twoclipping-402193](https://skillry.dev/ai-videos/opus-5-5/twoclipping-402193) | [@twoclipping](https://x.com/twoclipping/status/2103273003555402193) | 单形状 UI 循环的六段式母模板：输入、方向、结构、实现、坑、开工方式。被多人改成日文、中文版复刻。 |
| [daniel-haida-636937](https://skillry.dev/ai-videos/opus-5-5/daniel-haida-636937) | [@daniel_haida](https://x.com/daniel_haida/status/2104139720829636937) | 记账 App 15 秒产品片的长 brief：读真实品牌源、列转场好坏对照、多时间点抽帧自检、交付清单。（部分公开） |
| [everestchris6-399895](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/everestchris6-399895.md) | [@everestchris6](https://x.com/everestchris6/status/2104965415164399895) | GSAP + Three.js 的完整生产流程，带独立评审循环和量化验收，可以直接当母版。 |
| [twoclipping-041659](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/twoclipping-041659.md) | [@twoclipping](https://x.com/twoclipping/status/2107822293653041659) | 20 秒像素热成像短片。分块模板最完整，写了 seek(t) + Playwright 逐帧渲染和转场衔接。 |
| [verbove-268381](https://skillry.dev/ai-videos/opus-5-5/verbove-268381) | [@verbove](https://x.com/verbove/status/2103483957266268381) | 确定性渲染规范写得最全：文字进出顺序、每拍静帧先审、运动模糊、多画幅导出。 |
| [flxrnc-251921](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/flxrnc-251921.md) | [@flxrnc](https://x.com/flxrnc/status/2108242454105251921) | 几乎所有要求都写成数字而不是形容词，适合对照自己的导演稿查漏。 |

## 产品 / 发布片 / 品牌

| 案例 | 作者 | 看点 |
|---|---|---|
| [twoclipping-551116](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/twoclipping-551116.md) | [@twoclipping](https://x.com/twoclipping/status/2106101258834551116) | 方形发布预告：真实视频素材嵌进设计里，以拍为单位排结构，镜头一直在动但不卡拍。 |
| [brainextends-606193](https://skillry.dev/ai-videos/opus-5-5/brainextends-606193) | [@brainextends](https://x.com/brainextends/status/2103801834930606193) | 音乐产品片：时间轴细到 0.6–0.9 秒一格，用一个常驻播放器把各镜头串起来。 |
| [howdevelop-733090](https://skillry.dev/ai-videos/opus-5-5/howdevelop-733090) | [@HowDevelop](https://x.com/HowDevelop/status/2103840883812733090) | 事实护栏的写法：先读官网和仓库，不许编造功能、指标、客户名。 |
| [notdwd-998633](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/notdwd-998633.md) | [@notdwd](https://x.com/notdwd/status/2103995183255998633) | 档案影像加一个 3D 按钮当唯一的饱和色英雄物，颜色与饱和度控制得很克制。 |
| [archiveexplorer-560622](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/archiveexplorer-560622.md) | [@ArchiveExplorer](https://x.com/ArchiveExplorer/status/2106732275685560622) | 9 拍发布片：先用线框锁定时序，再换皮，布局不动。 |
| [tetsu-tetsu333-576886](https://skillry.dev/ai-videos/opus-5-5/tetsu-tetsu333-576886) | [@tetsu_tetsu333](https://x.com/tetsu_tetsu333/status/2106177888265576886) | 日文产品片流水线：TTS 按短语拆开，自动对齐画面和字幕。配音驱动同步的样板。（部分公开） |

## Logo / 动态字体 / 形变 / showreel

| 案例 | 作者 | 看点 |
|---|---|---|
| [twoclipping-747965](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/twoclipping-747965.md) | [@twoclipping](https://x.com/twoclipping/status/2105927781678747965) | 整片发生在字标的句点里。踩坑记录价值最高：光圈按面积缓动、计数器读整帧时间。 |
| [gdgtify-929495](https://skillry.dev/ai-videos/opus-5-5/gdgtify-929495) | [@Gdgtify](https://x.com/Gdgtify/status/2103458245213929495) | 字体宣言片：词承担建筑结构，按短语而不是节拍编舞，最后回到首帧。 |
| [gdgtify-130294](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/gdgtify-130294.md) | [@Gdgtify](https://x.com/Gdgtify/status/2105570411870130294) | 20 秒文字跟着演讲走：分镜时间码、一条核心视觉规则、逐字锁定台词。 |
| [gdgtify-989608](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/gdgtify-989608.md) | [@Gdgtify](https://x.com/Gdgtify/status/2105669567036989608) | 文字沿轨道运动：只用 3 种运镜，确定性接口和抽检时间点写得很细。 |
| [heyiamnick-119558](https://skillry.dev/ai-videos/opus-5-5/heyiamnick-119558) | [@heyiamnick](https://x.com/heyiamnick/status/2109174851412119558) | 一根铅笔线升级三次的循环 showreel：三套渲染"墨水"、弹簧公式、逐拍事件。概念驱动的典范。 |
| [mounnna-497266](https://skillry.dev/ai-videos/opus-5-5/mounnna-497266) | [@Mounnna](https://x.com/Mounnna/status/2103802871934497266) | Logo 演绎：先画线框，再让低多边形碎片逐块飞入拼成 Logo，最后打出品牌名。一句话，但三步结构清楚。 |

## 科普 / 讲解 / 讲史

| 案例 | 作者 | 看点 |
|---|---|---|
| [astrothewizard-618782](https://skillry.dev/ai-videos/opus-5-5/astrothewizard-618782) | [@AstroTheWizard](https://x.com/AstroTheWizard/status/2103629247751618782) | 60 秒光子科普：准确性、字幕、配乐、音效、混音、自查回路，一份完整的 brief。 |
| [gdgtify-393073](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/gdgtify-393073.md) | [@Gdgtify](https://x.com/Gdgtify/status/2107054188836393073) | 用机械隐喻演示欧几里得素数证明，带逻辑护栏。科普和数据片的样板。 |
| [dotey-927166](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/dotey-927166.md) | [@dotey](https://x.com/dotey/status/2103964025683927166) | 《中华文明史》编年片（中文）：配乐当时钟、朱印卷号、竖排朝代 HUD、纹样随年代演进。 |
| [stokebuilder-356793](https://skillry.dev/ai-videos/opus-5-5/stokebuilder-356793) | [@stokebuilder](https://x.com/stokebuilder/status/2103896101120356793) | 给一整期播客插入 35–50 个动画：忠实原话、按说话节奏卡点、不跨剪辑点、先写风格圣经。（部分公开） |
| [henrygsing-050247](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/henrygsing-050247.md) | [@HenrygSing](https://x.com/HenrygSing/status/2106208175792050247) | 中文轻量流程：讲稿 + 导演要求 → 方案 → 分镜文件 → 逐场搭建，配本地免费 TTS。 |
| [rpa-dake-593915](https://skillry.dev/ai-videos/opus-5-5/rpa-dake-593915) | [@rpa_dake](https://x.com/rpa_dake/status/2104466394859593915) | 年表片的节奏心法：气势来自镜头砸下来的间隔，不靠信息密度。（部分公开） |
| [deedydas-407965](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/deedydas-407965.md) | [@deedydas](https://x.com/deedydas/status/2104391577091407965) | 长篇技术讲解的五段结构：是什么 → 全局地图 → 走一遍全程 → 核心抽象 → 真实执行追踪。 |
| [pluvio9yte-662953](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/pluvio9yte-662953.md) | [@Pluvio9yte](https://x.com/Pluvio9yte/status/2107087191738662953) | 中文方法论帖：素材拆解、编排表、打击反馈分级，可以直接移植。 |

## 3D 场景 / 产品 / 尺度

| 案例 | 作者 | 看点 |
|---|---|---|
| [tanabe-fragm-322001](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/tanabe-fragm-322001.md) | [@tanabe_fragm](https://x.com/tanabe_fragm/status/2107644501372322001) | 19 万片瓷砖拼成广告的最后一帧：正俯视翻转、自制景深、色彩对齐、防止文字提前露形。 |
| [agioyaz-986461](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/agioyaz-986461.md) | [@AGIOyaZ](https://x.com/AGIOyaZ/status/2103145567945986461) | 大教堂彩窗片：用光讲故事，窗、光柱、地面投影出自同一张图，色彩从冷到暖。 |
| [xanares-738984](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/xanares-738984.md) | [@Xanares](https://x.com/Xanares/status/2105770390924738984) | demoscene 风格的着色器 raymarch：先生成拍点 JSON，同一页面兼做实时播放和离线高采样渲染。 |
| [alexalbert-274839](https://skillry.dev/ai-videos/opus-5-5/alexalbert-274839) | [@alexalbert__](https://x.com/alexalbert__/status/2102466523164274839) | 复原 1906 年旧金山：先建带出处和置信度的资料表，再写可复用的生成器。"数据先行"的重建范本。 |
| [aichrislee-476025](https://skillry.dev/ai-videos/opus-5-5/aichrislee-476025) | [@aichrislee](https://x.com/aichrislee/status/2107622585307476025) | 交互式机械表 + 爆炸图：短 prompt 也能成，关键是部件清单和交互写具体。 |
| [aayush4soni-644283](https://skillry.dev/ai-videos/opus-5-5/aayush4soni-644283) | [@aayush4soni](https://x.com/aayush4soni/status/2104181266459644283) | 户型图生成可漫游的 3D 房子：尺寸冲突标出来不瞎猜，用像素一致性测试查出状态泄漏。（部分公开） |
| [victortaelin-875778](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/victortaelin-875778.md) | [@VictorTaelin](https://x.com/VictorTaelin/status/2103299766473875778) | 尺度穿越的一句话命题（数据中心内部），适合当题目，再用本 skill 扩写成导演稿。 |

## 游戏 / 像素 / 互动转视频

| 案例 | 作者 | 看点 |
|---|---|---|
| [op7418-814408](https://skillry.dev/ai-videos/opus-5-5/op7418-814408) | [@op7418](https://x.com/op7418/status/2103724883301814408) | 中文手游开宝箱演出：单文件、点一下播完整套，五段节奏、光效数值、交付前截图自检都写全了。 |
| [zacxbt-944604](https://skillry.dev/ai-videos/opus-5-5/zacxbt-944604) | [@zacxbt](https://x.com/zacxbt/status/2103808699466944604) | 像素法师施法循环：整数缩放、固定色板、参数量化、零分配粒子池，像素规矩最标准。 |
| [godsboy7777-150194](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/godsboy7777-150194.md) | [@GodsBoy7777](https://x.com/GodsBoy7777/status/2103117450854150194) | 弹珠机械计算机：要求结果由机构本身算出，并自带一段专供录屏的演示序列。 |
| [niegramotny-197521](https://skillry.dev/ai-videos/opus-5-5/niegramotny-197521) | [@_nieGRAMotny_](https://x.com/_nieGRAMotny_/status/2103128800909197521) | Three.js 赛车：数据驱动，玩家和 AI 共用操控接口（方便做自动演示），分阶段构建和验收。 |
| [froessell-562325](https://skillry.dev/ai-videos/opus-5-5/froessell-562325) | [@froessell](https://x.com/froessell/status/2103789415323562325) | 警车追逐手游 PRD：打击感清单、刻意做笨的 AI、每个里程碑以"好不好玩"为门槛。 |
| [rossaxbt-707651](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/rossaxbt-707651.md) | [@rossaxbt](https://x.com/rossaxbt/status/2107121188027707651) | 首尾帧一致的无缝循环，以及动作对齐节拍。 |
