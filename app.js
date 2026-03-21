import { loadCatalog } from "./modules/catalog.js";
import {
  clearSearch,
  createDeckState,
  getActiveCard,
  getDisplayCards,
  getPathDescriptor,
  getVisibleDeckCards,
  moveToNextCard,
  moveToPreviousCard,
  setActiveGallery,
  setFlowMode,
  setSearchResults,
  setSwipeOut,
  setToneResults,
  showGalleryForCard,
  toggleCardFlip,
  updateDragState,
} from "./modules/deck.js";
import { resetFlipState } from "./modules/flip.js";
import { attachDeckGestures } from "./modules/gestures.js";
import { SpeechController } from "./modules/audio.js";
import { renderApp } from "./modules/renderer.js";
import { findSimilarTone, scoreCards } from "./modules/search.js";
import { applyThemeFromCard, prewarmCardTheme } from "./modules/theme.js";


const elements = {
  deck: document.querySelector("#deck"),
  pathTrigger: document.querySelector("#pathTrigger"),
  routeKicker: document.querySelector("#routeKicker"),
  routeMeta: document.querySelector("#routeMeta"),
  captionKicker: document.querySelector("#captionKicker"),
  workTitle: document.querySelector("#workTitle"),
  workOrigin: document.querySelector("#workOrigin"),
  curatorLead: document.querySelector("#curatorLead"),
  searchTrigger: document.querySelector("#searchTrigger"),
  flowTrigger: document.querySelector("#flowTrigger"),
  audioToggle: document.querySelector("#audioToggle"),
  linePanel: document.querySelector("#linePanel"),
  pathList: document.querySelector("#pathList"),
  searchPanel: document.querySelector("#searchPanel"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  resetSearch: document.querySelector("#resetSearch"),
  applySearch: document.querySelector("#applySearch"),
  searchSummary: document.querySelector("#searchSummary"),
  cardTemplate: document.querySelector("#cardTemplate"),
};

const speech = new SpeechController();
let state = createDeckState();
let catalog = null;
let detachGestures = () => {};
let activePanel = null;


boot().catch((error) => {
  console.error(error);
  elements.routeKicker.textContent = "ошибка загрузки";
  elements.routeMeta.textContent = "проверьте локальный сервер и manifest.json";
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
  elements.pathTrigger.addEventListener("click", () => togglePanel("line"));
  elements.searchTrigger.addEventListener("click", () => openSearchPanel());
  elements.flowTrigger.addEventListener("click", () => {
    closePanels();
    speech.stop();
    state = setFlowMode(state);
    refresh();
    warmUpcomingThemes();
  });
  elements.audioToggle.addEventListener("click", handleAudioToggle);

  elements.linePanel.addEventListener("click", handlePanelClick);
  elements.searchPanel.addEventListener("click", handlePanelClick);

  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.clearSearch.addEventListener("click", () => {
    elements.searchInput.value = "";
    state = clearSearch(state);
    refresh();
  });
  elements.resetSearch.addEventListener("click", () => {
    elements.searchInput.value = "";
    closePanels();
    state = clearSearch(state);
    refresh();
  });
  elements.applySearch.addEventListener("click", () => closePanels());

  window.addEventListener("keydown", (event) => {
    if (!catalog) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      commitSwipe(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      commitSwipe(-1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement === elements.searchInput) {
        closePanels();
        return;
      }
      event.preventDefault();
      state = toggleCardFlip(state);
      refresh();
      return;
    }
    if (event.key === "Escape") {
      if (activePanel) {
        closePanels();
        return;
      }
      if (state.isFlipped) {
        state = resetFlipState(state);
        refresh();
        return;
      }
      if (state.mode === "search") {
        elements.searchInput.value = "";
        state = clearSearch(state);
        refresh();
      }
    }
  });
}


function handlePanelClick(event) {
  const closeTarget = event.target.closest("[data-close-panel]");
  if (closeTarget) {
    closePanels();
    return;
  }

  const routeButton = event.target.closest("[data-route-mode]");
  if (routeButton) {
    const routeMode = routeButton.dataset.routeMode;
    if (routeMode === "flow") {
      state = setFlowMode(state);
    } else if (routeMode === "gallery" && routeButton.dataset.gallerySlug) {
      state = setActiveGallery(state, routeButton.dataset.gallerySlug);
    }
    speech.stop();
    closePanels();
    refresh();
    warmUpcomingThemes();
  }
}


function openSearchPanel() {
  activePanel = "search";
  refresh();
  window.setTimeout(() => elements.searchInput.focus(), 30);
}


function togglePanel(panelName) {
  activePanel = activePanel === panelName ? null : panelName;
  refresh();
}


function closePanels() {
  activePanel = null;
  refresh();
}


function handleSearchInput(event) {
  const query = event.currentTarget.value.trim();
  if (!query) {
    state = clearSearch(state);
    refresh();
    return;
  }

  const matches = scoreCards(query, catalog.cards, state.activeGallerySlug);
  state = setSearchResults(state, query, matches);
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

  speech.speak(activeCard.audioText, activeCard.id);
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
      if (state.isFlipped || state.isSwipeAnimating || activePanel) {
        return;
      }
      state = updateDragState(state, deltaX, progress);
      refresh();
    },
    onCancel() {
      state = updateDragState(state, 0, 0);
      refresh();
    },
    onSwipe(direction) {
      commitSwipe(direction);
    },
  });

  activeCardNode.addEventListener("click", handleDeckClick);
}


function handleDeckClick(event) {
  const activeCard = getActiveCard(state);
  if (!activeCard) {
    return;
  }

  const listenButton = event.target.closest(".listen-button");
  if (listenButton) {
    event.stopPropagation();
    if (speech.isPlaying && speech.activeId === activeCard.id) {
      speech.stop();
    } else {
      speech.speak(activeCard.audioText, activeCard.id);
    }
    refresh();
    return;
  }

  const toneButton = event.target.closest(".tone-button");
  if (toneButton) {
    event.stopPropagation();
    speech.stop();
    state = setToneResults(state, activeCard.id, findSimilarTone(activeCard, catalog.cards));
    closePanels();
    refresh();
    warmUpcomingThemes();
    return;
  }

  const seriesButton = event.target.closest(".series-button");
  if (seriesButton) {
    event.stopPropagation();
    speech.stop();
    state = showGalleryForCard(state, activeCard.id);
    closePanels();
    refresh();
    warmUpcomingThemes();
  }
}


function commitSwipe(direction) {
  if (!catalog || state.isSwipeAnimating || activePanel) {
    return;
  }

  if (state.isFlipped) {
    state = resetFlipState(state);
  }

  speech.stop();
  state = setSwipeOut(state, direction);
  refresh();

  window.setTimeout(() => {
    state =
      direction > 0
        ? moveToNextCard(state)
        : moveToPreviousCard(state);
    refresh();
    warmUpcomingThemes();
  }, 320);
}


function refresh() {
  if (!catalog) {
    return;
  }

  const activeCard = getActiveCard(state);
  const displayCards = getDisplayCards(state);
  const visibleCards = getVisibleDeckCards(state);
  const pathDescriptor = getPathDescriptor(state);
  applyThemeFromCard(activeCard);

  renderApp({
    elements,
    state,
    galleries: catalog.galleries,
    displayCards,
    visibleCards,
    activeCard,
    pathDescriptor,
    speech,
    activePanel,
  });

  elements.audioToggle.textContent = speech.isPlaying ? "стоп" : "звук";
  elements.flowTrigger.classList.toggle("is-active", state.mode === "flow");
  attachInteractions();
}


function warmUpcomingThemes() {
  for (const card of getVisibleDeckCards(state).slice(0, 3)) {
    prewarmCardTheme(card);
  }
}
