import { expandQueryTokens, normalizeText, SYNONYM_GROUPS, tokenizeQuery } from "./search-query.js";


export function scoreCards(query, cards) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  const expandedTokens = new Set(expandQueryTokens(tokens));

  return cards
    .map((card) => {
      const haystack = new Set(card.tags.map((tag) => normalizeText(tag)));
      const title = normalizeText(card.title);
      const description = normalizeText(card.description);
      const tone = normalizeText(card.tone);
      const gallery = normalizeText(card.galleryTitle);
      let score = 0;

      for (const token of tokens) {
        if (haystack.has(token)) {
          score += 12;
        }
        if (tone.includes(token)) {
          score += 10;
        }
        if (title.includes(token)) {
          score += 7;
        }
        if (gallery.includes(token)) {
          score += 4;
        }
        if (description.includes(token)) {
          score += 3;
        }

        const group = SYNONYM_GROUPS.find((item) => item.includes(token));
        if (group) {
          for (const synonym of group) {
            if (haystack.has(synonym)) {
              score += synonym === token ? 0 : 4;
            }
          }
        }
      }

      for (const token of expandedTokens) {
        if (tokens.includes(token)) {
          continue;
        }
        if (haystack.has(token)) {
          score += 3;
        }
        if (tone.includes(token)) {
          score += 2;
        }
        if (title.includes(token)) {
          score += 1.5;
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


function tokenize(value) {
  return tokenizeQuery(value);
}


function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}
