#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parent.parent
GALLERIES_ROOT = PROJECT_ROOT / "assets" / "galleries"
MANIFEST_PATH = GALLERIES_ROOT / "manifest.json"
README_PATH = GALLERIES_ROOT / "README.md"
MAX_LONG_EDGE = 2048
SSIM_THRESHOLD = 0.992
QUALITY_MIN = 5
QUALITY_MAX = 90


@dataclass
class OptimizationResult:
    width: int
    height: int
    bytes_before: int
    bytes_after: int
    quality: int
    ssim: float
    resized: bool


def progress_bar(done: int, total: int, width: int = 24) -> str:
    total = max(total, 1)
    filled = round(width * done / total)
    return f"[{'#' * filled}{'.' * (width - filled)}] {done}/{total} ({done / total * 100:5.1f}%)"


def resize_for_web(image: Image.Image) -> tuple[Image.Image, bool]:
    width, height = image.size
    long_edge = max(width, height)
    if long_edge <= MAX_LONG_EDGE:
        return image, False

    scale = MAX_LONG_EDGE / long_edge
    new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS), True


def channel_ssim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float64)
    b = b.astype(np.float64)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu_a = a.mean()
    mu_b = b.mean()
    var_a = a.var()
    var_b = b.var()
    cov = ((a - mu_a) * (b - mu_b)).mean()
    numerator = (2 * mu_a * mu_b + c1) * (2 * cov + c2)
    denominator = (mu_a**2 + mu_b**2 + c1) * (var_a + var_b + c2)
    if denominator == 0:
        return 1.0
    return float(numerator / denominator)


def image_similarity(reference: Image.Image, candidate: Image.Image) -> float:
    ref = np.asarray(reference.convert("RGB"))
    cur = np.asarray(candidate.convert("RGB"))

    luma_ref = 0.299 * ref[:, :, 0] + 0.587 * ref[:, :, 1] + 0.114 * ref[:, :, 2]
    luma_cur = 0.299 * cur[:, :, 0] + 0.587 * cur[:, :, 1] + 0.114 * cur[:, :, 2]

    score = 0.7 * channel_ssim(luma_ref, luma_cur)
    score += 0.1 * channel_ssim(ref[:, :, 0], cur[:, :, 0])
    score += 0.1 * channel_ssim(ref[:, :, 1], cur[:, :, 1])
    score += 0.1 * channel_ssim(ref[:, :, 2], cur[:, :, 2])
    return float(score)


def save_webp(image: Image.Image, output: Path, quality: int) -> None:
    image.save(
        output,
        format="WEBP",
        quality=quality,
        method=6,
    )


def candidate_quality(image: Image.Image, quality: int) -> tuple[int, float, bytes]:
    with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        save_webp(image, tmp_path, quality)
        with Image.open(tmp_path) as encoded:
            encoded = ImageOps.exif_transpose(encoded).convert("RGB")
            score = image_similarity(image, encoded)
        return quality, score, tmp_path.stat().st_size
    finally:
        tmp_path.unlink(missing_ok=True)


def choose_quality(image: Image.Image) -> tuple[int, float]:
    best_quality = QUALITY_MAX
    best_score = 1.0
    low = QUALITY_MIN
    high = QUALITY_MAX

    while low <= high:
        mid = (low + high) // 2
        _, score, _ = candidate_quality(image, mid)
        if score >= SSIM_THRESHOLD:
            best_quality = mid
            best_score = score
            high = mid - 1
        else:
            low = mid + 1

    _, best_score, _ = candidate_quality(image, best_quality)
    return best_quality, best_score


def optimize_file(path: Path) -> OptimizationResult:
    bytes_before = path.stat().st_size
    with Image.open(path) as source:
        source = ImageOps.exif_transpose(source)
        mode = "RGBA" if "A" in source.getbands() else "RGB"
        prepared = source.convert(mode)

    prepared, resized = resize_for_web(prepared)
    width, height = prepared.size
    quality, score = choose_quality(prepared)

    output_path = path.with_suffix(".webp")
    save_webp(prepared, output_path, quality)
    bytes_after = output_path.stat().st_size

    if output_path != path:
        path.unlink()

    return OptimizationResult(
        width=width,
        height=height,
        bytes_before=bytes_before,
        bytes_after=bytes_after,
        quality=quality,
        ssim=score,
        resized=resized,
    )


def write_readme(manifest: dict) -> None:
    stats = manifest["optimization"]
    lines = [
        "# Галереи",
        "",
        f"- Всего слотов: **{manifest['total_slots']}**",
        f"- Уникальных работ: **{manifest['unique_works']}**",
        f"- Повторных слотов: **{manifest['duplicate_slots']}**",
        f"- Формат веб-ассетов: **webp**",
        f"- Размер до оптимизации: **{stats['total_bytes_before']}** байт",
        f"- Размер после оптимизации: **{stats['total_bytes_after']}** байт",
        f"- Экономия: **{stats['saved_bytes']}** байт ({stats['saved_percent']}%)",
        f"- Максимальная длина стороны: **{stats['max_long_edge']} px**",
        f"- Целевой порог качества: **SSIM >= {stats['ssim_threshold']}**",
        "",
    ]

    for gallery in manifest["galleries"]:
        lines.append(f"## {gallery['title']}")
        lines.append("")
        lines.append(gallery["description"])
        lines.append("")
        lines.append(f"Работ: **{gallery['count']}**")
        lines.append("")
        for item in gallery["items"]:
            lines.append(
                f"- `{gallery['slug']}/{item['filename']}` "
                f"({item['width']}×{item['height']}, {item['bytes']} байт, q={item['quality']}, ssim={item['ssim']}) "
                f"← `{item['source']}`"
            )
        lines.append("")

    README_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    all_items = [item for gallery in manifest["galleries"] for item in gallery["items"]]
    total = len(all_items)
    total_before = 0
    total_after = 0

    for done, gallery in enumerate(manifest["galleries"], start=0):
        _ = gallery

    processed = 0
    for gallery in manifest["galleries"]:
        for item in gallery["items"]:
            asset_path = GALLERIES_ROOT / gallery["slug"] / item["filename"]
            result = optimize_file(asset_path)
            item["filename"] = Path(item["filename"]).with_suffix(".webp").name
            item["format"] = "webp"
            item["width"] = result.width
            item["height"] = result.height
            item["bytes"] = result.bytes_after
            item["quality"] = result.quality
            item["ssim"] = round(result.ssim, 4)
            item["resized"] = result.resized

            total_before += result.bytes_before
            total_after += result.bytes_after
            processed += 1
            print(progress_bar(processed, total))

    saved_bytes = total_before - total_after
    saved_percent = round(saved_bytes / total_before * 100, 2) if total_before else 0.0
    manifest["optimization"] = {
        "format": "webp",
        "total_bytes_before": total_before,
        "total_bytes_after": total_after,
        "saved_bytes": saved_bytes,
        "saved_percent": saved_percent,
        "max_long_edge": MAX_LONG_EDGE,
        "ssim_threshold": SSIM_THRESHOLD,
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    write_readme(manifest)


if __name__ == "__main__":
    main()
