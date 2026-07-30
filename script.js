// ---- invert (dark) mode toggle ----
const invertToggle = document.getElementById("invertToggle");

function setInverted(isInverted) {
  document.documentElement.classList.toggle("inverted", isInverted);
  if (invertToggle) {
    invertToggle.setAttribute("aria-pressed", String(isInverted));
    invertToggle.setAttribute("aria-label", isInverted ? "turn off dark mode" : "turn on dark mode");
  }
  try {
    window.localStorage.setItem("mt-inverted", isInverted ? "on" : "off");
  } catch (_) {}
}

try {
  setInverted(window.localStorage.getItem("mt-inverted") === "on");
} catch (_) {}

if (invertToggle) {
  invertToggle.addEventListener("click", () => {
    setInverted(!document.documentElement.classList.contains("inverted"));
  });
}

// ---- page load-in stagger ----
window.addEventListener("load", () => {
  requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  playHeroIntro();
});

// ---- split-text hero headline reveal (anime.js) ----
function splitIntoChars(el) {
  const words = el.textContent.split(" ");
  el.textContent = "";
  words.forEach((word, wi) => {
    word.split("").forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      el.appendChild(span);
    });
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return el.querySelectorAll(".char");
}

const heroHeadline = document.getElementById("heroHeadline");
let heroChars = [];
if (heroHeadline) {
  heroHeadline.querySelectorAll(".line").forEach((line) => {
    heroChars = heroChars.concat(Array.from(splitIntoChars(line)));
  });
}

function playHeroIntro() {
  if (!heroChars.length) return;
  if (typeof anime === "undefined") {
    heroChars.forEach((c) => { c.style.opacity = 1; });
    return;
  }
  anime.set(heroChars, { opacity: 0, translateY: 24, filter: "blur(10px)" });
  anime({
    targets: heroChars,
    opacity: [0, 1],
    translateY: [24, 0],
    filter: ["blur(10px)", "blur(0px)"],
    easing: "easeOutExpo",
    duration: 900,
    delay: anime.stagger(18, { start: 120 }),
  });
}

// ---- magnetic button (hero CTA) ----
function initMagnetic(selector, strength) {
  const el = document.querySelector(selector);
  if (!el) return;
  const wrap = document.createElement("span");
  wrap.className = "magnetic";
  el.parentNode.insertBefore(wrap, el);
  wrap.appendChild(el);

  wrap.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    if (typeof anime !== "undefined") {
      anime({
        targets: el,
        translateX: x * strength,
        translateY: y * strength,
        duration: 400,
        easing: "easeOutQuad",
      });
    } else {
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    }
  });

  wrap.addEventListener("mouseleave", () => {
    if (typeof anime !== "undefined") {
      anime({ targets: el, translateX: 0, translateY: 0, duration: 500, easing: "easeOutElastic(1, .6)" });
    } else {
      el.style.transform = "translate(0, 0)";
    }
  });
}

initMagnetic(".hero-cta", 0.35);

// ---- scramble-text hover on project card titles ----
const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz";

function scrambleText(el) {
  const original = el.dataset.text || el.textContent;
  el.dataset.text = original;
  if (el._scrambling) clearInterval(el._scrambling);

  let frame = 0;
  const totalFrames = 16;
  el._scrambling = setInterval(() => {
    el.textContent = original
      .split("")
      .map((ch, i) => {
        if (ch === " ") return " ";
        const revealAt = (i / original.length) * totalFrames;
        if (frame >= revealAt + 6) return ch;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      })
      .join("");
    frame += 1;
    if (frame > totalFrames + 6) {
      clearInterval(el._scrambling);
      el.textContent = original;
    }
  }, 28);
}

document.querySelectorAll(".card-meta h3").forEach((title) => {
  title.dataset.text = title.textContent;
  title.addEventListener("mouseenter", () => scrambleText(title));
});

// ---- hover-to-play project previews ----
document.querySelectorAll(".card-visual").forEach((link) => {
  const video = link.querySelector("video");
  if (!video) return;

  link.addEventListener("mouseenter", () => {
    link.classList.add("is-playing");
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  link.addEventListener("mouseleave", () => {
    link.classList.remove("is-playing");
    video.pause();
  });
});

// ---- scroll reveal ----
const revealTargets = document.querySelectorAll(".card, .hero, .about-body, .section-head");
revealTargets.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealTargets.forEach((el) => revealObserver.observe(el));

// ---- live visitor tracker ("rec" strip) ----
const visitorLocation = document.getElementById("visitorLocation");
const visitorTime = document.getElementById("visitorTime");

function formatVisitTime(iso) {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

async function updateRecStrip() {
  if (!visitorLocation || !visitorTime) return;

  try {
    const response = await fetch(`/api/visitor?path=${encodeURIComponent(window.location.pathname)}`, {
      method: "POST",
    });

    if (!response.ok) {
      visitorLocation.textContent = "visitor unavailable";
      visitorTime.textContent = "";
      return;
    }

    const data = await response.json();

    if (!data.stored || data.error) {
      visitorLocation.textContent = "storage not configured";
      visitorTime.textContent = "";
      return;
    }

    if (!data.previous) {
      visitorLocation.textContent = "no previous visitor";
      visitorTime.textContent = "first tracked load";
      return;
    }

    visitorLocation.textContent = data.previous.label || "unknown location";
    visitorTime.textContent = formatVisitTime(data.previous.visitedAt);
  } catch (error) {
    visitorLocation.textContent = "visitor unavailable";
    visitorTime.textContent = "";
  }
}

updateRecStrip();
