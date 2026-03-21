const SYNONYM_GROUPS = [
  ["тихий", "тишина", "пауза", "медитация", "спокойствие", "воздух"],
  ["ритуал", "таро", "аркан", "символ", "миф", "сакральное"],
  ["рыжая", "огонь", "свет", "героиня", "девушка", "девочка"],
  ["город", "улица", "архитектура", "окно", "мечеть"],
  ["зверь", "кошка", "собака", "бабочка", "животное", "змея"],
  ["космос", "луна", "звезда", "орбита", "астрал"],
];

const POSITION_KEYS = ["корень вопроса", "узел напряжения", "направление"];


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


export function buildSpread(cards, question = "") {
  const scored = question.trim() ? scoreCards(question, cards) : [];
  const basePool = scored.length >= 9 ? shuffle([...scored.slice(0, 18)]) : shuffle([...cards]);
  return basePool.slice(0, 3);
}


export function getPositionLabel(index) {
  return POSITION_KEYS[index] ?? "";
}


export function buildCardInterpretation(card, index, question) {
  const position = getPositionLabel(index);
  const questionText = question.trim()
    ? `В контексте вопроса «${question.trim()}» `
    : "";

  if (index === 0) {
    return `${questionText}эта карта показывает, где сейчас сгущается главный смысл и откуда растёт внутреннее движение.`;
  }
  if (index === 1) {
    return `${questionText}эта карта указывает на трение, сопротивление или ту силу, которая не даёт сюжету остаться простым.`;
  }
  return `${questionText}эта карта предлагает направление: не готовый ответ, а тон следующего шага.`;
}


export function buildSpreadSummary(spreadCards, question) {
  if (spreadCards.length < 3) {
    return "";
  }

  const tones = spreadCards.map((card) => card.tone).join(", ");
  const questionPart = question.trim()
    ? `Ваш вопрос звучит как «${question.trim()}». `
    : "";

  return (
    `${questionPart}Расклад собирается из трёх состояний: ${tones}. ` +
    `Первая карта формулирует ядро темы, вторая усиливает напряжение, третья переводит всё это в возможный вектор. ` +
    `Это не предсказание, а образная схема того, как сейчас устроен ваш внутренний сюжет.`
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
