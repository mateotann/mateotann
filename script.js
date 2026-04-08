const projectCards = Array.from(document.querySelectorAll(".project-card"));
const collageCards = Array.from(document.querySelectorAll(".collage-card"));
const revealItems = Array.from(document.querySelectorAll(".reveal-up"));
const heroReelVideo = document.getElementById("heroReelVideo");
const heroFilmstrip = document.getElementById("heroFilmstrip");
const heroReelProgress = document.getElementById("heroReelProgress");
const heroReelMarker = document.getElementById("heroReelMarker");
const fishCursor = document.getElementById("fishCursor");
const catCompanion = document.getElementById("catCompanion");
const catWalkingFrames = catCompanion ? Array.from(catCompanion.querySelectorAll(".cat-walking")) : [];
const loadingScreen = document.getElementById("loadingScreen");
const loadingName = loadingScreen ? loadingScreen.querySelector(".loading-name") : null;
const introRevealItems = Array.from(document.querySelectorAll(".intro-reveal"));
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const footerPolaroid = document.querySelector(".footer-polaroid");
const polaroidBackdrop = document.getElementById("polaroidBackdrop");
const lifeScene = document.getElementById("lifeScene");
const collageBoard = document.getElementById("collageBoard");
const collagePromotedLayer = document.getElementById("collagePromotedLayer");
const lifeStatement = document.getElementById("lifeStatement");
const clickableSelector = "a, button, .project-visual, .hero-zone, .collage-card";
const storedHomeTransitionMode = (() => {
  try {
    return window.sessionStorage.getItem("home-transition-mode");
  } catch (_) {
    return null;
  }
})();

let mouseX = window.innerWidth * 0.5;
let mouseY = window.innerHeight * 0.5;
let catX = window.innerWidth - 180;
let catY = window.innerHeight - 140;
let catState = "sleeping";
let catFrameElapsed = 0;
let lastCatTime = 0;
let parkedDocX = 0;
let parkedDocY = 0;
let lastScrollY = window.scrollY;
let heroReelRAF = null;
let clickAudioContext = null;
let lifeLayoutInitialized = false;
let lifeLayoutResizeTimer = null;

function clearHomeTransitionMode() {
  try {
    window.sessionStorage.removeItem("home-transition-mode");
  } catch (_) {}
}

function revealHomepageIntro(withDelay = true) {
  const reveal = () => {
    introRevealItems.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add("is-visible");
      }, withDelay ? index * 90 : 0);
    });
    document.body.classList.add("hero-animated");
  };

  reveal();
}

function setFishHoverState(isHoveringClickable) {
  document.body.classList.toggle("is-hovering-clickable", isHoveringClickable);
  fishCursor.classList.toggle("is-hovering-clickable", isHoveringClickable);
}

function playClickSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  if (!clickAudioContext) {
    clickAudioContext = new AudioCtx();
  }

  if (clickAudioContext.state === "suspended") {
    clickAudioContext.resume().catch(() => {});
  }

  const now = clickAudioContext.currentTime;
  const masterGain = clickAudioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.024, now + 0.001);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  masterGain.connect(clickAudioContext.destination);

  const bodyOscillator = clickAudioContext.createOscillator();
  bodyOscillator.type = "triangle";
  bodyOscillator.frequency.setValueAtTime(760, now);
  bodyOscillator.frequency.exponentialRampToValueAtTime(490, now + 0.032);

  const bodyFilter = clickAudioContext.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(1320, now);
  bodyFilter.Q.value = 0.55;

  const transientOscillator = clickAudioContext.createOscillator();
  transientOscillator.type = "sine";
  transientOscillator.frequency.setValueAtTime(1280, now);
  transientOscillator.frequency.exponentialRampToValueAtTime(880, now + 0.014);

  const transientGain = clickAudioContext.createGain();
  transientGain.gain.setValueAtTime(0.0001, now);
  transientGain.gain.exponentialRampToValueAtTime(0.006, now + 0.001);
  transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

  bodyOscillator.connect(bodyFilter);
  bodyFilter.connect(masterGain);
  transientOscillator.connect(transientGain);
  transientGain.connect(masterGain);

  bodyOscillator.start(now);
  transientOscillator.start(now);
  bodyOscillator.stop(now + 0.05);
  transientOscillator.stop(now + 0.018);
}

setFishHoverState(false);
const loadingNameText = "[ mateo tannahill ]";
if (storedHomeTransitionMode === "section-fade" && loadingScreen) {
  loadingScreen.hidden = true;
  loadingScreen.classList.add("is-hidden");
  revealHomepageIntro(false);
  window.setTimeout(() => {
    clearHomeTransitionMode();
  }, 0);
} else if (loadingName) {
  loadingName.textContent = loadingNameText;

  window.setTimeout(() => {
    let current = loadingNameText;
    const eraseTimer = window.setInterval(() => {
      current = current.slice(0, -1);
      loadingName.textContent = current || " ";

      if (current.length === 0) {
        window.clearInterval(eraseTimer);
        window.setTimeout(() => {
          loadingScreen.classList.add("is-lifting");
        }, 140);
        window.setTimeout(() => {
          revealHomepageIntro(true);
        }, 240);
        window.setTimeout(() => {
          loadingScreen.classList.add("is-hidden");
          clearHomeTransitionMode();
        }, 900);
      }
    }, 58);
  }, 860);
}

const navSections = [
  { id: "top", element: document.getElementById("top") },
  { id: "gallery", element: document.getElementById("gallery") },
  { id: "life", element: document.getElementById("life") },
];

const navMap = new Map(
  navLinks.map((link) => {
    const href = link.getAttribute("href")?.replace("#", "") || "";
    return [href, link];
  })
);

function updateActiveNav() {
  const probeY = window.scrollY + window.innerHeight * 0.34;
  let activeId = "top";

  navSections.forEach((section) => {
    if (!section.element) {
      return;
    }

    if (probeY >= section.element.offsetTop) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => link.classList.remove("is-active"));
  const targetLink = navMap.get(activeId === "top" ? "top" : activeId);
  if (targetLink) {
    targetLink.classList.add("is-active");
  }
}

function updateHeaderVisibility() {
  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > lastScrollY + 8;
  const isNearTop = currentScrollY < 24;
  const shouldHide = isScrollingDown && !isNearTop;
  const shouldShow = isNearTop;

  if (shouldHide) {
    document.body.classList.add("header-hidden");
  } else if (shouldShow) {
    document.body.classList.remove("header-hidden");
  }

  lastScrollY = currentScrollY;
}

window.addEventListener("scroll", () => {
  updateActiveNav();
  updateHeaderVisibility();
}, { passive: true });
window.addEventListener("resize", () => {
  updateActiveNav();

  if (lifeLayoutInitialized) {
    window.clearTimeout(lifeLayoutResizeTimer);
    lifeLayoutResizeTimer = window.setTimeout(() => {
      randomizeLifeLayout();
    }, 140);
  }
});
updateActiveNav();
updateHeaderVisibility();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  fishCursor.style.left = `${mouseX}px`;
  fishCursor.style.top = `${mouseY}px`;

  const hovered = document.elementFromPoint(mouseX, mouseY);
  setFishHoverState(hovered instanceof Element && Boolean(hovered.closest(clickableSelector)));
});

document.addEventListener("mousedown", (event) => {
  document.body.classList.add("is-clicking");

  if (event.button === 0) {
    playClickSound();
  }
});

document.addEventListener("mouseup", () => {
  window.setTimeout(() => {
    document.body.classList.remove("is-clicking");
  }, 120);
});

function updateHeroReelProgress() {
  if (!heroReelVideo || !heroReelMarker) {
    return;
  }

  const duration = heroReelVideo.duration || 0;
  const currentTime = heroReelVideo.currentTime || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  heroReelMarker.style.left = `${progress}%`;
}

function animateHeroReelProgress() {
  updateHeroReelProgress();
  heroReelRAF = window.requestAnimationFrame(animateHeroReelProgress);
}

function drawVideoCover(context, source, width, height) {
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;

  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;
  context.drawImage(source, dx, dy, drawWidth, drawHeight);
}

async function buildHeroFilmstrip() {
  if (!heroReelVideo || !heroFilmstrip) {
    return;
  }

  const sourceUrl = heroReelVideo.currentSrc || heroReelVideo.querySelector("source")?.src;
  if (!sourceUrl) {
    return;
  }

  const frameCount = 18;
  const captureVideo = document.createElement("video");
  captureVideo.src = sourceUrl;
  captureVideo.muted = true;
  captureVideo.playsInline = true;
  captureVideo.preload = "auto";

  await new Promise((resolve) => {
    captureVideo.addEventListener("loadedmetadata", resolve, { once: true });
  });

  const duration = captureVideo.duration || 0;
  if (!duration) {
    return;
  }

  const canvas = document.createElement("canvas");
  const frameWidth = 180;
  const frameHeight = 72;
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  heroFilmstrip.innerHTML = "";

  for (let index = 0; index < frameCount; index += 1) {
    const time = Math.max(0, (duration * index) / frameCount);
    captureVideo.currentTime = time;
    await new Promise((resolve) => {
      captureVideo.addEventListener("seeked", resolve, { once: true });
    });

    context.clearRect(0, 0, frameWidth, frameHeight);
    drawVideoCover(context, captureVideo, frameWidth, frameHeight);

    const frame = document.createElement("span");
    frame.className = "hero-filmstrip-frame";

    const image = document.createElement("img");
    image.src = canvas.toDataURL("image/jpeg", 0.78);
    image.alt = "";

    frame.appendChild(image);
    heroFilmstrip.appendChild(frame);
  }
}

if (heroReelVideo) {
  heroReelVideo.addEventListener("loadedmetadata", () => {
    updateHeroReelProgress();
    buildHeroFilmstrip();
  });
  heroReelVideo.addEventListener("play", () => {
    if (!heroReelRAF) {
      heroReelRAF = window.requestAnimationFrame(animateHeroReelProgress);
    }
  });
  heroReelVideo.addEventListener("pause", () => {
    if (heroReelRAF) {
      window.cancelAnimationFrame(heroReelRAF);
      heroReelRAF = null;
    }
  });
  heroReelVideo.addEventListener("ended", () => {
    if (heroReelMarker) {
      heroReelMarker.style.left = "0%";
    }
  });
  if (!heroReelVideo.paused) {
    heroReelRAF = window.requestAnimationFrame(animateHeroReelProgress);
  }
}

if (catCompanion) {
  catCompanion.addEventListener("click", () => {
    if (catState === "sleeping") {
      catState = "awake";
      catCompanion.classList.add("is-awake");
      catCompanion.classList.remove("is-sleeping", "is-parked");
      catCompanion.style.position = "fixed";
      catCompanion.style.right = "auto";
      catCompanion.style.bottom = "auto";
      return;
    }

    if (catState === "awake") {
      catState = "parked";
      parkedDocX = catX;
      parkedDocY = window.scrollY + catY;
      catCompanion.classList.remove("is-awake", "is-sleeping", "is-step-b");
      catCompanion.classList.add("is-parked");
      catCompanion.style.position = "absolute";
      catCompanion.style.left = `${parkedDocX}px`;
      catCompanion.style.top = `${parkedDocY}px`;
      catCompanion.style.right = "auto";
      catCompanion.style.bottom = "auto";
      return;
    }

    if (catState === "parked") {
      catState = "awake";
      catX = parkedDocX;
      catY = parkedDocY - window.scrollY;
      catCompanion.classList.add("is-awake");
      catCompanion.classList.remove("is-sleeping", "is-parked");
      catCompanion.style.position = "fixed";
      catCompanion.style.left = `${catX}px`;
      catCompanion.style.top = `${catY}px`;
      catCompanion.style.right = "auto";
      catCompanion.style.bottom = "auto";
      return;
    }

    if (catState !== "sleeping") {
      catState = "sleeping";
      catCompanion.classList.remove("is-step-b");
      catCompanion.classList.remove("is-awake", "is-parked", "is-facing-left");
      catCompanion.classList.add("is-sleeping");
      catCompanion.style.position = "fixed";
      catCompanion.style.left = "";
      catCompanion.style.top = "";
      catCompanion.style.right = "1.2rem";
      catCompanion.style.bottom = "1rem";
      catX = window.innerWidth - 180;
      catY = window.innerHeight - 140;
    }
  });
}

function animateCat(now) {
  const delta = lastCatTime ? now - lastCatTime : 16;
  lastCatTime = now;

  if (catState === "awake") {
    const restRadius = 150;
    const chaseStartRadius = 210;
    const dxToFish = mouseX - catX;
    const dyToFish = mouseY - catY;
    const distanceToFish = Math.hypot(dxToFish, dyToFish) || 0.001;
    const targetX = mouseX - (dxToFish / distanceToFish) * restRadius;
    const targetY = mouseY - (dyToFish / distanceToFish) * restRadius;
    const dx = targetX - catX;
    const dy = targetY - catY;
    const distance = Math.hypot(dx, dy);
    const moveSpeed = 1.45;
    const catFacingLeft = dx < -4;

    catCompanion.classList.toggle("is-facing-left", catFacingLeft);
    catWalkingFrames.forEach((frame) => {
      frame.style.transform = catFacingLeft ? "scaleX(-1)" : "";
    });

    if (distanceToFish > chaseStartRadius && distance > 0.001) {
      const step = Math.min(moveSpeed, distance);
      catX += (dx / distance) * step;
      catY += (dy / distance) * step;
    }

    catCompanion.style.position = "fixed";
    catCompanion.style.left = `${catX}px`;
    catCompanion.style.top = `${catY}px`;
    catCompanion.style.right = "auto";
    catCompanion.style.bottom = "auto";

    if (distanceToFish > chaseStartRadius && distance > 12) {
      catFrameElapsed += delta;

      if (catFrameElapsed >= 280) {
        catCompanion.classList.toggle("is-step-b");
        catFrameElapsed = 0;
      }
    } else {
      catFrameElapsed = 0;
      catCompanion.classList.remove("is-step-b");
    }
  } else if (catState === "parked") {
    catCompanion.style.position = "absolute";
    catCompanion.style.left = `${parkedDocX}px`;
    catCompanion.style.top = `${parkedDocY}px`;
  } else {
    catCompanion.classList.remove("is-step-b", "is-facing-left");
    catWalkingFrames.forEach((frame) => {
      frame.style.transform = "";
    });
  }

  requestAnimationFrame(animateCat);
}

if (catCompanion) {
  requestAnimationFrame(animateCat);
}

let collageZ = 1;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffleCards(cards) {
  const copy = [...cards];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function parseCssSize(value, fallback = 180) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rectsOverlap(first, second, padding = 0) {
  return !(
    first.right < second.left - padding ||
    first.left > second.right + padding ||
    first.bottom < second.top - padding ||
    first.top > second.bottom + padding
  );
}

function inflateRect(rect, amount) {
  return {
    left: rect.left - amount,
    top: rect.top - amount,
    right: rect.right + amount,
    bottom: rect.bottom + amount,
  };
}

function getPlacementBounds(zone, width, height, boardWidth, boardHeight, textRect) {
  const margin = window.innerWidth <= 760 ? 12 : 24;
  let minX = margin;
  let maxX = Math.max(margin, boardWidth - width - margin);
  let minY = margin;
  let maxY = Math.max(margin, boardHeight - height - margin);

  if (window.innerWidth <= 760) {
    if (zone === "top") {
      maxY = Math.max(minY, Math.min(maxY, textRect.top - height * 0.15));
    } else if (zone === "bottom") {
      minY = Math.min(maxY, Math.max(minY, textRect.bottom - height * 0.1));
    } else if (zone === "left") {
      maxX = Math.max(minX, Math.min(maxX, boardWidth * 0.48 - width));
    } else if (zone === "right") {
      minX = Math.min(maxX, Math.max(minX, boardWidth * 0.46));
    }

    return { minX, maxX, minY, maxY };
  }

  if (zone === "left") {
    maxX = Math.max(minX, Math.min(maxX, textRect.left - width * 0.08));
  } else if (zone === "right") {
    minX = Math.min(maxX, Math.max(minX, textRect.right - width * 0.92));
  } else if (zone === "top") {
    maxY = Math.max(minY, Math.min(maxY, textRect.top + height * 0.4));
  } else if (zone === "bottom") {
    minY = Math.min(maxY, Math.max(minY, textRect.bottom - height * 0.45));
  } else if (zone === "center") {
    minX = Math.max(minX, textRect.left - width * 0.35);
    maxX = Math.min(maxX, textRect.right - width * 0.65);
    minY = Math.max(minY, textRect.top - height * 0.25);
    maxY = Math.min(maxY, textRect.bottom - height * 0.75);
  }

  return { minX, maxX, minY, maxY };
}

function randomizeLifeLayout() {
  if (!lifeScene || !collageBoard || !lifeStatement || !collageCards.length) {
    return;
  }

  const sceneRect = lifeScene.getBoundingClientRect();
  const textRectRaw = lifeStatement.getBoundingClientRect();
  const boardWidth = sceneRect.width;
  const boardHeight = sceneRect.height;

  if (!boardWidth || !boardHeight) {
    return;
  }

  const textRect = {
    left: textRectRaw.left - sceneRect.left,
    top: textRectRaw.top - sceneRect.top,
    right: textRectRaw.right - sceneRect.left,
    bottom: textRectRaw.bottom - sceneRect.top,
  };

  const cards = shuffleCards(collageCards);
  const layoutPadding = window.innerWidth <= 760 ? 14 : 26;
  let layout = null;

  cards.forEach((card) => {
    if (!card.dataset.baseRotation) {
      card.dataset.baseRotation = `${parseCssSize(card.style.getPropertyValue("--r"), 0)}`;
    }
  });

  for (let pass = 0; pass < 40 && !layout; pass += 1) {
    const placedRects = [];
    const placements = [];
    let failed = false;

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const width = parseCssSize(card.style.getPropertyValue("--w"));
      const height = parseCssSize(card.style.getPropertyValue("--h"));
      const layer = card.dataset.layer || "back";
      const zone = card.dataset.zone || "any";
      const baseRotation = parseCssSize(card.dataset.baseRotation, 0);
      const bounds = getPlacementBounds(zone, width, height, boardWidth, boardHeight, textRect);
      let candidateRect = null;

      for (let attempt = 0; attempt < 160; attempt += 1) {
        const x = randomBetween(bounds.minX, Math.max(bounds.minX, bounds.maxX));
        const y = randomBetween(bounds.minY, Math.max(bounds.minY, bounds.maxY));
        const rect = {
          left: x,
          top: y,
          right: x + width,
          bottom: y + height,
        };
        const bufferedRect = inflateRect(rect, layoutPadding);
        const intersectsOther = placedRects.some((placedRect) => rectsOverlap(bufferedRect, placedRect, 0));
        const intersectsText = layer !== "back" && rectsOverlap(bufferedRect, textRect, window.innerWidth <= 760 ? 10 : 20);

        if (!intersectsOther && !intersectsText) {
          candidateRect = rect;
          placedRects.push(bufferedRect);
          break;
        }
      }

      if (!candidateRect) {
        failed = true;
        break;
      }

      placements.push({
        card,
        index,
        layer,
        baseRotation,
        candidateRect,
      });
    }

    if (!failed) {
      layout = placements;
    }
  }

  if (!layout) {
    return;
  }

  layout.forEach(({ card, index, layer, baseRotation, candidateRect }) => {
    if (collageBoard && card.parentElement !== collageBoard) {
      collageBoard.appendChild(card);
    }

    const rotationOffset = randomBetween(-6, 6);
    const baseZ = layer === "front" ? 70 + index : 10 + index;

    card.dataset.x = `${candidateRect.left}`;
    card.dataset.y = `${candidateRect.top}`;
    card.style.setProperty("--x", `${candidateRect.left}px`);
    card.style.setProperty("--y", `${candidateRect.top}px`);
    card.style.setProperty("--r", `${(baseRotation + rotationOffset).toFixed(2)}deg`);
    card.style.zIndex = `${baseZ}`;
    card.classList.toggle("is-behind-text", layer === "back");
    card.classList.toggle("is-front-layer", layer === "front");
    card.classList.remove("is-promoted");
    collageZ = Math.max(collageZ, baseZ + 1);
  });

  lifeLayoutInitialized = true;
}

function initializeLifeLayout() {
  if (lifeLayoutInitialized) {
    return;
  }

  randomizeLifeLayout();
}

if (lifeScene) {
  if (document.readyState === "complete") {
    initializeLifeLayout();
  } else {
    window.addEventListener("load", initializeLifeLayout, { once: true });
  }

  const lifeSceneObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !lifeLayoutInitialized) {
          initializeLifeLayout();
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.28,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  lifeSceneObserver.observe(lifeScene);
}

collageCards.forEach((card) => {
  const startX = Number(card.dataset.x || 0);
  const startY = Number(card.dataset.y || 0);
  card.style.setProperty("--x", `${startX}px`);
  card.style.setProperty("--y", `${startY}px`);
  card.style.zIndex = collageZ++;

  let pointerId = null;
  let offsetX = 0;
  let offsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;

  card.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    offsetX = event.clientX - Number(card.dataset.x || 0);
    offsetY = event.clientY - Number(card.dataset.y || 0);
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragMoved = false;
    card.classList.remove("is-behind-text");
    card.classList.add("is-front-layer");
    card.classList.add("is-promoted");
    card.classList.add("is-dragging");
    card.style.zIndex = collageZ++;
    card.setPointerCapture(pointerId);

    if (collagePromotedLayer && card.parentElement !== collagePromotedLayer) {
      collagePromotedLayer.appendChild(card);
    }
  });

  card.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }

    const x = event.clientX - offsetX;
    const y = event.clientY - offsetY;
    dragMoved = dragMoved || Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 8;

    card.dataset.x = String(x);
    card.dataset.y = String(y);
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  });

  function releasePointer(event) {
    if (pointerId !== event.pointerId) {
      return;
    }

    card.releasePointerCapture(pointerId);
    pointerId = null;
    card.classList.remove("is-dragging");
  }

  card.addEventListener("pointerup", releasePointer);
  card.addEventListener("pointercancel", releasePointer);

  const photo = card.querySelector("img");
  if (photo) {
    photo.draggable = false;
  }
});

if (footerPolaroid && polaroidBackdrop) {
  function closePolaroid() {
    footerPolaroid.classList.remove("is-expanded");
    polaroidBackdrop.hidden = true;
    document.body.classList.remove("polaroid-open");
  }

  footerPolaroid.addEventListener("click", () => {
    if (footerPolaroid.classList.contains("is-expanded")) {
      return;
    }

    footerPolaroid.classList.add("is-expanded");
    polaroidBackdrop.hidden = false;
    document.body.classList.add("polaroid-open");
  });

  polaroidBackdrop.addEventListener("click", closePolaroid);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && footerPolaroid.classList.contains("is-expanded")) {
      closePolaroid();
    }
  });
}
