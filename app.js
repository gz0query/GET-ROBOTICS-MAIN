const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dots = Array.from(document.querySelectorAll(".slider-dot"));
const currentSlideNumber = document.querySelector(".current-slide-number");
const slider = document.querySelector(".hero-slider");
const previousButton = document.querySelector(".slider-prev");
const nextButton = document.querySelector(".slider-next");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeSlide = 0;
let slideTimer;
let touchStartX = 0;
let touchStartY = 0;

function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.hidden = !isActive;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeSlide;
    dot.classList.toggle("is-active", isActive);
    if (isActive) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
  });

  if (currentSlideNumber) {
    currentSlideNumber.textContent = String(activeSlide + 1).padStart(2, "0");
  }
}

function stopAutoplay() {
  window.clearInterval(slideTimer);
}

function startAutoplay() {
  stopAutoplay();
  if (!reducedMotion.matches && !document.hidden) {
    slideTimer = window.setInterval(() => showSlide(activeSlide + 1), 5000);
  }
}

previousButton?.addEventListener("click", () => {
  showSlide(activeSlide - 1);
  startAutoplay();
});

nextButton?.addEventListener("click", () => {
  showSlide(activeSlide + 1);
  startAutoplay();
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showSlide(index);
    startAutoplay();
  });
});

slider?.addEventListener("mouseenter", stopAutoplay);
slider?.addEventListener("mouseleave", startAutoplay);
slider?.addEventListener("focusin", stopAutoplay);
slider?.addEventListener("focusout", (event) => {
  if (!slider.contains(event.relatedTarget)) {
    startAutoplay();
  }
});

slider?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });

slider?.addEventListener("touchend", (event) => {
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
    showSlide(activeSlide + (deltaX < 0 ? 1 : -1));
    startAutoplay();
  }
}, { passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoplay();
  } else {
    startAutoplay();
  }
});

reducedMotion.addEventListener?.("change", startAutoplay);
showSlide(0);
startAutoplay();

const menuButton = document.querySelector("#mobile-menu-btn");
const drawer = document.querySelector("#mobile-nav-drawer");
const overlay = document.querySelector("#mobile-nav-overlay");
const drawerCloseButton = document.querySelector(".drawer-close");

function setMenuOpen(isOpen) {
  if (!menuButton || !drawer || !overlay) return;

  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  drawer.setAttribute("aria-hidden", String(!isOpen));
  drawer.inert = !isOpen;
  overlay.setAttribute("aria-hidden", String(!isOpen));
  drawer.classList.toggle("is-open", isOpen);
  overlay.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);

  if (isOpen) {
    drawerCloseButton?.focus();
  } else {
    menuButton.focus();
  }
}

menuButton?.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});
drawerCloseButton?.addEventListener("click", () => setMenuOpen(false));
overlay?.addEventListener("click", () => setMenuOpen(false));
drawer?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

const lightbox = document.querySelector("#media-lightbox-modal");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxCloseButton = lightbox?.querySelector(".lightbox-close");
let lastFocusedElement;

function openLightbox(source) {
  const image = source.closest("[data-image]");
  const imagePath = image?.getAttribute("data-image");
  if (!lightbox || !lightboxImage || !imagePath) return;

  stopAutoplay();
  lastFocusedElement = document.activeElement;
  lightboxImage.src = imagePath;
  lightboxImage.alt = image.getAttribute("data-alt") || "";
  if (lightboxCaption) {
    lightboxCaption.textContent = lightboxImage.alt;
  }
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightboxCloseButton?.focus();
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxImage.removeAttribute("src");
  lastFocusedElement?.focus();
  if (!slider?.contains(document.activeElement)) {
    startAutoplay();
  }
}

document.querySelectorAll("[data-image]").forEach((element) => {
  element.addEventListener("click", () => openLightbox(element));
});

lightboxCloseButton?.addEventListener("click", closeLightbox);
lightbox?.querySelector(".lightbox-backdrop")?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (lightbox?.classList.contains("is-open")) {
      closeLightbox();
    } else if (drawer?.classList.contains("is-open")) {
      setMenuOpen(false);
    }
  }
});

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}