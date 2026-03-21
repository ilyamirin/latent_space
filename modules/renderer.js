export function renderApp({
  elements,
  state,
  galleries,
  displayCards,
  visibleCards,
  activeCard,
  pathDescriptor,
  speech,
  activePanel,
}) {
  renderPathTrigger(elements.pathTrigger, pathDescriptor);
  renderRouteContext(elements, pathDescriptor);
  renderCaption(elements, activeCard, pathDescriptor);
  renderDeck(elements, state, visibleCards, activeCard, speech);
  renderLinePanel(elements, galleries, state, activePanel);
  renderSearchPanel(elements, state, displayCards, activePanel);
}


function renderPathTrigger(button, pathDescriptor) {
  button.textContent = `${pathDescriptor.chip} ▾`;
}


function renderRouteContext(elements, pathDescriptor) {
  elements.routeKicker.textContent = pathDescriptor.kicker;
  elements.routeMeta.textContent = pathDescriptor.meta;
}


function renderCaption(elements, activeCard, pathDescriptor) {
  if (!activeCard) {
    elements.captionKicker.textContent = pathDescriptor.kicker;
    elements.workTitle.textContent = "архив пока молчит";
    elements.workOrigin.textContent = pathDescriptor.meta;
    elements.curatorLead.textContent = "Попробуйте сменить линию или ввести другое состояние поиска.";
    return;
  }

  elements.captionKicker.textContent = `${activeCard.galleryTitle} · карта ${pathDescriptor.currentIndex} из ${pathDescriptor.count}`;
  elements.workTitle.textContent = activeCard.title;
  elements.workOrigin.textContent = `тон: ${activeCard.tone} · ${activeCard.galleryTitle}`;
  elements.curatorLead.textContent = activeCard.leadText;
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
              <span class="card-back-gallery">архив</span>
              <h2 class="card-back-title">здесь пока тишина</h2>
            </div>
            <p class="card-curator">Измените запрос, включите поток или вернитесь в одну из линий архива.</p>
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
      const stackIndex = visibleCards.length - reverseIndex - 1;
      const isActive = stackIndex === 0;
      const depth = stackIndex;
      const shell = elements.cardTemplate.content.firstElementChild.cloneNode(true);
      const cardNode = shell.querySelector(".card");
      const imageNode = shell.querySelector(".card-image");

      shell.classList.toggle("is-active", isActive);
      shell.style.setProperty("--offset-y", `${depth * 1.15}rem`);
      shell.style.setProperty("--offset-x", `${depth * -0.08}rem`);
      shell.style.setProperty("--scale", `${1 - depth * 0.036}`);
      shell.style.setProperty("--rotation", `${depth * -1.2}deg`);
      shell.style.setProperty("--opacity", `${1 - depth * 0.16}`);
      shell.style.setProperty("--z", `${50 - depth}`);

      if (isActive) {
        shell.style.setProperty("--offset-y", `${state.dragProgress * -0.36}rem`);
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
      shell.querySelector(".card-back-gallery").textContent = `${card.galleryTitle} · ${card.tone}`;
      shell.querySelector(".card-back-title").textContent = card.title;
      shell.querySelector(".card-curator").textContent = card.curatorText;
      shell.querySelector(".card-prompt").textContent = card.prompt;
      shell.querySelector(".card-metadata").innerHTML = card.meta
        .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
        .join("");

      const listenButton = shell.querySelector(".listen-button");
      listenButton.classList.toggle("is-playing", speech.activeId === card.id && speech.isPlaying);
      listenButton.textContent =
        speech.activeId === card.id && speech.isPlaying ? "остановить" : "слушать";

      shell.querySelector(".tone-button").dataset.action = "tone";
      shell.querySelector(".series-button").dataset.action = "series";

      elements.deck.append(shell);
    });
}


function renderLinePanel(elements, galleries, state, activePanel) {
  const isOpen = activePanel === "line";
  elements.linePanel.classList.toggle("is-hidden", !isOpen);
  elements.linePanel.setAttribute("aria-hidden", String(!isOpen));
  elements.pathList.innerHTML = [
    {
      mode: "flow",
      title: "Поток",
      description: "Смешанный маршрут через весь архив, где линии перекликаются между собой.",
    },
    ...galleries.map((gallery) => ({
      mode: "gallery",
      slug: gallery.slug,
      title: gallery.title,
      description: gallery.lineText,
    })),
  ]
    .map((item) => {
      const active =
        item.mode === "flow"
          ? state.mode === "flow"
          : state.mode === "gallery" && item.slug === state.activeGallerySlug;
      return `
        <button
          class="archive-option ${active ? "is-active" : ""}"
          type="button"
          data-route-mode="${item.mode}"
          ${item.slug ? `data-gallery-slug="${item.slug}"` : ""}
        >
          <span class="archive-option-title">${item.title}</span>
          <span class="archive-option-body">${item.description}</span>
        </button>
      `;
    })
    .join("");
}


function renderSearchPanel(elements, state, displayCards, activePanel) {
  const isOpen = activePanel === "search";
  elements.searchPanel.classList.toggle("is-hidden", !isOpen);
  elements.searchPanel.setAttribute("aria-hidden", String(!isOpen));
  elements.searchInput.value = state.searchQuery;

  if (!state.searchQuery) {
    elements.searchSummary.textContent =
      "Введите настроение, сюжет или образ. Архив соберёт новый маршрут и покажет, из каких линий он сложен.";
    return;
  }

  const galleryCount = new Set(displayCards.map((card) => card.gallerySlug)).size;
  if (displayCards.length === 0) {
    elements.searchSummary.textContent =
      "Архив пока не нашёл точного совпадения. Попробуйте мягче: тишина, ритуал, город, миф, рыжий свет.";
    return;
  }

  elements.searchSummary.textContent =
    `Найдено ${displayCards.length} ${pluralize(displayCards.length, "работа", "работы", "работ")} · ` +
    `смешано из ${galleryCount} ${pluralize(galleryCount, "линии", "линий", "линий")}.`;
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
