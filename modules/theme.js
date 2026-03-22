const paletteCache = new Map();
const paletteRequests = new Map();
let activeThemeCardId = null;


export function applyThemeFromCard(card) {
  if (!card) {
    return Promise.resolve(null);
  }

  activeThemeCardId = card.id;
  return loadPalette(card).then((palette) => {
    if (activeThemeCardId === card.id) {
      updateCssVariables(palette);
    }
    return palette;
  });
}


export function prewarmCardTheme(card) {
  if (!card || paletteCache.has(card.id)) {
    return Promise.resolve(null);
  }

  return loadPalette(card);
}


function loadPalette(card) {
  const cached = paletteCache.get(card.id);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = paletteRequests.get(card.id);
  if (pending) {
    return pending;
  }

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  const request = new Promise((resolve) => {
    const finalize = (palette) => {
      paletteCache.set(card.id, palette);
      paletteRequests.delete(card.id);
      resolve(palette);
    };

    image.addEventListener("load", () => {
      finalize(extractPalette(image));
    });

    image.addEventListener("error", () => {
      finalize({
        accent: [100, 242, 255],
        accentSoft: [255, 180, 122],
      });
    });

    image.src = card.imageSrc;
  });

  paletteRequests.set(card.id, request);
  return request;
}


function extractPalette(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return {
      accent: [100, 242, 255],
      accentSoft: [255, 180, 122],
    };
  }

  canvas.width = 24;
  canvas.height = 24;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let brightR = 0;
  let brightG = 0;
  let brightB = 0;
  let darkR = 0;
  let darkG = 0;
  let darkB = 0;
  let brightCount = 0;
  let darkCount = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const alpha = pixels[index + 3];
    if (alpha < 40) {
      continue;
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance > 0.52) {
      brightR += r;
      brightG += g;
      brightB += b;
      brightCount += 1;
    } else {
      darkR += r;
      darkG += g;
      darkB += b;
      darkCount += 1;
    }
  }

  const accent = brightCount
    ? [brightR / brightCount, brightG / brightCount, brightB / brightCount]
    : [100, 242, 255];
  const accentSoft = darkCount
    ? [darkR / darkCount, darkG / darkCount, darkB / darkCount]
    : [255, 180, 122];

  return {
    accent: accent.map(clampChannel),
    accentSoft: accentSoft.map(clampChannel),
  };
}


function updateCssVariables(palette) {
  document.documentElement.style.setProperty("--accent-rgb", palette.accent.join(", "));
  document.documentElement.style.setProperty("--accent-soft-rgb", palette.accentSoft.join(", "));
}


function clampChannel(value) {
  return Math.max(30, Math.min(255, Math.round(value)));
}
