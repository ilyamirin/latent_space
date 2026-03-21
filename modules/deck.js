const VISIBLE_STACK = 4;


export function createDeckState(catalog = { galleries: [], cards: [], flowCards: [] }) {
  const firstGallery = catalog.galleries[0];
  return {
    galleries: catalog.galleries,
    cards: catalog.cards,
    flowCards: catalog.flowCards,
    activeGallerySlug: firstGallery?.slug ?? null,
    mode: "gallery",
    searchQuery: "",
    searchResults: [],
    toneSourceId: null,
    toneResults: [],
    activeIndex: 0,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


export function getDisplayCards(state) {
  switch (state.mode) {
    case "flow":
      return state.flowCards;
    case "search":
      return state.searchResults;
    case "tone":
      return state.toneResults;
    case "gallery":
    default:
      return state.cards.filter((card) => card.gallerySlug === state.activeGallerySlug);
  }
}


export function getVisibleDeckCards(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return [];
  }

  const activeIndex = clampIndex(state.activeIndex, cards.length);
  const visible = [];
  for (let offset = 0; offset < Math.min(VISIBLE_STACK, cards.length); offset += 1) {
    visible.push(cards[(activeIndex + offset) % cards.length]);
  }
  return visible;
}


export function getActiveCard(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return null;
  }
  return cards[clampIndex(state.activeIndex, cards.length)];
}


export function getPathDescriptor(state) {
  const activeCard = getActiveCard(state);
  const count = getDisplayCards(state).length;
  const currentIndex = count ? clampIndex(state.activeIndex, count) + 1 : 0;
  const gallery = state.galleries.find((item) => item.slug === state.activeGallerySlug);

  switch (state.mode) {
    case "flow":
      return {
        kicker: "поток",
        meta: `Смешанный маршрут через весь архив · ${count} работ`,
        chip: "Поток",
        count,
        currentIndex,
      };
    case "search": {
      const galleryCount = new Set(getDisplayCards(state).map((card) => card.gallerySlug)).size;
      return {
        kicker: state.searchQuery ? `поиск по состоянию «${state.searchQuery}»` : "поиск",
        meta:
          count > 0
            ? `Найдено ${count} работ · смешано из ${galleryCount} линий`
            : "Архив пока не нашёл точного совпадения",
        chip: state.searchQuery ? `Поиск: ${state.searchQuery}` : "Поиск",
        count,
        currentIndex,
      };
    }
    case "tone":
      return {
        kicker: "ещё в этом тоне",
        meta:
          activeCard && count > 0
            ? `Маршрут собран вокруг настроения «${activeCard.tone}» · ${count} работ`
            : "Близкие по тону работы",
        chip: "Ещё в этом тоне",
        count,
        currentIndex,
      };
    case "gallery":
    default:
      return {
        kicker: "линия архива",
        meta: gallery ? `${gallery.title} · ${gallery.lineText}` : "",
        chip: gallery?.title ?? "Архив",
        count,
        currentIndex,
      };
  }
}


export function moveToNextCard(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return state;
  }
  return resetMotion({
    ...state,
    activeIndex: (clampIndex(state.activeIndex, cards.length) + 1) % cards.length,
  });
}


export function moveToPreviousCard(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return state;
  }
  return resetMotion({
    ...state,
    activeIndex: (clampIndex(state.activeIndex, cards.length) - 1 + cards.length) % cards.length,
  });
}


export function setActiveGallery(state, gallerySlug) {
  return resetMotion({
    ...state,
    activeGallerySlug: gallerySlug,
    mode: "gallery",
    searchQuery: "",
    searchResults: [],
    toneSourceId: null,
    toneResults: [],
    activeIndex: 0,
  });
}


export function setFlowMode(state) {
  return resetMotion({
    ...state,
    mode: "flow",
    searchQuery: "",
    searchResults: [],
    toneSourceId: null,
    toneResults: [],
    activeIndex: 0,
  });
}


export function setSearchResults(state, query, results) {
  return resetMotion({
    ...state,
    mode: "search",
    searchQuery: query,
    searchResults: results,
    toneSourceId: null,
    toneResults: [],
    activeIndex: 0,
  });
}


export function clearSearch(state) {
  return resetMotion({
    ...state,
    mode: "gallery",
    searchQuery: "",
    searchResults: [],
    toneSourceId: null,
    toneResults: [],
    activeIndex: 0,
  });
}


export function setToneResults(state, sourceCardId, results) {
  return resetMotion({
    ...state,
    mode: "tone",
    toneSourceId: sourceCardId,
    toneResults: results,
    activeIndex: 0,
  });
}


export function showGalleryForCard(state, cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) {
    return state;
  }
  const galleryCards = state.cards.filter((item) => item.gallerySlug === card.gallerySlug);
  const nextIndex = galleryCards.findIndex((item) => item.id === cardId);
  return resetMotion({
    ...state,
    activeGallerySlug: card.gallerySlug,
    mode: "gallery",
    searchQuery: "",
    searchResults: [],
    toneSourceId: null,
    toneResults: [],
    activeIndex: Math.max(0, nextIndex),
  });
}


export function toggleCardFlip(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0 || state.isSwipeAnimating) {
    return state;
  }
  return {
    ...state,
    isFlipped: !state.isFlipped,
  };
}


export function updateDragState(state, deltaX, progress) {
  return {
    ...state,
    dragOffsetX: deltaX,
    dragProgress: progress,
  };
}


export function setSwipeOut(state, direction) {
  return {
    ...state,
    isSwipeAnimating: true,
    swipeDirection: direction,
    dragOffsetX: direction * window.innerWidth * 0.92,
    dragProgress: 1,
  };
}


function resetMotion(state) {
  return {
    ...state,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


function clampIndex(index, length) {
  if (length <= 0) {
    return 0;
  }
  return ((index % length) + length) % length;
}
