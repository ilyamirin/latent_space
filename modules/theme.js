const paletteCache = new Map();
let activeThemeCardId = null;


export function applyThemeFromCard(card) {
  if (!card) {
    return;
  }

  activeThemeCardId = card.id;
  const cached = paletteCache.get(card.id);
  if (cached) {
    updateCssVariables(cached);
    return;
  }

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = card.imageSrc;
  image.addEventListener("load", () => {
    const palette = extractPalette(image);
    paletteCache.set(card.id, palette);
    if (activeThemeCardId === card.id) {
      updateCssVariables(palette);
    }
  });
}


export function prewarmCardTheme(card) {
  if (!card || paletteCache.has(card.id)) {
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = card.imageSrc;
  image.addEventListener("load", () => {
    paletteCache.set(card.id, extractPalette(image));
  });
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
