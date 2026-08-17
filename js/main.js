(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const menuButton = document.querySelector("[data-menu-button]");
  const navigation = document.querySelector("[data-navigation]");
  const toast = document.querySelector("[data-toast]");
  const address = document.querySelector("[data-address]");
  const pendingNote = document.querySelector("#pending-contacts");
  let toastTimer;

  const isConfigured = (value) =>
    typeof value === "string" && value.trim() !== "" && !value.startsWith("INSERIR_");

  const contactNames = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    maps: "localização",
  };

  function showStatus(message) {
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 4200);
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

    if (hasPendingLink && pendingNote) {
      pendingNote.hidden = false;
    }

    if (address && isConfigured(config.address)) {
      address.textContent = config.address;
    }
  }

  function closeMenu({ returnFocus = false } = {}) {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
    navigation.classList.remove("is-open");

    if (returnFocus) menuButton.focus();
  }

  function setupMobileMenu() {
    if (!menuButton || !navigation) return;

    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
      navigation.classList.toggle("is-open", willOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) {
        closeMenu({ returnFocus: true });
      }
    });

    window.matchMedia("(min-width: 800px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  function setupActiveNavigation() {
    if (!("IntersectionObserver" in window)) return;

    const links = new Map(
      Array.from(document.querySelectorAll('.site-navigation a[href^="#"]:not(.nav-cta)')).map((link) => [
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

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  configureCommercialLinks();
  setupMobileMenu();
  setupActiveNavigation();
})();
