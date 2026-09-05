#!/usr/bin/env python3
"""重新生成 Noto Serif SC（思源宋体）子集字体。

流程：
1. 收集 src/**/*.vue 中出现的全部 CJK 字符，加上常用中文标点与 ASCII；
2. 从 jsdelivr 下载 Noto Serif SC SemiBold 的 SC 子集 OTF（约 12MB，带缓存）；
3. 用 fonttools 的 pyftsubset 子集化并压缩为单个 woff2；
4. 覆盖 src/assets/fonts/noto-serif-sc-600.woff2（CSS 声明无需变化）。

用法：
    python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
    python3 scripts/fetch_noto_serif_sc.py

新增或修改页面中文文案后需重新执行，否则衬线标题可能出现回退字形。
"""

import pathlib
import subprocess
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / 'src' / 'assets' / 'fonts'
FONT_OUT = FONT_DIR / 'noto-serif-sc-600.woff2'
CACHE_OTF = pathlib.Path('/tmp/NotoSerifSC-SemiBold.otf')
OTF_URL = (
    'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main'
    '/Serif/SubsetOTF/SC/NotoSerifSC-SemiBold.otf'
)
PYFTSUBSET = pathlib.Path('/tmp/fontenv/bin/pyftsubset')


def collect_chars():
    chars = set()
    for path in (ROOT / 'src').rglob('*.vue'):
        for ch in path.read_text(encoding='utf-8'):
            if '\u4e00' <= ch <= '\u9fff' or '\u3400' <= ch <= '\u4dbf':
                chars.add(ch)
    chars |= set('，。、·（）：；！？—…“”‘’')
    chars |= {chr(c) for c in range(0x20, 0x7F)}
    return chars


def main():
    if not PYFTSUBSET.exists():
        sys.exit('未找到 /tmp/fontenv/bin/pyftsubset，请先按脚本头部说明创建 venv')

    chars = collect_chars()
    print(f'收集到 {len(chars)} 个字符')
    text_file = pathlib.Path('/tmp/serif-chars.txt')
    text_file.write_text(''.join(sorted(chars)), encoding='utf-8')

    if not CACHE_OTF.exists() or CACHE_OTF.stat().st_size < 1_000_000:
        print(f'下载源字体：{OTF_URL}')
        req = urllib.request.Request(OTF_URL, headers={'User-Agent': 'curl/8'})
        CACHE_OTF.write_bytes(urllib.request.urlopen(req, timeout=120).read())

    subprocess.run(
        [
            str(PYFTSUBSET),
            str(CACHE_OTF),
            f'--text-file={text_file}',
            '--flavor=woff2',
            '--layout-features=kern,liga',
            f'--output-file={FONT_OUT}',
        ],
        check=True,
    )
    print(f'已生成 {FONT_OUT}（{FONT_OUT.stat().st_size} bytes）')


if __name__ == '__main__':
    main()
