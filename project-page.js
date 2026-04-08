const projectPageCursor = document.getElementById("fishCursor");
const projectPageRevealItems = Array.from(document.querySelectorAll(".reveal-up, .intro-reveal"));
const projectPageHeaderLinks = Array.from(document.querySelectorAll(".site-nav a"));
const projectPageClickableSelector = "a, button, .project-gallery-card";
const projectKey = document.body.dataset.project;
const projectData = window.PROJECTS?.[projectKey];

let projectPageMouseX = window.innerWidth * 0.5;
let projectPageMouseY = window.innerHeight * 0.5;
let projectLastScrollY = window.scrollY;

function setProjectCursorHoverState(isHoveringClickable) {
  document.body.classList.toggle("is-hovering-clickable", isHoveringClickable);
  if (projectPageCursor) {
    projectPageCursor.classList.toggle("is-hovering-clickable", isHoveringClickable);
  }
}

function updateProjectHeaderVisibility() {
  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > projectLastScrollY + 8;
  const isNearTop = currentScrollY < 24;

  if (isScrollingDown && !isNearTop) {
    document.body.classList.add("header-hidden");
  } else if (isNearTop) {
    document.body.classList.remove("header-hidden");
  }

  projectLastScrollY = currentScrollY;
}

function hydrateProjectPage(project) {
  if (!project) {
    return;
  }

  document.title = project.pageTitle;

  const title = document.getElementById("projectTitle");
  const category = document.getElementById("projectCategory");
  const videoSource = document.getElementById("projectVideoSource");
  const video = document.getElementById("projectVideo");
  const description = document.getElementById("projectDescription");
  const gallery = document.getElementById("projectGallery");

  if (title) {
    title.textContent = project.title;
  }

  if (category) {
    category.textContent = project.category;
  }

  if (videoSource) {
    videoSource.setAttribute("src", project.videoSrc);
    videoSource.setAttribute("type", project.videoType || "video/mp4");
  }

  if (video) {
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.load();

    const attemptPlayback = () => {
      video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      attemptPlayback();
    } else {
      video.addEventListener("loadeddata", attemptPlayback, { once: true });
      video.addEventListener("canplay", attemptPlayback, { once: true });
    }
  }

  if (description) {
    description.innerHTML = project.description.map((paragraph) => `<p>${paragraph}</p>`).join("");
  }

  if (gallery) {
    gallery.innerHTML = project.gallery
      .map(
        (image) => `
          <figure class="project-gallery-card reveal-up${image.wide ? " is-wide" : ""}">
            <img src="${image.src}" alt="${image.alt}" loading="lazy" />
          </figure>
        `
      )
      .join("");
  }
}

hydrateProjectPage(projectData);

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
setProjectCursorHoverState(false);

document.addEventListener("mousemove", (event) => {
  projectPageMouseX = event.clientX;
  projectPageMouseY = event.clientY;

  if (projectPageCursor) {
    projectPageCursor.style.left = `${projectPageMouseX}px`;
    projectPageCursor.style.top = `${projectPageMouseY}px`;
  }

  const hovered = document.elementFromPoint(projectPageMouseX, projectPageMouseY);
  setProjectCursorHoverState(hovered instanceof Element && Boolean(hovered.closest(projectPageClickableSelector)));
});

document.addEventListener("mousedown", () => {
  document.body.classList.add("is-clicking");
});

document.addEventListener("mouseup", () => {
  window.setTimeout(() => {
    document.body.classList.remove("is-clicking");
  }, 120);
});
