#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import os
import re
import subprocess
import sys
import tempfile
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageFile, ImageOps


Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True
warnings.simplefilter("ignore")

IMAGE_EXTS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".heic",
}

GENERIC_WORDS = {
    "downloads",
    "download",
    "изображения",
    "image",
    "images",
    "img",
    "chatgpt",
    "prediction",
    "replicate",
    "vertical",
    "verticals",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
    "heic",
    "october",
    "november",
    "december",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
}

MONTH_WORDS = {
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
    "октябрь-декабрь",
    "апрель-октябрь",
    "ноябрь-декабрь",
}

KEYWORD_BONUS = {
    "таро": 1.0,
    "космос": 0.9,
    "космонавты": 0.9,
    "мечети": 0.9,
    "бабочка": 0.7,
    "ченнелинг": 0.8,
    "фрейда": 0.6,
    "кошка": 0.5,
    "кошки": 0.5,
    "собаки": 0.4,
    "киты": 0.7,
    "каяки": 0.6,
    "рыжая": 0.4,
    "девочка": 0.5,
    "девушка": 0.4,
    "женщины": 0.3,
    "tonya": 0.3,
    "ai": 0.2,
}


@dataclass
class Candidate:
    path: Path
    source_root: Path
    rel_path: str
    folder: str
    width: int
    height: int
    aspect: float
    brightness: float
    contrast: float
    saturation: float
    colorfulness: float
    entropy: float
    edge_density: float
    center_emphasis: float
    palette_complexity: float
    hist_feature: np.ndarray
    palette_names: list[str]
    series_hint: str
    unusualness: int = 0
    gaze_pull: int = 0
    hold_power: int = 0
    description: str = ""


def progress_bar(done: int, total: int, width: int = 24) -> str:
    total = max(total, 1)
    filled = round(width * done / total)
    return f"[{'#' * filled}{'.' * (width - filled)}] {done}/{total} ({done / total * 100:5.1f}%)"


def run_sips_size(path: Path) -> tuple[int, int] | None:
    try:
        out = subprocess.check_output(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return None

    values: dict[str, str] = {}
    for line in out.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()

    try:
        return int(values["pixelWidth"]), int(values["pixelHeight"])
    except Exception:
        return None


def open_image(path: Path) -> Image.Image:
    try:
        image = Image.open(path)
        return ImageOps.exif_transpose(image).convert("RGB")
    except Exception:
        if path.suffix.lower() != ".heic":
            raise

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        subprocess.run(
            ["sips", "-s", "format", "png", str(path), "--out", str(tmp_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        image = Image.open(tmp_path)
        return ImageOps.exif_transpose(image).convert("RGB")
    finally:
        tmp_path.unlink(missing_ok=True)


def get_dimensions(path: Path) -> tuple[int, int] | None:
    try:
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image)
            return image.size
    except Exception:
        if path.suffix.lower() == ".heic":
            return run_sips_size(path)
        return None


def coarse_histogram(arr: np.ndarray, bins: int = 4) -> np.ndarray:
    edges = np.linspace(0, 256, bins + 1)
    hist, _ = np.histogramdd(arr.reshape(-1, 3), bins=(edges, edges, edges))
    hist = hist.astype(np.float64).ravel()
    total = hist.sum() or 1.0
    return hist / total


def colorfulness_metric(arr: np.ndarray) -> float:
    rg = arr[:, :, 0] - arr[:, :, 1]
    yb = 0.5 * (arr[:, :, 0] + arr[:, :, 1]) - arr[:, :, 2]
    return float(np.sqrt(np.std(rg) ** 2 + np.std(yb) ** 2) + 0.3 * np.sqrt(np.mean(rg) ** 2 + np.mean(yb) ** 2))


def entropy_metric(gray: np.ndarray) -> float:
    hist, _ = np.histogram(gray, bins=64, range=(0.0, 1.0), density=True)
    hist = hist[hist > 0]
    return float(-(hist * np.log2(hist)).sum())


def edge_density_metric(gray: np.ndarray) -> float:
    dx = np.abs(np.diff(gray, axis=1))
    dy = np.abs(np.diff(gray, axis=0))
    edge_map = (dx[:-1, :] + dy[:, :-1]) / 2.0
    return float(np.mean(edge_map > 0.08))


def center_emphasis_metric(gray: np.ndarray) -> float:
    h, w = gray.shape
    y1, y2 = int(h * 0.2), int(h * 0.8)
    x1, x2 = int(w * 0.2), int(w * 0.8)
    center = gray[y1:y2, x1:x2]
    border = gray.copy()
    border[y1:y2, x1:x2] = 0.0
    border_mask = np.ones_like(gray, dtype=bool)
    border_mask[y1:y2, x1:x2] = False
    border_vals = gray[border_mask]
    return float(abs(center.mean() - border_vals.mean()) + max(center.std() - border_vals.std(), 0.0))


def palette_complexity_metric(arr: np.ndarray) -> float:
    quant = (arr / 32.0).astype(int)
    flat = quant[:, :, 0] * 64 + quant[:, :, 1] * 8 + quant[:, :, 2]
    unique = np.unique(flat)
    return float(len(unique) / 512.0)


def dominant_palette_names(image: Image.Image) -> list[str]:
    reduced = image.resize((80, 120), Image.Resampling.LANCZOS).quantize(colors=4, method=Image.Quantize.MEDIANCUT)
    palette = reduced.getpalette()
    colors = sorted(reduced.getcolors(), reverse=True)
    result: list[str] = []

    for _, index in colors[:4]:
        rgb = tuple(palette[index * 3 : index * 3 + 3])
        name = color_name(rgb)
        if name not in result:
            result.append(name)
        if len(result) == 2:
            break

    return result or ["темной"]


def color_name(rgb: tuple[int, int, int]) -> str:
    r, g, b = rgb
    mx = max(rgb)
    mn = min(rgb)
    delta = mx - mn
    light = mx
    sat = 0 if mx == 0 else delta / mx

    if sat < 0.1:
        if light < 45:
            return "угольно-черной"
        if light < 110:
            return "серой"
        if light < 180:
            return "дымчатой"
        return "молочной"

    if mx == r:
        hue = ((g - b) / delta) % 6
    elif mx == g:
        hue = (b - r) / delta + 2
    else:
        hue = (r - g) / delta + 4
    hue *= 60

    if hue < 18 or hue >= 342:
        base = "красной"
    elif hue < 40:
        base = "янтарной"
    elif hue < 65:
        base = "золотистой"
    elif hue < 155:
        base = "зеленой"
    elif hue < 205:
        base = "бирюзовой"
    elif hue < 255:
        base = "синей"
    elif hue < 310:
        base = "фиолетовой"
    else:
        base = "малиновой"

    if light < 80:
        return f"темно-{base}"
    if light > 200:
        return f"светло-{base}"
    return base


def percentile_rank(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values)
    result = np.empty_like(values, dtype=float)
    if len(values) == 1:
        result[order[0]] = 0.5
        return result
    result[order] = np.linspace(0.0, 1.0, len(values))
    return result


def to_rating(rank: float) -> int:
    return int(min(5, max(1, math.ceil(rank * 5))))


def meaningful_text_bits(path: Path, root: Path) -> list[str]:
    parts = [part for part in path.relative_to(root).parts[:-1]]
    stem = path.stem
    parts.append(stem)
    tokens: list[str] = []

    for chunk in parts:
        raw = re.split(r"[^0-9A-Za-zА-Яа-яЁё]+", chunk.lower())
        for token in raw:
            if not token or token.isdigit():
                continue
            if len(token) <= 2:
                continue
            if len(token) > 14:
                continue
            if any(char.isdigit() for char in token):
                continue
            if re.fullmatch(r"[a-z]+", token):
                if len(token) < 5:
                    continue
                if not any(ch in "aeiouy" for ch in token):
                    continue
            if token in GENERIC_WORDS or token in MONTH_WORDS:
                continue
            if re.fullmatch(r"[0-9_]+", token):
                continue
            tokens.append(token)

    deduped: list[str] = []
    for token in tokens:
        if token not in deduped:
            deduped.append(token)
    return deduped


def build_series_hint(path: Path, root: Path) -> str:
    tokens = meaningful_text_bits(path, root)
    if not tokens:
        return ""
    phrase = " ".join(tokens[:4]).strip()
    phrase = re.sub(r"\s+", " ", phrase)
    if not phrase:
        return ""
    return phrase


def keyword_bonus(text: str) -> float:
    total = 0.0
    for key, weight in KEYWORD_BONUS.items():
        if key in text:
            total += weight
    return total


def mood_word(brightness: float, contrast: float, saturation: float) -> str:
    if brightness < 0.33 and contrast > 0.2:
        return "драматической"
    if saturation > 0.45 and contrast > 0.16:
        return "яркой"
    if brightness > 0.72 and saturation < 0.22:
        return "воздушной"
    if contrast < 0.12:
        return "мягкой"
    return "сдержанной"


def composition_word(center: float, edges: float, entropy: float) -> str:
    if center > 0.15:
        return "с сильным центральным акцентом"
    if edges > 0.16 and entropy > 0.8:
        return "с плотной фактурой и множеством деталей"
    if entropy < 0.55:
        return "с более тихой и разреженной композицией"
    return "с уравновешенной вертикальной композицией"


def build_description(candidate: Candidate) -> str:
    palette = " и ".join(candidate.palette_names[:2])
    mood = mood_word(candidate.brightness, candidate.contrast, candidate.saturation)
    composition = composition_word(candidate.center_emphasis, candidate.edge_density, candidate.entropy)

    if candidate.series_hint:
        return (
            f"Вертикальная работа из серии «{candidate.series_hint}» в {mood} "
            f"{palette} гамме, {composition}."
        )

    return f"Вертикальная сцена в {mood} {palette} гамме, {composition}."


def extract_candidate(path: Path, root: Path) -> Candidate | None:
    size = get_dimensions(path)
    if not size:
        return None
    width, height = size
    if height <= width:
        return None

    try:
        image = open_image(path)
    except Exception:
        return None

    thumb = image.resize((120, 180), Image.Resampling.LANCZOS)
    arr = np.asarray(thumb).astype(np.float32) / 255.0
    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    sat = arr.max(axis=2) - arr.min(axis=2)
    rel_path = str(path.relative_to(root))
    folder = path.parent.name
    series_hint = build_series_hint(path, root)

    return Candidate(
        path=path,
        source_root=root,
        rel_path=rel_path,
        folder=folder,
        width=width,
        height=height,
        aspect=height / width,
        brightness=float(gray.mean()),
        contrast=float(gray.std()),
        saturation=float(sat.mean()),
        colorfulness=colorfulness_metric(arr),
        entropy=entropy_metric(gray),
        edge_density=edge_density_metric(gray),
        center_emphasis=center_emphasis_metric(gray),
        palette_complexity=palette_complexity_metric(arr),
        hist_feature=coarse_histogram((arr * 255).astype(np.uint8)),
        palette_names=dominant_palette_names(image),
        series_hint=series_hint,
    )


def write_markdown(candidates: list[Candidate], output: Path, roots: list[Path]) -> None:
    gallery_options = [
        (
            "1. Мистический портретный цикл",
            "Собрать линию из женских образов, таро, космоса и мягкой неосюрреалистической фигуративности: это даст цельный, узнаваемый и эмоционально плотный маршрут.",
        ),
        (
            "2. Тихие миры и внутренние пейзажи",
            "Опора на спокойные сцены, зимние сюжеты, лодки, леса, пустоты и приглушённые палитры; такая экспозиция будет работать как медленный медитативный просмотр.",
        ),
        (
            "3. Звери, миф и священное",
            "Свести в одну линию кошек, собак, бабочек, китов, мечети, арканы и ритуальные символы, чтобы получить выставку о пересечении бытового и сакрального.",
        ),
        (
            "4. Рыжая героиня как сквозной персонаж",
            "Построить галерею вокруг повторяющегося архетипа рыжей девочки или девушки: это даст повествовательную нить и почти книжную драматургию.",
        ),
        (
            "5. AI-иллюстрация между плакатом и видением",
            "Взять самые графичные, яркие, цифрово-иллюстративные работы и собрать выставку про современный образный синтез, где важны не серии, а сила отдельного кадра.",
        ),
    ]

    total = len(candidates)
    bar = progress_bar(total, total)

    with output.open("w", encoding="utf-8") as fh:
        fh.write("# Кандидаты в экспозицию\n\n")
        fh.write(f"Прогресс: `{bar}`\n\n")
        fh.write("## Источники\n\n")
        for root in roots:
            fh.write(f"- `{root}`\n")
        fh.write("\n")
        fh.write(f"Обработано вертикальных изображений: **{total}**.\n\n")
        fh.write(
            "Оценки в этой таблице эвристические: они рассчитаны по визуальным признакам изображения и структуре архива, "
            "чтобы быстро получить рабочую карту материала для будущей ручной кураторской сборки.\n\n"
        )
        fh.write("## Варианты галереи\n\n")
        for title, body in gallery_options:
            fh.write(f"- **{title}**: {body}\n")
        fh.write("\n")
        fh.write("## Таблица\n\n")
        fh.write("| № | Файл | Источник | Папка | Размер | Необычность | Притягивает взгляд | Держит внимание | Описание |\n")
        fh.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
        for idx, candidate in enumerate(candidates, start=1):
            path_text = str(candidate.path).replace("|", "\\|")
            root_name = candidate.source_root.name.replace("|", "\\|")
            folder = candidate.folder.replace("|", "\\|")
            size = f"{candidate.width}×{candidate.height}"
            description = candidate.description.replace("|", "\\|")
            fh.write(
                f"| {idx} | `{path_text}` | `{root_name}` | `{folder}` | {size} | "
                f"{candidate.unusualness}/5 | {candidate.gaze_pull}/5 | {candidate.hold_power}/5 | {description} |\n"
            )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        action="append",
        required=True,
        dest="roots",
        help="Directory to scan. Repeat for multiple roots.",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Markdown file to write.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional cap for debugging.",
    )
    args = parser.parse_args()

    roots = [Path(item).expanduser().resolve() for item in args.roots]
    output = Path(args.output).expanduser().resolve()

    files: list[tuple[Path, Path]] = []
    for root in roots:
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
                files.append((path, root))

    files.sort(key=lambda item: str(item[0]).lower())
    if args.limit > 0:
        files = files[: args.limit]

    print(f"Scanning {len(files)} image files...")
    candidates: list[Candidate] = []

    for idx, (path, root) in enumerate(files, start=1):
        candidate = extract_candidate(path, root)
        if candidate is not None:
            candidates.append(candidate)

        if idx == len(files) or idx % 25 == 0:
            print(progress_bar(idx, len(files)), file=sys.stderr)

    if not candidates:
        print("No vertical images found.", file=sys.stderr)
        return 1

    hist_matrix = np.stack([item.hist_feature for item in candidates], axis=0)
    hist_center = hist_matrix.mean(axis=0)
    hist_outlier = np.linalg.norm(hist_matrix - hist_center, axis=1)

    brightness = np.array([item.brightness for item in candidates])
    contrast = np.array([item.contrast for item in candidates])
    saturation = np.array([item.saturation for item in candidates])
    colorfulness = np.array([item.colorfulness for item in candidates])
    entropy = np.array([item.entropy for item in candidates])
    edge_density = np.array([item.edge_density for item in candidates])
    center_emphasis = np.array([item.center_emphasis for item in candidates])
    palette_complexity = np.array([item.palette_complexity for item in candidates])
    balanced_brightness = 1.0 - np.abs(brightness - 0.55)
    keyword_scores = np.array([keyword_bonus(str(item.path).lower()) for item in candidates])

    unusual_raw = (
        0.55 * percentile_rank(hist_outlier)
        + 0.20 * percentile_rank(palette_complexity)
        + 0.15 * percentile_rank(edge_density)
        + 0.10 * percentile_rank(keyword_scores)
    )
    gaze_raw = (
        0.30 * percentile_rank(colorfulness)
        + 0.28 * percentile_rank(contrast)
        + 0.22 * percentile_rank(center_emphasis)
        + 0.20 * percentile_rank(balanced_brightness)
    )
    hold_raw = (
        0.32 * percentile_rank(entropy)
        + 0.26 * percentile_rank(edge_density)
        + 0.22 * percentile_rank(palette_complexity)
        + 0.20 * percentile_rank(keyword_scores + colorfulness * 0.1)
    )

    for idx, candidate in enumerate(candidates):
        candidate.unusualness = to_rating(percentile_rank(unusual_raw)[idx])
        candidate.gaze_pull = to_rating(percentile_rank(gaze_raw)[idx])
        candidate.hold_power = to_rating(percentile_rank(hold_raw)[idx])
        candidate.description = build_description(candidate)

    candidates.sort(key=lambda item: (item.source_root.name.lower(), item.rel_path.lower()))
    output.parent.mkdir(parents=True, exist_ok=True)
    write_markdown(candidates, output, roots)
    print(f"Wrote {len(candidates)} vertical image rows to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
