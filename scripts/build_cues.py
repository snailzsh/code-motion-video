#!/usr/bin/env python3
"""把"逐句配音"拼成一条旁白音轨，同时生成画面要用的时间轴 cues.json。

配音驱动的视频（讲史、科普、产品讲解）里，画面要跟着话走。最稳的做法是：
每句台词单独合成一个音频文件 → 量出每句的真实时长 → 按顺序拼起来、句间留固定停顿 →
得到每句的开始/结束时间。HTML 里的动作挂在这些时间点上，换配音也不用改动画代码。

用法：
  python3 build_cues.py --lines script.txt --clips clips/ --out-audio voice.wav --out-cues cues.json
  python3 build_cues.py --lines script.txt --clips clips/ --gap 0.35 --lead 0.4 --tail 1.0 ...

  --lines   台词文件，一行一句（空行忽略）。行数必须等于音频文件数。
            行尾可以写 "｜关键词" 或 "|关键词"，会存进 cue 的 key 字段，给画面放大字用。
  --clips   放逐句音频的文件夹（按文件名排序，如 001.mp3 002.mp3 …），或用逗号分隔的文件列表
  --gap     句间停顿秒数（默认 0.3）
  --gap-after  个别句子后面单独加长停顿，如 "3:0.8,5:1.2"（第 3 句后停 0.8 秒、第 5 句后停 1.2 秒，从 1 数）。
             金句后定格、高潮前蓄力就用它
  --lead    片头留白秒数（默认 0.3）
  --tail    结尾留白秒数（默认 1.0，给收尾定格）
  --rate    输出采样率（默认 48000）
  --lufs    响度标准化目标（默认 -14，短视频平台常用值）；设成 0 表示不处理

输出的 cues.json：
  {"duration": 总时长, "cues": [{"i":0,"start":0.3,"end":2.41,"text":"…","key":"…"}, …]}
把 cues 数组贴进模板的 CUES，duration 填进 CONFIG.duration，渲染时 --audio voice.wav。

依赖：ffmpeg / ffprobe（PATH 里）。只用 Python 标准库。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus"}


def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        die(f"命令失败：{' '.join(cmd)}\n{p.stderr.strip()}")
    return p.stdout


def duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path])
    return float(out.strip())


def main():
    ap = argparse.ArgumentParser(description="逐句配音 → 旁白音轨 + cues.json")
    ap.add_argument("--lines", required=True)
    ap.add_argument("--clips", required=True)
    ap.add_argument("--out-audio", default="voice.wav")
    ap.add_argument("--out-cues", default="cues.json")
    ap.add_argument("--gap", type=float, default=0.3)
    ap.add_argument("--lead", type=float, default=0.3)
    ap.add_argument("--tail", type=float, default=1.0)
    ap.add_argument("--rate", type=int, default=48000)
    ap.add_argument("--gap-after", default="")
    ap.add_argument("--lufs", type=float, default=-14.0)
    a = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"找不到 {tool}，请先安装（macOS：brew install ffmpeg）")

    with open(a.lines, encoding="utf-8") as f:
        raw = [l.strip() for l in f if l.strip()]
    lines = []
    for l in raw:
        m = re.match(r"^(.*?)\s*[|｜]\s*(.+)$", l)
        lines.append((m.group(1), m.group(2)) if m else (l, ""))

    if os.path.isdir(a.clips):
        clips = sorted(os.path.join(a.clips, n) for n in os.listdir(a.clips)
                       if os.path.splitext(n)[1].lower() in AUDIO_EXT)
    else:
        clips = [c.strip() for c in a.clips.split(",") if c.strip()]
    if not clips:
        die("没找到音频文件")
    if len(clips) != len(lines):
        die(f"台词 {len(lines)} 行，音频 {len(clips)} 个，数量不一致。请一句一个文件。")

    gap_after = {}
    for part in filter(None, (x.strip() for x in a.gap_after.split(","))):
        try:
            k, v = part.split(":")
            gap_after[int(k) - 1] = float(v)
        except ValueError:
            die(f"--gap-after 格式不对：{part}（应为 句号:秒数，如 3:0.8）")

    tmp = tempfile.mkdtemp(prefix="cues-")
    try:
        def silence(sec, name):
            p = os.path.join(tmp, name)
            run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r={a.rate}:cl=mono",
                 "-t", f"{sec:.3f}", "-c:a", "pcm_s16le", p])
            return p

        parts, cues, t = [], [], 0.0
        if a.lead > 0:
            parts.append(silence(a.lead, "lead.wav"))
            t += a.lead
        for i, (clip, (text, key)) in enumerate(zip(clips, lines)):
            norm = os.path.join(tmp, f"{i:04d}.wav")
            run(["ffmpeg", "-y", "-v", "error", "-i", clip, "-ac", "1", "-ar", str(a.rate), "-c:a", "pcm_s16le", norm])
            d = duration(norm)
            cues.append({"i": i, "start": round(t, 3), "end": round(t + d, 3), "text": text, "key": key})
            parts.append(norm)
            t += d
            g = gap_after.get(i, a.gap)
            if g > 0 and i < len(clips) - 1:
                parts.append(silence(g, f"gap{i:04d}.wav"))
                t += g
        if a.tail > 0:
            parts.append(silence(a.tail, "tail.wav"))
            t += a.tail

        lst = os.path.join(tmp, "list.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for p in parts:
                f.write(f"file '{p}'\n")
        out_dir = os.path.dirname(os.path.abspath(a.out_audio))
        os.makedirs(out_dir, exist_ok=True)
        codec = ["-c:a", "pcm_s16le"] if a.out_audio.lower().endswith(".wav") else ["-c:a", "libmp3lame", "-q:a", "2"]
        # 响度标准化：逐句 TTS 拼出来通常偏轻（实测可低到 -33 LUFS），不处理直接出片会很小声
        af = ["-af", f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11", "-ar", str(a.rate)] if a.lufs else []
        run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, *af, *codec, a.out_audio])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    total = round(t, 3)
    with open(a.out_cues, "w", encoding="utf-8") as f:
        json.dump({"duration": total, "cues": cues}, f, ensure_ascii=False, indent=2)
    print(f"{len(cues)} 句，总时长 {total}s")
    print(f"音轨：{a.out_audio}")
    print(f"时间轴：{a.out_cues}")
    for c in cues:
        print(f"  {c['start']:7.2f}–{c['end']:7.2f}  {c['text']}" + (f"  [{c['key']}]" if c["key"] else ""))


if __name__ == "__main__":
    main()
