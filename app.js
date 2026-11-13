let firebaseSdk = null;
try {
  firebaseSdk = await import("./firebase-config.js");
} catch (error) {
  console.error("Firebase could not be loaded. The local storefront will remain available.", error);
}
const {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  isUserAuthorizedAdmin,
  DEFAULT_ADMIN_EMAILS,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} = firebaseSdk || {};

let slides = Array.from(document.querySelectorAll(".hero-slide"));
let dots = Array.from(document.querySelectorAll(".slider-dot"));
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

const schoolBookingProgram = "Bring Get Robotics to Our School (STEM Partnership)";
const schoolBookingForm = document.querySelector("#direct-booking-form");
const schoolBookingSelect = document.querySelector("#wa-program");
let schoolBookingHighlightTimer;

document.querySelectorAll("[data-school-partner-cta]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const programOption = Array.from(schoolBookingSelect?.options || [])
      .find((option) => option.textContent.trim() === schoolBookingProgram);
    if (!schoolBookingForm || !schoolBookingSelect || !programOption) {
      console.error("The school partnership booking option is unavailable.");
      return;
    }

    event.preventDefault();
    if (drawer?.classList.contains("is-open")) {
      setMenuOpen(false);
    }
    schoolBookingSelect.value = programOption.value;
    schoolBookingSelect.dispatchEvent(new Event("change", { bubbles: true }));
    schoolBookingForm.classList.add("is-highlighted");
    const status = document.querySelector("#booking-form-status");
    if (status) status.textContent = "School partnership enquiry selected.";
    schoolBookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
    window.clearTimeout(schoolBookingHighlightTimer);
    schoolBookingHighlightTimer = window.setTimeout(() => {
      schoolBookingForm.classList.remove("is-highlighted");
    }, 3600);
    window.setTimeout(() => schoolBookingSelect.focus({ preventScroll: true }), 450);
  });
});

const lightbox = document.querySelector("#media-lightbox-modal");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxCloseButton = lightbox?.querySelector(".lightbox-close");
let lastFocusedElement;

function openLightbox(source) {
  const image = source.closest("[data-image]");
  const imagePath = image?.querySelector("img")?.currentSrc || image?.getAttribute("data-image");
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

document.querySelectorAll("[data-image]:not(.video-card-media)").forEach((element) => {
  element.addEventListener("click", () => openLightbox(element));
});
document.querySelector(".video-hub-grid")?.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-image]");
  if (trigger) openLightbox(trigger);
});

lightboxCloseButton?.addEventListener("click", closeLightbox);
lightbox?.querySelector(".lightbox-backdrop")?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (lightbox?.classList.contains("is-open")) {
      closeLightbox();
    } else if (drawer?.classList.contains("is-open")) {
      setMenuOpen(false);
    } else if (cartDrawer?.classList.contains("is-open") || wishlistDrawer?.classList.contains("is-open")) {
      closeStorePanels();
    }
  }
});

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const globalSearchInput = document.querySelector("#global-search-input");
const mobileSearchInput = document.querySelector("#mobile-search-input");
const mobileShopSearchInput = document.querySelector("#mobile-shop-search-input");
const productGrid = document.querySelector("#rev-products-grid");
const storeSearchEmpty = document.querySelector("#store-search-empty");
const productCount = document.querySelector("#store-product-count");
const storeSection = document.querySelector("#shop-all-section");
const featuredProductLimit = Number(productGrid?.dataset.productLimit || 0);
const searchInputs = [globalSearchInput, mobileSearchInput, mobileShopSearchInput].filter(Boolean);
const DEFAULT_PRODUCTS = Object.freeze([
  {
    id: "GET-21-3006",
    sku: "GET-21-3006",
    title: "Acebott 4WD Smart Robot Car Kit V2.0 (Arduino / ESP32)",
    price: 65000,
    image: "images/kits-smart-cars-spider.jpg",
    categories: ["complete-kits"],
    featuredRank: 1,
    salesCount: 90,
    createdAt: "2026-10-01",
    inStock: true,
  },
  {
    id: "GET-21-1652",
    sku: "GET-21-1652",
    title: "Acebott Quadruped Bionic Spider Robot Kit (ESP32 Wi-Fi)",
    price: 85000,
    image: "images/kits-smart-cars-spider.jpg",
    categories: ["complete-kits"],
    featuredRank: 2,
    salesCount: 75,
    createdAt: "2026-10-02",
    inStock: true,
  },
  {
    id: "GET-11-2159",
    sku: "GET-11-2159",
    title: "Arduino Uno R3 School Lab Starter Bundle with Breadboard & Project Guide",
    price: 32500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["microcontrollers", "prototyping", "training"],
    featuredRank: 3,
    salesCount: 110,
    createdAt: "2026-10-03",
    inStock: true,
  },
  {
    id: "GET-11-2858",
    sku: "GET-11-2858",
    title: "Blind Assist Ultrasonic Walking Stick Sensor Kit (HC-SR04 + Buzzer)",
    price: 18500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["sensors", "complete-kits"],
    featuredRank: 4,
    salesCount: 55,
    createdAt: "2026-10-04",
    inStock: true,
  },
  {
    id: "GET-11-2828",
    sku: "GET-11-2828",
    title: "ESP32 Wi-Fi & Bluetooth Microcontroller Development Board",
    price: 12000,
    image: "images/IMG-20261106-WA0110.jpg",
    categories: ["microcontrollers"],
    featuredRank: 5,
    salesCount: 130,
    createdAt: "2026-10-05",
    inStock: true,
  },
  {
    id: "GET-21-6801",
    sku: "GET-21-6801",
    title: "Automated Smart Waste Bin Servo & Ultrasonic DIY Kit",
    price: 22000,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["sensors", "complete-kits"],
    featuredRank: 6,
    salesCount: 60,
    createdAt: "2026-10-06",
    inStock: true,
  },
  {
    id: "GET-13-2981",
    sku: "GET-13-2981",
    title: "L298N Dual H-Bridge DC Motor Driver Module",
    price: 7500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["motors"],
    featuredRank: 7,
    salesCount: 80,
    createdAt: "2026-10-13",
    inStock: true,
  },
  {
    id: "GET-12-1110",
    sku: "GET-12-1110",
    title: "DHT11 Digital Temperature & Humidity Sensor Module",
    price: 3500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["sensors"],
    featuredRank: 8,
    salesCount: 100,
    createdAt: "2026-10-14",
    inStock: true,
  },
  {
    id: "GET-11-2101",
    sku: "GET-11-2101",
    title: "Arduino Nano V3.0 ATmega328P Microcontroller Board",
    price: 8500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["microcontrollers"],
    featuredRank: 9,
    salesCount: 95,
    createdAt: "2026-10-09",
    inStock: true,
  },
  {
    id: "GET-12-0401",
    sku: "GET-12-0401",
    title: "HC-SR04 Ultrasonic Distance Sensor Module",
    price: 4500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["sensors"],
    featuredRank: 10,
    salesCount: 145,
    createdAt: "2026-10-10",
    inStock: true,
  },
  {
    id: "GET-13-0901",
    sku: "GET-13-0901",
    title: "SG90 9g Micro Servo Motor",
    price: 6500,
    image: "images/kits-smart-cars-spider.jpg",
    categories: ["motors"],
    featuredRank: 11,
    salesCount: 105,
    createdAt: "2026-10-11",
    inStock: true,
  },
  {
    id: "GET-14-0801",
    sku: "GET-14-0801",
    title: "Breadboard Jumper Wires Pack (Male-to-Male)",
    price: 3500,
    image: "images/circuit-arduino-breadboard.jpg",
    categories: ["prototyping"],
    featuredRank: 12,
    salesCount: 125,
    createdAt: "2026-10-12",
    inStock: true,
  },
].map((product) => Object.freeze({
  ...product,
  categories: Object.freeze([...product.categories]),
  selarUrl: "",
})));
let products = [...DEFAULT_PRODUCTS];
let activeStoreCategory = "all";
let activeStoreSort = "featured";
const productQuantities = new Map();
let activeAuthUser = null;
let whatsappPhone = String(window.GET_ROBOTICS_WHATSAPP_NUMBER || "2347033952315").replace(/\D/g, "");
const officialSocialUrls = {
  tiktokUrl: "https://www.tiktok.com/@getrobotics?_r=1&_t=ZS-9BKD57KGDHM",
  youtubeUrl: "https://youtube.com/@getrobotics?si=hxkOtylsKbNI1wXF",
  facebookUrl: "https://www.facebook.com/share/1KRdG9jwhc/?mibextid=wwXIfr",
};
let officialSelarStoreUrl = "https://selar.com";

function buildWhatsAppLink(message) {
  const recipient = whatsappPhone ? `/${whatsappPhone}` : "/";
  return `https://wa.me${recipient}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
  const message = new URL(link.href).searchParams.get("text");
  if (message) link.href = buildWhatsAppLink(message);
});

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function productElement(className = "") {
  const element = document.createElement("article");
  element.className = className;
  return element;
}

function buildProductCard(product, className = "rev-product-card") {
  const card = productElement(className);
  card.dataset.productId = product.id;
  card.dataset.categories = product.categories.join(" ");
  card.dataset.searchTerms = `${product.title} ${product.sku}`.toLocaleLowerCase();

  const imageWrap = document.createElement("div");
  imageWrap.className = "rev-product-img-wrap";
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.title;
  image.loading = "lazy";

  const wishButton = document.createElement("button");
  wishButton.className = "btn-wishlist-toggle";
  wishButton.type = "button";
  wishButton.setAttribute("aria-label", `${wishlist.includes(product.id) ? "Remove" : "Add"} ${product.title} ${wishlist.includes(product.id) ? "from" : "to"} wish list`);
  wishButton.setAttribute("aria-pressed", String(wishlist.includes(product.id)));
  wishButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 8.8c0 4.3-8.5 10-8.5 10s-8.5-5.7-8.5-10a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  wishButton.addEventListener("click", () => toggleWishlist(product.id, wishButton));
  imageWrap.append(image, wishButton);

  const title = document.createElement("h3");
  title.className = "rev-product-title";
  title.textContent = product.title;
  const sku = document.createElement("div");
  sku.className = "rev-product-sku";
  sku.textContent = product.sku;
  const price = document.createElement("div");
  price.className = "rev-product-price";
  price.textContent = formatNaira(product.price);

  const stepper = document.createElement("div");
  stepper.className = "rev-qty-stepper";
  const minus = document.createElement("button");
  minus.className = "qty-minus";
  minus.type = "button";
  minus.setAttribute("aria-label", `Decrease ${product.title} quantity`);
  minus.textContent = "−";
  const input = document.createElement("input");
  input.className = "qty-input";
  input.type = "number";
  input.min = "1";
  input.max = String(MAX_ITEM_QUANTITY);
  input.step = "1";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", `${product.title} quantity`);
  input.value = String(productQuantities.get(product.id) || 1);
  const plus = document.createElement("button");
  plus.className = "qty-plus";
  plus.type = "button";
  plus.setAttribute("aria-label", `Increase ${product.title} quantity`);
  plus.textContent = "+";

  function setQuantity(nextQuantity) {
    const quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(nextQuantity) || 1)));
    productQuantities.set(product.id, quantity);
    input.value = String(quantity);
  }

  minus.addEventListener("click", () => setQuantity(Number(input.value) - 1));
  plus.addEventListener("click", () => setQuantity(Number(input.value) + 1));
  input.addEventListener("change", () => setQuantity(input.value));
  input.addEventListener("blur", () => setQuantity(input.value));
  stepper.append(minus, input, plus);

  const addButton = document.createElement("button");
  addButton.className = "rev-add-to-cart-btn";
  addButton.type = "button";
  addButton.textContent = product.inStock === false ? "OUT OF STOCK" : "ADD TO CART";
  addButton.disabled = product.inStock === false;
  addButton.addEventListener("click", () => {
    addProductToCart(product.id, Number(input.value), addButton);
  });

  const actionRow = document.createElement("div");
  actionRow.className = "product-action-row";
  actionRow.append(stepper, addButton);

  card.append(imageWrap, title, sku, price, actionRow);
  return card;
}

function sortProducts(items) {
  const sortedItems = [...items];
  if (activeStoreSort === "newest") {
    sortedItems.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } else if (activeStoreSort === "bestselling") {
    sortedItems.sort((a, b) => b.salesCount - a.salesCount);
  } else if (activeStoreSort === "price-asc") {
    sortedItems.sort((a, b) => a.price - b.price);
  } else if (activeStoreSort === "price-desc") {
    sortedItems.sort((a, b) => b.price - a.price);
  } else {
    sortedItems.sort((a, b) => a.featuredRank - b.featuredRank);
  }
  return sortedItems;
}

function renderProducts() {
  if (!productGrid) return;
  const searchTerm = (globalSearchInput?.value || mobileSearchInput?.value || mobileShopSearchInput?.value || "").trim().toLocaleLowerCase();
  const matchingProducts = sortProducts(products.filter((product) => {
    const matchesCategory = activeStoreCategory === "all" || product.categories.includes(activeStoreCategory);
    const matchesSearch = !searchTerm || `${product.title} ${product.sku}`.toLocaleLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  }));
  const visibleProducts = featuredProductLimit && activeStoreCategory === "all" && !searchTerm
    ? matchingProducts.slice(0, featuredProductLimit)
    : matchingProducts;
  productGrid.replaceChildren(...visibleProducts.map((product) => buildProductCard(product)));
  if (productCount) productCount.textContent = String(matchingProducts.length);
  if (storeSearchEmpty) storeSearchEmpty.hidden = matchingProducts.length > 0;
  document.querySelectorAll(".store-category-tab").forEach((tab) => {
    const isActive = tab.dataset.category === activeStoreCategory;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
}

function filterStoreProducts(query) {
  searchInputs.forEach((input) => {
    if (input.value !== query) input.value = query;
  });
  renderProducts();
}

searchInputs.forEach((input) => {
  input.addEventListener("input", () => {
    searchInputs.forEach((otherInput) => {
      if (otherInput !== input) otherInput.value = input.value;
    });
    filterStoreProducts(input.value);
  });

  input.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    filterStoreProducts(input.value);
    if (!storeSection) {
      const target = new URL("shop.html", window.location.href);
      if (input.value.trim()) target.searchParams.set("search", input.value.trim());
      window.location.assign(target.href);
      return;
    }
    if (drawer?.classList.contains("is-open")) {
      setMenuOpen(false);
    }
    storeSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const initialSearch = new URLSearchParams(window.location.search).get("search");
if (initialSearch) {
  searchInputs.forEach((input) => {
    input.value = initialSearch;
  });
}

document.querySelectorAll("#direct-booking-form, #online-class-registration-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submittedForm = event.currentTarget;
  if (!(submittedForm instanceof HTMLFormElement)) return;
  const form = submittedForm;
  const isOnlineClassRegistration = form.id === "online-class-registration-form";
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const status = document.querySelector(isOnlineClassRegistration ? "#online-registration-status" : "#booking-form-status");
  const programSelect = form.querySelector('[name="program"]');
  const selectedProgram = programSelect instanceof HTMLSelectElement
    ? programSelect.selectedOptions[0]?.textContent?.trim() || String(formData.get("program") || "").trim()
    : String(formData.get("program") || "").trim();
  if (!db || !collection || !addDoc || !serverTimestamp) {
    if (status) status.textContent = isOnlineClassRegistration
      ? "Your registration could not be saved. Please contact Get Robotics directly."
      : "Your enquiry could not be saved. Please contact Get Robotics directly.";
    console.error("The enquiry was not sent because Firestore is unavailable.");
    return;
  }
  const whatsappWindow = window.open("about:blank", "_blank");
  if (whatsappWindow) whatsappWindow.opener = null;
  if (status) status.textContent = "Saving your enquiry before opening WhatsApp.";
  const inquiry = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    program: selectedProgram,
    studentAge: String(formData.get("studentAge") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    ...(isOnlineClassRegistration ? { inquiryType: "online_class_registration" } : {}),
  };
  let savedInquiry;
  try {
    savedInquiry = await addDoc(collection(db, "getrobotics_inquiries"), {
      ...inquiry,
      createdAt: serverTimestamp(),
    });
    const cachedInquiries = readAdminCache("inquiries", []);
    writeAdminCache("inquiries", [
      { id: savedInquiry.id, data: { ...inquiry, createdAt: new Date().toISOString() } },
      ...(Array.isArray(cachedInquiries) ? cachedInquiries : []),
    ]);
  } catch (error) {
    whatsappWindow?.close();
    console.error("Unable to save the booking or partnership enquiry.", error);
    if (status) status.textContent = isOnlineClassRegistration
      ? "Your registration could not be saved. Please try again or contact Get Robotics directly."
      : "Your enquiry could not be saved. Please try again or contact Get Robotics directly.";
    return;
  }
  const message = [
    isOnlineClassRegistration
      ? "Hello Get Robotics, I would like to register for an online class."
      : "Hello Get Robotics, I would like to make a booking enquiry.",
    `Program: ${selectedProgram}`,
    `Name: ${formData.get("name")}`,
    ...(formData.get("email") ? [`Email: ${formData.get("email")}`] : []),
    ...(formData.get("phone") ? [`Phone: ${formData.get("phone")}`] : []),
    ...(formData.get("studentAge") ? [`Student Age / Class Level or School: ${formData.get("studentAge")}`] : []),
    ...(formData.get("message") ? [`Message: ${formData.get("message")}`] : []),
  ].join("\n");
  if (status) status.textContent = isOnlineClassRegistration
    ? "Saved to Cloud! Your online class registration request was saved. Opening WhatsApp."
    : "Saved to Cloud! Your enquiry was saved. Opening WhatsApp.";
  const whatsappUrl = buildWhatsAppLink(message);
  if (whatsappWindow) {
    whatsappWindow.location.href = whatsappUrl;
  } else {
    window.location.assign(whatsappUrl);
  }
  });
});

document.querySelectorAll("[data-online-cohort]").forEach((link) => {
  link.addEventListener("click", () => {
    const cohort = link.dataset.onlineCohort;
    const cohortSelect = document.querySelector("#online-cohort-choice");
    if (cohort && cohortSelect instanceof HTMLSelectElement) {
      cohortSelect.value = cohort;
    }
  });
});

const teslaVideo = document.querySelector("#tesla-main-video");
const teslaStage = document.querySelector("#tesla-video-stage");
const teslaUnmutePill = document.querySelector("#tesla-unmute-pill");
const teslaCenterPlayButton = document.querySelector("#tesla-center-play-btn");
const teslaVolumeButton = document.querySelector("#tesla-volume-btn");
const teslaFullscreenButton = document.querySelector("#tesla-fullscreen-btn");
const teslaProgress = document.querySelector("#tesla-video-progress");
const teslaTime = document.querySelector("#tesla-video-time");
const teslaVideoStatus = document.querySelector(".tesla-video-status");
let teslaCenterButtonTimer;
let teslaFallbackAttempted = false;

function formatVideoTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateTeslaVideoControls() {
  if (!teslaVideo || !teslaProgress || !teslaTime) return;
  const duration = Number.isFinite(teslaVideo.duration) ? teslaVideo.duration : 58;
  const currentTime = Number.isFinite(teslaVideo.currentTime) ? teslaVideo.currentTime : 0;
  teslaTime.textContent = `${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}`;
  teslaProgress.value = String(duration > 0 ? (currentTime / duration) * 100 : 0);
}

function updateTeslaPlaybackState(showControl = false) {
  if (!teslaVideo || !teslaCenterPlayButton) return;
  teslaCenterPlayButton.classList.toggle("is-playing", !teslaVideo.paused);
  teslaCenterPlayButton.setAttribute("aria-label", teslaVideo.paused ? "Play video" : "Pause video");
  if (teslaVideo.paused || showControl) {
    teslaCenterPlayButton.classList.add("is-visible");
    window.clearTimeout(teslaCenterButtonTimer);
    if (!teslaVideo.paused) {
      teslaCenterButtonTimer = window.setTimeout(() => {
        teslaCenterPlayButton.classList.remove("is-visible");
      }, 1100);
    }
  } else {
    teslaCenterPlayButton.classList.remove("is-visible");
  }
}

function updateTeslaMuteState() {
  if (!teslaVideo || !teslaUnmutePill || !teslaVolumeButton) return;
  teslaUnmutePill.hidden = !teslaVideo.muted;
  teslaVolumeButton.classList.toggle("is-muted", teslaVideo.muted);
  teslaVolumeButton.setAttribute("aria-label", teslaVideo.muted ? "Unmute video" : "Mute video");
}

function playTeslaVideo() {
  if (!teslaVideo) return;
  const playRequest = teslaVideo.play();
  if (playRequest) {
    playRequest.catch((error) => {
      console.warn("The robotics showcase video could not start.", error);
      if (teslaVideoStatus) {
        teslaVideoStatus.textContent = "Tap the video controls to start the classroom showcase.";
        teslaVideoStatus.hidden = false;
      }
    });
  }
}

function tryTeslaVideoFallback() {
  if (!teslaVideo || teslaFallbackAttempted) return false;
  const configuredStream = window.GET_ROBOTICS_LIVE_STREAM_URL;
  const classroomVideo = document.querySelector('.video-card[data-video-src]:not([data-video-src=""])');
  const fallbackStream = typeof configuredStream === "string" && configuredStream.trim()
    ? configuredStream.trim()
    : classroomVideo?.dataset.videoSrc;
  if (!fallbackStream) return false;

  let streamUrl;
  try {
    streamUrl = new URL(fallbackStream, window.location.href);
  } catch (error) {
    console.error("The configured robotics video fallback URL is invalid.", error);
    if (teslaVideoStatus) {
      teslaVideoStatus.textContent = "The live classroom stream URL is invalid.";
      teslaVideoStatus.hidden = false;
    }
    return false;
  }
  if (!["http:", "https:"].includes(streamUrl.protocol)) {
    console.error("The configured robotics video fallback must use HTTP or HTTPS.");
    if (teslaVideoStatus) {
      teslaVideoStatus.textContent = "The live classroom stream URL is invalid.";
      teslaVideoStatus.hidden = false;
    }
    return false;
  }

  teslaFallbackAttempted = true;
  if (teslaVideoStatus) {
    teslaVideoStatus.textContent = "Connecting to the live classroom stream.";
    teslaVideoStatus.hidden = false;
  }
  teslaVideo.src = streamUrl.href;
  teslaVideo.load();
  playTeslaVideo();
  return true;
}

teslaVideo?.addEventListener("loadedmetadata", updateTeslaVideoControls);
teslaVideo?.addEventListener("timeupdate", updateTeslaVideoControls);
teslaVideo?.addEventListener("play", () => {
  if (teslaVideoStatus) teslaVideoStatus.hidden = true;
  updateTeslaPlaybackState();
});
teslaVideo?.addEventListener("pause", () => updateTeslaPlaybackState(true));
teslaVideo?.addEventListener("volumechange", updateTeslaMuteState);
teslaVideo?.addEventListener("error", () => {
  if (tryTeslaVideoFallback()) return;
  if (!teslaFallbackAttempted) {
    if (teslaVideoStatus) {
      teslaVideoStatus.textContent = "The local showcase video is missing and no live classroom stream is configured.";
      teslaVideoStatus.hidden = false;
    }
    console.error("No live robotics video stream is configured as a showcase fallback.");
    return;
  }
  if (teslaVideoStatus) {
    teslaVideoStatus.textContent = "The classroom showcase video is unavailable right now.";
    teslaVideoStatus.hidden = false;
  }
  console.error("The robotics showcase video could not be loaded.");
});

teslaStage?.addEventListener("click", (event) => {
  if (event.target.closest(".tesla-video-controls, #tesla-center-play-btn, #tesla-unmute-pill")) return;
  if (!teslaVideo) return;
  if (teslaVideo.muted) {
    teslaVideo.muted = false;
    if (teslaVideo.paused) playTeslaVideo();
  } else if (teslaVideo.paused) {
    playTeslaVideo();
  } else {
    teslaVideo.pause();
  }
  updateTeslaMuteState();
  updateTeslaPlaybackState(true);
});

teslaUnmutePill?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!teslaVideo) return;
  teslaVideo.muted = false;
  updateTeslaMuteState();
  if (teslaVideo.paused) playTeslaVideo();
  updateTeslaPlaybackState(true);
});

teslaCenterPlayButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!teslaVideo) return;
  if (teslaVideo.paused) playTeslaVideo();
  else teslaVideo.pause();
  updateTeslaPlaybackState(true);
});

teslaVolumeButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!teslaVideo) return;
  teslaVideo.muted = !teslaVideo.muted;
  updateTeslaMuteState();
});

teslaProgress?.addEventListener("input", () => {
  if (!teslaVideo || !Number.isFinite(teslaVideo.duration)) return;
  teslaVideo.currentTime = (Number(teslaProgress.value) / 100) * teslaVideo.duration;
  updateTeslaVideoControls();
});

teslaFullscreenButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!teslaStage || !teslaVideo) return;
  const requestFullscreen = teslaStage.requestFullscreen
    ? teslaStage.requestFullscreen()
    : teslaVideo.webkitEnterFullscreen?.();
  if (requestFullscreen?.catch) {
    requestFullscreen.catch((error) => {
      console.warn("Fullscreen playback is unavailable.", error);
    });
  }
});

updateTeslaMuteState();
updateTeslaVideoControls();
if (teslaVideo) {
  playTeslaVideo();
}

document.querySelectorAll(".rev-newsletter-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.parentElement?.querySelector(".newsletter-status");
    if (status) {
      status.textContent = "Newsletter subscriptions are not available yet. Please contact Get Robotics.";
    }
    console.error("Newsletter submission is unavailable because no subscription service is configured.");
  });
});

document.querySelectorAll(".floating-scroll-top").forEach((button) => {
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
});

function setupMobileFooterAccordions() {
  const media = window.matchMedia("(max-width: 768px)");
  const accordions = [];
  document.querySelectorAll(".rev-footer-column:not(:first-child)").forEach((column) => {
    const heading = column.querySelector(":scope > h2");
    if (!heading) return;
    const details = document.createElement("details");
    details.className = "rev-footer-accordion";
    details.open = !media.matches;
    const summary = document.createElement("summary");
    summary.textContent = heading.textContent;
    const content = document.createElement("div");
    content.className = "rev-footer-accordion-content";
    while (heading.nextSibling) content.append(heading.nextSibling);
    details.append(summary, content);
    column.replaceChildren(details);
    accordions.push(details);
  });
  const updateAccordionState = (event) => {
    accordions.forEach((accordion) => {
      accordion.open = !event.matches;
    });
  };
  media.addEventListener?.("change", updateAccordionState);
}

setupMobileFooterAccordions();

const cartDrawer = document.querySelector("#cart-drawer-modal");
const wishlistDrawer = document.querySelector("#wishlist-drawer");
const storePanelOverlay = document.querySelector("#store-panel-overlay");
const cartItemsContainer = document.querySelector("#cart-items");
const fullCartItemsContainer = document.querySelector("#full-cart-items-list");
const wishlistItemsContainer = document.querySelector("#wishlist-items");
const cartWishlistItemsContainer = document.querySelector("#cart-wishlist-items");
const cartWishlistCount = document.querySelector("#cart-wishlist-count");
const cartSubtotal = document.querySelector("#cart-subtotal-value");
const whatsappCheckoutButton = document.querySelector("#whatsapp-checkout-btn");
const checkoutNowButton = document.querySelector("#checkout-now-btn");
const cartModalCount = document.querySelector("#cart-modal-count");
const cartOrderNote = document.querySelector("#cart-order-note");
const cartRecommendationContent = document.querySelector("#cart-recommendation-content");
const fullCartRecommendationContent = document.querySelector("#full-cart-recommendations");
const fullCartCount = document.querySelector("#full-cart-count");
const fullCartSubtotal = document.querySelector("#full-cart-subtotal");
const fullCartSidebarSubtotal = document.querySelector("#full-cart-sidebar-subtotal");
const fullCartCheckoutButtons = Array.from(document.querySelectorAll("[data-open-checkout-modal]"));
const fullCartWhatsAppButton = document.querySelector("#btn-order-whatsapp");
const checkoutModal = document.querySelector("#secure-checkout-modal");
const productById = new Map(products.map((product) => [product.id, product]));
const secureCheckoutForm = document.querySelector("#secure-checkout-form");
const secureCheckoutTotal = document.querySelector("#secure-checkout-total");
const secureCheckoutStatus = document.querySelector("#secure-checkout-status");
const paySelarButton = document.querySelector("#btn-pay-selar");
const payWhatsAppButton = document.querySelector("#btn-pay-whatsapp");
const MAX_ITEM_QUANTITY = 99;
const cartRecommendationIds = ["GET-12-0401", "GET-13-0901", "GET-14-0801", "GET-11-2828"];
let cartRecommendationIndex = 0;

function readStoredList(key) {
  try {
    const savedValue = window.localStorage.getItem(key);
    if (!savedValue) return [];
    const parsedValue = JSON.parse(savedValue);
    if (!Array.isArray(parsedValue)) {
      console.error(`Stored ${key} data must be an array.`);
      return [];
    }
    return parsedValue;
  } catch (error) {
    console.error(`Unable to read ${key} from local storage.`, error);
    return [];
  }
}

let cart = readStoredList("getRoboticsCart")
  .filter((entry) => entry && typeof entry.id === "string" && productById.has(entry.id)
    && Number.isInteger(Number(entry.quantity ?? entry.qty)) && Number(entry.quantity ?? entry.qty) > 0)
  .map((entry) => {
    const product = productById.get(entry.id);
    return {
      id: entry.id,
      quantity: Math.min(MAX_ITEM_QUANTITY, Number(entry.quantity ?? entry.qty)),
      price: product.price,
      selarUrl: product.selarUrl || "",
    };
  });
let wishlist = readStoredList("getRoboticsWishlist")
  .filter((id) => typeof id === "string" && productById.has(id));
let lastStoreTrigger = null;
function getVerifiedProductRecord(productId) {
  const record = productById.get(productId);
  if (!record || !Number.isFinite(record.price) || record.price < 0) {
    throw new Error(`The verified catalog record for product ${productId} is unavailable.`);
  }
  return record;
}

function verifyCartPrices() {
  let changed = false;
  cart = cart.map((item) => {
    const product = getVerifiedProductRecord(item.id);
    const quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    if (item.price !== product.price || item.selarUrl !== (product.selarUrl || "") || item.quantity !== quantity) changed = true;
    return { id: product.id, quantity, price: product.price, selarUrl: product.selarUrl || "" };
  });
  if (changed) saveStoreState();
  return cart;
}

function getVerifiedCartLines() {
  return verifyCartPrices().map((item) => {
    const product = getVerifiedProductRecord(item.id);
    return {
      id: product.id,
      sku: product.sku,
      title: product.title,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
      selarUrl: product.selarUrl || "",
    };
  });
}

function getVerifiedCartTotal(lines = getVerifiedCartLines()) {
  return lines.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

renderProducts();

function saveStoreState() {
  try {
    window.localStorage.setItem("getRoboticsCart", JSON.stringify(cart));
    window.localStorage.setItem("getRoboticsWishlist", JSON.stringify(wishlist));
  } catch (error) {
    console.error("Unable to save the cart or wish list.", error);
  }
}

function updateStoreCounts() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const cartBadge = document.querySelector("#cart-count-badge");
  const mobileCartBadge = document.querySelector("#mobile-cart-count-badge");
  const wishlistBadge = document.querySelector("#wishlist-count-badge");
  if (cartModalCount) cartModalCount.textContent = String(cartCount);

  if (cartBadge) cartBadge.textContent = String(cartCount);
  if (mobileCartBadge) mobileCartBadge.textContent = String(cartCount);
  if (fullCartCount) {
    fullCartCount.textContent = `Cart (${cartCount} ${cartCount === 1 ? "item" : "items"})`;
  }
  document.querySelectorAll(".mobile-bottom-cart-badge").forEach((badge) => {
    badge.textContent = String(cartCount);
    badge.hidden = cartCount === 0;
  });
  if (wishlistBadge) wishlistBadge.textContent = String(wishlistCount);
}

function toggleWishlist(productId, button) {
  const previousStoreState = JSON.stringify({ cart, wishlist });
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter((id) => id !== productId);
  } else {
    wishlist.push(productId);
  }
  if (button) button.setAttribute("aria-pressed", String(wishlist.includes(productId)));
  productGrid?.querySelectorAll(".btn-wishlist-toggle").forEach((wishlistButton) => {
    const id = wishlistButton.closest(".rev-product-card")?.dataset.productId;
    const isSaved = Boolean(id && wishlist.includes(id));
    const product = id ? productById.get(id) : null;
    wishlistButton.setAttribute("aria-pressed", String(isSaved));
    if (product) {
      wishlistButton.setAttribute("aria-label", `${isSaved ? "Remove" : "Add"} ${product.title} ${isSaved ? "from" : "to"} wish list`);
    }
  });
  saveStoreState();
  updateStoreCounts();
  renderStorePanels();
  if (previousStoreState !== JSON.stringify({ cart, wishlist })) {
    syncCartToFirestore().catch((error) => {
      console.error("Unable to remove unavailable products from the signed-in user's saved cart.", error);
    });
  }
}

let applyingRemoteStoreState = false;
let profileSyncReady = false;
let unsubscribeUserProfile = null;

function syncCartToFirestore() {
  const user = activeAuthUser || auth?.currentUser;
  if (!user || !db || !profileSyncReady || applyingRemoteStoreState) return Promise.resolve(false);
  return setDoc(doc(db, "users", user.uid), {
    cart,
    wishlist,
    updatedAt: serverTimestamp(),
  }, { merge: true }).then(() => true);
}

function addProductToCart(productId, quantity, trigger) {
  const product = getVerifiedProductRecord(productId);
  const amount = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(quantity) || 1)));
  if (!product || product.inStock === false) return;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity = Math.min(MAX_ITEM_QUANTITY, existingItem.quantity + amount);
    existingItem.price = product.price;
    existingItem.selarUrl = product.selarUrl || "";
  } else {
    cart.push({ id: productId, quantity: amount, price: product.price, selarUrl: product.selarUrl || "" });
  }
  saveStoreState();
  updateStoreCounts();
  renderStorePanels();
  syncCartToFirestore().catch((error) => {
    console.error("Unable to sync the shopping cart to Firestore.", error);
  });
  showStoreToast("Added to Cart!");
}

function createStoreItem(product, quantity, options = {}) {
  const row = document.createElement("div");
  row.className = "store-drawer-item";

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.title;

  const info = document.createElement("div");
  info.className = "store-drawer-item-copy";
  const title = document.createElement("strong");
  title.textContent = product.title;
  const sku = document.createElement("small");
  sku.className = "store-drawer-item-sku";
  sku.textContent = `SKU: ${product.sku}`;
  const price = document.createElement("small");
  price.className = "store-drawer-item-price";
  price.textContent = formatNaira(product.price);
  info.append(title, sku, price);

  if (options.cartItem) {
    const controls = document.createElement("div");
    controls.className = "store-drawer-item-controls";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.setAttribute("aria-label", `Decrease ${product.title} quantity`);
    minus.textContent = "−";
    minus.addEventListener("click", () => changeCartQuantity(product.id, -1));
    const count = document.createElement("span");
    count.textContent = String(quantity);
    const plus = document.createElement("button");
    plus.type = "button";
    plus.setAttribute("aria-label", `Increase ${product.title} quantity`);
    plus.textContent = "+";
    plus.addEventListener("click", () => changeCartQuantity(product.id, 1));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-cart-item";
    remove.setAttribute("aria-label", `Remove ${product.title} from cart`);
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    remove.addEventListener("click", () => removeCartItem(product.id));
    controls.append(minus, count, plus, remove);
    info.append(controls);
  } else {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = "Remove";
    action.setAttribute("aria-label", `Remove ${product.title} from wish list`);
    action.addEventListener("click", () => toggleWishlist(product.id));
    info.append(action);
  }
  row.append(image, info);
  return row;
}

let storeToastTimer;
function showStoreToast(message, actionLabel = "View Cart", actionHref = "cart.html") {
  let toast = document.querySelector("#store-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "store-toast";
    toast.className = "store-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }

  const messageText = document.createElement("span");
  messageText.textContent = message;
  const viewCartLink = document.createElement("a");
  viewCartLink.href = actionHref;
  viewCartLink.className = "store-toast-link";
  viewCartLink.append(document.createTextNode(actionLabel));
  viewCartLink.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  toast.replaceChildren(messageText, viewCartLink);
  toast.classList.add("is-visible");
  window.clearTimeout(storeToastTimer);
  storeToastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 5000);
}

function renderCartRecommendation() {
  if (!cartRecommendationContent) return;
  const recommendations = cartRecommendationIds.map((id) => productById.get(id))
    .filter((product) => product && !cart.some((item) => item.id === product.id));
  if (!recommendations.length) {
    cartRecommendationContent.replaceChildren();
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-recommendation-empty";
    emptyMessage.textContent = "You are all set with these recommended parts.";
    cartRecommendationContent.append(emptyMessage);
    return;
  }

  cartRecommendationIndex %= recommendations.length;
  const product = recommendations[cartRecommendationIndex];
  cartRecommendationContent.replaceChildren(
    buildProductCard(product, "rev-product-card cart-upsell-card"),
  );
}

function renderFullCartRecommendations() {
  if (!fullCartRecommendationContent) return;
  const recommendations = cartRecommendationIds.map((id) => productById.get(id))
    .filter((product) => product && !cart.some((item) => item.id === product.id));
  fullCartRecommendationContent.replaceChildren();
  if (!recommendations.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-recommendation-empty";
    emptyMessage.textContent = "You are all set with these recommended parts.";
    fullCartRecommendationContent.append(emptyMessage);
    return;
  }
  fullCartRecommendationContent.append(...recommendations.map((product) => (
    buildProductCard(product, "rev-product-card cart-upsell-card")
  )));
}

document.querySelector("#cart-recommendation-prev")?.addEventListener("click", () => {
  const recommendations = cartRecommendationIds
    .map((id) => productById.get(id))
    .filter((product) => product && !cart.some((item) => item.id === product.id));
  cartRecommendationIndex = (cartRecommendationIndex + recommendations.length - 1) % (recommendations.length || 1);
  renderCartRecommendation();
});
document.querySelector("#cart-recommendation-next")?.addEventListener("click", () => {
  const recommendations = cartRecommendationIds
    .map((id) => productById.get(id))
    .filter((product) => product && !cart.some((item) => item.id === product.id));
  cartRecommendationIndex = (cartRecommendationIndex + 1) % (recommendations.length || 1);
  renderCartRecommendation();
});

document.querySelector("#cart-note-toggle")?.addEventListener("click", () => {
  if (!cartOrderNote) return;
  cartOrderNote.hidden = !cartOrderNote.hidden;
  if (!cartOrderNote.hidden) cartOrderNote.focus();
});
cartOrderNote?.addEventListener("input", renderStorePanels);

function changeCartQuantity(productId, amount) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, item.quantity + amount));
  saveStoreState();
  updateStoreCounts();
  renderStorePanels();
  syncCartToFirestore().catch((error) => {
    console.error("Unable to sync the shopping cart to Firestore.", error);
  });
}

function setCartQuantity(productId, quantity) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(quantity) || 1)));
  saveStoreState();
  updateStoreCounts();
  renderStorePanels();
  syncCartToFirestore().catch((error) => {
    console.error("Unable to sync the shopping cart to Firestore.", error);
  });
}

function removeCartItem(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveStoreState();
  updateStoreCounts();
  renderStorePanels();
  syncCartToFirestore().catch((error) => {
    console.error("Unable to sync the shopping cart to Firestore.", error);
  });
}

function createFullCartItem(product, quantity) {
  const item = document.createElement("article");
  item.className = "full-cart-item";
  item.dataset.productId = product.id;

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.title;
  image.loading = "lazy";

  const details = document.createElement("div");
  details.className = "full-cart-item-details";
  const title = document.createElement("h3");
  title.textContent = product.title;
  const sku = document.createElement("p");
  sku.textContent = `SKU: ${product.sku}`;
  const unitPrice = document.createElement("strong");
  unitPrice.className = "full-cart-unit-price";
  unitPrice.textContent = formatNaira(product.price);
  const stock = document.createElement("span");
  stock.className = "full-cart-stock";
  stock.textContent = product.inStock === false ? "Out of Stock" : "In Stock";
  details.append(title, sku, unitPrice, stock);

  const actions = document.createElement("div");
  actions.className = "full-cart-item-actions cart-item-actions-row";
  const itemLinks = document.createElement("div");
  itemLinks.className = "full-cart-item-links";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn-remove-cart-item";
  remove.setAttribute("aria-label", `Remove ${product.title} from cart`);
  remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Remove</span>';
  remove.addEventListener("click", () => removeCartItem(product.id));

  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn-move-to-wishlist";
  save.setAttribute("aria-label", `Save ${product.title} to wish list`);
  save.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 8.8c0 4.3-8.5 10-8.5 10s-8.5-5.7-8.5-10a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span>Save to Wish List</span>';
  save.addEventListener("click", () => {
    if (!wishlist.includes(product.id)) wishlist.push(product.id);
    saveStoreState();
    updateStoreCounts();
    renderStorePanels();
    syncCartToFirestore().catch((error) => {
      console.error("Unable to sync the wish list to Firestore.", error);
    });
    showStoreToast("Saved to Wish List!", "View Cart");
  });
  itemLinks.append(remove, save);

  const stepper = document.createElement("div");
  stepper.className = "full-cart-qty-stepper cart-qty-stepper rev-qty-stepper";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "qty-minus";
  minus.setAttribute("aria-label", `Decrease ${product.title} quantity`);
  minus.textContent = "−";
  minus.addEventListener("click", () => setCartQuantity(product.id, quantity - 1));
  const count = document.createElement("input");
  count.className = "qty-input";
  count.type = "number";
  count.min = "1";
  count.max = String(MAX_ITEM_QUANTITY);
  count.step = "1";
  count.inputMode = "numeric";
  count.value = String(quantity);
  count.setAttribute("aria-label", `${product.title} quantity`);
  count.addEventListener("change", () => setCartQuantity(product.id, count.value));
  count.addEventListener("blur", () => setCartQuantity(product.id, count.value));
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "qty-plus";
  plus.setAttribute("aria-label", `Increase ${product.title} quantity`);
  plus.textContent = "+";
  plus.addEventListener("click", () => setCartQuantity(product.id, quantity + 1));
  stepper.append(minus, count, plus);
  actions.append(itemLinks, stepper);

  item.append(image, details, actions);
  return item;
}

function createCartWishlistItem(product) {
  const card = document.createElement("article");
  card.className = "cart-wishlist-card";
  card.dataset.productId = product.id;

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.title;
  image.loading = "lazy";

  const title = document.createElement("h3");
  title.textContent = product.title;
  const sku = document.createElement("p");
  sku.className = "cart-wishlist-sku";
  sku.textContent = `SKU: ${product.sku}`;
  const price = document.createElement("strong");
  price.className = "cart-wishlist-price";
  price.textContent = formatNaira(product.price);

  const moveButton = document.createElement("button");
  moveButton.type = "button";
  moveButton.className = "cart-wishlist-move";
  moveButton.textContent = "Move to Cart";
  moveButton.disabled = product.inStock === false;
  moveButton.addEventListener("click", () => {
    if (product.inStock === false) return;
    const previousStoreState = JSON.stringify({ cart, wishlist });
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ id: product.id, quantity: 1 });
    wishlist = wishlist.filter((id) => id !== product.id);
    saveStoreState();
    updateStoreCounts();
    renderStorePanels();
    if (previousStoreState !== JSON.stringify({ cart, wishlist })) {
      syncCartToFirestore().catch((error) => {
        console.error("Unable to sync the cart and wish list to Firestore.", error);
      });
    }
    showStoreToast("Moved to Cart!", "View Cart");
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "cart-wishlist-remove";
  removeButton.textContent = "Remove";
  removeButton.setAttribute("aria-label", `Remove ${product.title} from wish list`);
  removeButton.addEventListener("click", () => {
    wishlist = wishlist.filter((id) => id !== product.id);
    saveStoreState();
    updateStoreCounts();
    renderStorePanels();
    syncCartToFirestore().catch((error) => {
      console.error("Unable to sync the wish list to Firestore.", error);
    });
  });

  card.append(image, title, sku, price, moveButton, removeButton);
  return card;
}

function renderStorePanels() {
  const verifiedLines = getVerifiedCartLines();
  if (cartItemsContainer) {
    cartItemsContainer.replaceChildren();
    if (cart.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "store-drawer-empty";
      emptyMessage.textContent = "Your shopping cart is empty.";
      cartItemsContainer.append(emptyMessage);
    } else {
      cart.forEach((item) => {
        const product = productById.get(item.id);
        if (!product) return;
        cartItemsContainer.append(createStoreItem(product, item.quantity, { cartItem: true }));
      });
    }
  }

  const subtotal = getVerifiedCartTotal(verifiedLines);
  if (cartSubtotal) cartSubtotal.textContent = formatNaira(subtotal);
  if (fullCartSubtotal) fullCartSubtotal.textContent = formatNaira(subtotal);
  if (fullCartSidebarSubtotal) fullCartSidebarSubtotal.textContent = formatNaira(subtotal);
  if (fullCartItemsContainer) {
    fullCartItemsContainer.replaceChildren();
    if (cart.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "full-cart-empty";
      emptyMessage.textContent = "Your shopping cart is empty.";
      fullCartItemsContainer.append(emptyMessage);
    } else {
      verifiedLines.forEach((item) => {
        const product = getVerifiedProductRecord(item.id);
        fullCartItemsContainer.append(createFullCartItem(product, item.quantity));
      });
    }
  }
  const receipt = [
    "Hello Get Robotics, I would like to place this order:",
    ...verifiedLines.map((item) => `${item.sku} - ${item.title} x ${item.quantity} = ${formatNaira(item.lineTotal)}`),
    ...(cartOrderNote?.value.trim() ? [`Order note: ${cartOrderNote.value.trim()}`] : []),
    `Total: ${formatNaira(subtotal)}`,
  ].join("\n");
  [checkoutNowButton, whatsappCheckoutButton].filter(Boolean).forEach((checkoutLink) => {
    checkoutLink.href = buildWhatsAppLink(receipt);
    checkoutLink.setAttribute("aria-disabled", String(cart.length === 0));
  });
  if (fullCartWhatsAppButton) {
    fullCartWhatsAppButton.href = buildWhatsAppLink(receipt);
    fullCartWhatsAppButton.setAttribute("aria-disabled", String(cart.length === 0));
  }
  fullCartCheckoutButtons.forEach((button) => {
    if (button !== fullCartWhatsAppButton && button.dataset.checkoutLabel) {
      button.textContent = `${button.dataset.checkoutLabel} (${formatNaira(subtotal)})`;
    }
    button.disabled = verifiedLines.length === 0;
  });
  if (secureCheckoutTotal) secureCheckoutTotal.textContent = formatNaira(subtotal);
  renderCartRecommendation();
  renderFullCartRecommendations();

  if (wishlistItemsContainer) {
    wishlistItemsContainer.replaceChildren();
    if (wishlist.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "store-drawer-empty";
      emptyMessage.textContent = "Your wish list is empty.";
      wishlistItemsContainer.append(emptyMessage);
    } else {
      wishlist.forEach((id) => {
        const product = productById.get(id);
        if (!product) return;
        wishlistItemsContainer.append(createStoreItem(product, 0));
      });
    }
  }
  if (cartWishlistCount) cartWishlistCount.textContent = String(wishlist.length);
  if (cartWishlistItemsContainer) {
    cartWishlistItemsContainer.replaceChildren();
    if (wishlist.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "cart-wishlist-empty";
      emptyMessage.textContent = "Your wish list is empty. Save products from the shop to keep them here.";
      cartWishlistItemsContainer.append(emptyMessage);
    } else {
      wishlist.forEach((id) => {
        const product = productById.get(id);
        if (product) cartWishlistItemsContainer.append(createCartWishlistItem(product));
      });
    }
  }
}

whatsappCheckoutButton?.addEventListener("click", (event) => {
  if (cart.length === 0) {
    event.preventDefault();
    window.alert("Your shopping cart is empty.");
  }
});
fullCartWhatsAppButton?.addEventListener("click", (event) => {
  if (cart.length === 0) {
    event.preventDefault();
    window.alert("Your shopping cart is empty.");
  }
});
checkoutNowButton?.addEventListener("click", (event) => {
  if (cart.length === 0) {
    event.preventDefault();
    window.alert("Your shopping cart is empty.");
  }
});

function setCheckoutModalOpen(isOpen) {
  if (!checkoutModal) return;
  checkoutModal.hidden = !isOpen;
  checkoutModal.classList.toggle("is-open", isOpen);
  checkoutModal.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("checkout-modal-open", isOpen);
  if (isOpen) {
    const lines = getVerifiedCartLines();
    if (secureCheckoutTotal) secureCheckoutTotal.textContent = formatNaira(getVerifiedCartTotal(lines));
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = "";
    checkoutModal.querySelector("[data-close-checkout-modal]")?.focus();
  }
}

fullCartCheckoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (cart.length === 0) {
      window.alert("Your shopping cart is empty.");
      return;
    }
    setCheckoutModalOpen(true);
  });
});
document.querySelectorAll("[data-close-checkout-modal]").forEach((button) => {
  button.addEventListener("click", () => setCheckoutModalOpen(false));
});
checkoutModal?.addEventListener("click", (event) => {
  if (event.target === checkoutModal) setCheckoutModalOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkoutModal?.classList.contains("is-open")) {
    setCheckoutModalOpen(false);
  }
});

function createOrderId() {
  const token = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
    : Math.random().toString(36).slice(2, 14).toUpperCase();
  return `GET-ORD-${Date.now().toString(36).toUpperCase()}-${token}`;
}

async function completeSecureCheckout(method) {
  if (!secureCheckoutForm || !secureCheckoutForm.reportValidity()) return;
  const lines = getVerifiedCartLines();
  if (!lines.length) {
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = "Your shopping cart is empty.";
    return;
  }
  if (lines.length > 10) {
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = "For secure checkout, place no more than 10 different products in one order.";
    return;
  }
  if (!db || !doc || !setDoc || !serverTimestamp) {
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = "Secure order saving is unavailable. Please try again later.";
    return;
  }

  const values = new FormData(secureCheckoutForm);
  const orderId = createOrderId();
  const total = getVerifiedCartTotal(lines);
  const customer = {
    name: String(values.get("customerName") || "").trim(),
    phone: String(values.get("customerPhone") || "").trim(),
    address: String(values.get("deliveryAddress") || "").trim(),
  };
  const orderItems = lines.map(({ id, sku, title, quantity, unitPrice, selarUrl }) => ({
    id,
    sku,
    title,
    quantity,
    unitPrice,
    selarUrl,
  }));
  const receipt = [
    `Hello Get Robotics, I have placed order ${orderId}.`,
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery address: ${customer.address}`,
    ...lines.map((item) => `${item.sku} - ${item.title} x ${item.quantity} @ ${formatNaira(item.unitPrice)} = ${formatNaira(item.lineTotal)}`),
    `Verified order total: ${formatNaira(total)}`,
  ].join("\n");
  const selarTarget = method === "selar"
    ? lines.length === 1 && lines[0].selarUrl
      ? lines[0].selarUrl
      : officialSelarStoreUrl
    : "";
  if (selarTarget && !isValidSelarUrl(selarTarget)) {
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = "The official Selar checkout URL is not configured correctly.";
    return;
  }

  const whatsappWindow = window.open("about:blank", "_blank");
  const selarWindow = method === "selar" ? window.open("about:blank", "_blank") : null;
  if (secureCheckoutStatus) secureCheckoutStatus.textContent = "Saving your verified order...";
  [paySelarButton, payWhatsAppButton].filter(Boolean).forEach((button) => { button.disabled = true; });
  try {
    await setDoc(doc(db, "getrobotics_orders", orderId), {
      orderId,
      customer,
      items: orderItems,
      total,
      currency: "NGN",
      status: "pending",
      createdAt: serverTimestamp(),
    });

    if (method === "whatsapp") {
      if (whatsappWindow) {
        whatsappWindow.location.href = `https://wa.me/2349030221179?text=${encodeURIComponent(receipt)}`;
      } else {
        window.location.href = `https://wa.me/2349030221179?text=${encodeURIComponent(receipt)}`;
      }
      if (secureCheckoutStatus) secureCheckoutStatus.textContent = `Order ${orderId} saved. Complete your order in WhatsApp.`;
      return;
    }

    if (lines.length > 1) {
      const verifiedInvoice = `${receipt}\nPlease match payment to order ${orderId}.`;
      if (whatsappWindow) {
        whatsappWindow.location.href = `https://wa.me/2349030221179?text=${encodeURIComponent(verifiedInvoice)}`;
      } else {
        window.open(`https://wa.me/2349030221179?text=${encodeURIComponent(verifiedInvoice)}`, "_blank", "noopener,noreferrer");
      }
    } else {
      whatsappWindow?.close();
    }
    if (selarWindow) {
      selarWindow.location.href = selarTarget;
    } else {
      window.location.href = selarTarget;
    }
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = `Order ${orderId} saved. Continue with Selar to pay.`;
  } catch (error) {
    whatsappWindow?.close();
    selarWindow?.close();
    console.error("Unable to save the verified secure order.", error);
    if (secureCheckoutStatus) secureCheckoutStatus.textContent = `Order could not be saved: ${error.message}`;
  } finally {
    [paySelarButton, payWhatsAppButton].filter(Boolean).forEach((button) => { button.disabled = false; });
  }
}

function isValidSelarUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && (parsed.hostname === "selar.com" || parsed.hostname.endsWith(".selar.com"));
  } catch (error) {
    if (!(error instanceof TypeError)) console.error("Unable to validate the Selar checkout URL.", error);
    return false;
  }
}

paySelarButton?.addEventListener("click", () => completeSecureCheckout("selar"));
payWhatsAppButton?.addEventListener("click", () => completeSecureCheckout("whatsapp"));

function openStorePanel(panel, trigger) {
  if (!panel || !storePanelOverlay) return;
  if (drawer?.classList.contains("is-open")) setMenuOpen(false);
  closeStorePanels(false);
  lastStoreTrigger = trigger || document.activeElement;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  panel.inert = false;
  storePanelOverlay.classList.add("is-open");
  storePanelOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("store-panel-open");
  panel.querySelector(".store-drawer-close")?.focus();
}

function closeStorePanels(restoreFocus = true) {
  [cartDrawer, wishlistDrawer].forEach((panel) => {
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
  });
  storePanelOverlay?.classList.remove("is-open");
  storePanelOverlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("store-panel-open");
  if (restoreFocus) lastStoreTrigger?.focus();
}

document.querySelector("#header-cart-btn")?.addEventListener("click", (event) => {
  if (event.currentTarget instanceof HTMLAnchorElement && !window.location.pathname.endsWith("/cart.html")) return;
  event.preventDefault();
  if (window.location.pathname.endsWith("/cart.html")) {
    document.querySelector("#main-content")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.assign("cart.html");
});
document.querySelector("#mobile-cart-btn")?.addEventListener("click", (event) => {
  event.preventDefault();
  if (window.location.pathname.endsWith("/cart.html")) {
    document.querySelector("#main-content")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  window.location.assign("cart.html");
});
document.querySelectorAll("[data-open-cart]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (window.location.pathname.endsWith("/cart.html")) {
      document.querySelector("#main-content")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.assign("cart.html");
  });
});
document.querySelectorAll("[data-close-store-panel]").forEach((button) => {
  button.addEventListener("click", () => closeStorePanels());
});
storePanelOverlay?.addEventListener("click", () => closeStorePanels());

document.querySelectorAll(".store-category-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeStoreCategory = tab.dataset.category || "all";
    renderProducts();
  });
});

document.querySelectorAll(".store-sort-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activeStoreSort = button.dataset.sort || "featured";
    document.querySelectorAll(".store-sort-btn").forEach((sortButton) => {
      const isActive = sortButton === button;
      sortButton.classList.toggle("is-active", isActive);
      sortButton.setAttribute("aria-pressed", String(isActive));
    });
    renderProducts();
  });
});

document.querySelector(".video-filter-pills")?.addEventListener("click", (event) => {
  const filterButton = event.target.closest(".video-filter");
  if (!filterButton) return;
  const category = filterButton.dataset.videoFilter;
  document.querySelectorAll(".video-filter").forEach((button) => {
    const isActive = button === filterButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelectorAll(".video-card").forEach((card) => {
    card.hidden = category !== "all" && card.dataset.category !== category;
  });
});

function attachVideoCard(card) {
  const video = card.querySelector("video");
  const soundButton = card.querySelector(".video-sound-button");
  if (!video || !card.dataset.videoSrc) return;
  card.addEventListener("mouseenter", () => startVideoPreview(card));
  card.addEventListener("mouseleave", () => video.pause());
  card.addEventListener("focusin", () => startVideoPreview(card));
  card.addEventListener("focusout", (event) => {
    if (!card.contains(event.relatedTarget)) video.pause();
  });
  soundButton?.addEventListener("click", () => {
    video.muted = !video.muted;
    soundButton.textContent = video.muted ? "Tap for Sound" : "Mute Video";
    startVideoPreview(card);
  });
}

document.querySelectorAll(".video-card").forEach(attachVideoCard);

function startVideoPreview(card) {
  const video = card.querySelector("video");
  const videoSource = card.dataset.videoSrc;
  if (!video || !videoSource) return;

  if (!video.src) {
    video.src = videoSource;
    card.classList.add("has-video");
    const soundButton = card.querySelector(".video-sound-button");
    if (soundButton) soundButton.disabled = false;
  } else {
    card.classList.add("has-video");
  }

  const playRequest = video.play();
  if (playRequest) {
    playRequest.catch((error) => {
      console.warn("The classroom video preview could not start.", error);
    });
  }
}

let videoObserver = null;
if ("IntersectionObserver" in window) {
  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!window.matchMedia("(max-width: 992px)").matches) return;
      const video = entry.target.querySelector("video");
      if (!video) return;
      if (entry.isIntersecting) {
        startVideoPreview(entry.target);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });
}
document.querySelectorAll(".video-card[data-video-src]").forEach((card) => videoObserver?.observe(card));

const instructorPortrait = document.querySelector("#instructor-portrait");
instructorPortrait?.addEventListener("error", () => {
  const fallback = instructorPortrait.dataset.fallback;
  if (fallback && instructorPortrait.getAttribute("src") !== fallback) {
    instructorPortrait.setAttribute("src", fallback);
  }
});

function updateAccountLabel(user) {
  const label = document.querySelector("#header-account-label");
  if (!label) return;
  const fullName = user?.firstName || user?.displayName || user?.name;
  const firstName = typeof fullName === "string" ? fullName.trim().split(/\s+/)[0] : "";
  label.textContent = firstName || "Account";
}

const authAlertBox = document.querySelector("#auth-alert-box");
const loginPanel = document.querySelector("#rev-login-grid");
const registrationPanel = document.querySelector("#rev-register-panel");
const accountDashboard = document.querySelector("#rev-account-dashboard");
const accountDashboardName = document.querySelector("#account-dashboard-name");
const accountDashboardEmail = document.querySelector("#account-dashboard-email");
const savedOrdersContainer = document.querySelector("#account-saved-orders");
const accountWishlistContainer = document.querySelector("#account-wishlist-items");
const adminManager = document.querySelector("#admin-cms-modal");

function showAuthAlert(message, kind = "error") {
  if (!authAlertBox) return;
  authAlertBox.textContent = message;
  authAlertBox.dataset.kind = kind;
  authAlertBox.hidden = false;
}

function clearAuthAlert() {
  if (!authAlertBox) return;
  authAlertBox.textContent = "";
  authAlertBox.hidden = true;
}

function setAuthBusy(button, isBusy, busyText) {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
  button.disabled = isBusy;
}

function getAuthRuntime() {
  if (!auth || !db || !firebaseSdk) {
    throw new Error("Account sign in is unavailable because Firebase Authentication is not configured.");
  }
  return { auth, db };
}

function getAuthErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact Get Robotics for assistance.",
    "auth/user-not-found": "No account was found for this email address.",
    "auth/wrong-password": "The password is incorrect.",
    "auth/invalid-credential": "The email address or password is incorrect.",
    "auth/email-already-in-use": "An account already exists for this email address.",
    "auth/weak-password": "Choose a stronger password with at least eight characters.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before completing sign in.",
    "auth/network-request-failed": "A network error interrupted authentication. Check your connection and try again.",
  };
  return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
}

function showRegistration(showRegistration) {
  if (!registrationPanel || !loginPanel) return;
  clearAuthAlert();
  registrationPanel.hidden = !showRegistration;
  loginPanel.hidden = showRegistration;
  const title = document.querySelector("#auth-page-title");
  if (title) title.textContent = showRegistration ? "Create account" : "Sign in";
  if (showRegistration) {
    window.history.replaceState(null, "", `${window.location.pathname}#register`);
    registrationPanel.querySelector("input")?.focus();
  } else {
    window.history.replaceState(null, "", window.location.pathname);
    document.querySelector("#login-email")?.focus();
  }
}

function renderAccountWishlist() {
  if (!accountWishlistContainer) return;
  accountWishlistContainer.replaceChildren();
  const savedProducts = wishlist.map((id) => productById.get(id)).filter(Boolean);
  if (savedProducts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Your wish list is empty.";
    accountWishlistContainer.append(emptyMessage);
    return;
  }
  savedProducts.forEach((product) => {
    const row = document.createElement("div");
    row.className = "account-wishlist-row";
    row.textContent = `${product.title} - ${formatNaira(product.price)}`;
    accountWishlistContainer.append(row);
  });
}

async function loadAccountOrders(user) {
  if (!savedOrdersContainer) return;
  savedOrdersContainer.replaceChildren();
  if (!db) {
    const message = document.createElement("p");
    message.textContent = "Order history is unavailable because Firestore is not configured.";
    savedOrdersContainer.append(message);
    return;
  }
  try {
    const ordersQuery = query(
      collection(db, "users", user.uid, "orders"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const snapshot = await getDocs(ordersQuery);
    if (snapshot.empty) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "You do not have any saved orders yet.";
      savedOrdersContainer.append(emptyMessage);
      return;
    }
    snapshot.forEach((documentSnapshot) => {
      const order = documentSnapshot.data();
      const row = document.createElement("div");
      row.className = "account-order-row";
      const count = Array.isArray(order.items) ? order.items.reduce((total, item) => total + Number(item.quantity || 0), 0) : 0;
      row.textContent = `${count} item${count === 1 ? "" : "s"} - ${formatNaira(order.subtotal || 0)}`;
      savedOrdersContainer.append(row);
    });
  } catch (error) {
    console.error("Unable to load saved account orders.", error);
    const message = document.createElement("p");
    message.textContent = "Saved orders could not be loaded. Please try again later.";
    savedOrdersContainer.append(message);
  }
}

async function updateAccountDashboard(user) {
  const isAdmin = await updateAdminAccess(user);
  if (!accountDashboard) return;
  if (!user) {
    accountDashboard.hidden = true;
    if (loginPanel) loginPanel.hidden = false;
    if (adminManager) adminManager.hidden = true;
    return;
  }
  accountDashboard.hidden = false;
  if (loginPanel) loginPanel.hidden = true;
  if (registrationPanel) registrationPanel.hidden = true;
  if (accountDashboardName) accountDashboardName.textContent = user.displayName || user.email?.split("@")[0] || "Student";
  if (accountDashboardEmail) accountDashboardEmail.textContent = user.email || "";
  renderAccountWishlist();
  await loadAccountOrders(user);
  if (window.location.hash === "#admin" && isAdmin) openAdminManager();
}

async function updateAdminAccess(user) {
  let authorized = false;
  if (user && isUserAuthorizedAdmin) {
    try {
      authorized = await isUserAuthorizedAdmin(user);
    } catch (error) {
      console.error("Unable to verify administrator access.", error);
    }
  }
  document.querySelectorAll(".admin-access-link, #btn-open-admin-manager").forEach((link) => {
    link.hidden = !authorized;
  });
  return authorized;
}

document.querySelector("#btn-show-register-modal")?.addEventListener("click", () => showRegistration(true));
document.querySelector("#btn-back-to-signin")?.addEventListener("click", () => showRegistration(false));

document.querySelector("#rev-signin-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthAlert();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = document.querySelector("#btn-rev-signin");
  setAuthBusy(button, true, "SIGNING IN...");
  try {
    getAuthRuntime();
    await signInWithEmailAndPassword(
      auth,
      document.querySelector("#login-email").value.trim(),
      document.querySelector("#login-password").value,
    );
  } catch (error) {
    console.error("Get Robotics sign-in failed.", error);
    showAuthAlert(getAuthErrorMessage(error));
  } finally {
    setAuthBusy(button, false);
  }
});

document.querySelector("#rev-register-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthAlert();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const button = document.querySelector("#btn-rev-register");
  setAuthBusy(button, true, "CREATING ACCOUNT...");
  try {
    getAuthRuntime();
    const fullName = String(data.get("name")).trim();
    const email = String(data.get("email")).trim();
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      String(data.get("password")),
    );
    await updateProfile(credential.user, { displayName: fullName });
    await setDoc(doc(db, "users", credential.user.uid), {
      fullName,
      displayName: fullName,
      email,
      phone: String(data.get("phone")).trim(),
      createdAt: serverTimestamp(),
    }, { merge: true });
    showAuthAlert("Your Get Robotics account has been created.", "success");
  } catch (error) {
    console.error("Get Robotics account registration failed.", error);
    showAuthAlert(getAuthErrorMessage(error));
  } finally {
    setAuthBusy(button, false);
  }
});

document.querySelector("#btn-forgot-password")?.addEventListener("click", async () => {
  clearAuthAlert();
  const email = document.querySelector("#login-email")?.value.trim();
  if (!email) {
    showAuthAlert("Enter your email address first, then choose Forgot your password.");
    document.querySelector("#login-email")?.focus();
    return;
  }
  try {
    getAuthRuntime();
    await sendPasswordResetEmail(auth, email);
    showAuthAlert("If an account exists for this email, a password reset email has been sent.", "success");
  } catch (error) {
    console.error("Unable to send a password reset email.", error);
    showAuthAlert(getAuthErrorMessage(error));
  }
});

document.querySelector("#btn-google-auth")?.addEventListener("click", async () => {
  clearAuthAlert();
  try {
    getAuthRuntime();
    const credential = await signInWithPopup(auth, googleProvider);
    const profileRef = doc(db, "users", credential.user.uid);
    const profileSnapshot = await getDoc(profileRef);
    await setDoc(profileRef, {
      fullName: credential.user.displayName || "",
      displayName: credential.user.displayName || "",
      email: credential.user.email || "",
      updatedAt: serverTimestamp(),
      ...(!profileSnapshot.exists() ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
  } catch (error) {
    console.error("Google sign-in failed.", error);
    showAuthAlert(getAuthErrorMessage(error));
  }
});

document.querySelector("#btn-rev-signout")?.addEventListener("click", async () => {
  try {
    getAuthRuntime();
    await signOut(auth);
    activeAuthUser = null;
    updateAccountLabel(null);
    updateAccountDashboard(null);
    showAuthAlert("You have signed out.", "success");
  } catch (error) {
    console.error("Get Robotics sign out failed.", error);
    showAuthAlert(getAuthErrorMessage(error));
  }
});

async function openAdminManager() {
  if (!adminManager) return;
  adminManager.hidden = false;
  if (adminContent) adminContent.hidden = true;
  const user = auth?.currentUser;
  if (!user) {
    setAdminStatus("Sign in with an administrator account to manage this site.", true);
    return;
  }
  if (!(await isUserAuthorizedAdmin?.(user))) {
    setAdminStatus("This account is not authorized to manage this site.", true);
    return;
  }
  if (adminContent) adminContent.hidden = false;
  setAdminStatus("Administrator access verified.");
  adminManager.querySelector("[data-admin-tab]")?.focus();
}

document.querySelector("#btn-open-admin-manager")?.addEventListener("click", openAdminManager);
document.querySelector("#btn-open-admin-modal")?.addEventListener("click", (event) => {
  event.preventDefault();
  openAdminManager();
});
document.querySelector("#btn-close-admin-cms")?.addEventListener("click", () => {
  if (adminManager) adminManager.hidden = true;
  lockAdminTools();
});

if (registrationPanel && window.location.hash === "#register") {
  showRegistration(true);
}

function normalizeFirestoreProduct(documentSnapshot) {
  const data = typeof documentSnapshot.data === "function" ? documentSnapshot.data() : documentSnapshot;
  if (!data || typeof data !== "object") return null;
  const sku = typeof data.sku === "string" && data.sku.trim()
    ? data.sku.trim()
    : documentSnapshot.id;
  const price = typeof data.price === "number"
    ? data.price
    : Number(String(data.price || "").replace(/[^\d.]/g, ""));
  if (!sku || !Number.isFinite(price) || price < 0) return null;
  const categoryValues = Array.isArray(data.categories)
    ? data.categories
    : (typeof data.category === "string" ? [data.category] : []);
  const allowedCategories = new Set([
    "complete-kits",
    "microcontrollers",
    "sensors",
    "motors",
    "prototyping",
    "training",
    "boards",
    "smart-cars",
    "breadboards",
  ]);
  const categories = categoryValues.filter((category) => allowedCategories.has(category));
  const createdAt = data.createdAt?.toDate
    ? data.createdAt.toDate().toISOString()
    : String(data.createdAt || new Date().toISOString());
  return {
    id: sku,
    sku,
    title: typeof data.title === "string" ? data.title : (typeof data.name === "string" ? data.name : ""),
    price,
    selarUrl: typeof data.selarUrl === "string" ? data.selarUrl.trim() : "",
    image: typeof data.image === "string" ? data.image : (typeof data.imageUrl === "string" ? data.imageUrl : ""),
    categories: categories.length ? categories : ["complete-kits"],
    featuredRank: Number.isFinite(data.featuredRank) ? data.featuredRank : 1000,
    salesCount: Number.isFinite(data.salesCount) ? data.salesCount : 0,
    createdAt,
    inStock: data.inStock !== false && data.stockStatus !== "sold-out",
  };
}

function mergeFirestoreProducts(documents) {
  const previousStoreState = JSON.stringify({ cart, wishlist });
  const mergedProducts = new Map(DEFAULT_PRODUCTS.map((product) => [product.id, product]));
  documents.forEach((snapshot) => {
    const product = normalizeFirestoreProduct(snapshot);
    if (!product || !product.title || !product.image) return;
    mergedProducts.set(product.id, product);
  });
  products = [...mergedProducts.values()];
  productById.clear();
  products.forEach((product) => productById.set(product.id, product));
  cart = cart.filter((item) => productById.has(item.id));
  verifyCartPrices();
  wishlist = wishlist.filter((id) => productById.has(id));
  saveStoreState();
  renderProducts();
  updateStoreCounts();
  renderStorePanels();
}

const flyerGrid = document.querySelector("#updates-flyer-grid");
const defaultFlyerCards = flyerGrid
  ? Array.from(flyerGrid.children, (card) => card.cloneNode(true))
  : [];
const videoGrid = document.querySelector(".video-hub-grid");
const defaultVideoCards = videoGrid
  ? Array.from(videoGrid.children, (card) => card.cloneNode(true))
  : [];
let cloudVideos = [];
let cloudUpdates = [];
let cloudProducts = [];

function createFlyerCard(flyer) {
  const grid = document.querySelector("#updates-flyer-grid");
  if (!grid || !flyer?.id || !flyer.title || !flyer.image) return null;
  const card = document.createElement("article");
  card.className = "resource-card";
  card.dataset.firestoreFlyer = flyer.id;
  const preview = document.createElement("button");
  preview.className = "flyer-preview";
  preview.type = "button";
  preview.dataset.image = flyer.image;
  preview.dataset.alt = flyer.title;
  const image = document.createElement("img");
  image.src = flyer.image;
  image.alt = flyer.title;
  image.loading = "lazy";
  preview.append(image);
  const badge = document.createElement("span");
  badge.className = "resource-status-badge";
  badge.textContent = flyer.statusBadge || "GET ROBOTICS UPDATE";
  const title = document.createElement("h3");
  title.textContent = flyer.title;
  const description = document.createElement("p");
  description.textContent = flyer.description || "A new Get Robotics program update.";
  const viewButton = document.createElement("button");
  viewButton.className = "button flyer-lightbox-trigger";
  viewButton.type = "button";
  viewButton.textContent = "VIEW FULL FLYER";
  viewButton.dataset.image = flyer.image;
  viewButton.dataset.alt = flyer.title;
  const enrollLink = document.createElement("a");
  enrollLink.className = "flyer-enroll-link";
  enrollLink.href = buildWhatsAppLink(`Hello Get Robotics, I would like to enroll in ${flyer.title}.`);
  enrollLink.target = "_blank";
  enrollLink.rel = "noopener noreferrer";
  enrollLink.textContent = "Enroll on WhatsApp";
  card.append(preview, badge, title, description, viewButton, enrollLink);
  return card;
}

function renderFlyers() {
  if (!flyerGrid) return;
  flyerGrid.replaceChildren(...defaultFlyerCards.map((card) => card.cloneNode(true)));
  cloudUpdates.forEach((flyer) => {
    const card = createFlyerCard(flyer);
    if (card) flyerGrid.append(card);
  });
}

function createVideoCard(video) {
  if (!video?.id || !video.title || !video.videoUrl || !video.thumbnail) return null;
  const card = document.createElement("article");
  card.className = "video-card";
  card.dataset.category = video.category;
  card.dataset.videoSrc = video.videoUrl;
  card.dataset.firestoreVideo = video.id;
  const media = document.createElement("div");
  media.className = "video-card-media";
  const image = document.createElement("img");
  image.src = video.thumbnail;
  image.alt = video.title;
  image.loading = "lazy";
  const player = document.createElement("video");
  player.muted = true;
  player.loop = true;
  player.playsInline = true;
  player.preload = "none";
  player.setAttribute("aria-label", video.title);
  media.append(image, player);
  const copy = document.createElement("div");
  copy.className = "video-card-copy";
  const title = document.createElement("h3");
  title.textContent = video.title;
  const sound = document.createElement("button");
  sound.className = "video-sound-button";
  sound.type = "button";
  sound.textContent = "Tap for Sound";
  const actions = [title, sound];
  if (video.socialUrl) {
    const social = document.createElement("a");
    social.href = video.socialUrl;
    social.target = "_blank";
    social.rel = "noopener noreferrer";
    social.textContent = "Open Social Video";
    actions.push(social);
  }
  copy.append(...actions);
  card.append(media, copy);
  return card;
}

function renderVideos() {
  if (!videoGrid) return;
  videoGrid.replaceChildren(...defaultVideoCards.map((card) => card.cloneNode(true)));
  videoGrid.querySelectorAll(".video-card").forEach((card) => {
    attachVideoCard(card);
    if (videoObserver && card.dataset.videoSrc) videoObserver.observe(card);
  });
  cloudVideos.forEach((video) => {
    const card = createVideoCard(video);
    if (!card) return;
    const selectedFilter = document.querySelector(".video-filter.is-active")?.dataset.videoFilter || "all";
    card.hidden = selectedFilter !== "all" && card.dataset.category !== selectedFilter;
    videoGrid.append(card);
    attachVideoCard(card);
    if (videoObserver && card.dataset.videoSrc) videoObserver.observe(card);
  });
  if (teslaVideo?.error) tryTeslaVideoFallback();
}

function createHeroUpdate(update) {
  if (!update?.id || !update.title || !update.image) return null;
  const slide = document.createElement("article");
  slide.className = "hero-slide";
  slide.dataset.cloudHero = update.id;
  slide.setAttribute("aria-hidden", "true");
  slide.hidden = true;
  const content = document.createElement("div");
  content.className = "hero-content";
  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = update.statusBadge || "GET ROBOTICS UPDATE";
  const title = document.createElement("h2");
  title.textContent = update.title;
  const description = document.createElement("p");
  description.className = "hero-description";
  description.textContent = update.description || "Explore the latest Get Robotics program.";
  const actions = document.createElement("div");
  actions.className = "hero-actions";
  const enroll = document.createElement("a");
  enroll.className = "button";
  enroll.href = "#booking-section";
  enroll.textContent = "Enquire About This Program";
  actions.append(enroll);
  content.append(eyebrow, title, description, actions);
  const visual = document.createElement("div");
  visual.className = "hero-visual";
  const frame = document.createElement("div");
  frame.className = "hero-image-frame";
  const preview = document.createElement("button");
  preview.className = "media-open";
  preview.type = "button";
  preview.dataset.image = update.image;
  preview.dataset.alt = update.title;
  const image = document.createElement("img");
  image.src = update.image;
  image.alt = update.title;
  image.loading = "lazy";
  preview.append(image);
  frame.append(preview);
  visual.append(frame);
  slide.append(content, visual);
  return slide;
}

function renderHeroUpdates() {
  if (!slider) return;
  slider.querySelectorAll("[data-cloud-hero]").forEach((slide) => slide.remove());
  slider.querySelectorAll("[data-cloud-hero-dot]").forEach((dot) => dot.remove());
  const controls = slider.querySelector(".slider-controls");
  const count = slider.querySelector(".slide-count");
  const totalLabel = count?.lastChild;
  cloudUpdates.filter((update) => update.showInHero).forEach((update) => {
    const slide = createHeroUpdate(update);
    if (!slide) return;
    slider.insertBefore(slide, controls);
    const dot = document.createElement("button");
    dot.className = "slider-dot";
    dot.type = "button";
    dot.dataset.cloudHeroDot = update.id;
    dot.setAttribute("aria-label", `Show slide ${slider.querySelectorAll(".hero-slide").length}`);
    controls?.insertBefore(dot, count);
    dot.addEventListener("click", () => {
      showSlide(Array.from(dots).indexOf(dot));
      startAutoplay();
    });
  });
  slides = Array.from(slider.querySelectorAll(".hero-slide"));
  dots = Array.from(slider.querySelectorAll(".slider-dot"));
  if (totalLabel) totalLabel.textContent = `/ ${String(slides.length).padStart(2, "0")}`;
  dots.forEach((dot, index) => {
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    if (!dot.hasAttribute("data-cloud-hero-dot")) {
      dot.onclick = () => {
        showSlide(index);
        startAutoplay();
      };
    }
  });
  showSlide(Math.min(activeSlide, slides.length - 1));
}

function updateWhatsAppLinks() {
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
    const message = new URL(link.href).searchParams.get("text");
    if (message) link.href = buildWhatsAppLink(message);
  });
}

function applyLiveSettings(settings) {
  if (typeof settings.whatsappNumber === "string") {
    whatsappPhone = settings.whatsappNumber.replace(/\D/g, "");
    updateWhatsAppLinks();
    document.querySelectorAll('.rev-footer-contact[href*="booking-section"]').forEach((link) => {
      if (whatsappPhone) link.href = `https://wa.me/${whatsappPhone}`;
    });
  }
  if (typeof settings.contactEmail === "string" && settings.contactEmail) {
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = `mailto:${settings.contactEmail}`;
      const emailText = link.querySelector("span");
      if (emailText) emailText.textContent = settings.contactEmail;
    });
  }
  if (typeof settings.physicalAddress === "string" && settings.physicalAddress) {
    document.querySelectorAll(".rev-footer-column:first-child > p.rev-footer-contact span").forEach((address) => {
      address.textContent = settings.physicalAddress;
    });
  }
  if (typeof settings.selarStoreUrl === "string" && settings.selarStoreUrl.trim()) {
    if (isValidSelarUrl(settings.selarStoreUrl.trim())) {
      officialSelarStoreUrl = settings.selarStoreUrl.trim();
    } else {
      console.error("Ignoring an invalid official Selar store URL.");
    }
  }
  const socialLinks = [
    ["tiktokUrl", "TikTok"],
    ["youtubeUrl", "YouTube"],
    ["facebookUrl", "Facebook"],
  ];
  socialLinks.forEach(([field, label]) => {
    if (typeof settings[field] !== "string" || !settings[field]) return;
    document.querySelectorAll(`a[aria-label="${label}"]`).forEach((link) => {
      link.href = settings[field];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  });
  if (typeof settings.instructorPortrait === "string" && settings.instructorPortrait) {
    const portrait = document.querySelector("#instructor-portrait");
    if (portrait) {
      portrait.dataset.fallback = "";
      portrait.src = settings.instructorPortrait;
    }
  }
}

function applyShowcaseSettings(settings) {
  const video = document.querySelector("#tesla-main-video");
  if (video && typeof settings.videoUrl === "string" && settings.videoUrl.trim()) {
    const source = video.querySelector("source");
    const url = new URL(settings.videoUrl.trim(), window.location.href).href;
    if (source && source.src !== url) {
      source.src = url;
      video.load();
      playTeslaVideo();
    }
  }
  const headline = document.querySelector("#tesla-video-title");
  if (headline && typeof settings.headline === "string" && settings.headline.trim()) {
    headline.textContent = settings.headline.trim();
  }
  [
    ["#tesla-stat-one-value", settings.statOneValue],
    ["#tesla-stat-one-label", settings.statOneLabel],
    ["#tesla-stat-two-value", settings.statTwoValue],
    ["#tesla-stat-two-label", settings.statTwoLabel],
  ].forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element && typeof value === "string" && value.trim()) element.textContent = value.trim();
  });
}

const adminStatus = document.querySelector("#admin-cms-status");
const adminContent = document.querySelector("#admin-cms-content");
const adminTabButtons = Array.from(document.querySelectorAll("[data-admin-tab]"));
const adminTabPanels = Array.from(document.querySelectorAll("[data-admin-panel]"));
const adminCollections = {
  products: "getrobotics_products",
  videos: "getrobotics_videos",
  updates: "getrobotics_updates",
};
const adminDocuments = { products: [], videos: [], updates: [] };
const adminShowcaseForm = document.querySelector("#admin-showcase-form");
const adminInquiryList = document.querySelector("#admin-inquiries-list");
const adminSettingsForm = document.querySelector("#admin-settings-form");
const adminEmailsList = document.querySelector("#admin-emails-list");
let adminEmails = [];
let adminWorkspaceConnected = false;
let adminUnsubscribers = [];
let currentSiteSettings = {};

function setAdminStatus(message, isError = false) {
  if (!adminStatus) return;
  adminStatus.textContent = message;
  adminStatus.dataset.kind = isError ? "error" : "success";
}

const adminCachePrefix = "getRoboticsAdmin:";

function readAdminCache(key, fallback) {
  try {
    const cached = window.localStorage.getItem(`${adminCachePrefix}${key}`);
    return cached ? JSON.parse(cached) : fallback;
  } catch (error) {
    console.error(`Unable to read the local administrator cache for ${key}.`, error);
    return fallback;
  }
}

function writeAdminCache(key, value) {
  try {
    window.localStorage.setItem(`${adminCachePrefix}${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to write the local administrator cache for ${key}.`, error);
    return false;
  }
}

function saveCachedAdminDocument(type, id, data) {
  const entries = adminDocuments[type];
  const index = entries.findIndex((entry) => entry.id === id);
  const cachedEntry = { id, data };
  if (index < 0) entries.unshift(cachedEntry);
  else entries[index] = cachedEntry;
  const cached = writeAdminCache(`collection:${type}`, entries);
  const listIds = { products: "#admin-products-list", videos: "#admin-videos-list", updates: "#admin-updates-list" };
  renderAdminList(listIds[type], type);
  return cached;
}

function removeCachedAdminDocument(type, id) {
  adminDocuments[type] = adminDocuments[type].filter((entry) => entry.id !== id);
  const cached = writeAdminCache(`collection:${type}`, adminDocuments[type]);
  const listIds = { products: "#admin-products-list", videos: "#admin-videos-list", updates: "#admin-updates-list" };
  renderAdminList(listIds[type], type);
  return cached;
}

function lockAdminTools() {
  if (adminContent) adminContent.hidden = true;
  setAdminStatus("");
}

function validateDirectMp4(value) {
  const parsed = new URL(value, window.location.href);
  if (!["http:", "https:"].includes(parsed.protocol) || !/\.mp4$/i.test(parsed.pathname)) {
    throw new Error("Enter a direct MP4 URL ending in .mp4.");
  }
  return parsed.href;
}

function renderAdminInquiries(snapshot) {
  if (!adminInquiryList) return;
  adminInquiryList.replaceChildren();
  const entries = Array.isArray(snapshot)
    ? snapshot
    : snapshot.docs.map((entry) => ({ id: entry.id, data: entry.data() }));
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.textContent = "There are no saved enquiries yet.";
    adminInquiryList.append(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "admin-list-table";
  table.innerHTML = "<thead><tr><th>Received</th><th>Name &amp; contact</th><th>Enquiry</th><th>Message</th><th>Action</th></tr></thead>";
  const body = document.createElement("tbody");
  entries.forEach((entry) => {
    const data = entry.data;
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const timestamp = data.createdAt;
    const createdAt = timestamp?.toDate?.()
      || (typeof timestamp === "number" || typeof timestamp === "string"
        ? new Date(timestamp)
        : Number.isFinite(timestamp?.seconds) ? new Date(timestamp.seconds * 1000) : null);
    dateCell.textContent = createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString()
      : "Just received";
    const contactCell = document.createElement("td");
    contactCell.textContent = [data.name, data.email, data.phone].filter(Boolean).join("\n");
    const programCell = document.createElement("td");
    programCell.textContent = data.program || "General enquiry";
    const messageCell = document.createElement("td");
    messageCell.textContent = data.message || "";
    const actionCell = document.createElement("td");
    const digits = String(data.phone || "").replace(/\D/g, "");
    const phone = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
    const reply = document.createElement("a");
    reply.className = "admin-action-link";
    reply.textContent = phone ? "Reply on WhatsApp" : "No phone provided";
    if (phone) {
      const message = `Hello ${data.name || "there"}, we are following up on your Get Robotics enquiry about ${data.program || "our programs"}.`;
      reply.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      reply.target = "_blank";
      reply.rel = "noopener noreferrer";
    } else {
      reply.setAttribute("aria-disabled", "true");
    }
    actionCell.append(reply);
    row.append(dateCell, contactCell, programCell, messageCell, actionCell);
    body.append(row);
  });
  table.append(body);
  adminInquiryList.append(table);
}

function renderAdminEmails() {
  if (!adminEmailsList) return;
  adminEmailsList.replaceChildren();
  const defaults = DEFAULT_ADMIN_EMAILS || [];
  [...new Set([...defaults, ...adminEmails])].forEach((email) => {
    const row = document.createElement("div");
    row.className = "admin-email-row";
    const label = document.createElement("span");
    label.textContent = email;
    row.append(label);
    if (!defaults.includes(email)) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-delete-button";
      remove.dataset.removeAdminEmail = email;
      remove.textContent = "Remove";
      row.append(remove);
    } else {
      const badge = document.createElement("small");
      badge.textContent = "Primary admin";
      row.append(badge);
    }
    adminEmailsList.append(row);
  });
}

async function connectAdminWorkspace() {
  if (!db || adminWorkspaceConnected) return;
  adminWorkspaceConnected = true;
  for (const type of Object.keys(adminCollections)) {
    const cachedEntries = readAdminCache(`collection:${type}`, []);
    if (Array.isArray(cachedEntries)) {
      adminDocuments[type] = cachedEntries;
      const listIds = { products: "#admin-products-list", videos: "#admin-videos-list", updates: "#admin-updates-list" };
      renderAdminList(listIds[type], type);
    }
  }
  const cachedInquiries = readAdminCache("inquiries", []);
  if (Array.isArray(cachedInquiries)) renderAdminInquiries(cachedInquiries);
  const cachedShowcase = readAdminCache("showcase", {});
  const cachedSettings = readAdminCache("settings:main", {});
  const cachedAdmins = readAdminCache("admins", []);
  currentSiteSettings = cachedSettings;
  adminEmails = Array.isArray(cachedAdmins) ? cachedAdmins : [];
  renderAdminEmails();
  applyShowcaseSettings(cachedShowcase);
  applyLiveSettings(cachedSettings);
  if (adminShowcaseForm) {
    adminShowcaseForm.elements.videoUrl.value = cachedShowcase.videoUrl || "videos/hands-on-showcase.mp4";
    adminShowcaseForm.elements.headline.value = cachedShowcase.headline || "";
    adminShowcaseForm.elements.statOneValue.value = cachedShowcase.statOneValue || "";
    adminShowcaseForm.elements.statOneLabel.value = cachedShowcase.statOneLabel || "";
    adminShowcaseForm.elements.statTwoValue.value = cachedShowcase.statTwoValue || "";
    adminShowcaseForm.elements.statTwoLabel.value = cachedShowcase.statTwoLabel || "";
  }
  if (adminSettingsForm) {
    ["whatsappNumber", "contactEmail", "physicalAddress", "tiktokUrl", "youtubeUrl", "facebookUrl", "instructorPortrait", "selarStoreUrl"].forEach((field) => {
      if (adminSettingsForm.elements[field]) {
        const value = field === "instructorPortrait" && String(cachedSettings[field] || "").startsWith("data:image/")
          ? ""
            : cachedSettings[field] || officialSocialUrls[field] || (field === "selarStoreUrl" ? "https://selar.com" : "");
        adminSettingsForm.elements[field].value = value;
      }
    });
  }

  const inquiriesUnsubscribe = onSnapshot(
    query(collection(db, "getrobotics_inquiries"), orderBy("createdAt", "desc")),
    (snapshot) => {
      const entries = snapshot.docs.map((entry) => ({ id: entry.id, data: entry.data() }));
      writeAdminCache("inquiries", entries);
      renderAdminInquiries(entries);
    },
    (error) => {
      console.error("Unable to load the live bookings inbox.", error);
      setAdminStatus(`Bookings inbox failed to load: ${error.message}`, true);
    },
  );
  const showcaseUnsubscribe = onSnapshot(doc(db, "getrobotics_settings", "showcase_video"), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : cachedShowcase;
    writeAdminCache("showcase", data);
    if (adminShowcaseForm && !adminShowcaseForm.matches(":focus-within")) {
      adminShowcaseForm.elements.videoUrl.value = data.videoUrl || "videos/hands-on-showcase.mp4";
      adminShowcaseForm.elements.headline.value = data.headline || "";
      adminShowcaseForm.elements.statOneValue.value = data.statOneValue || "";
      adminShowcaseForm.elements.statOneLabel.value = data.statOneLabel || "";
      adminShowcaseForm.elements.statTwoValue.value = data.statTwoValue || "";
      adminShowcaseForm.elements.statTwoLabel.value = data.statTwoLabel || "";
    }
    applyShowcaseSettings(data);
  }, (error) => {
    console.error("Unable to load the Tesla showcase settings.", error);
    setAdminStatus(`Showcase settings failed to load: ${error.message}`, true);
  });
  const settingsUnsubscribe = onSnapshot(doc(db, "getrobotics_settings", "main"), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : cachedSettings;
    writeAdminCache("settings:main", data);
    currentSiteSettings = data;
    if (adminSettingsForm && !adminSettingsForm.matches(":focus-within")) {
      ["whatsappNumber", "contactEmail", "physicalAddress", "tiktokUrl", "youtubeUrl", "facebookUrl", "instructorPortrait", "selarStoreUrl"].forEach((field) => {
        if (adminSettingsForm.elements[field]) {
          const value = field === "instructorPortrait" && String(data[field] || "").startsWith("data:image/")
            ? ""
              : data[field] || officialSocialUrls[field] || (field === "selarStoreUrl" ? "https://selar.com" : "");
          adminSettingsForm.elements[field].value = value;
        }
      });
    }
  }, (error) => {
    console.error("Unable to load the administrator contact settings.", error);
    setAdminStatus(`Contact settings failed to load: ${error.message}`, true);
  });
  const adminsUnsubscribe = onSnapshot(doc(db, "getrobotics_settings", "admins"), (snapshot) => {
    const emails = snapshot.exists() ? snapshot.data().emails : [];
    adminEmails = Array.isArray(emails)
      ? [...new Set(emails.filter((email) => typeof email === "string").map((email) => email.trim().toLowerCase()))]
      : [];
    writeAdminCache("admins", adminEmails);
    renderAdminEmails();
  }, (error) => {
    console.error("Unable to load the co-administrator allowlist.", error);
    setAdminStatus(`Co-admin list failed to load: ${error.message}`, true);
  });
  adminUnsubscribers.push(inquiriesUnsubscribe, showcaseUnsubscribe, settingsUnsubscribe, adminsUnsubscribe);
}

const adminDashboard = document.querySelector("#admin-dashboard");
if (adminDashboard) {
  const authCard = document.querySelector("#admin-auth-gate");
  const authMessage = document.querySelector("#admin-auth-message");
  const adminEmailBadge = document.querySelector("#admin-email-badge");
  const adminLoginLink = document.querySelector("#admin-login-link");
  const adminEmailForm = document.querySelector("#admin-email-signin-form");
  const adminGoogleButton = document.querySelector("#admin-google-signin");
  const adminSignOut = document.querySelector("#admin-signout");
  const adminRedirect = new URL("login.html", window.location.href);
  adminRedirect.searchParams.set("redirect", "admin.html");
  if (adminLoginLink) adminLoginLink.href = adminRedirect.href;
  const showAdminAuthMessage = (message) => {
    if (authMessage) authMessage.textContent = message;
  };

  adminEmailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    showAdminAuthMessage("Signing in and checking administrator access.");
    try {
      await signInWithEmailAndPassword(
        auth,
        form.elements.email.value.trim(),
        form.elements.password.value,
      );
    } catch (error) {
      console.error("Admin email sign-in failed.", error);
      showAdminAuthMessage(getAuthErrorMessage(error));
    } finally {
      submit.disabled = false;
    }
  });

  adminGoogleButton?.addEventListener("click", async () => {
    adminGoogleButton.disabled = true;
    showAdminAuthMessage("Signing in with Google and checking administrator access.");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Admin Google sign-in failed.", error);
      showAdminAuthMessage(getAuthErrorMessage(error));
    } finally {
      adminGoogleButton.disabled = false;
    }
  });

  if (!auth || !onAuthStateChanged || !isUserAuthorizedAdmin) {
    showAdminAuthMessage("Administrator Authentication Required. Sign in with an authorized admin account to continue.");
    authCard.hidden = false;
  } else {
    onAuthStateChanged(auth, async (user) => {
      adminUnsubscribers.forEach((unsubscribe) => unsubscribe());
      adminUnsubscribers = [];
      adminWorkspaceConnected = false;
      adminDashboard.hidden = true;
      authCard.hidden = false;
      if (!user) {
        showAdminAuthMessage("Administrator Authentication Required. Sign in with an authorized admin account to continue.");
        return;
      }

      try {
        if (!(await isUserAuthorizedAdmin(user))) {
          showAdminAuthMessage("This signed-in account is not authorized to manage Get Robotics.");
          return;
        }
        authCard.hidden = true;
        adminDashboard.hidden = false;
        if (adminEmailBadge) adminEmailBadge.textContent = user.email || "";
        await connectAdminWorkspace();
      } catch (error) {
        console.error("Unable to verify administrator access on the admin portal.", error);
        showAdminAuthMessage("Administrator access could not be verified. Refresh the page or contact an administrator.");
      }
    }, (error) => {
      console.error("Unable to observe admin portal authentication state.", error);
      showAdminAuthMessage("Authentication could not be loaded. Please try again.");
      authCard.hidden = false;
      adminDashboard.hidden = true;
    });
  }

  adminSignOut?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.assign("login.html");
    } catch (error) {
      console.error("Unable to sign out of the admin portal.", error);
      setAdminStatus(`Sign out failed: ${error.message}`, true);
    }
  });
}

adminTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    adminTabButtons.forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    adminTabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== button.dataset.adminTab;
    });
  });
});

function renderAdminList(containerId, type) {
  const container = document.querySelector(containerId);
  if (!container) return;
  container.replaceChildren();
  const entries = adminDocuments[type];
  if (!entries.length) {
    const message = document.createElement("p");
    message.textContent = "No cloud entries have been added yet.";
    container.append(message);
    return;
  }
  if (type === "products") {
    const table = document.createElement("table");
    table.className = "admin-list-table";
    table.innerHTML = "<thead><tr><th>Image</th><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>";
    const body = document.createElement("tbody");
    entries.forEach(({ id, data }) => {
      const row = document.createElement("tr");
      const imageCell = document.createElement("td");
      const image = document.createElement("img");
      image.className = "admin-product-thumbnail";
      image.src = data.image || data.imageUrl || "images/kits-smart-cars-spider.jpg";
      image.alt = "";
      imageCell.append(image);
      const titleCell = document.createElement("td");
      titleCell.textContent = data.title || data.name || id;
      const skuCell = document.createElement("td");
      skuCell.textContent = data.sku || id;
      const priceCell = document.createElement("td");
      priceCell.textContent = formatNaira(data.price || 0);
      const stockCell = document.createElement("td");
      const stock = document.createElement("button");
      stock.type = "button";
      stock.dataset.adminStock = id;
      stock.textContent = data.inStock === false || data.stockStatus === "sold-out" ? "Out of Stock" : "In Stock";
      stock.className = `admin-stock-toggle${data.inStock === false || data.stockStatus === "sold-out" ? " is-out" : ""}`;
      stockCell.append(stock);
      const actionsCell = document.createElement("td");
      actionsCell.className = "admin-table-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.dataset.adminEdit = id;
      edit.textContent = "Edit";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-delete-button";
      remove.dataset.adminDelete = id;
      remove.textContent = "Delete";
      actionsCell.append(edit, remove);
      row.append(imageCell, titleCell, skuCell, priceCell, stockCell, actionsCell);
      body.append(row);
    });
    table.append(body);
    container.append(table);
    return;
  }
  entries.forEach(({ id, data }) => {
    const row = document.createElement("div");
    row.className = "admin-cms-list-row";
    const label = document.createElement("span");
    label.textContent = `${data.title || data.name || id}${data.sku ? ` (${data.sku})` : ""}`;
    row.append(label);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "admin-delete-button";
    remove.dataset.adminDelete = id;
    remove.textContent = "Delete";
    row.append(remove);
    container.append(row);
  });
}

function subscribeToAdminCollection(type, snapshot) {
  adminDocuments[type] = snapshot.docs.map((entry) => ({ id: entry.id, data: entry.data() }));
  writeAdminCache(`collection:${type}`, adminDocuments[type]);
  const listIds = { products: "#admin-products-list", videos: "#admin-videos-list", updates: "#admin-updates-list" };
  renderAdminList(listIds[type], type);
}

function readFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function compressedImage(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The selected image could not be opened."));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
  let scale = Math.min(1, 1500 / Math.max(source.width, source.height));
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image compression is unavailable in this browser.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const quality = Math.max(0.35, 0.86 - attempt * 0.07);
    const result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= 180 * 1024) return result;
    scale *= 0.82;
  }
  throw new Error("This image could not be compressed below 180 KB. Choose a smaller image.");
}

async function imageFromForm(form, fileName, urlName, currentImage = "") {
  const file = form.querySelector(`[name="${fileName}"]`)?.files?.[0];
  if (file) return compressedImage(file);
  const url = String(new FormData(form).get(urlName) || "").trim();
  if (!url && currentImage) return currentImage;
  try {
    if (new URL(url).protocol === "https:") return url;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  throw new Error("Choose an image file or provide a valid HTTPS image URL.");
}

document.querySelector("#admin-products-list")?.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const id = button?.dataset.adminDelete || button?.dataset.adminStock || button?.dataset.adminEdit;
  if (!id) return;
  if (button.dataset.adminEdit) {
    const item = adminDocuments.products.find((entry) => entry.id === id);
    if (!item) return;
    const form = document.querySelector("#admin-product-form");
    if (!form) return;
    form.elements.title.value = item.data.title || item.data.name || "";
    form.elements.sku.value = item.data.sku || id;
    form.elements.sku.readOnly = true;
    form.elements.price.value = String(item.data.price ?? "");
    form.elements.selarUrl.value = item.data.selarUrl || "";
    const savedCategory = item.data.category || item.data.categories?.[0] || "complete-kits";
    const categoryAliases = {
      boards: "microcontrollers",
      breadboards: "prototyping",
      "smart-cars": "complete-kits",
    };
    form.elements.category.value = categoryAliases[savedCategory] || savedCategory;
    form.elements.stockStatus.value = item.data.inStock === false || item.data.stockStatus === "sold-out" ? "sold-out" : "in-stock";
    form.elements.editId.value = id;
    form.dataset.currentImage = item.data.image || item.data.imageUrl || "";
    form.querySelector('[type="submit"]').textContent = "SAVE PRODUCT CHANGES";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.title.focus({ preventScroll: true });
    return;
  }
  const item = adminDocuments.products.find((entry) => entry.id === id);
  try {
    if (button.dataset.adminDelete) {
      removeCachedAdminDocument("products", id);
      setAdminStatus("Saved locally; syncing product deletion to Cloud.");
      if (!db) {
        setAdminStatus("Product removed from this browser only; Cloud is unavailable.", true);
        return;
      }
      await deleteDoc(doc(db, adminCollections.products, id));
      setAdminStatus("Saved to Cloud! Product deleted.");
    } else {
      const inStock = item?.data.inStock === false || item?.data.stockStatus === "sold-out";
      const updatedProduct = {
        ...item?.data,
        inStock: !inStock,
        stockStatus: inStock ? "in-stock" : "sold-out",
      };
      saveCachedAdminDocument("products", id, updatedProduct);
      setAdminStatus("Saved locally; syncing stock change to Cloud.");
      if (!db) {
        setAdminStatus("Stock change saved to this browser only; Cloud is unavailable.", true);
        return;
      }
      await updateDoc(doc(db, adminCollections.products, id), {
        inStock: !inStock,
        stockStatus: inStock ? "in-stock" : "sold-out",
      });
      setAdminStatus("Saved to Cloud! Product stock status updated.");
    }
  } catch (error) {
    console.error("Unable to update the cloud product.", error);
    setAdminStatus(`Change is saved in this browser, but Cloud update failed: ${error.message}`, true);
  }
});

["videos", "updates"].forEach((type) => {
  const list = document.querySelector(`#admin-${type}-list`);
  list?.addEventListener("click", async (event) => {
    const id = event.target.closest("[data-admin-delete]")?.dataset.adminDelete;
    if (!id) return;
    try {
      removeCachedAdminDocument(type, id);
      setAdminStatus("Saved locally; syncing removal to Cloud.");
      if (!db) {
        setAdminStatus("Removal saved to this browser only; Cloud is unavailable.", true);
        return;
      }
      await deleteDoc(doc(db, adminCollections[type], id));
      setAdminStatus("Saved to Cloud! Entry deleted.");
    } catch (error) {
      console.error(`Unable to delete cloud ${type}.`, error);
      setAdminStatus(`Removal is saved in this browser, but Cloud update failed: ${error.message}`, true);
    }
  });
});

document.querySelector("#admin-product-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let savedLocally = false;
  try {
    const values = readFormValues(form);
    const editId = String(values.editId || "").trim();
    const sku = String(values.sku || "").trim().toUpperCase()
      || `GET-${Date.now().toString(36).toUpperCase()}`;
    const title = String(values.title || "").trim();
    const price = Number(values.price);
    const selarUrl = String(values.selarUrl || "").trim();
    if (!/^GET-[A-Z0-9-]{1,44}$/.test(sku) || !title || !Number.isFinite(price) || price < 0) {
      throw new Error("Enter a product title, valid SKU, and non-negative price.");
    }
    if (selarUrl && !isValidSelarUrl(selarUrl)) {
      throw new Error("Enter a valid HTTPS Selar product URL.");
    }
    const image = await imageFromForm(form, "imageFile", "imageUrl", form.dataset.currentImage);
    const category = String(values.category || "complete-kits");
    const inStock = values.stockStatus === "in-stock";
    const productData = {
      title,
      sku,
      price,
      selarUrl,
      image,
      category,
      categories: [category],
      inStock,
      stockStatus: inStock ? "in-stock" : "sold-out",
    };
    const productId = editId || sku;
    savedLocally = saveCachedAdminDocument("products", productId, {
      ...productData,
      ...(!editId ? { createdAt: new Date().toISOString() } : {}),
    });
    setAdminStatus(savedLocally
      ? "Saved locally; syncing product changes to Cloud."
      : "Saving product changes to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(doc(db, adminCollections.products, productId), {
      ...productData,
      ...(!editId ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
    form.reset();
    form.elements.sku.readOnly = false;
    delete form.dataset.currentImage;
    form.querySelector('[type="submit"]').textContent = "ADD PRODUCT";
    setAdminStatus("Saved to Cloud! Product changes are now live.");
  } catch (error) {
    console.error("Unable to save the cloud product.", error);
    setAdminStatus(savedLocally
      ? "Product is saved in this browser, but Cloud sync failed."
      : `Product save failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#admin-video-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let savedLocally = false;
  try {
    const values = readFormValues(form);
    const videoUrl = String(values.videoUrl || "").trim();
    let parsedVideoUrl;
    try {
      parsedVideoUrl = new URL(videoUrl);
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
    if (parsedVideoUrl?.protocol !== "https:" || !/\.mp4$/i.test(parsedVideoUrl.pathname)) {
      throw new Error("Enter a secure direct MP4 URL ending in .mp4.");
    }
    const thumbnail = await imageFromForm(form, "thumbnailFile", "thumbnailUrl");
    const socialUrl = String(values.socialUrl || "").trim();
    if (socialUrl && new URL(socialUrl).protocol !== "https:") {
      throw new Error("Enter a secure social video URL.");
    }
    const videoRef = doc(collection(db, adminCollections.videos));
    const videoData = {
      title: String(values.title || "").trim(),
      category: values.category,
      videoUrl,
      socialUrl,
      thumbnail,
    };
    savedLocally = saveCachedAdminDocument("videos", videoRef.id, {
      ...videoData,
      createdAt: new Date().toISOString(),
    });
    setAdminStatus(savedLocally
      ? "Saved locally; syncing video to Cloud."
      : "Saving video to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(videoRef, { ...videoData, createdAt: serverTimestamp() });
    form.reset();
    setAdminStatus("Saved to Cloud! The video is live in the classroom hub.");
  } catch (error) {
    console.error("Unable to save the classroom video.", error);
    setAdminStatus(savedLocally
      ? "Video is saved in this browser, but Cloud sync failed."
      : `Video save failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#admin-update-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let savedLocally = false;
  try {
    const values = readFormValues(form);
    const image = await imageFromForm(form, "flyerFile", "flyerUrl");
    const updateRef = doc(collection(db, adminCollections.updates));
    const updateData = {
      title: String(values.title || "").trim(),
      statusBadge: values.statusBadge,
      description: String(values.description || "").trim(),
      image,
      showInHero: form.querySelector('[name="showInHero"]').checked,
    };
    savedLocally = saveCachedAdminDocument("updates", updateRef.id, {
      ...updateData,
      createdAt: new Date().toISOString(),
    });
    setAdminStatus(savedLocally
      ? "Saved locally; syncing flyer to Cloud."
      : "Saving flyer to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(updateRef, { ...updateData, createdAt: serverTimestamp() });
    form.reset();
    setAdminStatus("Saved to Cloud! The flyer and update are now live.");
  } catch (error) {
    console.error("Unable to save the flyer or update.", error);
    setAdminStatus(savedLocally
      ? "Flyer is saved in this browser, but Cloud sync failed."
      : `Flyer save failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

adminShowcaseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let savedLocally = false;
  try {
    const values = readFormValues(form);
    const videoUrl = validateDirectMp4(String(values.videoUrl || "").trim());
    const showcaseData = {
      videoUrl,
      headline: String(values.headline || "").trim(),
      statOneValue: String(values.statOneValue || "").trim(),
      statOneLabel: String(values.statOneLabel || "").trim(),
      statTwoValue: String(values.statTwoValue || "").trim(),
      statTwoLabel: String(values.statTwoLabel || "").trim(),
    };
    savedLocally = writeAdminCache("showcase", showcaseData);
    applyShowcaseSettings(showcaseData);
    setAdminStatus(savedLocally
      ? "Saved locally; syncing showcase settings to Cloud."
      : "Saving showcase settings to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(doc(db, "getrobotics_settings", "showcase_video"), {
      ...showcaseData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setAdminStatus("Saved to Cloud! Showcase video and headline stats are live.");
  } catch (error) {
    console.error("Unable to save the Tesla showcase settings.", error);
    setAdminStatus(savedLocally
      ? "Showcase settings are saved in this browser, but Cloud sync failed."
      : `Showcase save failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#admin-add-email-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const email = String(new FormData(form).get("email") || "").trim().toLowerCase();
  submit.disabled = true;
  let savedLocally = false;
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if ((DEFAULT_ADMIN_EMAILS || []).includes(email) || adminEmails.includes(email)) {
      throw new Error("That email already has administrator access.");
    }
    const nextEmails = [...adminEmails, email];
    adminEmails = nextEmails;
    renderAdminEmails();
    savedLocally = writeAdminCache("admins", adminEmails);
    setAdminStatus(savedLocally
      ? "Saved locally; syncing co-administrator access to Cloud."
      : "Saving co-administrator access to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(doc(db, "getrobotics_settings", "admins"), {
      emails: nextEmails,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    form.reset();
    setAdminStatus("Saved to Cloud! The co-administrator allowlist was updated.");
  } catch (error) {
    console.error("Unable to add a co-administrator.", error);
    setAdminStatus(savedLocally
      ? `Co-admin change is saved in this browser, but Cloud update failed: ${error.message}`
      : `Co-admin update failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

adminEmailsList?.addEventListener("click", async (event) => {
  const email = event.target.closest("[data-remove-admin-email]")?.dataset.removeAdminEmail;
  if (!email || !adminEmails.includes(email)) return;
  let savedLocally = false;
  try {
    adminEmails = adminEmails.filter((entry) => entry !== email);
    renderAdminEmails();
    savedLocally = writeAdminCache("admins", adminEmails);
    setAdminStatus(savedLocally
      ? "Saved locally; syncing co-administrator removal to Cloud."
      : "Saving co-administrator access to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(doc(db, "getrobotics_settings", "admins"), {
      emails: adminEmails,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setAdminStatus("Saved to Cloud! The co-administrator was removed.");
  } catch (error) {
    console.error("Unable to remove a co-administrator.", error);
    setAdminStatus(savedLocally
      ? `Co-admin change is saved in this browser, but Cloud update failed: ${error.message}`
      : `Co-admin removal failed: ${error.message}`, true);
  }
});

document.querySelector("#admin-settings-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let savedLocally = false;
  try {
    const values = readFormValues(form);
    const portraitInput = String(values.instructorPortrait || "").trim();
    const portrait = form.querySelector('[name="portraitFile"]')?.files?.[0]
      ? await compressedImage(form.querySelector('[name="portraitFile"]').files[0])
      : portraitInput || currentSiteSettings.instructorPortrait || "";
    const socialUrls = ["tiktokUrl", "youtubeUrl", "facebookUrl"];
    socialUrls.forEach((field) => {
      const value = String(values[field] || "").trim();
      if (value && new URL(value).protocol !== "https:") {
        throw new Error(`Enter a secure ${field.replace("Url", "")} URL.`);
      }
    });
    const selarStoreUrl = String(values.selarStoreUrl || "https://selar.com").trim();
    if (!isValidSelarUrl(selarStoreUrl)) {
      throw new Error("Enter a valid HTTPS Selar store URL.");
    }
    if (portrait && !portrait.startsWith("data:image/") && new URL(portrait).protocol !== "https:") {
      throw new Error("Enter a secure instructor portrait URL.");
    }
    const settingsData = {
      whatsappNumber: String(values.whatsappNumber || "").replace(/\D/g, ""),
      contactEmail: String(values.contactEmail || "").trim(),
      physicalAddress: String(values.physicalAddress || "").trim(),
      tiktokUrl: String(values.tiktokUrl || officialSocialUrls.tiktokUrl).trim(),
      youtubeUrl: String(values.youtubeUrl || officialSocialUrls.youtubeUrl).trim(),
      facebookUrl: String(values.facebookUrl || officialSocialUrls.facebookUrl).trim(),
      selarStoreUrl,
      instructorPortrait: portrait,
    };
    currentSiteSettings = { ...currentSiteSettings, ...settingsData };
    savedLocally = writeAdminCache("settings:main", currentSiteSettings);
    applyLiveSettings(currentSiteSettings);
    setAdminStatus(savedLocally
      ? "Saved locally; syncing site settings to Cloud."
      : "Saving site settings to Cloud; local backup is unavailable.");
    if (!db) throw new Error("Cloud is unavailable.");
    await setDoc(doc(db, "getrobotics_settings", "main"), {
      ...settingsData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setAdminStatus("Saved to Cloud! Contact and site settings are live.");
  } catch (error) {
    console.error("Unable to save Get Robotics settings.", error);
    setAdminStatus(savedLocally
      ? "Settings are saved in this browser, but Cloud sync failed."
      : `Settings save failed: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});

function getMasterDefaultVideos() {
  return defaultVideoCards.map((card, index) => {
    const video = card.querySelector("video");
    const title = card.querySelector("h3")?.textContent.trim() || `Get Robotics Classroom Video ${index + 1}`;
    const thumbnail = card.querySelector("img")?.getAttribute("src") || "";
    const videoUrl = card.dataset.videoSrc || video?.getAttribute("src") || "";
    const socialUrl = card.querySelector(".video-card-copy a")?.getAttribute("href") || "";
    const id = `master-video-${index + 1}`;
    return {
      id,
      data: {
        title,
        category: card.dataset.category || "Student Projects",
        videoUrl,
        thumbnail,
        ...(socialUrl ? { socialUrl } : {}),
      },
    };
  }).filter((entry) => entry.data.videoUrl && entry.data.thumbnail);
}

function getMasterDefaultUpdates() {
  return defaultFlyerCards.map((card, index) => {
    const image = card.querySelector(".flyer-preview img, > img");
    const title = card.querySelector("h3")?.textContent.trim() || `Get Robotics Update ${index + 1}`;
    const description = card.querySelector("p")?.textContent.trim() || "";
    return {
      id: `master-update-${index + 1}`,
      data: {
        title,
        description,
        image: image?.getAttribute("src") || "",
        statusBadge: index === 1 ? "BOOTCAMP" : "SATURDAY CLASS",
        showInHero: false,
      },
    };
  }).filter((entry) => entry.data.image);
}

function getMasterDefaultProducts() {
  return DEFAULT_PRODUCTS.map((product) => ({
    id: product.id,
    data: {
      title: product.title,
      sku: product.sku,
      price: product.price,
      selarUrl: product.selarUrl,
      image: product.image,
      categories: [...product.categories],
      category: product.categories[0],
      featuredRank: product.featuredRank,
      salesCount: product.salesCount,
      createdAt: product.createdAt,
      inStock: product.inStock,
      stockStatus: product.inStock ? "in-stock" : "sold-out",
    },
  }));
}

document.querySelector("#admin-export-backup")?.addEventListener("click", async () => {
  const button = document.querySelector("#admin-export-backup");
  button.disabled = true;
  try {
    const backup = {
      format: "get-robotics-admin-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      products: adminDocuments.products,
      videos: adminDocuments.videos,
      updates: adminDocuments.updates,
      settings: currentSiteSettings,
      showcase: readAdminCache("showcase", {}),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = downloadUrl;
    download.download = `get-robotics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    download.click();
    URL.revokeObjectURL(downloadUrl);
    setAdminStatus("Backup JSON exported successfully.");
  } catch (error) {
    console.error("Unable to export the Get Robotics backup.", error);
    setAdminStatus(`Backup export failed: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#admin-restore-defaults")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!window.confirm("Restore the master default products, prices, videos, and flyers? Existing live entries in these collections will be replaced.")) return;
  if (!db || !getDocs || !deleteDoc || !setDoc) {
    setAdminStatus("Cloud access is unavailable. The master catalog was not changed.", true);
    return;
  }

  button.disabled = true;
  try {
    const defaults = {
      products: getMasterDefaultProducts(),
      videos: getMasterDefaultVideos(),
      updates: getMasterDefaultUpdates(),
    };
    for (const [type, records] of Object.entries(defaults)) {
      const collectionRef = collection(db, adminCollections[type]);
      const existing = await getDocs(collectionRef);
      for (const snapshot of existing.docs) {
        await deleteDoc(doc(db, adminCollections[type], snapshot.id));
      }
      for (const record of records) {
        await setDoc(doc(db, adminCollections[type], record.id), record.data);
      }
      adminDocuments[type] = records;
      writeAdminCache(`collection:${type}`, records);
      renderAdminList(`#admin-${type}-list`, type);
    }

    const showcase = {
      videoUrl: "videos/hands-on-showcase.mp4",
      headline: "Hands-On Robotics (Live in Action)",
      statOneValue: "100%",
      statOneLabel: "Practical Hardware Builds",
      statTwoValue: "6+",
      statTwoLabel: "Core Arduino & ESP32 Projects",
    };
    await setDoc(doc(db, "getrobotics_settings", "showcase_video"), {
      ...showcase,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    writeAdminCache("showcase", showcase);
    applyShowcaseSettings(showcase);
    if (adminShowcaseForm) {
      adminShowcaseForm.elements.videoUrl.value = showcase.videoUrl;
      adminShowcaseForm.elements.headline.value = showcase.headline;
      adminShowcaseForm.elements.statOneValue.value = showcase.statOneValue;
      adminShowcaseForm.elements.statOneLabel.value = showcase.statOneLabel;
      adminShowcaseForm.elements.statTwoValue.value = showcase.statTwoValue;
      adminShowcaseForm.elements.statTwoLabel.value = showcase.statTwoLabel;
    }
    setAdminStatus("Master default products, prices, videos, and flyers were restored to Cloud.");
  } catch (error) {
    console.error("Unable to restore the master default Get Robotics catalog.", error);
    setAdminStatus(`Master restore did not complete: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
});

function connectFirestore() {
  if (!db) {
    console.warn("Firebase is not configured; using the local catalog, videos, and flyers.");
    return;
  }
  try {
    onSnapshot(collection(db, "getrobotics_products"), (snapshot) => {
      cloudProducts = snapshot.docs;
      mergeFirestoreProducts(cloudProducts);
      subscribeToAdminCollection("products", snapshot);
    }, (error) => {
      console.error("Unable to load cloud products; showing the local catalog.", error);
    });
    onSnapshot(collection(db, "getrobotics_videos"), (snapshot) => {
      cloudVideos = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      renderVideos();
      subscribeToAdminCollection("videos", snapshot);
    }, (error) => {
      console.error("Unable to load cloud classroom videos; showing the local videos.", error);
    });
    onSnapshot(collection(db, "getrobotics_updates"), (snapshot) => {
      cloudUpdates = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          title: data.title || data.name,
          description: data.description || "",
          image: data.image || data.imageUrl || "",
          statusBadge: data.statusBadge || "",
          showInHero: data.showInHero === true,
        };
      });
      renderFlyers();
      renderHeroUpdates();
      subscribeToAdminCollection("updates", snapshot);
    }, (error) => {
      console.error("Unable to load cloud flyers; showing the official local flyers.", error);
    });
    onSnapshot(doc(db, "getrobotics_settings", "main"), (snapshot) => {
      if (snapshot.exists()) applyLiveSettings(snapshot.data());
    }, (error) => {
      console.error("Unable to load live Get Robotics settings.", error);
    });
    onSnapshot(doc(db, "getrobotics_settings", "showcase_video"), (snapshot) => {
      if (snapshot.exists()) applyShowcaseSettings(snapshot.data());
    }, (error) => {
      console.error("Unable to load live showcase video settings.", error);
    });
  } catch (error) {
    console.error("Unable to subscribe to Firestore storefront updates.", error);
  }
}

async function handleAuthState(user) {
  if (unsubscribeUserProfile) {
    unsubscribeUserProfile();
    unsubscribeUserProfile = null;
  }
  profileSyncReady = false;
  activeAuthUser = user;
  updateAccountLabel(user);
  await updateAccountDashboard(user);
  if (user && new URLSearchParams(window.location.search).get("redirect") === "admin.html") {
    try {
      if (await isUserAuthorizedAdmin?.(user)) {
        window.location.replace("admin.html");
        return;
      }
    } catch (error) {
      console.error("Unable to authorize the requested admin portal redirect.", error);
    }
  }
  if (!user || !db) return;

  const profileRef = doc(db, "users", user.uid);
  try {
    const profileSnapshot = await getDoc(profileRef);
    if (activeAuthUser?.uid !== user.uid) return;
    const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
    applyingRemoteStoreState = true;
    cart = Array.isArray(profile.cart)
      ? profile.cart.filter((entry) => entry && typeof entry.id === "string" && productById.has(entry.id)
        && Number.isInteger(entry.quantity) && entry.quantity > 0)
      : cart;
    wishlist = Array.isArray(profile.wishlist)
      ? profile.wishlist.filter((id) => typeof id === "string" && productById.has(id))
      : wishlist;
    applyingRemoteStoreState = false;
    profileSyncReady = true;
    saveStoreState();
    updateStoreCounts();
    renderStorePanels();
    renderAccountWishlist();
    await setDoc(profileRef, {
      fullName: profile.fullName || user.displayName || "",
      displayName: profile.displayName || user.displayName || "",
      email: profile.email || user.email || "",
      ...(!profile.createdAt ? { createdAt: serverTimestamp() } : {}),
      cart,
      wishlist,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    unsubscribeUserProfile = onSnapshot(profileRef, (snapshot) => {
      if (!snapshot.exists() || activeAuthUser?.uid !== user.uid) return;
      const data = snapshot.data();
      applyingRemoteStoreState = true;
      if (Array.isArray(data.cart)) {
        cart = data.cart.filter((entry) => entry && typeof entry.id === "string" && productById.has(entry.id)
          && Number.isInteger(entry.quantity) && entry.quantity > 0);
      }
      if (Array.isArray(data.wishlist)) {
        wishlist = data.wishlist.filter((id) => typeof id === "string" && productById.has(id));
      }
      applyingRemoteStoreState = false;
      saveStoreState();
      updateStoreCounts();
      renderStorePanels();
      renderAccountWishlist();
    }, (error) => {
      console.error("Unable to observe the signed-in user's live cart and wish list.", error);
    });
  } catch (error) {
    applyingRemoteStoreState = false;
    profileSyncReady = false;
    console.error("Unable to initialize account cart and wish-list sync.", error);
    if (authAlertBox) showAuthAlert("Your account data could not be synced. Check your Firestore rules and try again.");
  }
}

function initializeAccountAuth() {
  if (!auth || !firebaseSdk) {
    if (authAlertBox) showAuthAlert("Firebase Authentication could not be loaded. The offline store is still available.");
    return;
  }
  try {
    onAuthStateChanged(auth, (user) => {
      handleAuthState(user).catch((error) => {
        console.error("Unable to apply the Firebase authentication state.", error);
      });
    }, (error) => {
      console.error("Unable to observe Firebase authentication state.", error);
      showAuthAlert("Your account status could not be loaded. Refresh the page or try again.");
    });
  } catch (error) {
    console.error("Unable to initialize Get Robotics account authentication.", error);
    showAuthAlert("Account sign in is unavailable. Please contact Get Robotics.");
  }
}

document.querySelector("#updates-flyer-grid")?.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-image]");
  if (trigger) openLightbox(trigger);
});

const supportLauncher = document.querySelector("#get-support-launcher");
const supportWidget = document.querySelector("#get-support-widget");
const supportClose = document.querySelector("#close-support-widget");
const supportMessages = document.querySelector("#support-chat-messages");
const supportForm = document.querySelector("#support-chat-form");
const supportInput = document.querySelector("#support-chat-input");
const supportWhatsappLink = document.querySelector("#support-whatsapp-link");
let latestSupportQuestion = "";

function getSmartSupportReply(queryText) {
  const query = queryText.toLowerCase();
  const stopWords = new Set(["what", "which", "how", "much", "price", "prices", "cost", "buy", "get", "the", "for", "and", "with", "do", "i", "a", "an", "is", "of", "please", "show", "me", "about", "product"]);
  const terms = query.match(/[a-z0-9]+/g)?.filter((term) => term.length > 1 && !stopWords.has(term)) || [];
  const liveUpdate = cloudUpdates.find((update) => {
    const searchable = `${update.title || ""} ${update.description || ""} ${update.statusBadge || ""}`.toLowerCase();
    return terms.some((term) => searchable.includes(term));
  });
  const faqAnswers = [
    {
      match: /saturday|class|classes|lesson|enroll/,
      text: "Saturday Robotics Classes are practical, instructor-led sessions where learners build and program real robots, work with Arduino and ESP32, and learn through guided projects. Use the booking form to ask about the next session, age group, schedule, and availability.",
      actions: [{ label: "Ask About Saturday Classes", href: "index.html#booking-section" }],
    },
    {
      match: /school|partner|partnership|lab|classroom/,
      text: "Schools can partner with Get Robotics for robotics lab setup, STEM curriculum support, classroom kits, and instructor-led training. Send your school name and goals through the partnership enquiry form and the team will follow up.",
      actions: [{ label: "Explore School Partnerships", href: "index.html#school-partnership-section" }],
    },
    {
      match: /bootcamp|holiday|next camp/,
      text: "Holiday STEM Bootcamp dates and registration are announced in the live program updates. Check the latest flyers or send an enquiry to confirm the next available cohort.",
      actions: [{ label: "View Latest Updates", href: "index.html#updates-flyers-section" }],
    },
    {
      match: /code|circuit|\\.docx|download|copy|arduino.*program|program.*arduino/,
      text: "Students can open the Student Code Hub for Arduino and ESP32 examples, circuit guidance, and downloadable project resources. Open the hub and choose the matching project or code guide.",
      actions: [{ label: "Open Student Code Hub", href: "https://get-robotics.gzoquery.com.ng", external: true }],
    },
    {
      match: /instructor|contact|whatsapp|human/,
      text: "For class, kit, or program questions, contact Get Robotics on WhatsApp and the team will help you.",
      actions: [{ label: "Contact the Lead Instructor", href: "index.html#booking-section" }],
    },
  ];
  const matchedFaq = faqAnswers.find((entry) => entry.match.test(query));
  if (matchedFaq) {
    if (/bootcamp|holiday|next camp/.test(query) && liveUpdate) {
      return {
        text: `${liveUpdate.title}${liveUpdate.statusBadge ? ` (${liveUpdate.statusBadge})` : ""}: ${liveUpdate.description || "See the latest Get Robotics program update for details."}`,
        actions: [{ label: "View Program Updates", href: "index.html#updates-flyers-section" }],
      };
    }
    return matchedFaq;
  }

  const catalog = [...products];
  if (Array.isArray(cloudProducts)) {
    cloudProducts.forEach((snapshot) => {
      const product = normalizeFirestoreProduct(snapshot);
      if (product && !catalog.some((entry) => entry.id === product.id)) catalog.push(product);
    });
  }
  const scoredProducts = catalog.map((product) => {
    const searchable = `${product.title} ${product.sku} ${(product.categories || []).join(" ")}`.toLowerCase();
    const score = terms.reduce((total, term) => total + (searchable.includes(term) ? (product.title.toLowerCase().includes(term) ? 3 : 1) : 0), 0);
    return { product, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.product.price - b.product.price);
  if (scoredProducts.length) {
    const matches = scoredProducts.slice(0, 3);
    const descriptions = matches.map(({ product }) => `${product.title} (SKU: ${product.sku}) — ${formatNaira(product.price)}`);
    return {
      text: `Here ${matches.length === 1 ? "is the matching item" : "are the closest matching items"} in the current Get Robotics catalog: ${descriptions.join("; ")}.`,
      actions: [{ label: "View in Shop All", href: "shop.html" }],
    };
  }
  if (liveUpdate) {
    return {
      text: `${liveUpdate.title}${liveUpdate.statusBadge ? ` (${liveUpdate.statusBadge})` : ""}: ${liveUpdate.description || "See the latest Get Robotics program update for details."}`,
      actions: [{ label: "View Program Updates", href: "index.html#updates-flyers-section" }],
    };
  }
  if (/price|cost|buy|hardware|kit|arduino|esp32|spider|car|ultrasonic|waste bin/.test(query)) {
    const featuredProducts = [...catalog].sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999)).slice(0, 3);
    return {
      text: `I could not find an exact catalog match for that wording. Here are current items to start with: ${featuredProducts.map((product) => `${product.title} (SKU: ${product.sku}) — ${formatNaira(product.price)}`).join("; ")}.`,
      actions: [{ label: "View in Shop All", href: "shop.html" }],
    };
  }

  const projectTiles = Array.from(document.querySelectorAll(".project-tile"));
  const projectMatches = projectTiles.map((tile) => tile.innerText.replace(/\s+/g, " ").trim())
    .filter((text) => terms.some((term) => text.toLowerCase().includes(term)));
  if (projectMatches.length) {
    return {
      text: `Related student project showcase: ${projectMatches.slice(0, 2).join("; ")}. Ask the instructor for the matching build and circuit resources.`,
      actions: [{ label: "Explore Student Projects", href: "index.html#projects-showcase-section" }],
    };
  }
  return {
    text: "I can help with Saturday classes, school partnerships, bootcamps, kits and prices, or Arduino and ESP32 code. Try a product name such as spider, car, Arduino, ESP32, ultrasonic, or waste bin.",
    actions: [
      { label: "View Shop All", href: "shop.html" },
      { label: "Open Student Code Hub", href: "https://get-robotics.gzoquery.com.ng", external: true },
    ],
  };
}

function appendSupportMessage(text, kind, actions = []) {
  if (!supportMessages) return;
  const message = document.createElement("article");
  message.className = `support-message support-message-${kind}`;
  const copy = document.createElement("p");
  copy.textContent = text;
  message.append(copy);
  if (actions.length) {
    const actionGroup = document.createElement("div");
    actionGroup.className = "support-message-actions";
    actions.forEach((action) => {
      const link = document.createElement("a");
      link.href = action.href;
      link.textContent = action.label;
      if (action.external) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actionGroup.append(link);
    });
    message.append(actionGroup);
  }
  supportMessages.append(message);
  supportMessages.scrollTop = supportMessages.scrollHeight;
}

function sendSupportQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  latestSupportQuestion = cleanQuestion;
  appendSupportMessage(cleanQuestion, "user");
  const reply = getSmartSupportReply(cleanQuestion);
  appendSupportMessage(reply.text, "assistant", reply.actions);
  if (supportWhatsappLink) {
    supportWhatsappLink.href = buildWhatsAppLink(`Hello Get Robotics, I have a support question: ${cleanQuestion}`);
  }
}

function toggleSupportWidget(forceOpen) {
  if (!supportWidget) return;
  const isOpen = typeof forceOpen === "boolean" ? forceOpen : supportWidget.hidden;
  supportWidget.hidden = !isOpen;
  supportLauncher?.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) supportInput?.focus();
  else supportLauncher?.focus();
}

function updateSupportLauncher() {
  if (!supportLauncher) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  supportLauncher.setAttribute("aria-label", isMobile ? "Contact Get Robotics on WhatsApp" : "Open Help and Live Chat");
}

updateSupportLauncher();
window.matchMedia("(max-width: 768px)").addEventListener?.("change", updateSupportLauncher);
supportLauncher?.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    const message = "Hello Get Robotics! I am visiting your website and have a question about your classes/robotics kits.";
    window.open(`https://wa.me/2349030221179?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    return;
  }
  toggleSupportWidget();
});
supportClose?.addEventListener("click", () => toggleSupportWidget(false));
document.querySelectorAll("[data-help-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(isOpen));
    button.closest(".header-help-menu")?.classList.toggle("is-open", isOpen);
  });
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".header-help-menu")) return;
  document.querySelectorAll("[data-help-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.closest(".header-help-menu")?.classList.remove("is-open");
  });
});
document.querySelectorAll("[data-open-support]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-help-toggle]").forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.closest(".header-help-menu")?.classList.remove("is-open");
    });
    toggleSupportWidget(true);
  });
});
document.querySelectorAll("[data-faq-question]").forEach((button) => {
  button.addEventListener("click", () => sendSupportQuestion(button.dataset.faqQuestion || ""));
});
supportForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!supportInput) return;
  sendSupportQuestion(supportInput.value);
  supportInput.value = "";
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && supportWidget && !supportWidget.hidden) toggleSupportWidget(false);
});

window.addEventListener("getrobotics:products-loaded", (event) => {
  if (Array.isArray(event.detail?.products)) {
    mergeFirestoreProducts(event.detail.products);
  }
});

connectFirestore();
initializeAccountAuth();
updateStoreCounts();
renderStorePanels();