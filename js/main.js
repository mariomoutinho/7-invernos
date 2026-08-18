(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const siteContent = window.SITE_CONTENT || {};
  const menuButton = document.querySelector("[data-menu-button]");
  const menuClose = document.querySelector("[data-menu-close]");
  const menuOverlay = document.querySelector("[data-menu-overlay]");
  const navigation = document.querySelector("[data-navigation]");
  const searchButtons = Array.from(document.querySelectorAll("[data-search-button]"));
  const searchDialog = document.querySelector("[data-search-dialog]");
  const searchClose = document.querySelector("[data-search-close]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchStatus = document.querySelector("[data-search-status]");
  const searchResults = document.querySelector("[data-search-results]");
  const toast = document.querySelector("[data-toast]");
  const address = document.querySelector("[data-address]");
  const pendingNote = document.querySelector("#pending-contacts");
  const floatingWhatsApp = document.querySelector("[data-floating-whatsapp]");
  const motionToggle = document.querySelector("[data-motion-toggle]");
  const motionStorageKey = "7-invernos-motion-paused";
  let toastTimer;
  let lastSearchTrigger;
  let allMotionPaused = readStoredMotionPreference();

  document.documentElement.classList.toggle("motion-paused", allMotionPaused);

  function readStoredMotionPreference() {
    try {
      return window.localStorage.getItem(motionStorageKey) === "true";
    } catch (_error) {
      return false;
    }
  }

  function storeMotionPreference(isPaused) {
    try {
      window.localStorage.setItem(motionStorageKey, String(isPaused));
    } catch (_error) {
      // O controle continua funcionando quando o navegador bloqueia o armazenamento local.
    }
  }

  function updateMotionControl() {
    if (!motionToggle) return;
    const label = allMotionPaused ? "Ativar animações" : "Pausar animações";
    motionToggle.setAttribute("aria-label", label);
    motionToggle.setAttribute("aria-pressed", String(allMotionPaused));
    motionToggle.title = label;
  }

  function setAllMotionPaused(isPaused, { persist = true } = {}) {
    allMotionPaused = isPaused;
    document.documentElement.classList.toggle("motion-paused", allMotionPaused);
    updateMotionControl();
    if (persist) storeMotionPreference(allMotionPaused);
    document.dispatchEvent(new CustomEvent("site-motion-change", { detail: { paused: allMotionPaused } }));
  }

  function setupMotionControl() {
    if (!motionToggle) return;
    updateMotionControl();
    motionToggle.addEventListener("click", () => setAllMotionPaused(!allMotionPaused));
  }

  const isConfigured = (value) =>
    typeof value === "string" && value.trim() !== "" && !value.startsWith("INSERIR_");

  const contactNames = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    maps: "localização",
  };

  function setupAnnouncementBar() {
    const bar = document.querySelector("[data-announcement-bar]");
    const track = bar?.querySelector("[data-marquee-track]");
    const group = bar?.querySelector("[data-announcement-group]");
    const messages = Array.isArray(siteContent.announcements) ? siteContent.announcements.filter(Boolean) : [];
    if (!bar || !track || !group || !messages.length) return;

    function fillGroup(target) {
      const items = [];
      messages.forEach((message) => {
        const text = document.createElement("span");
        const divider = document.createElement("span");
        text.className = "announcement-message";
        text.textContent = message;
        divider.className = "announcement-divider";
        divider.setAttribute("aria-hidden", "true");
        divider.textContent = "❄";
        items.push(text, divider);
      });
      target.replaceChildren(...items);
    }

    fillGroup(group);
    const clone = group.cloneNode(true);
    clone.removeAttribute("data-announcement-group");
    clone.dataset.marqueeCopy = "";
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
    bar.classList.add("is-ready");
  }

  function setupCategoryMarquee() {
    const marquee = document.querySelector("[data-category-marquee]");
    const track = marquee?.querySelector("[data-marquee-track]");
    const list = marquee?.querySelector("[data-category-list]");
    if (!marquee || !track || !list) return;

    for (let index = 0; index < 2; index += 1) {
      const clone = list.cloneNode(true);
      clone.removeAttribute("data-category-list");
      clone.dataset.marqueeCopy = "";
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("img").forEach((image) => {
        image.alt = "";
      });
      track.append(clone);
    }
    marquee.classList.add("is-ready");
  }

  function setupContinuousMarquees() {
    const desktopHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    document.querySelectorAll("[data-continuous-marquee]").forEach((marquee) => {
      let touchStartX = 0;
      let touchStartY = 0;
      let trackingTouch = false;

      const resume = () => {
        trackingTouch = false;
        marquee.classList.remove("is-touching");
      };

      marquee.addEventListener("pointerenter", (event) => {
        if (!desktopHover.matches || event.pointerType !== "mouse") return;
        marquee.classList.add("is-hovering");
      });
      marquee.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") marquee.classList.remove("is-hovering");
        resume();
      });
      marquee.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        touchStartX = event.clientX;
        touchStartY = event.clientY;
        trackingTouch = true;
      });
      marquee.addEventListener("pointermove", (event) => {
        if (!trackingTouch || event.pointerType === "mouse") return;
        const horizontalDistance = Math.abs(event.clientX - touchStartX);
        const verticalDistance = Math.abs(event.clientY - touchStartY);
        if (horizontalDistance >= 8 && horizontalDistance > verticalDistance) {
          marquee.classList.add("is-touching");
        }
      });
      marquee.addEventListener("pointerup", resume);
      marquee.addEventListener("pointercancel", resume);
      marquee.addEventListener("lostpointercapture", resume);
      marquee.addEventListener("touchend", resume, { passive: true });
      marquee.addEventListener("touchcancel", resume, { passive: true });
      document.addEventListener("pointerup", resume, { passive: true });
      document.addEventListener("pointercancel", resume, { passive: true });
      window.addEventListener("blur", resume);
    });
  }

  function setupHeroCarousel() {
    const carousel = document.querySelector("[data-hero-carousel]");
    const track = carousel?.querySelector("[data-hero-track]");
    const previous = carousel?.querySelector("[data-hero-prev]");
    const next = carousel?.querySelector("[data-hero-next]");
    const indicators = carousel?.querySelector("[data-hero-indicators]");
    const toggle = carousel?.querySelector("[data-hero-toggle]");
    const contentSlides = Array.isArray(siteContent.heroSlides) ? siteContent.heroSlides : [];
    if (!carousel || !track || !previous || !next || !indicators || !toggle || !contentSlides.length) return;

    const desktopHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const slideCount = contentSlides.length;
    let currentIndex = 0;
    let timer;
    let userPaused = false;
    let temporarilyPaused = false;
    let pointerInside = false;
    let focusInside = false;
    let inViewport = true;
    let dragStartX = 0;
    let dragStartY = 0;
    let trackingPointer = false;
    let horizontalDragging = false;

    function createSlide(slide, index) {
      const article = document.createElement("figure");
      const image = document.createElement("img");
      const overlay = document.createElement("div");
      const content = document.createElement("div");
      const introduction = document.createElement("p");
      const title = document.createElement("h2");
      const description = document.createElement("span");
      const button = document.createElement("a");

      article.className = "hero-carousel-slide";
      article.setAttribute("role", "group");
      article.setAttribute("aria-roledescription", "slide");
      article.setAttribute("aria-label", `${index + 1} de ${slideCount}`);
      article.dataset.heroSlide = "";

      image.src = slide.image;
      if (slide.srcset) {
        image.srcset = slide.srcset;
        image.sizes = "100vw";
      }
      image.width = slide.width;
      image.height = slide.height;
      image.alt = slide.alt;
      image.decoding = "async";
      image.loading = index === 0 ? "eager" : "lazy";
      image.style.objectPosition = slide.position || "center";
      if (index === 0) image.fetchPriority = "high";

      overlay.className = "hero-carousel-overlay";
      overlay.setAttribute("aria-hidden", "true");
      content.className = "container hero-carousel-content";
      introduction.textContent = slide.introduction;
      title.textContent = slide.title;
      description.textContent = slide.description;
      button.className = "button button-light";
      button.href = slide.href;
      button.textContent = slide.button;
      content.append(introduction, title, description, button);
      article.append(image, overlay, content);
      return article;
    }

    track.replaceChildren(...contentSlides.map(createSlide));
    const slides = Array.from(track.querySelectorAll("[data-hero-slide]"));

    contentSlides.forEach((_, index) => {
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.className = "hero-carousel-indicator";
      indicator.setAttribute("aria-label", `Ir para o destaque ${index + 1} de ${slideCount}`);
      indicator.addEventListener("click", () => {
        showSlide(index);
        resumeAfterInteraction();
      });
      indicators.append(indicator);
    });

    function updateToggle() {
      toggle.classList.toggle("is-paused", userPaused);
      toggle.setAttribute("aria-label", userPaused ? "Iniciar rotação automática" : "Pausar rotação automática");
    }

    function showSlide(index) {
      currentIndex = (index + slideCount) % slideCount;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        slide.inert = !isActive;
      });
      Array.from(indicators.children).forEach((indicator, indicatorIndex) => {
        if (indicatorIndex === currentIndex) indicator.setAttribute("aria-current", "true");
        else indicator.removeAttribute("aria-current");
      });
    }

    function stopAutoplay() {
      window.clearTimeout(timer);
    }

    function canAutoplay() {
      return !allMotionPaused && !userPaused && !temporarilyPaused && !pointerInside && !focusInside && inViewport && !document.hidden;
    }

    function scheduleAutoplay() {
      stopAutoplay();
      if (!canAutoplay()) return;
      timer = window.setTimeout(() => {
        showSlide(currentIndex + 1);
        scheduleAutoplay();
      }, 6500);
    }

    function resumeAfterInteraction() {
      stopAutoplay();
      temporarilyPaused = false;
      scheduleAutoplay();
    }

    function beginPointerInteraction() {
      stopAutoplay();
      temporarilyPaused = true;
    }

    function goManually(index) {
      showSlide(index);
      resumeAfterInteraction();
    }

    previous.addEventListener("click", () => goManually(currentIndex - 1));
    next.addEventListener("click", () => goManually(currentIndex + 1));
    carousel.addEventListener("keydown", (event) => {
      const actions = {
        ArrowLeft: () => goManually(currentIndex - 1),
        ArrowRight: () => goManually(currentIndex + 1),
        Home: () => goManually(0),
        End: () => goManually(slideCount - 1),
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    });

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest("a, button")) return;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      trackingPointer = true;
      horizontalDragging = false;
    });
    track.addEventListener("pointermove", (event) => {
      if (!trackingPointer || horizontalDragging) return;
      const horizontalDistance = Math.abs(event.clientX - dragStartX);
      const verticalDistance = Math.abs(event.clientY - dragStartY);
      if (horizontalDistance < 8 || horizontalDistance <= verticalDistance) return;
      horizontalDragging = true;
      track.classList.add("is-dragging");
      beginPointerInteraction();
      try {
        track.setPointerCapture?.(event.pointerId);
      } catch (_error) {
        // O Safari pode cancelar o ponteiro ao decidir que o gesto pertence à rolagem da página.
      }
    });
    track.addEventListener("pointerup", (event) => {
      if (!trackingPointer) return;
      trackingPointer = false;
      track.classList.remove("is-dragging");
      try {
        if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
      } catch (_error) {
        // A captura pode já ter sido liberada pelo navegador em dispositivos de toque.
      }
      const distance = event.clientX - dragStartX;
      if (horizontalDragging && Math.abs(distance) >= 45) showSlide(currentIndex + (distance < 0 ? 1 : -1));
      horizontalDragging = false;
      resumeAfterInteraction();
    });
    track.addEventListener("pointercancel", () => {
      if (!trackingPointer) return;
      trackingPointer = false;
      horizontalDragging = false;
      track.classList.remove("is-dragging");
      resumeAfterInteraction();
    });
    track.addEventListener("lostpointercapture", () => {
      if (!trackingPointer) return;
      trackingPointer = false;
      horizontalDragging = false;
      track.classList.remove("is-dragging");
      resumeAfterInteraction();
    });

    const cancelUnfinishedTouch = () => {
      if (!trackingPointer) return;
      trackingPointer = false;
      horizontalDragging = false;
      track.classList.remove("is-dragging");
      resumeAfterInteraction();
    };
    document.addEventListener("touchend", cancelUnfinishedTouch, { passive: true });
    document.addEventListener("touchcancel", cancelUnfinishedTouch, { passive: true });
    window.addEventListener("blur", cancelUnfinishedTouch);

    // Toques podem gerar eventos de mouse de compatibilidade sem um "leave" correspondente.
    // Por isso, a pausa por hover só responde a um ponteiro de mouse realmente capaz de hover.
    carousel.addEventListener("pointerenter", (event) => {
      if (!desktopHover.matches || event.pointerType !== "mouse") return;
      pointerInside = true;
      stopAutoplay();
    });
    carousel.addEventListener("pointerleave", (event) => {
      if (!desktopHover.matches || event.pointerType !== "mouse") return;
      pointerInside = false;
      scheduleAutoplay();
    });
    carousel.addEventListener("focusin", (event) => {
      focusInside = event.target.matches(":focus-visible");
      if (focusInside) stopAutoplay();
    });
    carousel.addEventListener("focusout", () => {
      window.setTimeout(() => {
        focusInside = carousel.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
        scheduleAutoplay();
      }, 0);
    });

    const resetHoverState = () => {
      if (desktopHover.matches) return;
      pointerInside = false;
      scheduleAutoplay();
    };
    if (typeof desktopHover.addEventListener === "function") desktopHover.addEventListener("change", resetHoverState);
    else desktopHover.addListener(resetHoverState);

    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      temporarilyPaused = false;
      updateToggle();
      scheduleAutoplay();
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stopAutoplay() : scheduleAutoplay()));
    document.addEventListener("site-motion-change", (event) => (event.detail.paused ? stopAutoplay() : scheduleAutoplay()));

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          inViewport = entry.isIntersecting;
          if (inViewport) scheduleAutoplay();
          else stopAutoplay();
        },
        { threshold: 0.25 },
      );
      observer.observe(carousel);
    }

    showSlide(0);
    updateToggle();
    scheduleAutoplay();
  }

  function showStatus(message) {
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  function configureCommercialLinks() {
    let hasPendingLink = false;

    document.querySelectorAll("[data-link]").forEach((link) => {
      const key = link.dataset.link;
      const url = config[key];

      if (isConfigured(url)) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        return;
      }

      hasPendingLink = true;
      link.dataset.pending = "true";
      link.setAttribute("aria-describedby", "pending-contacts");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showStatus(`O link de ${contactNames[key]} ainda precisa ser configurado antes da publicação.`);
      });
    });

    if (hasPendingLink && pendingNote) pendingNote.hidden = false;
    if (address && isConfigured(config.address)) address.textContent = config.address;
  }

  function setMenuState(isOpen, { returnFocus = false } = {}) {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    navigation.classList.toggle("is-open", isOpen);
    menuOverlay?.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-is-open", isOpen);

    if (isOpen) window.setTimeout(() => menuClose?.focus(), 0);
    else if (returnFocus) menuButton.focus();
  }

  function setupMobileMenu() {
    if (!menuButton || !navigation) return;

    menuButton.addEventListener("click", () => {
      setMenuState(menuButton.getAttribute("aria-expanded") !== "true");
    });
    menuClose?.addEventListener("click", () => setMenuState(false, { returnFocus: true }));
    menuOverlay?.addEventListener("click", () => setMenuState(false, { returnFocus: true }));

    navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("keydown", (event) => {
      if (!navigation.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenuState(false, { returnFocus: true });
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        navigation.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.matchMedia("(min-width: 800px)").addEventListener("change", (event) => {
      if (event.matches) setMenuState(false);
    });
  }

  function normalizeText(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function setupSiteSearch() {
    if (!searchButtons.length || !searchDialog || !searchInput || !searchStatus || !searchResults) return;

    const sections = Array.from(document.querySelectorAll("main > section[data-search-title]")).map((section) => {
      const description = section.querySelector("p:not(.eyebrow)")?.textContent.trim() || "";
      return {
        id: section.id,
        title: section.dataset.searchTitle,
        description,
        searchableText: normalizeText(
          `${section.dataset.searchTitle} ${section.dataset.searchKeywords || ""} ${section.textContent}`,
        ),
      };
    });

    function closeSearch() {
      if (typeof searchDialog.close === "function" && searchDialog.open) searchDialog.close();
      else searchDialog.removeAttribute("open");
    }

    function renderResults() {
      const query = normalizeText(searchInput.value);
      searchResults.replaceChildren();

      if (query.length < 2) {
        searchStatus.textContent = "Digite pelo menos dois caracteres para começar.";
        return;
      }

      const terms = query.split(" ").filter(Boolean);
      const matches = sections.filter((section) => terms.every((term) => section.searchableText.includes(term)));
      searchStatus.textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? "resultado encontrado" : "resultados encontrados"}.`
        : "Nenhum conteúdo encontrado. Tente buscar por aluguel, destino, atendimento ou localização.";

      matches.forEach((match) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const title = document.createElement("strong");
        const description = document.createElement("small");

        link.href = `#${match.id}`;
        title.textContent = match.title;
        description.textContent =
          match.description.length > 135 ? `${match.description.slice(0, 132).trim()}…` : match.description;
        link.append(title, description);
        link.addEventListener("click", closeSearch);
        item.append(link);
        searchResults.append(item);
      });
    }

    searchButtons.forEach((button) => {
      button.addEventListener("click", () => {
        lastSearchTrigger = button;
        setMenuState(false);
        searchInput.value = "";
        renderResults();

        if (typeof searchDialog.showModal === "function") searchDialog.showModal();
        else searchDialog.setAttribute("open", "");
        window.setTimeout(() => searchInput.focus(), 0);
      });
    });

    searchClose?.addEventListener("click", closeSearch);
    searchDialog.addEventListener("click", (event) => {
      if (event.target === searchDialog) closeSearch();
    });
    searchDialog.addEventListener("close", () => lastSearchTrigger?.focus());
    searchInput.addEventListener("input", renderResults);
  }

  function setupActiveNavigation() {
    if (!("IntersectionObserver" in window)) return;

    const links = new Map(
      Array.from(document.querySelectorAll('.site-navigation > a[href^="#"]')).map((link) => [
        link.getAttribute("href").slice(1),
        link,
      ]),
    );
    const sections = Array.from(links.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        links.forEach((link, id) => {
          if (id === visible.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-25% 0px -60%", threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
  }

  function setupCarousel(carousel) {
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previous = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const indicators = carousel.querySelector("[data-carousel-indicators]");
    if (!viewport || !slides.length || !previous || !next || !indicators) return;

    let currentIndex = 0;
    let maxStartIndex = slides.length - 1;
    let scrollFrame;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;

    function getMetrics() {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const styles = window.getComputedStyle(viewport);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const visibleCount = Math.max(1, Math.floor((viewport.clientWidth + gap) / (slideWidth + gap) + 0.05));
      return { slideWidth, gap, visibleCount };
    }

    function updateControls() {
      previous.disabled = currentIndex <= 0;
      next.disabled = currentIndex >= maxStartIndex;
      Array.from(indicators.children).forEach((indicator, index) => {
        if (index === currentIndex) indicator.setAttribute("aria-current", "true");
        else indicator.removeAttribute("aria-current");
      });
    }

    function scrollToIndex(index, behavior = "smooth") {
      const { slideWidth, gap } = getMetrics();
      currentIndex = Math.max(0, Math.min(index, maxStartIndex));
      viewport.scrollTo({ left: currentIndex * (slideWidth + gap), behavior });
      updateControls();
    }

    function renderIndicators() {
      const { visibleCount } = getMetrics();
      maxStartIndex = Math.max(0, slides.length - visibleCount);
      currentIndex = Math.min(currentIndex, maxStartIndex);
      indicators.replaceChildren();

      for (let index = 0; index <= maxStartIndex; index += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "carousel-indicator";
        button.setAttribute("aria-label", `Ir para a posição ${index + 1} do carrossel`);
        button.addEventListener("click", () => scrollToIndex(index));
        indicators.append(button);
      }
      updateControls();
    }

    function syncToScroll() {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const { slideWidth, gap } = getMetrics();
        currentIndex = Math.max(0, Math.min(Math.round(viewport.scrollLeft / (slideWidth + gap)), maxStartIndex));
        updateControls();
      });
    }

    previous.addEventListener("click", () => scrollToIndex(currentIndex - 1));
    next.addEventListener("click", () => scrollToIndex(currentIndex + 1));
    viewport.addEventListener("scroll", syncToScroll, { passive: true });
    viewport.addEventListener("keydown", (event) => {
      const actions = {
        ArrowLeft: () => scrollToIndex(currentIndex - 1),
        ArrowRight: () => scrollToIndex(currentIndex + 1),
        Home: () => scrollToIndex(0),
        End: () => scrollToIndex(maxStartIndex),
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    });

    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartScroll = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      viewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });
    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      syncToScroll();
    };
    viewport.addEventListener("pointerup", finishDrag);
    viewport.addEventListener("pointercancel", finishDrag);

    renderIndicators();
    if ("ResizeObserver" in window) new ResizeObserver(renderIndicators).observe(viewport);
    else window.addEventListener("resize", renderIndicators);
  }

  function setupRevealAnimations() {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!elements.length || reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
  }

  function setupFloatingWhatsApp() {
    if (!floatingWhatsApp || !("IntersectionObserver" in window)) return;

    const visibility = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.isIntersecting));
      floatingWhatsApp.classList.toggle("is-hidden", Array.from(visibility.values()).some(Boolean));
    });
    [document.querySelector("#contato"), document.querySelector(".site-footer")]
      .filter(Boolean)
      .forEach((element) => {
        visibility.set(element, false);
        observer.observe(element);
      });
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  setupAnnouncementBar();
  setupCategoryMarquee();
  setupContinuousMarquees();
  setupHeroCarousel();
  setupMotionControl();
  configureCommercialLinks();
  setupMobileMenu();
  setupSiteSearch();
  setupActiveNavigation();
  document.querySelectorAll("[data-carousel]").forEach(setupCarousel);
  setupRevealAnimations();
  setupFloatingWhatsApp();
})();
