#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = PROJECT_ROOT / "assets" / "galleries"


GALLERIES = [
    {
        "slug": "01-misticheskii-portretnyi-tsikl",
        "title": "Мистический портретный цикл",
        "description": "Таро, архетипы, выжженные поля, фигуры на границе ритуала и цифровой притчи.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/16_башня_обновление.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00023-324712468.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00031-2765451205.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00029-1710528807.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/31bb9b4f-8771-40be-a99c-307e5263a5d2.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/99ed7c1223ab478cfea474759cc1a13ee623cec72b3848df57b0d35b.jpg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/abcd7969-e092-44ad-8740-13d11ff528b7.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/11c98132-e34a-40ce-958c-b43fc7679acc.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-csbam8jhr1rm80ctanjbsy9724.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-dk624fv389rmc0ctankrnj1pjg.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-j6tj8q665nrm80ctbc2twt8710.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-7dyffnvs9nrmc0ctbc2rewna0w.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-rbqst3z7b5rmc0ctansagacdgc.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-bnbqq0znndrmc0ctaneb7a1dw4.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/11_справедливость_без_долга.jpg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/12_повешенный_по_собственному.jpg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/15_дьявол_алгоритм.jpg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/18_луна_без_страхов.jpg",
        ],
    },
    {
        "slug": "02-ryzhaya-geroinya",
        "title": "Рыжая героиня",
        "description": "Один сквозной персонаж проходит через жест, космос, ожидание и бытовую сцену.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00022-2216428888.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00023-915334462.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00026-1794339283.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00027-1794339284.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00043-1794339300.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00044-1794339301.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00021-2988042493.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/image (16).png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00014-1187765802.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/image (3).png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00015-115594058.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00017-4167027847.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00045-1794339302.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/image.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/image (5).png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/005cf022-dbc9-4eff-8ff4-cb629c430799.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка в космосе/00046-1794339303.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00033-1034922259.png",
        ],
    },
    {
        "slug": "03-tikhie-miry",
        "title": "Тихие миры",
        "description": "Медленные внутренние пейзажи: окна, поля, дети на воде, зимняя тишина и акварельное спокойствие.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00013-3298262996.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00031-1527523948.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00001-3877806212.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00007-711015873.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00017-1067285133.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00021-4224879126.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00010-4157353540.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00004-3561926520.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00019-2767971065.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00018-254729481.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00015-2593735691.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00009-1829974236.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00010-3640817879.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00012-290870974.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00013-3665710575.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00014-1016361179.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/бабочка зимой/00016-4185246755.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/бабочка зимой/00023-1025352151.png",
        ],
    },
    {
        "slug": "04-zveri-mif-i-sakralnoe",
        "title": "Звери, миф и сакральное",
        "description": "Кошки в исламской архитектуре, черные собаки, змеи и бабочки как знаки бытового мифа.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00030-481033081.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00031-4167196763.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00034-3845815524.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00035-631760761.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00037-3506846610.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00038-1446700523.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00039-2027856081.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00040-873734958.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/кошки и мечети/00041-1381707414.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00000-4225072087.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00001-1638776128.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00002-1444157343.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00003-2873566962.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00038-3251925361.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00004-2371671811.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00004-2897098174.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00021-3561121249.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00005-2897098175.png",
        ],
    },
    {
        "slug": "05-ai-videniya-i-plakat",
        "title": "AI-видения и плакат",
        "description": "Более графичная и странная линия: цифровые видения, меметическая иллюстрация и тревожный корпоративный сон без прямолинейных слоганов.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/HR ангел Мы заботимся.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-28jnvcywgxrmw0cvb9zrj4ttdw.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/0b160a8b-2ffc-4b44-8258-9763e7c4ff59.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-fyya7d9j5xrmy0cvb9kak4ntew.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-g1n0yndmksrmy0cvbdbb6z9p94.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/Rf0_LXX3fco92f8ph2l96kIruRG3IRTEw65x2waG4IxTfL2HPau4NRdWx5MCqdmUSS7nRMV7wFSNGRn7eWwLNv-n.jpg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-ncn0ttw2nsrmw0cvba6a6kv2hc.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-wdy332f05nrmr0cvbdbvj8f8pm.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Алгоритм Я не злой. Я точный.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-mxtddjskkhrme0ctangbhqe800.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Гуру продуктивности Ты просто можешь больше.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/a55628aa-57ad-4236-8a78-e373a490f83c.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Air3/replicate-prediction-sx5y0e4bqdrma0ctang9kpggrg.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже символы выгорают 3.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже чудеса считают калории.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00041-1635725547.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00020-3031227991.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00000-1208873029.png",
        ],
    },
]


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "total_slots": 0,
        "unique_works": 0,
        "duplicate_slots": 0,
        "galleries": [],
    }

    all_sources: list[str] = []

    for gallery in GALLERIES:
        target_dir = OUTPUT_ROOT / gallery["slug"]
        target_dir.mkdir(parents=True, exist_ok=True)
        items_out = []

        for index, source_text in enumerate(gallery["items"], start=1):
            source = Path(source_text)
            if not source.exists():
                raise FileNotFoundError(source)
            ext = source.suffix.lower()
            target_name = f"{index:02d}{ext}"
            target = target_dir / target_name
            shutil.copy2(source, target)

            item = {
                "index": index,
                "filename": target_name,
                "source": str(source),
                "source_name": source.name,
            }
            items_out.append(item)
            all_sources.append(str(source))

        manifest["galleries"].append(
            {
                "slug": gallery["slug"],
                "title": gallery["title"],
                "description": gallery["description"],
                "count": len(items_out),
                "items": items_out,
            }
        )

    counts = Counter(all_sources)
    manifest["total_slots"] = len(all_sources)
    manifest["unique_works"] = len(counts)
    manifest["duplicate_slots"] = sum(count - 1 for count in counts.values())

    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    lines = [
        "# Галереи",
        "",
        f"- Всего слотов: **{manifest['total_slots']}**",
        f"- Уникальных работ: **{manifest['unique_works']}**",
        f"- Повторных слотов: **{manifest['duplicate_slots']}**",
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
                f"- `{gallery['slug']}/{item['filename']}` ← `{item['source']}`"
            )
        lines.append("")

    (OUTPUT_ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
