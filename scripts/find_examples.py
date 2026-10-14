#!/usr/bin/env python3
"""从 awesome-opus5-5-videos 合集里按类型 / 技术 / 关键词找参考案例。

合集的数据（700+ 条，每条带原作者、原帖、预览页、prompt）在运行时从 GitHub 拉取，
缓存 1 天，本 skill 不内置任何原作者的 prompt。

用法：
  python3 find_examples.py --category explainer --full            讲解类、只看完整 prompt
  python3 find_examples.py --tech threejs --q "camera" --limit 10   Three.js 里提到 camera 的
  python3 find_examples.py --q 历史                                 关键词可以是中文
  python3 find_examples.py --show gdgtify-130294                    看某条的完整 prompt 和出处

  --category  motion | explainer | 3d | interactive
  --tech      canvas, svg, threejs, shader, gsap, css, audio, particles, playable, pixel, webgl, physics, ai-image（逗号分隔 = 都要有）
  --q         在 prompt 里搜关键词（不区分大小写）
  --full      排除只有部分 prompt / 只有晒图文案的条目
  --sort      detail（按 prompt 长度，默认，越长通常越具体）| new（按收录时间）
  --limit     默认 15

引用或改写别人的 prompt 时，请保留原作者署名和原帖链接。
"""
import argparse
import json
import os
import sys
import time
import urllib.request

SRC = "https://raw.githubusercontent.com/yihui-dev/awesome-opus5-5-videos/main/data/videos.json"
REPO = "https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/"
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "code-motion-video", "videos.json")


def load(refresh=False):
    if not refresh and os.path.exists(CACHE) and time.time() - os.path.getmtime(CACHE) < 86400:
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    try:
        with urllib.request.urlopen(SRC, timeout=30) as r:
            data = r.read().decode("utf-8")
    except Exception as e:
        if os.path.exists(CACHE):
            print(f"（拉取失败，用旧缓存：{e}）", file=sys.stderr)
            with open(CACHE, encoding="utf-8") as f:
                return json.load(f)
        sys.exit(f"拉取合集数据失败：{e}\n可以直接打开 https://github.com/yihui-dev/awesome-opus5-5-videos 浏览。")
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w", encoding="utf-8") as f:
        f.write(data)
    return json.loads(data)


def link(i):
    """有预览页用预览页，没有就用合集里的 prompt 文件。"""
    return i.get("skillry_url") or f"{REPO}{i['slug']}.md"


def main():
    ap = argparse.ArgumentParser(description="在 awesome-opus5-5-videos 里找参考案例")
    ap.add_argument("--category")
    ap.add_argument("--tech")
    ap.add_argument("--q")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--sort", default="detail", choices=["detail", "new"])
    ap.add_argument("--limit", type=int, default=15)
    ap.add_argument("--show")
    ap.add_argument("--refresh", action="store_true")
    a = ap.parse_args()

    items = load(a.refresh)

    if a.show:
        hit = next((i for i in items if i["slug"] == a.show), None)
        if not hit:
            sys.exit(f"没有这条：{a.show}")
        print(f"# {hit['slug']}  ·  @{hit['author']}  ·  {hit['category']}  ·  {', '.join(hit['tech_tags']) or '-'}")
        print(f"原帖：{hit['post_url']}")
        print(f"预览/出处：{link(hit)}")
        if hit.get("prompt_partial"):
            print("注意：作者只公开了部分 prompt，或这里只是原帖文案。")
        print("\n" + hit["prompt"])
        return

    seen, res = set(), []
    for i in items:
        key = " ".join(i["prompt"].lower().split())[:400]
        if key in seen:
            continue
        seen.add(key)
        if a.category and i["category"] != a.category:
            continue
        if a.tech and not all(t.strip() in i["tech_tags"] for t in a.tech.split(",")):
            continue
        if a.full and i.get("prompt_partial"):
            continue
        if a.q and a.q.lower() not in i["prompt"].lower():
            continue
        res.append(i)
    res.sort(key=(lambda i: -len(i["prompt"])) if a.sort == "detail" else (lambda i: i.get("added", "")), reverse=(a.sort == "new"))
    print(f"命中 {len(res)} 条（已去重），显示前 {min(a.limit, len(res))} 条：\n")
    for i in res[: a.limit]:
        first = (i.get("title") or "").strip() or " ".join(i["prompt"].split())[:70]
        flag = "部分" if i.get("prompt_partial") else "完整"
        print(f"{i['slug']:<32} {i['category']:<11} {flag} {len(i['prompt']):>6}字  @{i['author']}")
        print(f"    {first}")
        print(f"    {link(i)}")
    print("\n看某条全文：python3 find_examples.py --show <slug>")


if __name__ == "__main__":
    main()
