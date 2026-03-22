import {
  AUTHOR_CARDS,
  AUTHOR_CONTACTS,
  GALLERY_COPY,
  buildAuthorSummary,
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
  elements.appShell.classList.toggle("is-home", state.screen === "home");
  elements.appShell.classList.toggle("is-search", state.screen === "search");
  elements.appShell.classList.toggle("is-spread", state.screen === "spread");
  elements.appShell.classList.toggle("is-author", state.screen === "author");
  elements.infoPanel.classList.toggle("is-hidden", state.screen === "home");
}


function renderStage(stage, state) {
  if (state.screen === "home") {
    stage.innerHTML = `
      <div class="home-screen">
        <div class="home-orbit" aria-hidden="true"></div>
        <div class="home-copy">
          <div class="home-kicker">${UI_COPY.home.kicker}</div>
          <h1 class="home-title">${UI_COPY.home.title}</h1>
          <p class="home-lead">${UI_COPY.home.hero}</p>
          <p class="home-text">${UI_COPY.home.intro}</p>
        </div>
        <div class="home-gallery-list">
          ${renderGalleryChoices(state.galleries)}
        </div>
        <div
          class="home-author-entry"
          data-action="open-author"
          role="button"
          tabindex="0"
          aria-label="${UI_COPY.home.authorLabel}"
        >
          <div class="home-author-entry__label">${UI_COPY.home.authorLabel}</div>
          <div class="home-author-entry__prompt">${UI_COPY.home.authorPrompt}</div>
        </div>
      </div>
    `;
    return;
  }

  if (state.screen === "spread") {
    const activeCard = state.drawCount > 0 ? state.spreadCards[state.selectedSpreadIndex] : null;
    const openingNextCard = state.drawCount > 0 && state.drawCount < 3;
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
        <div class="hero-copy">
          ${state.drawCount >= 3 ? UI_COPY.spread.hintAfterComplete : UI_COPY.spread.nextCardHero}
        </div>
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
    return;
  }

  if (state.screen === "author") {
    const activeCard = AUTHOR_CARDS[state.selectedAuthorIndex] ?? AUTHOR_CARDS[0];
    stage.innerHTML = `
      <div class="spread-screen author-screen">
        <div class="spread-meter" aria-hidden="true">
          ${renderSpreadMeter(3, state.selectedAuthorIndex)}
        </div>
        <div class="spread-strip">
          ${renderAuthorSlots(state.selectedAuthorIndex)}
        </div>
        <div class="focus-zone">
          <div class="focus-shell">
            <div class="focus-badge">${escapeHtml(activeCard.position)}</div>
            <div
              class="focus-card focus-card--author"
              data-action="cycle-author-card"
              role="button"
              tabindex="0"
              aria-label="${UI_COPY.author.nextCardAria}"
            >
              ${renderAuthorFocusCard(activeCard)}
            </div>
          </div>
        </div>
        <div class="hero-copy">${UI_COPY.author.hero}</div>
      </div>
    `;
  }
}


function renderInfo(panel, state) {
  if (state.screen === "home") {
    panel.innerHTML = "";
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
    return;
  }

  if (state.screen === "author") {
    const activeCard = AUTHOR_CARDS[state.selectedAuthorIndex] ?? AUTHOR_CARDS[0];
    panel.innerHTML = `
      <div class="info-kicker">${escapeHtml(activeCard.position)}</div>
      <h2 class="info-title">${escapeHtml(activeCard.title)}</h2>
      <div class="info-subtitle">${escapeHtml(activeCard.subtitle)}</div>
      <p class="info-text">${escapeHtml(activeCard.lead)}</p>
      ${activeCard.paragraphs.map((paragraph) => `<p class="info-text">${escapeHtml(paragraph)}</p>`).join("")}
      ${renderAuthorItems(activeCard.items)}
      ${
        activeCard.id === "author-collaboration"
          ? `
            <div class="author-contacts">
              <div class="author-contacts__title">${UI_COPY.author.collaborationTitle}</div>
              ${renderAuthorContacts()}
            </div>
          `
          : ""
      }
      <p class="info-summary">${buildAuthorSummary()}</p>
      <div class="info-hint">${UI_COPY.author.hero}</div>
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


function renderAuthorSlots(selectedAuthorIndex) {
  return AUTHOR_CARDS.map((card, index) => {
    const isActive = index === selectedAuthorIndex;
    return `
      <div
        class="slot-card is-filled author-slot ${isActive ? "is-active" : ""}"
        data-action="select-author-card"
        data-card-index="${index}"
        role="button"
        tabindex="0"
        aria-label="${escapeHtml(card.position)}"
      >
        <div class="slot-card-media slot-card-media--author">
          <span class="author-slot__eyebrow">${escapeHtml(card.shortTitle)}</span>
          <span class="author-slot__index">0${index + 1}</span>
        </div>
        <span class="slot-label">${escapeHtml(card.position)}</span>
      </div>
    `;
  }).join("");
}


function renderGalleryChoices(galleries = []) {
  return galleries
    .map((gallery) => {
      const featuredIndex = GALLERY_COPY[gallery.slug]?.featuredCardIndex ?? 1;
      const previewCard = gallery.cards[Math.max(0, featuredIndex - 1)] ?? gallery.cards[0];
      return `
        <div
          class="gallery-option"
          data-action="choose-gallery"
          data-gallery-slug="${gallery.slug}"
          role="button"
          tabindex="0"
          aria-label="Выбрать колоду ${escapeHtml(gallery.title)}"
        >
          <div class="gallery-option__stack" aria-hidden="true">
            <div class="gallery-option__back gallery-option__back--rear"></div>
            <div class="gallery-option__back gallery-option__back--mid"></div>
            <div class="gallery-option__thumb">
              <img src="${previewCard.imageSrc}" alt="" />
            </div>
          </div>
          <div class="gallery-option__meta">
            <div class="gallery-option__title">${escapeHtml(gallery.title)}</div>
            <div class="gallery-option__tone">${escapeHtml(gallery.tone)}</div>
            <div class="gallery-option__prompt">коснитесь, чтобы начать</div>
          </div>
        </div>
      `;
    })
    .join("");
}


function renderFocusImage(card) {
  return `
    <div class="focus-card__mat">
      <img src="${card.imageSrc}" alt="${escapeHtml(card.title)}" />
    </div>
  `;
}


function renderAuthorFocusCard(card) {
  return `
    <div class="focus-card__mat focus-card__mat--author">
      <div class="author-focus-card">
        <div class="author-focus-card__orbit" aria-hidden="true"></div>
        <div class="author-focus-card__kicker">${escapeHtml(card.shortTitle)}</div>
        <div class="author-focus-card__title ${escapeHtml(card.focusTitleClass ?? "")}">${escapeHtml(card.title)}</div>
        <div class="author-focus-card__lead">${escapeHtml(card.lead)}</div>
      </div>
    </div>
  `;
}


function renderAuthorItems(items = []) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="author-points">
      ${items.map((item) => `<div class="author-point">${escapeHtml(item)}</div>`).join("")}
    </div>
  `;
}


function renderAuthorContacts() {
  return AUTHOR_CONTACTS.map((contact) => `
    <a class="author-contact" href="${escapeHtml(contact.href)}" target="_blank" rel="noreferrer noopener">
      <span class="author-contact__label">${escapeHtml(contact.label)}</span>
      <span class="author-contact__value">${escapeHtml(contact.value)}</span>
    </a>
  `).join("");
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
