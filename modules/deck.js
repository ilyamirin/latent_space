export function createAppState(catalog = { cards: [], featuredTags: [] }) {
  return {
    cards: catalog.cards,
    galleries: catalog.galleries ?? [],
    featuredTags: catalog.featuredTags,
    screen: "home",
    selectedGallerySlug: null,
    spreadCards: [],
    drawCount: 0,
    selectedSpreadIndex: 0,
    searchQuery: "",
    searchResults: [],
    searchIndex: 0,
  };
}


export function enterHome(state) {
  return {
    ...state,
    screen: "home",
    selectedGallerySlug: null,
    spreadCards: [],
    drawCount: 0,
    selectedSpreadIndex: 0,
    searchQuery: "",
    searchResults: [],
    searchIndex: 0,
  };
}


export function startSpread(state, gallery, spreadCards) {
  return {
    ...state,
    screen: "spread",
    selectedGallerySlug: gallery?.slug ?? null,
    spreadCards,
    drawCount: 0,
    selectedSpreadIndex: 0,
    searchQuery: "",
    searchResults: [],
    searchIndex: 0,
  };
}


export function revealNextCard(state) {
  const nextCount = Math.min(3, state.drawCount + 1);
  return {
    ...state,
    drawCount: nextCount,
    selectedSpreadIndex: Math.max(0, nextCount - 1),
  };
}


export function selectSpreadCard(state, index) {
  if (index < 0 || index >= state.drawCount) {
    return state;
  }
  return {
    ...state,
    selectedSpreadIndex: index,
  };
}


export function enterSearch(state, query = "", results = []) {
  return {
    ...state,
    screen: "search",
    searchQuery: query,
    searchResults: results,
    searchIndex: 0,
  };
}


export function setSearchResults(state, query, results) {
  return {
    ...state,
    screen: "search",
    searchQuery: query,
    searchResults: results,
    searchIndex: 0,
  };
}


export function moveSearchIndex(state, direction) {
  if (state.searchResults.length === 0) {
    return state;
  }
  return {
    ...state,
    searchIndex:
      (state.searchIndex + direction + state.searchResults.length) %
      state.searchResults.length,
  };
}


export function getActiveSpreadCard(state) {
  if (state.drawCount === 0) {
    return null;
  }
  return state.spreadCards[Math.min(state.selectedSpreadIndex, state.drawCount - 1)] ?? null;
}


export function getActiveSearchCard(state) {
  if (state.searchResults.length === 0) {
    return null;
  }
  return state.searchResults[state.searchIndex] ?? null;
}
