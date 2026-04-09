const projectPageRevealItems = Array.from(document.querySelectorAll(".reveal-up, .intro-reveal"));
const projectPageHeaderLinks = Array.from(document.querySelectorAll(".site-nav a"));
const projectKey = document.body.dataset.project;
const projectData = window.PROJECTS?.[projectKey];
const projectPageBrandLink = document.querySelector(".brand");
const projectPageSupportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let projectLastScrollY = window.scrollY;
let projectClickAudioContext = null;
const projectHeaderRevealTopThreshold = 18;
const projectHeaderHideScrollThreshold = 72;
const projectHeaderScrollDelta = 10;

function playProjectSoftClickSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  if (!projectClickAudioContext) {
    projectClickAudioContext = new AudioCtx();
  }

  if (projectClickAudioContext.state === "suspended") {
    projectClickAudioContext.resume().catch(() => {});
  }

  const now = projectClickAudioContext.currentTime;
  const output = projectClickAudioContext.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.038, now + 0.004);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
  output.connect(projectClickAudioContext.destination);

  const bodyOscillator = projectClickAudioContext.createOscillator();
  bodyOscillator.type = "triangle";
  bodyOscillator.frequency.setValueAtTime(240, now);
  bodyOscillator.frequency.exponentialRampToValueAtTime(162, now + 0.05);

  const bodyFilter = projectClickAudioContext.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(980, now);
  bodyFilter.Q.value = 0.7;

  const bodyGain = projectClickAudioContext.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(1.35, now + 0.003);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  const tapOscillator = projectClickAudioContext.createOscillator();
  tapOscillator.type = "sine";
  tapOscillator.frequency.setValueAtTime(1220, now);
  tapOscillator.frequency.exponentialRampToValueAtTime(760, now + 0.018);

  const tapGain = projectClickAudioContext.createGain();
  tapGain.gain.setValueAtTime(0.0001, now);
  tapGain.gain.exponentialRampToValueAtTime(0.24, now + 0.0015);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

  bodyOscillator.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(output);
  tapOscillator.connect(tapGain);
  tapGain.connect(output);

  bodyOscillator.start(now);
  tapOscillator.start(now);
  bodyOscillator.stop(now + 0.075);
  tapOscillator.stop(now + 0.022);
}

function updateProjectHeaderVisibility() {
  const currentScrollY = window.scrollY;
  const isNearTop = currentScrollY <= projectHeaderRevealTopThreshold;
  const isScrollingDown = currentScrollY > projectLastScrollY + projectHeaderScrollDelta;
  const isScrollingUp = currentScrollY < projectLastScrollY - projectHeaderScrollDelta;
  const hasScrolledPastHidePoint = currentScrollY > projectHeaderHideScrollThreshold;

  if (isNearTop) {
    document.body.classList.remove("header-hidden");
  } else if (isScrollingDown && hasScrolledPastHidePoint) {
    document.body.classList.add("header-hidden");
  } else if (isScrollingUp) {
    document.body.classList.remove("header-hidden");
  }

  projectLastScrollY = currentScrollY;
}
function hydrateProjectPage(project) {
  if (!project) {
    return;
  }

  document.title = project.pageTitle;
  document.body.classList.add(`project--${project.slug}`);

  const title = document.getElementById("projectTitle");
  const category = document.getElementById("projectCategory");
  const videoSource = document.getElementById("projectVideoSource");
  const video = document.getElementById("projectVideo");
  const description = document.getElementById("projectDescription");
  const credits = document.getElementById("projectCredits");
  const gallery = document.getElementById("projectGallery");
  const galleryIntro = document.getElementById("projectGalleryIntro");
  const galleryTitle = document.getElementById("projectGalleryTitle");
  const gallerySection = gallery?.closest(".project-gallery-section") || null;
  const controls = document.getElementById("projectVideoControls");
  const playToggle = document.getElementById("projectPlayToggle");
  const muteToggle = document.getElementById("projectMuteToggle");
  const fullscreenToggle = document.getElementById("projectFullscreenToggle");
  const progress = document.getElementById("projectVideoProgress");
  const time = document.getElementById("projectVideoTime");

  if (title) {
    title.textContent = project.title;
  }

  if (category) {
    category.textContent = project.date || project.category || "";
    category.hidden = !(project.date || project.category);
  }

  if (videoSource) {
    videoSource.setAttribute("src", project.videoSrc);
    videoSource.setAttribute("type", project.videoType || "video/mp4");
  }

  if (video) {
    video.volume = 0.5;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.load();

    const videoFrame = video.closest(".project-hero-video");

    const syncVideoFrame = () => {
      if (!videoFrame || !video.videoWidth || !video.videoHeight) {
        return;
      }

      const videoAspectRatio = video.videoWidth / video.videoHeight;
      videoFrame.style.setProperty("--project-video-aspect", `${videoAspectRatio}`);
      videoFrame.classList.toggle("is-tall-format", videoAspectRatio < 1.2);
      videoFrame.classList.toggle("is-classic-format", videoAspectRatio >= 1.2 && videoAspectRatio < 1.6);
      videoFrame.classList.toggle("is-widescreen-format", videoAspectRatio >= 1.6);
    };

    const attemptPlayback = () => {
      video.play().catch(() => {});
    };

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds)) {
        return "00:00";
      }

      const totalSeconds = Math.max(0, Math.floor(seconds));
      const minutes = Math.floor(totalSeconds / 60);
      const remainder = totalSeconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    };

    const syncControls = () => {
      if (playToggle) {
        playToggle.classList.toggle("is-paused", video.paused);
        playToggle.setAttribute("aria-label", video.paused ? "play video" : "pause video");
      }

      if (muteToggle) {
        muteToggle.classList.toggle("is-muted", video.muted);
        muteToggle.setAttribute("aria-label", video.muted ? "unmute video" : "mute video");
      }

      if (progress) {
        const ratio = video.duration ? video.currentTime / video.duration : 0;
        progress.value = `${Math.round(ratio * 1000)}`;
      }

      if (time) {
        time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      }
    };

    video.addEventListener("loadedmetadata", syncVideoFrame);
    video.addEventListener("loadeddata", syncVideoFrame);
    video.addEventListener("loadedmetadata", syncControls);
    video.addEventListener("timeupdate", syncControls);
    video.addEventListener("play", syncControls);
    video.addEventListener("pause", syncControls);
    video.addEventListener("volumechange", syncControls);
    video.addEventListener("ended", syncControls);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      syncVideoFrame();
      syncControls();
      attemptPlayback();
    } else {
      video.addEventListener("loadeddata", attemptPlayback, { once: true });
      video.addEventListener("canplay", attemptPlayback, { once: true });
    }

    if (playToggle) {
      playToggle.addEventListener("click", () => {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }

    if (muteToggle) {
      muteToggle.addEventListener("click", () => {
        video.muted = !video.muted;
      });
    }

    if (progress) {
      progress.addEventListener("input", () => {
        if (!video.duration) {
          return;
        }

        video.currentTime = (Number(progress.value) / 1000) * video.duration;
      });
    }

    if (fullscreenToggle) {
      fullscreenToggle.addEventListener("click", async () => {
        const frame = video.closest(".project-hero-video");

        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else if (frame?.requestFullscreen) {
            await frame.requestFullscreen();
          }
        } catch (_) {}
      });
    }
  }

  if (description) {
    if (project.copy?.length) {
      description.classList.add("is-paragraphs");
      description.innerHTML = project.copy
        .map((paragraph) => `<p class="project-copy-paragraph">${paragraph}</p>`)
        .join("");
    } else {
      description.classList.remove("is-paragraphs");

      const detailRows =
        project.details ||
        [project.category, ...(project.description || [])].map((content, index) => ({
          label: ["format", "overview", "approach", "link"][index] || `detail ${index + 1}`,
          value: content,
        }));

      description.innerHTML = detailRows
        .filter((row) => row?.value)
        .map(
          (row) => `
            <div class="project-detail-row">
              <p class="project-detail-label">${row.label}</p>
              <div class="project-detail-value">${row.value}</div>
            </div>
          `
        )
        .join("");
    }
  }

  if (credits) {
    const creditRows = (project.credits || [])
      .map(
        (row) => `
          <div class="project-credit-row">
            <p class="project-credit-label">${row.label}</p>
            <p class="project-credit-value">${row.value}</p>
          </div>
        `
      )
      .join("");

    credits.innerHTML = creditRows;
    credits.hidden = !creditRows;
  }

  if (galleryIntro) {
    galleryIntro.textContent = project.galleryIntro || "";
    galleryIntro.hidden = !project.galleryIntro;
  }

  if (galleryTitle) {
    galleryTitle.hidden = !project.galleryTitle;
    if (project.galleryTitle) {
      galleryTitle.textContent = project.galleryTitle;
    }
  }

  if (gallery) {
    const galleryItems = project.gallery || [];

    gallery.innerHTML = galleryItems
      .map(
        (image) => `
          <figure class="project-gallery-card reveal-up${image.wide ? " is-wide" : ""}">
            <img src="${image.src}" alt="${image.alt}" loading="lazy"${image.objectPosition ? ` style="object-position: ${image.objectPosition};"` : ""} />
          </figure>
        `
      )
      .join("");

    if (gallerySection) {
      gallerySection.hidden = galleryItems.length === 0;
    }
  }
}

hydrateProjectPage(projectData);

function setHomepageTransitionMode(mode) {
  try {
    window.sessionStorage.setItem("home-transition-mode", mode);
  } catch (_) {}
}

projectPageHeaderLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href") || "";
    const mode = href.includes("#gallery") || href.includes("#life") ? "section-fade" : "loader";
    setHomepageTransitionMode(mode);
  });
});

if (projectPageBrandLink) {
  projectPageBrandLink.addEventListener("click", () => {
    setHomepageTransitionMode("loader");
  });
}

window.setTimeout(() => {
  projectPageRevealItems.forEach((item, index) => {
    window.setTimeout(() => {
      item.classList.add("is-visible");
    }, index * 90);
  });
}, 120);

const projectRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -10% 0px",
  }
);

Array.from(document.querySelectorAll(".reveal-up")).forEach((item) => projectRevealObserver.observe(item));

projectPageHeaderLinks.forEach((link) => {
  link.classList.remove("is-active");
});

window.addEventListener("scroll", updateProjectHeaderVisibility, { passive: true });
updateProjectHeaderVisibility();

if (projectPageSupportsHover) {
  document.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      playProjectSoftClickSound();
    }
  });
}
