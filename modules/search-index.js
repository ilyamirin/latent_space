import MiniSearch from "../vendor/minisearch.js";
import { scoreCards } from "./search.js";
import { expandQueryTokens, normalizeText, tokenizeQuery } from "./search-query.js";


export function buildSearchIndex(cards) {
  const miniSearch = new MiniSearch({
    fields: [
      "searchTitle",
      "searchDescription",
      "searchTone",
      "searchGallery",
      "searchTagsText",
      "searchText",
    ],
    storeFields: ["id"],
    processTerm: (term) => normalizeText(term),
    searchOptions: {
      boost: {
        searchTagsText: 5,
        searchTone: 4,
        searchTitle: 3,
        searchGallery: 2,
        searchDescription: 1.5,
        searchText: 1,
      },
      prefix: true,
      fuzzy: 0.15,
      combineWith: "AND",
    },
  });

  const documents = cards.map((card) => ({
    id: card.id,
    searchTitle: card.searchTitle,
    searchDescription: card.searchDescription,
    searchTone: card.searchTone,
    searchGallery: card.searchGallery,
    searchTagsText: card.searchTagsText,
    searchText: card.searchText,
  }));

  miniSearch.addAll(documents);

  return {
    miniSearch,
    cards,
    cardsById: new Map(cards.map((card) => [card.id, card])),
  };
}


export function searchCardsWithIndex(index, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }

  const tokens = tokenizeQuery(normalizedQuery);
  if (tokens.length === 0) {
    return [];
  }

  const expandedTokens = expandQueryTokens(tokens);
  const candidates = new Map();

  mergeResults(
    candidates,
    index.miniSearch.search(tokens.join(" "), { combineWith: "AND", prefix: true, fuzzy: 0.1 }),
    1,
  );
  mergeResults(
    candidates,
    index.miniSearch.search(tokens.join(" "), { combineWith: "OR", prefix: true, fuzzy: 0.2 }),
    0.7,
  );

  if (expandedTokens.length > tokens.length) {
    mergeResults(
      candidates,
      index.miniSearch.search(expandedTokens.join(" "), { combineWith: "OR", prefix: true, fuzzy: 0.1 }),
      0.35,
    );
  }

  const fallbackCards = scoreCards(normalizedQuery, index.cards).slice(0, 24);
  fallbackCards.forEach((card, position) => {
    const entry = candidates.get(card.id) ?? { score: 0 };
    entry.score += Math.max(0, 10 - position) * 0.8;
    candidates.set(card.id, entry);
  });

  if (candidates.size === 0) {
    return fallbackCards;
  }

  return [...candidates.entries()]
    .map(([cardId, entry]) => ({
      card: index.cardsById.get(cardId),
      score: entry.score,
    }))
    .filter((item) => item.card)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);
}


function mergeResults(target, results, weight) {
  for (const result of results) {
    const entry = target.get(result.id) ?? { score: 0 };
    entry.score += result.score * weight;
    target.set(result.id, entry);
  }
}
