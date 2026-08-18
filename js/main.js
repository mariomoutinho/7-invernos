(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const menuButton = document.querySelector("[data-menu-button]");
  const menuOverlay = document.querySelector("[data-menu-overlay]");
  const navigation = document.querySelector("[data-navigation]");
  const searchButton = document.querySelector("[data-search-button]");
  const searchDialog = document.querySelector("[data-search-dialog]");
  const searchClose = document.querySelector("[data-search-close]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchStatus = document.querySelector("[data-search-status]");
  const searchResults = document.querySelector("[data-search-results]");
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
    menuOverlay?.classList.remove("is-open");
    document.body.classList.remove("menu-is-open");

    if (returnFocus) menuButton.focus();
  }

  function setupMobileMenu() {
    if (!menuButton || !navigation) return;

    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
      navigation.classList.toggle("is-open", willOpen);
      menuOverlay?.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-is-open", willOpen);
    });

    menuOverlay?.addEventListener("click", () => closeMenu({ returnFocus: true }));

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) {
        closeMenu({ returnFocus: true });
      }
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
    if (!searchButton || !searchDialog || !searchInput || !searchStatus || !searchResults) return;

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
        link.addEventListener("click", () => searchDialog.close());
        item.append(link);
        searchResults.append(item);
      });
    }

    searchButton.addEventListener("click", () => {
      closeMenu();
      searchInput.value = "";
      renderResults();

      if (typeof searchDialog.showModal === "function") searchDialog.showModal();
      else searchDialog.setAttribute("open", "");

      window.setTimeout(() => searchInput.focus(), 0);
    });

    searchClose?.addEventListener("click", () => searchDialog.close());
    searchDialog.addEventListener("click", (event) => {
      if (event.target === searchDialog) searchDialog.close();
    });
    searchInput.addEventListener("input", renderResults);
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
  setupSiteSearch();
  setupActiveNavigation();
})();
