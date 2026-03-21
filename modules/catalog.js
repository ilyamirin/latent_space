const GALLERY_META = {
  "01-misticheskii-portretnyi-tsikl": {
    mood: ["ритуал", "таро", "архетип", "аркан", "сумрак", "поле", "символ", "порог"],
    tone: "ритуальный сумрак",
    lineText: "Таро, архетипы, выжженные поля и тихая цифровая притча.",
    curator: ({ title }) =>
      `${title} держится на паузе между знаком и действием. Это работа о моменте, когда фигура ещё не двинулась, но смысл уже сгустился в воздухе.`,
  },
  "02-ryzhaya-geroinya": {
    mood: ["рыжая", "героиня", "огонь", "космос", "ожидание", "сигнал", "свет", "внутренний путь"],
    tone: "рыжий свет",
    lineText: "Сквозной персонаж проходит через жест, космос, окно и внутренний огонь.",
    curator: ({ title }) =>
      `${title} ведёт себя как эпизод большого личного романа. Рыжая фигура здесь не модель, а проводница: она удерживает направление, свет и внутреннюю решимость.`,
  },
  "03-tikhie-miry": {
    mood: ["тишина", "вода", "зима", "медитация", "лодка", "пейзаж", "воздух", "пауза"],
    tone: "мягкая тишина",
    lineText: "Вода, зима, окна и медленный взгляд, который снимает шум с мира.",
    curator: ({ title }) =>
      `${title} работает через снижение темпа. Эта сцена не требует решения: она приглашает задержаться в воздухе, воде или снеговой паузе чуть дольше обычного.`,
  },
  "04-zveri-mif-i-sakralnoe": {
    mood: ["кошка", "собака", "зверь", "мечеть", "миф", "сакральное", "улица", "знак"],
    tone: "бытовой миф",
    lineText: "Животные, улицы и архитектура постепенно превращаются в знаки и притчи.",
    curator: ({ title }) =>
      `${title} выглядит как бытовая сцена, которая слишком долго смотрела на себя и стала мифом. Здесь животное уже не просто герой кадра, а носитель знака.`,
  },
  "05-ai-videniya-i-plakat": {
    mood: ["алгоритм", "плакат", "сатира", "ирония", "корпоративный", "чудо", "спектакль", "цифровой"],
    tone: "цифровая ирония",
    lineText: "Плакатная графика, корпоративный сон и мягкая сатира на современное чудо.",
    curator: ({ title }) =>
      `${title} собирает архив в плакат и заставляет его говорить громче. Здесь ирония не отменяет серьёзности, а только подчёркивает странность цифрового спектакля.`,
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
  "card",
  "image",
  "without",
]);


export async function loadCatalog() {
  const response = await fetch("./assets/galleries/manifest.json");
  if (!response.ok) {
    throw new Error(`manifest request failed: ${response.status}`);
  }

  const manifest = await response.json();
  const galleries = manifest.galleries.map((gallery) => enhanceGallery(gallery));
  const cards = galleries.flatMap((gallery) => gallery.cards);
  const flowCards = buildFlowCards(galleries);

  return { galleries, cards, flowCards };
}


function enhanceGallery(gallery) {
  const meta = GALLERY_META[gallery.slug];
  const cards = gallery.items.map((item) => enhanceCard(gallery, item, meta));
  return {
    slug: gallery.slug,
    title: gallery.title,
    description: gallery.description,
    tone: meta.tone,
    lineText: meta.lineText,
    keywords: meta.mood,
    count: gallery.count,
    cards,
  };
}


function enhanceCard(gallery, item, meta) {
  const sourceTokens = tokenize(item.source_name);
  const title = buildTitle(gallery.title, item.index, sourceTokens);
  const curatorText = meta.curator({ title, tokens: sourceTokens, gallery });
  const leadText = curatorText.split(". ")[0] + ".";
  const prompt = buildPrompt(gallery, title, sourceTokens);
  const tags = unique([
    ...meta.mood,
    meta.tone,
    ...tokenize(gallery.title),
    ...tokenize(gallery.description),
    ...sourceTokens,
  ]);

  return {
    id: `${gallery.slug}-${item.index}`,
    gallerySlug: gallery.slug,
    galleryTitle: gallery.title,
    galleryDescription: gallery.description,
    title,
    subtitle: `${gallery.title} · карта ${String(item.index).padStart(2, "0")}`,
    tone: meta.tone,
    curatorText,
    leadText,
    prompt,
    imageSrc: `./assets/galleries/${gallery.slug}/${item.filename}`,
    width: item.width,
    height: item.height,
    bytes: item.bytes,
    format: item.format,
    quality: item.quality,
    ssim: item.ssim,
    tags,
    audioText: `${gallery.title}. ${title}. ${curatorText} ${prompt}`,
    meta: [
      ["линия", gallery.title],
      ["карта", `${item.index} / ${gallery.count}`],
      ["тон", meta.tone],
      ["размер", `${item.width} × ${item.height}`],
      ["формат", `${item.format} · ${Math.round(item.bytes / 1024)} кб`],
    ],
  };
}


function buildFlowCards(galleries) {
  const queues = galleries.map((gallery) => [...gallery.cards]);
  const result = [];

  while (queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const card = queue.shift();
      if (card) {
        result.push(card);
      }
    }
  }

  return result;
}


function buildTitle(galleryTitle, index, tokens) {
  const readable = tokens.filter((token) => token.length > 3).slice(0, 3);
  if (readable.length > 0) {
    return toSentenceCase(readable.join(" "));
  }
  return `${galleryTitle} ${String(index).padStart(2, "0")}`;
}


function buildPrompt(gallery, title, tokens) {
  const accents = tokens.slice(0, 3).join(", ");
  const accentText = accents ? ` Внутри слышны мотивы: ${accents}.` : "";
  return `${title} включена в линию «${gallery.title}». ${gallery.description}${accentText}`;
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


function toSentenceCase(value) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
