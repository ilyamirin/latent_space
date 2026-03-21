const SYNONYM_GROUPS = [
  ["тихий", "тишина", "спокойствие", "медитация", "воздух", "мягкость"],
  ["ритуал", "таро", "аркан", "символ", "сакральное", "миф"],
  ["рыжая", "героиня", "огонь", "сигнал", "девочка", "девушка"],
  ["город", "улица", "архитектура", "мечеть", "окно", "компьютер"],
  ["кошка", "кот", "собака", "зверь", "бабочка", "змея", "животное"],
  ["космос", "луна", "звезда", "астрал", "орбита"],
  ["плакат", "сатира", "алгоритм", "ирония", "реклама", "корпоративный"],
  ["вода", "река", "лодка", "каяк", "озеро", "туман"],
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
          score += 7;
        }

        const group = SYNONYM_GROUPS.find((item) => item.includes(token));
        if (group) {
          for (const synonym of group) {
            if (haystack.has(synonym)) {
              score += synonym === token ? 0 : 3;
            }
          }
        }

        if (card.title.toLowerCase().includes(token)) {
          score += 5;
        }

        if (card.galleryTitle.toLowerCase().includes(token)) {
          score += 4;
        }
      }

      if (card.gallerySlug === activeGallerySlug) {
        score += 1.5;
      }

      return { card, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);
}


function tokenize(value) {
  return value
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}
