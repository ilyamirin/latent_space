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
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_230238_two_male_cyborgs_one_tall_and_one_short_staying_at_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_230323_two_male_cyborgs_one_tall_and_one_short_staying_at_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_235544_______.__-______________________-______________-.__1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_235607_______.__-______________________-______________-.__1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_235756_______._______-____________-________________.____._1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251101_235854_Карта_Таро_с_названием_Отец-отдых._Мягкий_минимали_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_001702_Карта_Таро_с_названием_Начало_без_цели._Мягкий_мин_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_002115_Карта_Таро_с_названием_Руки_а_не_алгоритмы._Мягкий_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_002244_Карта_Таро_с_названием_Руки_а_не_алгоритмы._Приглу_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_003014_Карта_Таро_с_названием_Колесо_без_кармы._Приглушён_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_003014_Карта_Таро_с_названием_Колесо_без_кармы._Приглушён_2.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_003014_Карта_Таро_с_названием_Колесо_без_кармы._Приглушён_3.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_003239_Карта_Таро_с_названием_Отец-отдых._Приглушённый_эк_1.jpeg",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/карты Таро/20251102_003239_Карта_Таро_с_названием_Отец-отдых._Приглушённый_эк_2.jpeg",
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
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00011-144899893.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00012-3851404609.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00014-1187765802.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00014-1712379931.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00015-115594058.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/рыжая девочка поднимает руку/00017-4167027847.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00000-241889493.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00001-992504662.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00002-992504663.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00003-992504664.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00004-992504665.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2024 рыжая девушка за компом/00005-992504666.png",
        ],
    },
    {
        "slug": "03-tikhie-miry",
        "title": "Тихие миры",
        "description": "Медленные внутренние пейзажи: окна, поля, дети на воде, зимняя тишина и акварельное спокойствие.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00000-2949235211.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00000-3411233221.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00001-3877806212.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00002-1814083585.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00003-1404950705.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00003-1487955224.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00004-1627124748.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/успокаивающие изображения TONYA AI/00004-3561926520.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00005-2069051691.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00006-871580320.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2025 дети каяки и киты/00008-219812277.png",
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
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00004-204499573.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00004-2371671811.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00004-2897098174.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00005-204499574.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/Ленаре собаки и кошки и проч/00005-2897098175.png",
        ],
    },
    {
        "slug": "05-ai-videniya-i-plakat",
        "title": "AI-видения и плакат",
        "description": "Более сатирическая и графичная линия: цифровой плакат, меметическая иллюстрация и странный корпоративный сон.",
        "items": [
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/HR ангел Мы заботимся.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-28jnvcywgxrmw0cvb9zrj4ttdw.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-7f7qz1p3bsrmy0cvbdabqm0b2c.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-fyya7d9j5xrmy0cvb9kak4ntew.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-g1n0yndmksrmy0cvbdbb6z9p94.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-gyfjpmw2qhrmt0cvbd88wdvphw.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-ncn0ttw2nsrmw0cvba6a6kv2hc.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/replicate-prediction-wdy332f05nrmr0cvbdbvj8f8pm.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Алгоритм Я не злой. Я точный.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Взрослые хотят чуда, но называют его бонусом.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Гуру продуктивности Ты просто можешь больше.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже символы выгорают 1.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже символы выгорают 2.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже символы выгорают 3.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Даже чудеса считают калории.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Контроль убивает волшебство.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Магия уходит туда, где внимание 1.png",
            "/Users/ilyagmirin/Yandex.Disk.localized/Изображения/2026 публикации/Магия уходит туда, где внимание 2.png",
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
