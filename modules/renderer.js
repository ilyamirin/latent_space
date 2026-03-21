import {
  buildCardInterpretation,
  buildSearchPlaceholder,
  buildSearchResultLabel,
  buildSpreadPlaceholder,
  buildSpreadSummary,
  getPositionLabel,
  UI_COPY,
} from "./copy.js";


export function renderScreen({ elements, state }) {
  renderStage(elements.stage, state);
  renderInfo(elements.infoPanel, state);
  renderSearchDock(elements, state);
  elements.brandHome.classList.toggle("is-home", state.screen === "home");
  elements.appShell.classList.toggle("is-search", state.screen === "search");
  elements.appShell.classList.toggle("is-spread", state.screen === "spread");
}


function renderStage(stage, state) {
  if (state.screen === "home") {
    stage.innerHTML = `
      <div class="home-hero">
        <div class="home-orbit" aria-hidden="true"></div>
        <div class="hero-copy">${UI_COPY.home.hero}</div>
        <div class="gallery-chooser">
          ${renderGalleryChoices(state.galleries)}
        </div>
      </div>
    `;
    return;
  }

  if (state.screen === "spread") {
    const activeCard = state.drawCount > 0 ? state.spreadCards[state.selectedSpreadIndex] : null;
    const openingNextCard = state.drawCount > 0 && state.drawCount < 3;
    const spreadComplete = state.drawCount >= 3;
    stage.innerHTML = `
      <div class="spread-screen">
        <div class="spread-meter" aria-hidden="true">
          ${renderSpreadMeter(state.drawCount, state.selectedSpreadIndex)}
        </div>
        <div class="spread-strip">
          ${renderSpreadSlots(state.spreadCards, state.drawCount, state.selectedSpreadIndex)}
        </div>
        <div class="focus-zone">
          ${
            activeCard
              ? `
                <div class="focus-shell">
                  <div class="focus-badge">${escapeHtml(getPositionLabel(state.selectedSpreadIndex))}</div>
                  <div
                    class="focus-card"
                    data-action="cycle-spread-card"
                    role="button"
                    tabindex="0"
                    aria-label="${openingNextCard ? UI_COPY.spread.nextCardAria : UI_COPY.spread.cycleCardAria}"
                  >
                    ${renderFocusImage(activeCard)}
                  </div>
                </div>
              `
              : `<div class="focus-placeholder">${buildSpreadPlaceholder()}</div>`
          }
        </div>
        ${
          spreadComplete
            ? renderCompletionSheet()
            : `
              <div class="hero-copy">${UI_COPY.spread.nextCardHero}</div>
            `
        }
      </div>
    `;
    return;
  }

  if (state.screen === "search") {
    const activeCard = state.searchResults[state.searchIndex];
    stage.innerHTML = activeCard
      ? `
        <div class="search-screen">
          <div class="tag-row">
            ${state.featuredTags
              .map(
                (tag) => `
                  <span class="tag-chip" data-action="search-tag" data-tag="${tag}" role="button" tabindex="0">${tag}</span>
                `,
              )
              .join("")}
          </div>
          <div class="focus-shell">
            <div class="focus-badge">${buildSearchResultLabel(state.searchIndex, state.searchResults.length)}</div>
            <div
              class="focus-card"
              data-action="cycle-search-card"
              role="button"
              tabindex="0"
              aria-label="${UI_COPY.search.nextResultAria}"
            >
              ${renderFocusImage(activeCard)}
            </div>
          </div>
          <div class="hero-copy">${UI_COPY.search.resultHero}</div>
        </div>
      `
      : `
        <div class="search-screen">
          <div class="tag-row">
            ${state.featuredTags
              .map(
                (tag) => `
                  <span class="tag-chip" data-action="search-tag" data-tag="${tag}" role="button" tabindex="0">${tag}</span>
                `,
              )
              .join("")}
          </div>
          <div class="focus-placeholder">${buildSearchPlaceholder()}</div>
          <div class="hero-copy">${UI_COPY.search.emptyHero}</div>
        </div>
      `;
  }
}


function renderInfo(panel, state) {
  if (state.screen === "home") {
    panel.innerHTML = `
      <div class="info-kicker">${UI_COPY.home.kicker}</div>
      <h1 class="info-title">${UI_COPY.home.title}</h1>
      <p class="info-text">${UI_COPY.home.intro}</p>
    `;
    return;
  }

  if (state.screen === "spread") {
    if (state.drawCount === 0) {
      panel.innerHTML = `
        <div class="info-kicker">${UI_COPY.spread.kicker}</div>
        <h2 class="info-title">${UI_COPY.spread.title}</h2>
        <p class="info-text">${UI_COPY.spread.intro}</p>
      `;
      return;
    }

    const activeCard = state.spreadCards[state.selectedSpreadIndex];
    panel.innerHTML = `
      <div class="info-kicker">${getPositionLabel(state.selectedSpreadIndex)}</div>
      <h2 class="info-title">${escapeHtml(activeCard.title)}</h2>
      <div class="info-subtitle">${escapeHtml(activeCard.galleryTitle)} · ${escapeHtml(activeCard.tone)}</div>
      <p class="info-text">${escapeHtml(activeCard.description)}</p>
      <p class="info-text">${escapeHtml(buildCardInterpretation(activeCard, state.selectedSpreadIndex))}</p>
      ${
        state.drawCount >= 3
          ? `<p class="info-summary">${escapeHtml(buildSpreadSummary(state.spreadCards))}</p>`
          : ""
      }
      <div class="info-hint">
        ${
          state.drawCount >= 3
            ? UI_COPY.spread.hintAfterComplete
            : UI_COPY.spread.hintBeforeComplete
        }
      </div>
    `;
    return;
  }

  if (state.screen === "search") {
    const activeCard = state.searchResults[state.searchIndex];
    panel.innerHTML = activeCard
      ? `
        <div class="info-kicker">${UI_COPY.search.kicker}</div>
        <h2 class="info-title">${escapeHtml(activeCard.title)}</h2>
        <div class="info-subtitle">${escapeHtml(activeCard.galleryTitle)} · ${escapeHtml(activeCard.tone)}</div>
        <p class="info-text">${escapeHtml(activeCard.description)}</p>
        <div class="info-hint">${buildSearchResultLabel(state.searchIndex, state.searchResults.length)} · ${UI_COPY.search.resultHero}</div>
      `
      : `
        <div class="info-kicker">${UI_COPY.search.kicker}</div>
        <h2 class="info-title">${UI_COPY.search.emptyTitle}</h2>
        <p class="info-text">${UI_COPY.search.emptyText}</p>
      `;
  }
}


function renderSearchDock(elements, state) {
  const searching = state.screen === "search";
  elements.searchEntry.classList.toggle("is-active", searching);
  elements.searchPrompt.textContent =
    state.searchQuery || (searching ? UI_COPY.searchActive : UI_COPY.searchCollapsed);
  elements.searchPrompt.hidden = searching;
  elements.searchInput.hidden = !searching;
  if (searching) {
    elements.searchInput.value = state.searchQuery;
  } else {
    elements.searchInput.value = "";
  }
}


function renderSpreadSlots(cards, drawCount, selectedSpreadIndex) {
  return [0, 1, 2]
    .map((index) => {
      if (index < drawCount && cards[index]) {
        return `
          <div
            class="slot-card is-filled ${index === selectedSpreadIndex ? "is-active" : ""}"
            data-action="select-spread-card"
            data-card-index="${index}"
            role="button"
            tabindex="0"
            aria-label="${escapeHtml(getPositionLabel(index))}"
          >
            <div class="slot-card-media">
              <img src="${cards[index].imageSrc}" alt="${escapeHtml(cards[index].title)}" />
            </div>
            <span class="slot-label">${escapeHtml(getPositionLabel(index))}</span>
          </div>
        `;
      }
      return `
        <div class="slot-card is-empty" aria-hidden="true">
          <span>${index + 1}</span>
          <span class="slot-label">${escapeHtml(getPositionLabel(index))}</span>
        </div>
      `;
    })
    .join("");
}


function renderSpreadMeter(drawCount, selectedSpreadIndex) {
  return [0, 1, 2]
    .map((index) => {
      const classes = [
        "meter-dot",
        index < drawCount ? "is-filled" : "",
        index === selectedSpreadIndex && index < drawCount ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `<span class="${classes}"></span>`;
    })
    .join("");
}


function renderGalleryChoices(galleries = []) {
  return galleries
    .map((gallery, index) => {
      const previewCard = gallery.cards[0];
      const wideClass = index === galleries.length - 1 ? "is-wide" : "";
      return `
        <div
          class="gallery-option ${wideClass}"
          data-action="choose-gallery"
          data-gallery-slug="${gallery.slug}"
          role="button"
          tabindex="0"
          aria-label="Выбрать колоду ${escapeHtml(gallery.title)}"
        >
          <div class="gallery-option__thumb">
            <img src="${previewCard.imageSrc}" alt="" />
          </div>
          <div class="gallery-option__meta">
            <div class="gallery-option__title">${escapeHtml(gallery.title)}</div>
            <div class="gallery-option__tone">${escapeHtml(gallery.tone)}</div>
          </div>
        </div>
      `;
    })
    .join("");
}
function renderCompletionSheet() {
  return `
    <div class="completion-sheet">
      <div class="completion-sheet__kicker">${UI_COPY.spread.doneKicker}</div>
      <div class="completion-sheet__title">${UI_COPY.spread.doneTitle}</div>
      <div class="completion-actions">
        <button type="button" class="completion-action is-primary" data-action="go-home-galleries">${UI_COPY.spread.doneActions.home}</button>
        <button type="button" class="completion-action" data-action="restart-current-gallery">${UI_COPY.spread.doneActions.restart}</button>
        <button type="button" class="completion-action" data-action="go-search">${UI_COPY.spread.doneActions.search}</button>
      </div>
    </div>
  `;
}


function renderDeckStack() {
  return `
    <div class="stack-layer stack-layer-3"></div>
    <div class="stack-layer stack-layer-2"></div>
    <div class="stack-layer stack-layer-1"></div>
  `;
}


function renderFocusImage(card) {
  return `
    <div class="focus-card__mat">
      <img src="${card.imageSrc}" alt="${escapeHtml(card.title)}" />
    </div>
  `;
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
