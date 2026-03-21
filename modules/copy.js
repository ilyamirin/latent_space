export const UI_COPY = {
  searchCollapsed: "искать знак",
  searchActive: "назовите знак",
  searchPlaceholder: "дым, узел, зверь, алгоритм...",
  noScript: "Без JavaScript колода молчит.",
  home: {
    hero: "выберите колоду. первый знак выйдет сразу.",
    kicker: "пять входов",
    title: "откуда войдёт вопрос",
    intro: "У каждой колоды свой нерв: ритуал, рыжий жар, тишина, миф, цифровой жар.",
  },
  spread: {
    kicker: "три знака",
    title: "исток, узел, след",
    intro: "Сначала то, что уже поднялось. Потом то, что держит. Потом то, что зовёт дальше.",
    placeholderLines: ["исток", "узел", "след"],
    nextCardHero: "коснитесь карты: дальше еще знак",
    nextCardAria: "Открыть следующий знак",
    cycleCardAria: "Следующий знак расклада",
    hintBeforeComplete: "коснитесь карты: дальше еще знак",
    hintAfterComplete: "верхние карты дают выбор. большая ведет по кругу.",
  },
  search: {
    kicker: "поиск",
    emptyTitle: "знак не вышел",
    emptyText: "Попробуйте одно слово. Иногда его хватает.",
    emptyHero: "слово или тег",
    resultHero: "листайте дальше",
    placeholderLines: ["тишина", "ритуал", "миф"],
    nextResultAria: "Следующий знак",
  },
  error: {
    kicker: "сбой",
    title: "колода не открылась",
  },
};

export const FEATURED_TAGS = [
  "ритуал",
  "тишина",
  "рыжая",
  "миф",
  "огонь",
  "зверь",
  "космос",
  "алгоритм",
];

export const GALLERY_COPY = {
  "01-misticheskii-portretnyi-tsikl": {
    tone: "ритуал",
    description: "Знак проступает из золы.",
    seriesTitle: "Портрет",
  },
  "02-ryzhaya-geroinya": {
    tone: "рыжий жар",
    description: "Свет идет впереди имени.",
    seriesTitle: "Героиня",
  },
  "03-tikhie-miry": {
    tone: "тишина",
    description: "Тишина держит мир целым.",
    seriesTitle: "Тишина",
  },
  "04-zveri-mif-i-sakralnoe": {
    tone: "миф",
    description: "Быт вдруг становится мифом.",
    seriesTitle: "Миф",
  },
  "05-ai-videniya-i-plakat": {
    tone: "цифровой жар",
    description: "Чудо шипит сквозь пиксели.",
    seriesTitle: "Видение",
  },
};

export const CARD_TITLE_OVERRIDES = {
  "01-misticheskii-portretnyi-tsikl-1": "Башня",
  "01-misticheskii-portretnyi-tsikl-15": "Справедливость",
  "01-misticheskii-portretnyi-tsikl-16": "Повешенный",
  "01-misticheskii-portretnyi-tsikl-17": "Дьявол",
  "01-misticheskii-portretnyi-tsikl-18": "Луна",
  "05-ai-videniya-i-plakat-1": "Ангел",
  "05-ai-videniya-i-plakat-9": "Алгоритм",
  "05-ai-videniya-i-plakat-11": "Гуру",
  "05-ai-videniya-i-plakat-14": "Выгорание",
  "05-ai-videniya-i-plakat-15": "Калории чуда",
};

const POSITION_LABELS = ["исток", "узел", "след"];
const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
];

export function getPositionLabel(index) {
  return POSITION_LABELS[index] ?? "";
}

export function buildSpreadPlaceholder() {
  return UI_COPY.spread.placeholderLines.join("<br />");
}

export function buildSearchPlaceholder() {
  return UI_COPY.search.placeholderLines.join("<br />");
}

export function buildSearchResultLabel(index, total) {
  return `знак ${index + 1} из ${total}`;
}

export function buildCardInterpretation(card, index) {
  if (index === 0) {
    return `${card.title}. Здесь вопрос уже пустил корни.`;
  }
  if (index === 1) {
    return `${card.title}. Здесь узел стягивается туже.`;
  }
  return `${card.title}. Это след шага, который ещё не сделан.`;
}

export function buildSpreadSummary(spreadCards) {
  if (spreadCards.length < 3) {
    return "";
  }

  const tones = spreadCards.map((card) => card.tone).join(", ");
  return `Три знака сошлись: ${tones}. Исток назван. Узел слышен. Дальше только след.`;
}

export function shouldUseSourceTitle(tokens) {
  return tokens.some((token) => /[а-яё]/i.test(token));
}

export function buildFallbackCardTitle(gallerySlug, index) {
  const seriesTitle = GALLERY_COPY[gallerySlug]?.seriesTitle ?? "Карта";
  return `${seriesTitle} ${ROMAN_NUMERALS[index - 1] ?? String(index)}`;
}
