import { UI_COPY } from "./modules/copy.js";
import { loadCatalog } from "./modules/catalog.js";
import { BackgroundMusicController } from "./modules/audio.js";
import {
  cycleAuthorCard,
  createAppState,
  enterAuthor,
  enterHome,
  enterSearch,
  getActiveSearchCard,
  getActiveSpreadCard,
  moveSearchIndex,
  revealNextCard,
  selectAuthorCard,
  selectSpreadCard,
  setSearchResults,
  startSpread,
} from "./modules/deck.js";
import { attachDeckGestures } from "./modules/gestures.js";
import { normalizeText } from "./modules/search-query.js";
import { renderScreen } from "./modules/renderer.js";
import { buildSearchIndex, searchCardsWithIndex } from "./modules/search-index.js";
import { buildSpread, scoreCards } from "./modules/search.js";
import { applyThemeFromCard, prewarmCardTheme } from "./modules/theme.js";


const elements = {
  appShell: document.querySelector(".app-shell"),
  brandHome: document.querySelector("#brandHome"),
  bootLog: document.querySelector("#bootLog"),
  bootLines: document.querySelector("#bootLines"),
  bootMeterFill: document.querySelector("#bootMeterFill"),
  bootStatus: document.querySelector("#bootStatus"),
  stage: document.querySelector("#stage"),
  infoPanel: document.querySelector("#infoPanel"),
  searchEntry: document.querySelector("#searchEntry"),
  searchPrompt: document.querySelector("#searchPrompt"),
  searchInput: document.querySelector("#searchInput"),
};

let catalog = null;
let state = createAppState();
let searchIndex = null;
let detachSearchGesture = () => {};
const startupLog = createStartupLog(elements);
const backgroundMusic = new BackgroundMusicController([
  "./assets/audio/temnyi-interfeis.mp3",
  "./assets/audio/temnyi-interfeis-alt.mp3",
]);


boot().catch((error) => {
  console.error(error);
  startupLog.fail(error instanceof Error ? error.message : String(error));
  elements.infoPanel.innerHTML = `
    <div class="info-kicker">${UI_COPY.error.kicker}</div>
    <h1 class="info-title">${UI_COPY.error.title}</h1>
    <p class="info-text">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
  `;
});


async function boot() {
  startupLog.step("загружаем колоду", 0.12);
  catalog = await loadCatalog();
  startupLog.step("manifest собран", 0.28, `найдено ${catalog.cards.length} карт`);
  searchIndex = buildSearchIndex(catalog.cards);
  startupLog.step("готовим поиск", 0.38);
  state = createAppState(catalog);
  bindEvents();
  const themeRequest = refresh();
  startupLog.step("рисуем первый экран", 0.52);
  await waitForStageMedia();
  startupLog.step("видимые карты готовы", 0.88);
  await themeRequest;
  startupLog.step("фон синхронизирован", 0.96);
  await startupLog.finish();
  backgroundMusic.startByDefault().catch((error) => {
    console.error("Background music failed to initialize:", error);
  });
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

    if (state.screen === "author" && event.key === "ArrowRight") {
      event.preventDefault();
      state = cycleAuthorCard(state, 1);
      refresh();
      return;
    }

    if (state.screen === "search" && event.key === "ArrowLeft") {
      event.preventDefault();
      state = moveSearchIndex(state, -1);
      refresh();
      return;
    }

    if (state.screen === "author" && event.key === "ArrowLeft") {
      event.preventDefault();
      state = cycleAuthorCard(state, -1);
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

  if (action === "open-author") {
    ensureBackgroundMusic();
    state = enterAuthor(state);
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

  if (action === "cycle-author-card") {
    state = cycleAuthorCard(state, 1);
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

  if (action === "select-author-card") {
    const index = Number(actionNode.dataset.cardIndex);
    if (Number.isNaN(index)) {
      return;
    }

    state = selectAuthorCard(state, index);
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
  if (shouldAdvanceRepeatedSearch(normalized)) {
    state = moveSearchIndex(state, 1);
    refresh();
    window.setTimeout(() => elements.searchInput.focus(), 30);
    return;
  }

  const results = normalized ? performSearch(normalized) : [];
  state = enterSearch(state, normalized, results);
  refresh();
  window.setTimeout(() => elements.searchInput.focus(), 30);
}


function updateSearch(query) {
  if (shouldAdvanceRepeatedSearch(query)) {
    state = moveSearchIndex(state, 1);
    refresh();
    return;
  }

  state = setSearchResults(state, query, query ? performSearch(query) : []);
  refresh();
}


function goHome() {
  state = enterHome(state);
  refresh();
}


function attachDynamicInteractions() {
  detachSearchGesture();
  const focusCard = elements.stage.querySelector(".search-screen .focus-card");
  if (focusCard) {
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
    return;
  }

  const authorFocusCard = elements.stage.querySelector(".author-screen .focus-card");
  if (!authorFocusCard) {
    return;
  }

  detachSearchGesture = attachDeckGestures(authorFocusCard, {
    onTap() {
      state = cycleAuthorCard(state, 1);
      refresh();
    },
    onSwipe(direction) {
      state = cycleAuthorCard(state, direction > 0 ? -1 : 1);
      refresh();
    },
  });
}


function refresh() {
  renderScreen({ elements, state });
  attachDynamicInteractions();
  const themeRequest = applyCurrentTheme();
  prewarmThemes();
  return themeRequest;
}


function applyCurrentTheme() {
  const themeCard =
    state.screen === "search"
      ? getActiveSearchCard(state)
      : getActiveSpreadCard(state) ?? state.spreadCards[0] ?? catalog.cards[0];
  return applyThemeFromCard(themeCard);
}


function prewarmThemes() {
  if (state.screen === "spread") {
    const nextSpreadCard = state.spreadCards[state.selectedSpreadIndex + 1];
    prewarmCardTheme(nextSpreadCard);
    return;
  }

  if (state.screen === "search") {
    const nextSearchCard = state.searchResults[state.searchIndex + 1];
    prewarmCardTheme(nextSearchCard);
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


function performSearch(query) {
  if (!searchIndex) {
    return scoreCards(query, catalog.cards);
  }

  try {
    return searchCardsWithIndex(searchIndex, query);
  } catch (error) {
    console.warn("MiniSearch fallback:", error);
    return scoreCards(query, catalog.cards);
  }
}


function shouldAdvanceRepeatedSearch(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || state.screen !== "search" || state.searchResults.length === 0) {
    return false;
  }

  return normalizeText(state.searchQuery) === normalizedQuery;
}


async function waitForStageMedia() {
  const images = Array.from(elements.stage.querySelectorAll("img"));
  if (!images.length) {
    startupLog.note("видимых картинок нет");
    return;
  }

  let readyCount = 0;
  const totalCount = images.length;
  const updateProgress = () => {
    const ratio = readyCount / totalCount;
    startupLog.setStatus(`готовим видимые карты ${readyCount}/${totalCount}`);
    startupLog.setProgress(0.56 + ratio * 0.26);
  };

  updateProgress();

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          const markReady = () => {
            readyCount += 1;
            updateProgress();
            resolve();
          };

          if (image.complete) {
            markReady();
            return;
          }

          image.addEventListener("load", markReady, { once: true });
          image.addEventListener("error", markReady, { once: true });
        }),
    ),
  );
}


function createStartupLog({ bootLog, bootLines, bootMeterFill, bootStatus }) {
  const entries = [];
  let progress = 0;

  const render = () => {
    bootStatus.textContent = entries.at(-1)?.status ?? "поднимаем колоду";
    bootMeterFill.style.transform = `scaleX(${progress})`;
    bootLines.innerHTML = entries
      .slice(-5)
      .map(
        (entry) => `
          <div class="boot-log__line ${entry.kind === "error" ? "is-error" : ""}">
            <span class="boot-log__dot" aria-hidden="true"></span>
            <span>${escapeHtml(entry.text)}</span>
          </div>
        `,
      )
      .join("");
  };

  const push = (text, kind = "info", status = text) => {
    entries.push({ text, kind, status });
    render();
  };

  push("поднимаем колоду");

  return {
    note(text) {
      push(text, "info", bootStatus.textContent);
    },
    setProgress(value) {
      progress = Math.max(progress, Math.min(1, value));
      render();
    },
    setStatus(text) {
      if (entries.length) {
        entries[entries.length - 1].status = text;
      } else {
        entries.push({ text, kind: "info", status: text });
      }
      render();
    },
    step(status, nextProgress, line = status) {
      progress = Math.max(progress, Math.min(1, nextProgress));
      push(line, "info", status);
    },
    fail(text) {
      progress = 1;
      bootLog.classList.add("is-failed");
      push(text, "error", "ошибка загрузки");
    },
    async finish() {
      progress = 1;
      push("экран готов", "info", "экран готов");
      bootLog.classList.add("is-ready");
      render();
      await new Promise((resolve) => {
        window.setTimeout(resolve, 520);
      });
      bootLog.classList.add("is-hidden");
    },
  };
}
