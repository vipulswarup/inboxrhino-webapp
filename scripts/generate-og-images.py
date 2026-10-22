#!/usr/bin/env python3
"""Generate per-page Open Graph images into public/brand/og/.

Writes one 1200x630 PNG per entry in PAGES and regenerates
app/lib/og-images.ts, which pageMeta() reads to pick a page's image (pages
without one fall back to /brand/og-default.png).

Requirements: Pillow and fontTools (with brotli), plus ImageMagick's `magick`
for rasterising the SVG icon:

    python3 -m venv /tmp/og && /tmp/og/bin/pip install pillow fonttools brotli
    /tmp/og/bin/python scripts/generate-og-images.py

The Geist font is read from vinext's font cache (.vinext/fonts), which exists
after `npm run dev` or `npm run build`.
"""

import glob
import io
import os
import subprocess
import sys
import tempfile

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'brand', 'og')
MANIFEST = os.path.join(ROOT, 'app', 'lib', 'og-images.ts')

WIDTH, HEIGHT = 1200, 630
BG = (250, 246, 238)
TEAL = (15, 61, 62)
INK = (28, 25, 23)
MUTED = (87, 83, 78)

# path -> (eyebrow, headline, subline)
PAGES = {
    '/about': ('About', 'About InboxRhino', 'From the makers of EisenVault'),
    '/pricing': ('Pricing', 'InboxRhino pricing', 'Free tier: 11 inboxes and 33 emails a month'),
    '/blog': ('Blog', 'Email testing for agents and CI', 'Notes from the InboxRhino team'),
    '/docs': ('Docs', 'InboxRhino documentation', 'Quickstart, API reference and Playwright'),
    '/docs/quickstart': ('Docs', 'API quickstart', 'Create an inbox and assert the email in five minutes'),
    '/docs/api': ('Docs', 'API reference', 'Inboxes, messages and wait-for-message'),
    '/docs/playwright': ('Docs', 'Playwright email testing', 'Signup, OTP and magic-link tests'),
    '/compare/tigrmail': ('Compare', 'InboxRhino vs Tigrmail', 'Receive-only test inbox APIs compared'),
    '/compare/mailosaur': ('Compare', 'Mailosaur alternative', 'InboxRhino vs Mailosaur for email tests'),
    '/compare/mailhog': ('Compare', 'MailHog alternative', 'InboxRhino vs MailHog and Mailpit'),
    '/compare/mailslurp': ('Compare', 'MailSlurp alternative', 'InboxRhino vs MailSlurp for email-only tests'),
    '/compare/testmail': ('Compare', 'InboxRhino vs testmail.app', 'REST inboxes vs GraphQL email testing'),
    '/india': ('India', 'INR billing and GST invoices', 'Test email API for Indian SaaS and QA teams'),
    '/legal': ('Legal', 'Privacy and terms', 'Receive-only inboxes with 30-day retention'),
    '/blog/agentic-testing-email-flows': ('Blog', 'Agentic testing of email flows', 'Signup, OTP and password reset'),
}


def load_font_path():
    css = glob.glob(os.path.join(ROOT, '.vinext', 'fonts', 'geist-[0-9a-f]*', 'style.css'))
    if not css:
        sys.exit('Geist font not found in .vinext/fonts; run `npm run build` first.')
    # Use the latin subset: the @font-face whose unicode-range starts at U+0000.
    latin = next(block for block in open(css[0]).read().split('@font-face') if 'U+0000-00FF' in block)
    woff2 = latin.split('url(', 1)[1].split(')', 1)[0]
    font = TTFont(os.path.join(os.path.dirname(css[0]), os.path.basename(woff2)))
    font.flavor = None
    out = os.path.join(tempfile.mkdtemp(), 'Geist.ttf')
    font.save(out)
    return out


def font(path, size, weight):
    face = ImageFont.truetype(path, size)
    face.set_variation_by_axes([weight])
    return face


def icon(size):
    svg = os.path.join(ROOT, 'public', 'favicon.svg')
    png = subprocess.run(
        ['magick', '-background', 'none', '-density', '600', svg, '-resize', f'{size}x{size}', 'png:-'],
        check=True,
        capture_output=True,
    ).stdout
    return Image.open(io.BytesIO(png)).convert('RGBA')


def wrap(draw, text, face, max_width):
    lines, line = [], ''
    for word in text.split():
        candidate = f'{line} {word}'.strip()
        if draw.textlength(candidate, font=face) <= max_width:
            line = candidate
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def render(font_path, logo, eyebrow, headline, subline):
    image = Image.new('RGB', (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    pad = 80
    max_width = WIDTH - pad * 2

    draw.text((pad, 78), eyebrow.upper(), font=font(font_path, 28, 700), fill=TEAL)

    size = 84
    while True:
        face = font(font_path, size, 700)
        lines = wrap(draw, headline, face, max_width)
        if len(lines) <= 2 or size <= 60:
            break
        size -= 6
    y = 130
    for line in lines:
        draw.text((pad, y), line, font=face, fill=INK)
        y += int(size * 1.12)

    draw.text((pad, y + 18), subline, font=font(font_path, 36, 500), fill=MUTED)

    footer_y = HEIGHT - 80 - logo.height
    image.paste(logo, (pad, footer_y), logo)
    draw.text((pad + logo.width + 22, footer_y + 12), 'InboxRhino', font=font(font_path, 40, 700), fill=INK)
    domain_face = font(font_path, 30, 500)
    domain = 'inboxrhino.in'
    draw.text((WIDTH - pad - draw.textlength(domain, font=domain_face), footer_y + 20), domain, font=domain_face, fill=TEAL)
    draw.rectangle((0, HEIGHT - 14, WIDTH, HEIGHT), fill=TEAL)
    return image


def main():
    font_path = load_font_path()
    logo = icon(76)
    for path, (eyebrow, headline, subline) in PAGES.items():
        target = os.path.join(OUT_DIR, path.lstrip('/') + '.png')
        os.makedirs(os.path.dirname(target), exist_ok=True)
        render(font_path, logo, eyebrow, headline, subline).save(target, optimize=True)
        print('wrote', os.path.relpath(target, ROOT))

    entries = ''.join(f"  '{path}',\n" for path in PAGES)
    with open(MANIFEST, 'w') as handle:
        handle.write(
            '// Generated by scripts/generate-og-images.py. Do not edit by hand.\n'
            '// Paths with a page-specific Open Graph image at /brand/og<path>.png.\n'
            f'export const OG_IMAGE_PAGES: ReadonlySet<string> = new Set([\n{entries}]);\n'
        )
    print('wrote', os.path.relpath(MANIFEST, ROOT))


if __name__ == '__main__':
    main()
