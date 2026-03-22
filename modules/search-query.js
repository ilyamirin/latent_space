const QUERY_STOP_WORDS = new Set([
  "и",
  "или",
  "в",
  "во",
  "на",
  "по",
  "с",
  "со",
  "к",
  "ко",
  "о",
  "об",
  "от",
  "до",
  "для",
  "из",
  "под",
  "над",
  "не",
  "это",
  "тот",
  "та",
]);

export const SYNONYM_GROUPS = [
  ["тихий", "тишина", "пауза", "медитация", "спокойствие", "воздух", "вода", "покой"],
  ["ритуал", "обряд", "таро", "аркан", "символ", "миф", "сакральное", "знак"],
  ["рыжая", "рыжий", "огонь", "жар", "свет", "героиня", "девушка", "девочка"],
  ["город", "улица", "архитектура", "окно", "мечеть", "камень"],
  ["зверь", "звери", "кошка", "собака", "бабочка", "животное", "змея", "лиса"],
  ["космос", "луна", "звезда", "орбита", "астрал", "небо"],
  ["алгоритм", "цифра", "цифровой", "плакат", "нейросеть", "технология"],
];


export function normalizeText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ")
    .trim();
}


export function tokenizeQuery(value = "") {
  return [...new Set(
    normalizeText(value)
      .split(/[^a-zа-я0-9]+/i)
      .map((part) => part.trim())
      .filter((part) => part && !QUERY_STOP_WORDS.has(part)),
  )];
}


export function expandQueryTokens(tokens) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const group = SYNONYM_GROUPS.find((items) => items.includes(token));
    if (!group) {
      continue;
    }

    for (const item of group) {
      expanded.add(item);
    }
  }

  return [...expanded];
}
