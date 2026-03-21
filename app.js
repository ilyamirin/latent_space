import { loadCatalog } from "./modules/catalog.js";
import {
  createDeckState,
  getActiveCard,
  getDisplayCards,
  getVisibleDeckCards,
  moveToNextCard,
  moveToPreviousCard,
  setActiveGallery,
  setSearchResults,
  setSwipeOut,
  toggleCardFlip,
  updateDragState,
} from "./modules/deck.js";
import { resetFlipState } from "./modules/flip.js";
import { attachDeckGestures } from "./modules/gestures.js";
import { SpeechController } from "./modules/audio.js";
import { renderApp } from "./modules/renderer.js";
import { scoreCards } from "./modules/search.js";
import { applyThemeFromCard, prewarmCardTheme } from "./modules/theme.js";


const elements = {
  deck: document.querySelector("#deck"),
  deckStatus: document.querySelector("#deckStatus"),
  statusCopy: document.querySelector("#statusCopy"),
  statusMeta: document.querySelector("#statusMeta"),
  galleryRail: document.querySelector("#galleryRail"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  audioToggle: document.querySelector("#audioToggle"),
  cardTemplate: document.querySelector("#cardTemplate"),
};

const speech = new SpeechController();
let state = createDeckState();
let catalog = null;
let detachGestures = () => {};
let isSearchMode = false;


boot().catch((error) => {
  console.error(error);
  elements.statusCopy.textContent = "не получилось загрузить колоду";
  elements.statusMeta.textContent = "проверьте локальный сервер и manifest.json";
});


async function boot() {
  catalog = await loadCatalog();
  state = createDeckState(catalog);
  speech.setListener(() => refresh());

  bindGlobalEvents();
  refresh();
  warmUpcomingThemes();
}


function bindGlobalEvents() {
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.clearSearch.addEventListener("click", clearSearch);
  elements.galleryRail.addEventListener("click", handleGallerySelect);
  elements.audioToggle.addEventListener("click", handleAudioToggle);

  window.addEventListener("keydown", (event) => {
    if (!catalog) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      commitSwipe(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      commitSwipe(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      state = toggleCardFlip(state);
      refresh();
    } else if (event.key === "Escape") {
      if (state.isFlipped) {
        state = resetFlipState(state);
        refresh();
      } else if (elements.searchInput.value) {
        clearSearch();
      }
    }
  });
}


function handleSearchInput(event) {
  const query = event.currentTarget.value.trim();
  isSearchMode = query.length > 0;

  if (!query) {
    state = setSearchResults(state, []);
    refresh();
    return;
  }

  const matches = scoreCards(query, catalog.cards, state.activeGallerySlug);
  state = setSearchResults(state, matches);
  refresh();
  warmUpcomingThemes();
}


function clearSearch() {
  elements.searchInput.value = "";
  isSearchMode = false;
  state = setSearchResults(state, []);
  refresh();
}


function handleGallerySelect(event) {
  const button = event.target.closest("[data-gallery-slug]");
  if (!button) {
    return;
  }

  const nextGallery = button.dataset.gallerySlug;
  if (!nextGallery || nextGallery === state.activeGallerySlug) {
    return;
  }

  elements.searchInput.value = "";
  isSearchMode = false;
  speech.stop();
  state = setActiveGallery(state, nextGallery);
  refresh();
  warmUpcomingThemes();
}


function handleAudioToggle() {
  if (speech.isPlaying) {
    speech.stop();
    refresh();
    return;
  }

  const activeCard = getActiveCard(state);
  if (!activeCard) {
    return;
  }

  speech.speak(activeCard.audioText);
  refresh();
}


function attachInteractions() {
  detachGestures();
  const activeCardNode = elements.deck.querySelector(".card-shell.is-active .card");

  if (!activeCardNode) {
    return;
  }

  detachGestures = attachDeckGestures(activeCardNode, {
    onTap() {
      state = toggleCardFlip(state);
      refresh();
    },
    onDrag({ deltaX, progress }) {
      if (state.isFlipped || state.isSwipeAnimating) {
        return;
      }
      state = updateDragState(state, deltaX, progress);
      refresh({ preserveInteraction: true });
    },
    onCancel() {
      state = updateDragState(state, 0, 0);
      refresh({ preserveInteraction: true });
    },
    onSwipe(direction) {
      commitSwipe(direction);
    },
  });

  activeCardNode.addEventListener("click", handleDeckClick);
}


function handleDeckClick(event) {
  const listenButton = event.target.closest(".listen-button");
  if (!listenButton) {
    return;
  }

  event.stopPropagation();
  const activeCard = getActiveCard(state);
  if (!activeCard) {
    return;
  }

  if (speech.isPlaying && speech.activeId === activeCard.id) {
    speech.stop();
  } else {
    speech.speak(activeCard.audioText, activeCard.id);
  }

  refresh();
}


function commitSwipe(direction) {
  if (!catalog || state.isSwipeAnimating) {
    return;
  }

  if (state.isFlipped) {
    state = resetFlipState(state);
  }

  speech.stop();
  state = setSwipeOut(state, direction);
  refresh({ preserveInteraction: true });

  window.setTimeout(() => {
    state =
      direction > 0
        ? moveToNextCard(state)
        : moveToPreviousCard(state);
    refresh();
    warmUpcomingThemes();
  }, 320);
}


function refresh(options = {}) {
  if (!catalog) {
    return;
  }

  const activeCard = getActiveCard(state);
  const displayCards = getDisplayCards(state);
  const visibleCards = getVisibleDeckCards(state);
  applyThemeFromCard(activeCard);

  renderApp({
    elements,
    state,
    galleries: catalog.galleries,
    displayCards,
    visibleCards,
    activeCard,
    searchMode: isSearchMode,
    speech,
  });

  attachInteractions();
}


function warmUpcomingThemes() {
  const candidates = getVisibleDeckCards(state).slice(0, 3);
  for (const card of candidates) {
    prewarmCardTheme(card);
  }
}
