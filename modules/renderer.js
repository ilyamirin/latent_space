import {
  buildCardInterpretation,
  buildSpreadSummary,
  getPositionLabel,
} from "./search.js";


export function renderScreen({ elements, state, activeThemeCard }) {
  renderStage(elements.stage, state);
  renderInfo(elements.infoPanel, state);
  renderSearchDock(elements, state);
  elements.brandHome.classList.toggle("is-home", state.screen === "home");
  elements.appShell?.classList?.toggle?.("is-search", state.screen === "search");
}


function renderStage(stage, state) {
  if (state.screen === "home") {
    stage.innerHTML = `
      <div class="home-hero">
        <div class="ritual-deck" data-action="enter-question">
          ${renderDeckStack()}
        </div>
        <div class="hero-copy">нажмите на колоду, чтобы начать расклад</div>
      </div>
    `;
    return;
  }

  if (state.screen === "question") {
    stage.innerHTML = `
      <div class="question-screen">
        <div class="question-copy">о чём ваш вопрос?</div>
        <textarea
          id="questionInput"
          class="question-input"
          placeholder="отношения, работа, переход, тревога, пустота..."
        >${escapeHtml(state.questionDraft)}</textarea>
        <div class="ritual-deck" data-action="begin-draw">
          ${renderDeckStack()}
        </div>
        <div class="hero-copy">вопрос можно не писать — просто нажмите на колоду</div>
      </div>
    `;
    return;
  }

  if (state.screen === "draw") {
    stage.innerHTML = `
      <div class="draw-screen">
        <div class="spread-slots">
          ${renderSpreadSlots(state.spreadCards, state.drawCount)}
        </div>
        <div class="ritual-deck ${state.drawCount >= 3 ? "is-hidden" : ""}" data-action="draw-next">
          ${renderDeckStack()}
        </div>
        <div class="hero-copy">
          ${
            state.drawCount >= 3
              ? "нажмите на любую карту"
              : "нажмите на колоду, чтобы вытянуть следующую карту"
          }
        </div>
      </div>
    `;
    return;
  }

  if (state.screen === "reading") {
    stage.innerHTML = `
      <div class="reading-screen">
        <div class="spread-strip">
          ${state.spreadCards
            .map(
              (card, index) => `
                <div
                  class="mini-card ${index === state.selectedSpreadIndex ? "is-active" : ""}"
                  data-action="select-spread-card"
                  data-card-index="${index}"
                >
                  <img src="${card.imageSrc}" alt="${escapeHtml(card.title)}" />
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="focus-card" data-action="speak-active-spread">
          <img src="${state.spreadCards[state.selectedSpreadIndex].imageSrc}" alt="${escapeHtml(state.spreadCards[state.selectedSpreadIndex].title)}" />
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
                  <span class="tag-chip" data-action="search-tag" data-tag="${tag}">${tag}</span>
                `,
              )
              .join("")}
          </div>
          <div class="focus-card" data-action="speak-search-card">
            <img src="${activeCard.imageSrc}" alt="${escapeHtml(activeCard.title)}" />
          </div>
          <div class="hero-copy">свайпайте карту, чтобы смотреть дальше</div>
        </div>
      `
      : `
        <div class="search-screen search-empty">
          <div class="tag-row">
            ${state.featuredTags
              .map(
                (tag) => `
                  <span class="tag-chip" data-action="search-tag" data-tag="${tag}">${tag}</span>
                `,
              )
              .join("")}
          </div>
          <div class="hero-copy">архив пока не нашёл совпадения</div>
        </div>
      `;
  }
}


function renderInfo(panel, state) {
  if (state.screen === "home") {
    panel.innerHTML = `
      <div class="info-kicker">цифровая колода образов</div>
      <h1 class="info-title">три карты и один вопрос</h1>
      <p class="info-text">Основной сценарий — расклад на три карты. Запасной — поиск по состоянию, образу или тегу.</p>
    `;
    return;
  }

  if (state.screen === "question") {
    panel.innerHTML = `
      <div class="info-kicker">подготовка</div>
      <h2 class="info-title">сформулируйте вопрос или просто удерживайте его в уме</h2>
      <p class="info-text">После нажатия на колоду появятся три карты: корень вопроса, узел напряжения и направление.</p>
    `;
    return;
  }

  if (state.screen === "draw") {
    panel.innerHTML = `
      <div class="info-kicker">расклад</div>
      <h2 class="info-title">корень, узел, вектор</h2>
      <p class="info-text">Колода выдаёт карты по одной. После третьей карты можно нажимать на любую из них, чтобы читать расклад.</p>
    `;
    return;
  }

  if (state.screen === "reading") {
    const activeCard = state.spreadCards[state.selectedSpreadIndex];
    panel.innerHTML = `
      <div class="info-kicker">${getPositionLabel(state.selectedSpreadIndex)}</div>
      <h2 class="info-title">${escapeHtml(activeCard.title)}</h2>
      <div class="info-subtitle">${escapeHtml(activeCard.galleryTitle)} · ${escapeHtml(activeCard.tone)}</div>
      <p class="info-text">${escapeHtml(activeCard.description)}</p>
      <p class="info-text">${escapeHtml(buildCardInterpretation(activeCard, state.selectedSpreadIndex, state.questionDraft))}</p>
      <p class="info-summary">${escapeHtml(buildSpreadSummary(state.spreadCards, state.questionDraft))}</p>
      <div class="info-hint">нажмите на другую карту, чтобы сменить фокус. нажмите на активную карту ещё раз, чтобы слушать.</div>
    `;
    return;
  }

  if (state.screen === "search") {
    const activeCard = state.searchResults[state.searchIndex];
    panel.innerHTML = activeCard
      ? `
        <div class="info-kicker">поиск по архиву</div>
        <h2 class="info-title">${escapeHtml(activeCard.title)}</h2>
        <div class="info-subtitle">${escapeHtml(activeCard.galleryTitle)} · ${escapeHtml(activeCard.tone)}</div>
        <p class="info-text">${escapeHtml(activeCard.description)}</p>
        <div class="info-hint">нажмите на карту, чтобы слушать описание</div>
      `
      : `
        <div class="info-kicker">поиск по архиву</div>
        <h2 class="info-title">ничего не найдено</h2>
        <p class="info-text">Попробуйте мягче: тишина, ритуал, миф, огонь, звери, космос.</p>
      `;
  }
}


function renderSearchDock(elements, state) {
  const searching = state.screen === "search";
  elements.searchEntry.classList.toggle("is-active", searching);
  elements.searchPrompt.textContent = state.searchQuery || "поиск по образу или состоянию";
  elements.searchPrompt.hidden = searching;
  elements.searchInput.hidden = !searching;
  if (searching) {
    elements.searchInput.value = state.searchQuery;
  } else {
    elements.searchInput.value = "";
  }
}


function renderSpreadSlots(cards, drawCount) {
  return [0, 1, 2]
    .map((index) => {
      if (index < drawCount && cards[index]) {
        return `
          <div class="slot-card is-filled">
            <img src="${cards[index].imageSrc}" alt="${escapeHtml(cards[index].title)}" />
          </div>
        `;
      }
      return `<div class="slot-card is-empty">${index + 1}</div>`;
    })
    .join("");
}


function renderDeckStack() {
  return `
    <div class="stack-layer stack-layer-3"></div>
    <div class="stack-layer stack-layer-2"></div>
    <div class="stack-layer stack-layer-1"></div>
  `;
}


function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
