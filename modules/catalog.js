const GALLERY_KEYWORDS = {
  "01-misticheskii-portretnyi-tsikl": {
    mood: ["ритуал", "таро", "архетип", "пыль", "поле", "символ", "сумрак", "аркан", "киборг"],
    voice: "Мягкий кураторский тон о ритуале, архетипах и затишье перед смыслом.",
  },
  "02-ryzhaya-geroinya": {
    mood: ["рыжая", "героиня", "космос", "ожидание", "сигнал", "огонь", "жест", "окно", "компьютер"],
    voice: "Мягкий голос о рыжей проводнице, движении и внутреннем свете.",
  },
  "03-tikhie-miry": {
    mood: ["тишина", "вода", "пейзаж", "лодка", "зима", "тихо", "медитация", "воздух", "свет"],
    voice: "Тихое созерцательное описание, медленный ритм и водяная акварель.",
  },
  "04-zveri-mif-i-sakralnoe": {
    mood: ["кошка", "собака", "зверь", "мечеть", "миф", "сакральное", "улица", "бабочка", "змея"],
    voice: "Наблюдение за тем, как бытовой мир постепенно становится мифом.",
  },
  "05-ai-videniya-i-plakat": {
    mood: ["плакат", "ирония", "алгоритм", "корпоративный", "сатира", "реклама", "чудо", "цифровой", "мем"],
    voice: "Спокойная ирония о цифровом спектакле, продуктивности и чуде под давлением.",
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
  "temp",
  "tmp",
  "без",
]);


export async function loadCatalog() {
  const response = await fetch("./assets/galleries/manifest.json");
  if (!response.ok) {
    throw new Error(`manifest request failed: ${response.status}`);
  }

  const manifest = await response.json();
  const galleries = manifest.galleries.map((gallery) => enhanceGallery(gallery));
  const cards = galleries.flatMap((gallery) => gallery.cards);
  return { galleries, cards };
}


function enhanceGallery(gallery) {
  const meta = GALLERY_KEYWORDS[gallery.slug];
  const cards = gallery.items.map((item) => enhanceCard(gallery, item, meta));
  return {
    slug: gallery.slug,
    title: gallery.title,
    description: gallery.description,
    keywords: meta.mood,
    cards,
  };
}


function enhanceCard(gallery, item, meta) {
  const sourceTokens = tokenize(item.source_name);
  const title = buildTitle(gallery.title, item.index, sourceTokens);
  const subtitle = buildSubtitle(gallery.title, item.index);
  const prompt = buildPrompt(gallery.description, title, meta, sourceTokens);
  const tags = unique([
    ...meta.mood,
    ...sourceTokens,
    ...tokenize(gallery.title),
    ...tokenize(gallery.description),
  ]);
  const audioText = [
    `${gallery.title}.`,
    `${title}.`,
    prompt,
    meta.voice,
  ].join(" ");

  return {
    id: `${gallery.slug}-${item.index}`,
    gallerySlug: gallery.slug,
    galleryTitle: gallery.title,
    galleryDescription: gallery.description,
    title,
    subtitle,
    imageSrc: `./assets/galleries/${gallery.slug}/${item.filename}`,
    width: item.width,
    height: item.height,
    bytes: item.bytes,
    format: item.format,
    quality: item.quality,
    ssim: item.ssim,
    prompt,
    audioText,
    tags,
    meta: [
      ["галерея", gallery.title],
      ["карта", `${item.index} / ${gallery.count}`],
      ["размер", `${item.width} × ${item.height}`],
      ["формат", `${item.format} · ${Math.round(item.bytes / 1024)} кб`],
      ["качество", `q${item.quality} · ssim ${item.ssim}`],
    ],
  };
}


function buildTitle(galleryTitle, index, tokens) {
  const readable = tokens.filter((token) => token.length > 3).slice(0, 3);
  if (readable.length > 0) {
    return toSentenceCase(readable.join(" "));
  }
  return `${galleryTitle} ${String(index).padStart(2, "0")}`;
}


function buildSubtitle(galleryTitle, index) {
  return `${galleryTitle} · карта ${String(index).padStart(2, "0")}`;
}


function buildPrompt(galleryDescription, title, meta, tokens) {
  const accents = tokens.slice(0, 3).join(", ");
  const accentText = accents ? ` Вокруг звучат мотивы: ${accents}.` : "";
  return `${title} раскрывается как ${galleryDescription.toLowerCase()}${accentText} ${meta.voice}`;
}


function tokenize(value) {
  return unique(
    value
      .toLowerCase()
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(/[^a-zа-яё0-9]+/i)
      .map((part) => part.trim())
      .filter((part) => part && !part.match(/^\d+$/) && !STOP_WORDS.has(part))
      .map((part) => normalizeToken(part)),
  );
}


function normalizeToken(token) {
  if (token.endsWith("ии")) {
    return token.slice(0, -2) + "ия";
  }
  if (token.endsWith("ые")) {
    return token.slice(0, -2) + "ый";
  }
  return token;
}


function unique(values) {
  return [...new Set(values)];
}


function toSentenceCase(value) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
