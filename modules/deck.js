export function createAppState(catalog = { cards: [], featuredTags: [] }) {
  return {
    cards: catalog.cards,
    featuredTags: catalog.featuredTags,
    screen: "home",
    questionDraft: "",
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
    questionDraft: "",
    spreadCards: [],
    drawCount: 0,
    selectedSpreadIndex: 0,
    searchQuery: "",
    searchResults: [],
    searchIndex: 0,
  };
}


export function enterQuestion(state) {
  return {
    ...state,
    screen: "question",
    spreadCards: [],
    drawCount: 0,
    selectedSpreadIndex: 0,
  };
}


export function setQuestionDraft(state, value) {
  return {
    ...state,
    questionDraft: value,
  };
}


export function startSpread(state, spreadCards) {
  return {
    ...state,
    screen: "draw",
    spreadCards,
    drawCount: 1,
    selectedSpreadIndex: 0,
  };
}


export function revealNextCard(state) {
  const nextCount = Math.min(3, state.drawCount + 1);
  if (nextCount >= 3) {
    return {
      ...state,
      screen: "reading",
      drawCount: 3,
      selectedSpreadIndex: 2,
    };
  }
  return {
    ...state,
    drawCount: nextCount,
  };
}


export function selectSpreadCard(state, index) {
  return {
    ...state,
    screen: "reading",
    selectedSpreadIndex: index,
  };
}


export function enterSearch(state, query, results) {
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
  if (state.spreadCards.length === 0) {
    return null;
  }
  return state.spreadCards[state.selectedSpreadIndex] ?? state.spreadCards[0];
}


export function getActiveSearchCard(state) {
  if (state.searchResults.length === 0) {
    return null;
  }
  return state.searchResults[state.searchIndex] ?? state.searchResults[0];
}
