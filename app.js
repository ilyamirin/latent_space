import { loadCatalog } from "./modules/catalog.js";
import { BackgroundMusicController } from "./modules/audio.js";
import {
  createAppState,
  enterHome,
  enterSearch,
  getActiveSearchCard,
  getActiveSpreadCard,
  moveSearchIndex,
  revealNextCard,
  selectSpreadCard,
  setSearchResults,
  startSpread,
} from "./modules/deck.js";
import { attachDeckGestures } from "./modules/gestures.js";
import { renderScreen } from "./modules/renderer.js";
import { buildSpread, scoreCards } from "./modules/search.js";
import { applyThemeFromCard, prewarmCardTheme } from "./modules/theme.js";


const elements = {
  appShell: document.querySelector(".app-shell"),
  brandHome: document.querySelector("#brandHome"),
  stage: document.querySelector("#stage"),
  infoPanel: document.querySelector("#infoPanel"),
  searchEntry: document.querySelector("#searchEntry"),
  searchPrompt: document.querySelector("#searchPrompt"),
  searchInput: document.querySelector("#searchInput"),
};

let catalog = null;
let state = createAppState();
let detachSearchGesture = () => {};
const backgroundMusic = new BackgroundMusicController([
  "./assets/audio/temnyi-interfeis.mp3",
  "./assets/audio/temnyi-interfeis-alt.mp3",
]);


boot().catch((error) => {
  console.error(error);
  elements.infoPanel.innerHTML = `
    <div class="info-kicker">ошибка</div>
    <h1 class="info-title">колода не загрузилась</h1>
    <p class="info-text">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
  `;
});


async function boot() {
  catalog = await loadCatalog();
  state = createAppState(catalog);
  backgroundMusic.startByDefault().catch((error) => {
    console.error("Background music failed to initialize:", error);
  });
  bindEvents();
  refresh();
}


function bindEvents() {
  elements.brandHome.addEventListener("click", () => {
    ensureBackgroundMusic();
    goHome();
  });
  elements.brandHome.addEventListener("keydown", handleActionKeydown);

  elements.searchEntry.addEventListener("click", (event) => {
    if (event.target === elements.searchInput) {
      return;
    }
    openSearch(elements.searchInput.value.trim());
  });
  elements.searchEntry.addEventListener("keydown", handleActionKeydown);

  elements.searchInput.addEventListener("focus", () => {
    openSearch(elements.searchInput.value.trim());
  });
  elements.searchInput.addEventListener("input", (event) => updateSearch(event.currentTarget.value.trim()));
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      goHome();
    }
  });

  elements.stage.addEventListener("click", handleStageAction);
  elements.stage.addEventListener("keydown", handleActionKeydown);

  const wakeMusic = () => ensureBackgroundMusic();
  window.addEventListener("pointerdown", wakeMusic, { passive: true });
  window.addEventListener("touchstart", wakeMusic, { passive: true });
  window.addEventListener("keydown", wakeMusic);

  window.addEventListener("keydown", (event) => {
    if (document.activeElement === elements.searchInput) {
      return;
    }

    if (state.screen === "spread" && state.drawCount > 0 && event.key === "ArrowRight") {
      event.preventDefault();
      state = selectSpreadCard(state, (state.selectedSpreadIndex + 1) % state.drawCount);
      refresh();
      return;
    }

    if (state.screen === "spread" && state.drawCount > 0 && event.key === "ArrowLeft") {
      event.preventDefault();
      state = selectSpreadCard(
        state,
        (state.selectedSpreadIndex - 1 + state.drawCount) % state.drawCount,
      );
      refresh();
      return;
    }

    if (state.screen === "search" && event.key === "ArrowRight") {
      event.preventDefault();
      state = moveSearchIndex(state, 1);
      refresh();
      return;
    }

    if (state.screen === "search" && event.key === "ArrowLeft") {
      event.preventDefault();
      state = moveSearchIndex(state, -1);
      refresh();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      goHome();
    }
  });
}


function handleActionKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const target = event.target.closest("[data-action], #brandHome, #searchEntry");
  if (!target) {
    return;
  }

  event.preventDefault();
  target.click();
}


function handleStageAction(event) {
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) {
    return;
  }

  const { action } = actionNode.dataset;

  if (action === "choose-gallery") {
    const slug = actionNode.dataset.gallerySlug ?? "";
    const gallery = catalog.galleries.find((item) => item.slug === slug);
    if (!gallery) {
      return;
    }

    ensureBackgroundMusic();
    state = revealNextCard(startSpread(state, gallery, buildSpread(gallery.cards)));
    refresh();
    return;
  }

  if (action === "cycle-spread-card") {
    if (state.drawCount === 0) {
      return;
    }

    ensureBackgroundMusic();
    state =
      state.drawCount < 3
        ? revealNextCard(state)
        : selectSpreadCard(state, (state.selectedSpreadIndex + 1) % state.drawCount);
    refresh();
    return;
  }

  if (action === "select-spread-card") {
    const index = Number(actionNode.dataset.cardIndex);
    if (Number.isNaN(index) || index >= state.drawCount) {
      return;
    }

    if (index === state.selectedSpreadIndex) {
      return;
    }

    state = selectSpreadCard(state, index);
    refresh();
    return;
  }

  if (action === "search-tag") {
    const query = actionNode.dataset.tag ?? "";
    elements.searchInput.value = query;
    updateSearch(query);
    window.setTimeout(() => elements.searchInput.focus(), 30);
    return;
  }

  if (action === "cycle-search-card") {
    if (state.searchResults.length === 0) {
      return;
    }
    state = moveSearchIndex(state, 1);
    refresh();
    return;
  }
}


function openSearch(query = "") {
  const normalized = query.trim();
  const results = normalized ? scoreCards(normalized, catalog.cards) : [];
  state = enterSearch(state, normalized, results);
  refresh();
  window.setTimeout(() => elements.searchInput.focus(), 30);
}


function updateSearch(query) {
  state = setSearchResults(state, query, query ? scoreCards(query, catalog.cards) : []);
  refresh();
}


function goHome() {
  state = enterHome(state);
  refresh();
}


function attachDynamicInteractions() {
  detachSearchGesture();
  const focusCard = elements.stage.querySelector(".search-screen .focus-card");
  if (!focusCard) {
    return;
  }

  detachSearchGesture = attachDeckGestures(focusCard, {
    onTap() {
      if (state.searchResults.length === 0) {
        return;
      }
      state = moveSearchIndex(state, 1);
      refresh();
    },
    onSwipe(direction) {
      state = moveSearchIndex(state, direction > 0 ? -1 : 1);
      refresh();
    },
  });
}


function refresh() {
  renderScreen({ elements, state });
  attachDynamicInteractions();
  applyCurrentTheme();
  prewarmThemes();
}


function applyCurrentTheme() {
  const themeCard =
    state.screen === "search"
      ? getActiveSearchCard(state)
      : getActiveSpreadCard(state) ?? state.spreadCards[0] ?? catalog.cards[0];
  applyThemeFromCard(themeCard);
}


function prewarmThemes() {
  for (const card of state.spreadCards.slice(0, 3)) {
    prewarmCardTheme(card);
  }
  for (const card of state.searchResults.slice(0, 4)) {
    prewarmCardTheme(card);
  }
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}


function ensureBackgroundMusic() {
  backgroundMusic.startByDefault().catch(() => {});
}
