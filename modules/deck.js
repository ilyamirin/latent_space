const VISIBLE_STACK = 4;


export function createDeckState(catalog = { galleries: [], cards: [] }) {
  const firstGallery = catalog.galleries[0];
  return {
    galleries: catalog.galleries,
    cards: catalog.cards,
    activeGallerySlug: firstGallery?.slug ?? null,
    searchQuery: "",
    searchResults: [],
    activeIndex: 0,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


export function getDisplayCards(state) {
  if (state.searchResults.length > 0) {
    return state.searchResults;
  }
  return state.cards.filter((card) => card.gallerySlug === state.activeGallerySlug);
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


export function moveToNextCard(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return state;
  }
  return {
    ...state,
    activeIndex: (clampIndex(state.activeIndex, cards.length) + 1) % cards.length,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


export function moveToPreviousCard(state) {
  const cards = getDisplayCards(state);
  if (cards.length === 0) {
    return state;
  }
  return {
    ...state,
    activeIndex: (clampIndex(state.activeIndex, cards.length) - 1 + cards.length) % cards.length,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


export function setActiveGallery(state, gallerySlug) {
  return {
    ...state,
    activeGallerySlug: gallerySlug,
    activeIndex: 0,
    searchResults: [],
    searchQuery: "",
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
}


export function setSearchResults(state, results) {
  return {
    ...state,
    searchResults: results,
    activeIndex: 0,
    isFlipped: false,
    isSwipeAnimating: false,
    swipeDirection: 0,
    dragOffsetX: 0,
    dragProgress: 0,
  };
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


function clampIndex(index, length) {
  if (length <= 0) {
    return 0;
  }
  return ((index % length) + length) % length;
}
