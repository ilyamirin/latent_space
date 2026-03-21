export function renderApp({
  elements,
  state,
  galleries,
  displayCards,
  visibleCards,
  activeCard,
  searchMode,
  speech,
}) {
  renderGalleryRail(elements.galleryRail, galleries, state.activeGallerySlug);
  renderStatus(elements, state, activeCard, displayCards.length, searchMode, speech);
  renderDeck(elements, state, visibleCards, activeCard, speech);
}


function renderGalleryRail(container, galleries, activeGallerySlug) {
  container.innerHTML = galleries
    .map(
      (gallery) => `
        <button
          class="gallery-pill ${gallery.slug === activeGallerySlug ? "is-active" : ""}"
          type="button"
          data-gallery-slug="${gallery.slug}"
        >
          ${gallery.title}
        </button>
      `,
    )
    .join("");
}


function renderStatus(elements, state, activeCard, displayCount, searchMode, speech) {
  const gallery = state.galleries.find((item) => item.slug === state.activeGallerySlug);
  const hasResults = displayCount > 0;
  const currentIndex = hasResults ? (state.activeIndex % displayCount) + 1 : 0;
  const statusLine = searchMode
    ? `поиск нашёл ${displayCount} ${pluralize(displayCount, "работу", "работы", "работ")}`
    : gallery?.description ?? "";

  elements.deckStatus.textContent = searchMode
    ? "режим поиска"
    : gallery?.title ?? "";
  elements.statusCopy.textContent = hasResults
    ? statusLine
    : "ничего не найдено — попробуйте другой образ или настроение";
  elements.statusMeta.textContent = hasResults
    ? `${currentIndex} / ${displayCount}${speech.isPlaying ? " · куратор говорит" : ""}`
    : "сбросьте поиск, чтобы вернуться к колоде";
  elements.audioToggle.textContent = speech.isPlaying ? "стоп" : "звук";
}


function renderDeck(elements, state, visibleCards, activeCard, speech) {
  elements.deck.innerHTML = "";

  if (!activeCard) {
    const empty = document.createElement("div");
    empty.className = "card-shell";
    empty.innerHTML = `
      <div class="card">
        <div class="card-face card-back">
          <div class="card-back-inner">
            <div class="card-back-head">
              <span class="card-back-gallery">пустая колода</span>
              <h2 class="card-back-title">здесь пока тишина</h2>
            </div>
            <p class="card-prompt">Измените запрос или переключитесь на другую галерею.</p>
          </div>
        </div>
      </div>
    `;
    elements.deck.append(empty);
    return;
  }

  visibleCards
    .slice()
    .reverse()
    .forEach((card, reverseIndex) => {
      const index = visibleCards.length - reverseIndex - 1;
      const shell = elements.cardTemplate.content.firstElementChild.cloneNode(true);
      const cardNode = shell.querySelector(".card");
      const imageNode = shell.querySelector(".card-image");
      const isActive = index === 0;
      const depth = index;

      shell.classList.toggle("is-active", isActive);
      shell.style.setProperty("--offset-y", `${depth * 1.05}rem`);
      shell.style.setProperty("--offset-x", `${depth * -0.05}rem`);
      shell.style.setProperty("--scale", `${1 - depth * 0.035}`);
      shell.style.setProperty("--rotation", `${depth * -1.25}deg`);
      shell.style.setProperty("--opacity", `${1 - depth * 0.16}`);
      shell.style.setProperty("--z", `${50 - depth}`);

      if (isActive) {
        shell.classList.add("is-active");
        shell.style.setProperty("--offset-y", `${state.dragProgress * -0.5}rem`);
        shell.style.setProperty("--offset-x", `${state.dragOffsetX}px`);
        shell.style.setProperty("--scale", `${1 - state.dragProgress * 0.02}`);
        shell.style.setProperty("--rotation", `${state.dragOffsetX / 34}deg`);
        if (state.isSwipeAnimating) {
          shell.classList.add("is-swipe-out");
        }
      }

      cardNode.classList.toggle("is-flipped", isActive && state.isFlipped);
      cardNode.setAttribute("aria-pressed", String(isActive && state.isFlipped));
      cardNode.dataset.cardId = card.id;

      imageNode.src = card.imageSrc;
      imageNode.alt = `${card.galleryTitle}: ${card.title}`;
      imageNode.loading = isActive ? "eager" : "lazy";

      shell.querySelector(".card-gallery").textContent = card.galleryTitle;
      shell.querySelector(".card-title").textContent = card.title;
      shell.querySelector(".card-back-gallery").textContent = card.subtitle;
      shell.querySelector(".card-back-title").textContent = card.title;
      shell.querySelector(".card-prompt").textContent = card.prompt;
      shell.querySelector(".card-metadata").innerHTML = card.meta
        .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
        .join("");

      const listenButton = shell.querySelector(".listen-button");
      listenButton.classList.toggle("is-playing", speech.activeId === card.id && speech.isPlaying);
      listenButton.textContent =
        speech.activeId === card.id && speech.isPlaying ? "остановить" : "слушать";

      elements.deck.append(shell);
    });
}


function pluralize(value, one, two, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return two;
  }
  return many;
}
