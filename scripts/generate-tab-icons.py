"""生成微信小程序底部 Tab 图标（81x81 PNG）。

使用现有 H5 图标的同一套水滴造型，输出未选中灰色与选中蓝色两组。
运行：python scripts/generate-tab-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 81
SCALE = 4
OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "static"

GRAY = (139, 147, 166)
BLUE = (47, 125, 246)


def droplet_mask(size: int, scale: float = 1.0) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    cx, cy = size / 2, size / 2
    r = size * 0.24 * scale
    bottom_cy = cy + size * 0.08 * scale
    apex_y = cy - size * 0.31 * scale
    draw.polygon(
        [
            (cx, apex_y),
            (cx - r * 0.94, bottom_cy - r * 0.42),
            (cx + r * 0.94, bottom_cy - r * 0.42),
        ],
        fill=255,
    )
    draw.ellipse((cx - r, bottom_cy - r, cx + r, bottom_cy + r), fill=255)
    return mask


def render_drop(color: tuple[int, int, int]) -> Image.Image:
    big = SIZE * SCALE
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    outer = droplet_mask(big)
    inner = droplet_mask(big, 0.72)
    ring = Image.composite(
        Image.new("L", (big, big), 255),
        Image.new("L", (big, big), 0),
        outer,
    )
    ring = Image.composite(Image.new("L", (big, big), 0), ring, inner)
    layer = Image.new("RGBA", (big, big), color + (255,))
    layer.putalpha(ring)
    canvas = Image.alpha_composite(canvas, layer)

    draw = ImageDraw.Draw(canvas)
    bar_w = big * 0.045
    bar_h = big * 0.11
    cx, cy = big / 2, big / 2 + big * 0.07
    draw.rounded_rectangle(
        (cx - bar_w / 2, cy - bar_h / 2, cx + bar_w / 2, cy + bar_h / 2),
        radius=bar_w / 2,
        fill=color + (255,),
    )
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def render_history(color: tuple[int, int, int]) -> Image.Image:
    big = SIZE * SCALE
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    pad = big * 0.16
    draw.rounded_rectangle(
        (int(pad), int(pad), int(big - pad), int(big - pad)),
        radius=int(big * 0.08),
        outline=color + (255,),
        width=int(big * 0.055),
    )
    for offset in (-0.16, 0, 0.16):
        y = big / 2 + big * offset
        draw.line(
            (int(big * 0.29), int(y), int(big * 0.71), int(y)),
            fill=color + (255,),
            width=int(big * 0.045),
        )
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def render_calendar(color: tuple[int, int, int]) -> Image.Image:
    big = SIZE * SCALE
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    pad = big * 0.16
    top = big * 0.25
    draw.rounded_rectangle(
        (int(pad), int(top), int(big - pad), int(big - pad)),
        radius=int(big * 0.07),
        outline=color + (255,),
        width=int(big * 0.055),
    )
    draw.line(
        (int(pad), int(big * 0.38), int(big - pad), int(big * 0.38)),
        fill=color + (255,),
        width=int(big * 0.045),
    )
    for x in (0.34, 0.66):
        draw.line(
            (int(big * x), int(big * 0.17), int(big * x), int(big * 0.31)),
            fill=color + (255,),
            width=int(big * 0.055),
        )
    for x, y in ((0.34, 0.55), (0.5, 0.55), (0.66, 0.55), (0.34, 0.72), (0.5, 0.72)):
        draw.ellipse(
            (
                int(big * x - big * 0.035),
                int(big * y - big * 0.035),
                int(big * x + big * 0.035),
                int(big * y + big * 0.035),
            ),
            fill=color + (255,),
        )
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    icons = {
        "tab-price.png": render_drop(GRAY),
        "tab-price-active.png": render_drop(BLUE),
        "tab-history.png": render_history(GRAY),
        "tab-history-active.png": render_history(BLUE),
        "tab-calendar.png": render_calendar(GRAY),
        "tab-calendar-active.png": render_calendar(BLUE),
    }
    for name, image in icons.items():
        image.save(OUT_DIR / name)
        print(f"wrote {name}")


if __name__ == "__main__":
    main()
