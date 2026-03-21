const GALLERY_META = {
  "01-misticheskii-portretnyi-tsikl": {
    tone: "ритуальный сумрак",
    description:
      "Работа о паузе между знаком и действием, где смысл уже успел сгуститься.",
  },
  "02-ryzhaya-geroinya": {
    tone: "рыжий свет",
    description:
      "Работа о внутреннем свете, проводничестве и движении сквозь личный сюжет.",
  },
  "03-tikhie-miry": {
    tone: "мягкая тишина",
    description:
      "Работа о снижении темпа, воде, воздухе и взгляде, который снимает шум с мира.",
  },
  "04-zveri-mif-i-sakralnoe": {
    tone: "бытовой миф",
    description:
      "Работа о моменте, когда бытовая сцена становится знаком, притчей или мифом.",
  },
  "05-ai-videniya-i-plakat": {
    tone: "цифровая ирония",
    description:
      "Работа о цифровом спектакле, плакатной ясности и мягкой иронии на современное чудо.",
  },
};

const STOP_WORDS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "image",
  "chatgpt",
  "prediction",
  "replicate",
  "photo",
  "tmp",
  "without",
  "card",
  "img",
]);


export async function loadCatalog() {
  const response = await fetchManifest();
  const manifest = await response.json();
  const galleries = manifest.galleries.map((gallery) => {
    const meta = GALLERY_META[gallery.slug];
    return {
      slug: gallery.slug,
      title: gallery.title,
      description: gallery.description,
      tone: meta.tone,
      cards: gallery.items.map((item) => enhanceCard(gallery, item, meta)),
    };
  });

  const cards = galleries.flatMap((gallery) => gallery.cards);
  return {
    galleries,
    cards,
    featuredTags: ["ритуал", "тишина", "рыжая", "миф", "огонь", "звери", "космос", "город"],
  };
}


async function fetchManifest() {
  const candidates = [
    "./assets/galleries/manifest.json",
    "/assets/galleries/manifest.json",
  ];

  const failures = [];

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) {
        return response;
      }
      failures.push(`${path} -> ${response.status}`);
    } catch (error) {
      failures.push(`${path} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`manifest request failed: ${failures.join("; ")}`);
}


function enhanceCard(gallery, item, meta) {
  const tokens = tokenize(item.source_name);
  const title = buildTitle(gallery.title, item.index, tokens);
  const description = meta.description;
  return {
    id: `${gallery.slug}-${item.index}`,
    title,
    description,
    tone: meta.tone,
    galleryTitle: gallery.title,
    imageSrc: `./assets/galleries/${gallery.slug}/${item.filename}`,
    width: item.width,
    height: item.height,
    tags: unique([meta.tone, ...tokenize(gallery.title), ...tokenize(gallery.description), ...tokens]),
  };
}


function buildTitle(galleryTitle, index, tokens) {
  const readable = tokens.filter((token) => token.length > 3 && token.length <= 18).slice(0, 3);
  if (readable.length > 0) {
    return readable[0].charAt(0).toUpperCase() + readable.join(" ").slice(1);
  }
  return `${galleryTitle} ${String(index).padStart(2, "0")}`;
}


function tokenize(value) {
  return unique(
    value
      .toLowerCase()
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(/[^a-zа-яё0-9]+/i)
      .map((part) => part.trim())
      .filter((part) => part && !part.match(/^\d+$/) && !STOP_WORDS.has(part)),
  );
}


function unique(values) {
  return [...new Set(values)];
}
