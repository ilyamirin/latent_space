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
    authorLabel: "об авторе",
    authorPrompt: "три карты о человеке, который собрал эту колоду",
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
  author: {
    kicker: "три карты автора",
    hero: "верхние карты дают выбор. большая ведет по кругу.",
    nextCardAria: "Следующая карта автора",
    collaborationTitle: "по вопросам сотрудничества",
  },
  error: {
    kicker: "сбой",
    title: "колода не открылась",
  },
};

export const AUTHOR_CONTACTS = [
  {
    label: "почта",
    href: "mailto:ilya.mirin@gmail.com",
    value: "ilya.mirin@gmail.com",
  },
  {
    label: "linkedin",
    href: "https://www.linkedin.com/in/ilyamirin",
    value: "linkedin.com/in/ilyamirin",
  },
  {
    label: "telegram",
    href: "https://t.me/healthyit",
    value: "t.me/healthyit",
  },
];

export const AUTHOR_CARDS = [
  {
    id: "author-origin",
    position: "исток",
    shortTitle: "автор",
    title: "Илья Мирин",
    subtitle: "Staff AI Systems Engineer · LLM Platforms · AI Infrastructure",
    lead: "Инженер, который строит AI-native системы и превращает естественный язык в работающий софт.",
    paragraphs: [
      "Проект делает Илья Мирин — Staff-level инженер, работающий на пересечении LLM-платформ, AI-инфраструктуры и внутренних AI-продуктов.",
      "Его практика начинается не с декоративного слоя вокруг технологии, а с системной сборки: как из намерения, текста и слабой идеи получить рабочий, понятный и пригодный к развитию инструмент.",
    ],
  },
  {
    id: "author-practice",
    position: "узел",
    shortTitle: "практика",
    title: "AI-native практика",
    subtitle: "OpenAI-compatible backends · orchestration · internal AI products",
    lead: "Autocode workflows, retrieval layers, assistant backends и инженерные привычки, которые помогают собирать системы через AI, а не только добавлять AI в системы.",
    paragraphs: [
      "В центре этой практики — LLM products, orchestration layers, OpenAI-compatible services и generative pipelines, которые проходят путь от идеи и эксперимента до надежной эксплуатации.",
      "Такой подход собирает воедино продукт и инженерную дисциплину: скорость без имитации, observability без бюрократии, maintainability без потери темпа.",
    ],
    items: [
      "LLM products и assistant backends для внутренних процессов",
      "AI infrastructure, retrieval и orchestration layers",
      "GenAI pipelines для визуального, текстового и интерактивного контента",
      "AI-assisted engineering habits, review и delivery workflows",
    ],
  },
  {
    id: "author-collaboration",
    position: "след",
    shortTitle: "связь",
    title: "Сотрудничество",
    focusTitleClass: "is-long",
    subtitle: "LLM products · AI infrastructure · generative systems",
    lead: "Сюда можно приходить с идеей, сырым внутренним процессом или сложной AI-задачей: дальше это превращается в систему, а не в демо.",
    paragraphs: [
      "Подход особенно уместен там, где нужно собрать AI-native продукт, внутренний инструмент, инфраструктурный слой для моделей или production-ready генеративный пайплайн.",
      "Форматы могут быть разными: проектная работа, архитектурная сборка, консультации по LLM-системам и настройка инженерной практики вокруг AI.",
    ],
    items: [
      "внутренние AI-инструменты и ассистенты",
      "LLM-интеграции и OpenAI-compatible API",
      "AI infrastructure и platform engineering",
      "generative pipelines и AI-native delivery practice",
    ],
  },
];

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
    featuredCardIndex: 4,
  },
  "02-ryzhaya-geroinya": {
    tone: "рыжий жар",
    description: "Свет идет впереди имени.",
    seriesTitle: "Героиня",
    featuredCardIndex: 3,
  },
  "03-tikhie-miry": {
    tone: "тишина",
    description: "Тишина держит мир целым.",
    seriesTitle: "Тишина",
    featuredCardIndex: 11,
  },
  "04-zveri-mif-i-sakralnoe": {
    tone: "миф",
    description: "Быт вдруг становится мифом.",
    seriesTitle: "Миф",
    featuredCardIndex: 15,
  },
  "05-ai-videniya-i-plakat": {
    tone: "цифровой жар",
    description: "Чудо шипит сквозь пиксели.",
    seriesTitle: "Видение",
    featuredCardIndex: 1,
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

export function buildAuthorSummary() {
  return "Три карты сошлись: инженерная практика, продуктовая сборка и ясный канал для сотрудничества.";
}

export function shouldUseSourceTitle(tokens) {
  return tokens.some((token) => /[а-яё]/i.test(token));
}

export function buildFallbackCardTitle(gallerySlug, index) {
  const seriesTitle = GALLERY_COPY[gallerySlug]?.seriesTitle ?? "Карта";
  return `${seriesTitle} ${ROMAN_NUMERALS[index - 1] ?? String(index)}`;
}
