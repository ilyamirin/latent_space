import {
  buildFallbackCardTitle,
  CARD_TITLE_OVERRIDES,
  FEATURED_TAGS,
  GALLERY_COPY,
  shouldUseSourceTitle,
} from "./copy.js";
import { normalizeText } from "./search-query.js";

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
    const meta = GALLERY_COPY[gallery.slug];
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
    featuredTags: FEATURED_TAGS,
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
  const title = buildTitle(gallery, item.index, tokens);
  const description = meta.description;
  const assetVersion = `${item.bytes ?? 0}-${item.width ?? 0}x${item.height ?? 0}`;
  const searchTags = unique([meta.tone, ...tokenize(gallery.title), ...tokenize(gallery.description), ...tokens]);
  return {
    id: `${gallery.slug}-${item.index}`,
    title,
    description,
    tone: meta.tone,
    galleryTitle: gallery.title,
    imageSrc: `./assets/galleries/${gallery.slug}/${item.filename}?v=${assetVersion}`,
    width: item.width,
    height: item.height,
    tags: searchTags,
    searchTitle: normalizeText(title),
    searchDescription: normalizeText(description),
    searchTone: normalizeText(meta.tone),
    searchGallery: normalizeText(gallery.title),
    searchTagsText: normalizeText(searchTags.join(" ")),
    searchText: normalizeText([title, description, meta.tone, gallery.title, ...searchTags].join(" ")),
  };
}


function buildTitle(gallery, index, tokens) {
  const override = CARD_TITLE_OVERRIDES[`${gallery.slug}-${index}`];
  if (override) {
    return override;
  }

  const readable = tokens.filter((token) => token.length > 3 && token.length <= 18).slice(0, 2);
  if (readable.length > 0 && shouldUseSourceTitle(readable)) {
    return readable[0].charAt(0).toUpperCase() + readable.join(" ").slice(1);
  }
  return buildFallbackCardTitle(gallery.slug, index);
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
