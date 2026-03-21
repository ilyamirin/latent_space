const SYNONYM_GROUPS = [
  ["тихий", "тишина", "пауза", "медитация", "спокойствие", "воздух"],
  ["ритуал", "таро", "аркан", "символ", "миф", "сакральное"],
  ["рыжая", "огонь", "свет", "героиня", "девушка", "девочка"],
  ["город", "улица", "архитектура", "окно", "мечеть"],
  ["зверь", "кошка", "собака", "бабочка", "животное", "змея"],
  ["космос", "луна", "звезда", "орбита", "астрал"],
];

const POSITION_KEYS = ["корень вопроса", "узел напряжения", "вектор"];


export function scoreCards(query, cards) {
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
        if (card.description.toLowerCase().includes(token)) {
          score += 3;
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
      return { card, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);
}


export function buildSpread(cards) {
  return shuffle([...cards]).slice(0, 3);
}


export function getPositionLabel(index) {
  return POSITION_KEYS[index] ?? "";
}


export function buildCardInterpretation(card, index) {
  if (index === 0) {
    return `${card.title} показывает, где сейчас уже собралась энергия сюжета. Здесь вопрос перестаёт быть абстрактным и получает плотность.`;
  }
  if (index === 1) {
    return `${card.title} обозначает трение: то, что усложняет движение и не даёт истории остаться ровной. Именно здесь слышен главный внутренний узел.`;
  }
  return `${card.title} не обещает готовый ответ, но показывает тон следующего шага. Это скорее направление внимания, чем инструкция.`;
}


export function buildSpreadSummary(spreadCards) {
  if (spreadCards.length < 3) {
    return "";
  }

  const tones = spreadCards.map((card) => card.tone).join(", ");
  return (
    `Вместе три карты складываются в связку из состояний: ${tones}. ` +
    `Сначала колода показывает ядро, затем место напряжения, а потом уводит взгляд в сторону возможного движения. ` +
    `Это чтение не про предсказание, а про форму вашего текущего внутреннего сюжета.`
  );
}


function tokenize(value) {
  return value
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}


function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}
