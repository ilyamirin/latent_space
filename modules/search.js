const SYNONYM_GROUPS = [
  ["тихий", "тишина", "пауза", "медитация", "мягкость", "спокойствие", "воздух"],
  ["ритуал", "таро", "аркан", "символ", "сакральное", "миф", "знак"],
  ["рыжая", "героиня", "свет", "огонь", "девочка", "девушка"],
  ["город", "улица", "окно", "архитектура", "мечеть"],
  ["кошка", "кот", "собака", "зверь", "бабочка", "змея", "животное"],
  ["космос", "луна", "звезда", "орбита", "астрал"],
  ["плакат", "алгоритм", "ирония", "сатира", "корпоративный", "цифровой"],
  ["вода", "лодка", "каяк", "озеро", "туман", "река"],
];


export function scoreCards(query, cards, activeGallerySlug) {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  return cards
    .map((card) => {
      const haystack = new Set(card.tags);
      let score = 0;

      for (const token of tokens) {
        if (haystack.has(token)) {
          score += 8;
        }
        if (card.title.toLowerCase().includes(token)) {
          score += 5;
        }
        if (card.galleryTitle.toLowerCase().includes(token)) {
          score += 4;
        }

        const group = SYNONYM_GROUPS.find((item) => item.includes(token));
        if (group) {
          for (const synonym of group) {
            if (haystack.has(synonym)) {
              score += synonym === token ? 0 : 3;
            }
          }
        }
      }

      if (card.gallerySlug === activeGallerySlug) {
        score += 1.2;
      }

      return { card, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);
}


export function findSimilarTone(sourceCard, cards) {
  const baseTags = new Set(sourceCard.tags);
  return cards
    .filter((card) => card.id !== sourceCard.id)
    .map((card) => {
      let score = 0;
      for (const tag of card.tags) {
        if (baseTags.has(tag)) {
          score += 3;
        }
      }

      if (card.tone === sourceCard.tone) {
        score += 7;
      }
      if (card.gallerySlug === sourceCard.gallerySlug) {
        score += 2;
      }
      if (card.curatorText.slice(0, 32) === sourceCard.curatorText.slice(0, 32)) {
        score += 1;
      }

      return { card, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 18)
    .map((item) => item.card);
}


function tokenize(value) {
  return value
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}
