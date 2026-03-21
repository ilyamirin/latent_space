import {
  buildCardInterpretation,
  buildSpreadSummary,
  getPositionLabel,
} from "./search.js";


export function renderScreen({ elements, state, speech }) {
  renderStage(elements.stage, state);
  renderInfo(elements.infoPanel, state, speech);
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
        <div class="ritual-deck" data-action="start-spread" role="button" tabindex="0" aria-label="Начать расклад">
          ${renderDeckStack()}
        </div>
        <div class="hero-copy">нажмите на колоду, чтобы начать расклад</div>
      </div>
    `;
    return;
  }

  if (state.screen === "spread") {
    const activeCard = state.drawCount > 0 ? state.spreadCards[state.selectedSpreadIndex] : null;
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
                  <div class="focus-card" data-action="speak-active-spread" role="button" tabindex="0" aria-label="Слушать активную карту">
                    <img src="${activeCard.imageSrc}" alt="${escapeHtml(activeCard.title)}" />
                  </div>
                </div>
              `
              : `<div class="focus-placeholder">корень<br />узел<br />вектор</div>`
          }
        </div>
        <div
          class="ritual-deck ${state.drawCount >= 3 ? "is-hidden" : ""}"
          data-action="draw-next"
          role="button"
          tabindex="0"
          aria-label="Вытянуть следующую карту"
        >
          ${renderDeckStack()}
        </div>
        <div class="hero-copy">
          ${
            state.drawCount === 0
              ? "нажмите на колоду, чтобы вытянуть первую карту"
              : state.drawCount < 3
                ? "нажмите на колоду, чтобы вытянуть следующую карту"
                : "нажмите на карту, чтобы читать. нажмите на активную карту ещё раз, чтобы слушать"
          }
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
            <div class="focus-badge">результат ${state.searchIndex + 1} из ${state.searchResults.length}</div>
            <div class="focus-card" data-action="speak-search-card" role="button" tabindex="0" aria-label="Слушать описание работы">
              <img src="${activeCard.imageSrc}" alt="${escapeHtml(activeCard.title)}" />
            </div>
          </div>
          <div class="hero-copy">свайпайте карту, чтобы смотреть дальше</div>
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
          <div class="focus-placeholder">тишина<br />ритуал<br />миф</div>
          <div class="hero-copy">введите запрос или нажмите на тег</div>
        </div>
      `;
  }
}


function renderInfo(panel, state, speech) {
  if (state.screen === "home") {
    panel.innerHTML = `
      <div class="info-kicker">цифровая колода образов</div>
      <h1 class="info-title">три карты и один вопрос</h1>
      <p class="info-text">Главный путь здесь один: колода выдаёт три образа и собирает из них чтение. Поиск по архиву остаётся запасным входом.</p>
    `;
    return;
  }

  if (state.screen === "spread") {
    if (state.drawCount === 0) {
      panel.innerHTML = `
        <div class="info-kicker">расклад</div>
        <h2 class="info-title">корень, узел, вектор</h2>
        <p class="info-text">Колода выдаёт карты по одной. Три позиции всегда читаются одинаково: сначала источник напряжения, потом узел, потом направление движения.</p>
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
          speech.activeId === `spread-${activeCard.id}-${state.selectedSpreadIndex}`
            ? "озвучка идёт"
            : state.drawCount >= 3
              ? "нажимайте на карты в верхней линии, чтобы менять фокус"
              : "после третьей карты расклад соберётся полностью"
        }
      </div>
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
        <div class="info-hint">
          ${
            speech.activeId === `search-${activeCard.id}`
              ? "озвучка идёт"
              : `результат ${state.searchIndex + 1} из ${state.searchResults.length} · нажмите на карту, чтобы слушать`
          }
        </div>
      `
      : `
        <div class="info-kicker">поиск по архиву</div>
        <h2 class="info-title">здесь пока тишина</h2>
        <p class="info-text">Введите образ, настроение или сюжет. Если не хочется формулировать, начните с тегов под картой.</p>
      `;
  }
}


function renderSearchDock(elements, state) {
  const searching = state.screen === "search";
  elements.searchEntry.classList.toggle("is-active", searching);
  elements.searchPrompt.textContent =
    state.searchQuery || (searching ? "введите образ, настроение или тег" : "поиск по образу или состоянию");
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
            <img src="${cards[index].imageSrc}" alt="${escapeHtml(cards[index].title)}" />
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


function renderDeckStack() {
  return `
    <div class="stack-layer stack-layer-3"></div>
    <div class="stack-layer stack-layer-2"></div>
    <div class="stack-layer stack-layer-1"></div>
  `;
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
