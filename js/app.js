(function () {
  var state = {
    view: "menu",
    themeId: null,
    show: {
      order: [],
      index: 0,
      showWord: false,
      confirmReset: false,
      confirmExit: false
    },
    print: {
      count: 24,
      countText: "24",
      cards: [],
      showKey: false,
      confirmCreate: false,
      confirmCreateAt: 0,
      changedAt: 0
    }
  };

  var CONFIRM_MS = 400;
  var preloaded = [];
  var preloadedSrc = {};

  function themes() {
    return window.BINGO_THEMES || [];
  }

  function currentTheme() {
    var list = themes();
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === state.themeId) {
        return list[i];
      }
    }
    return list[0] || null;
  }

  function pictureSrc(theme, pair) {
    var base = theme.base || "";
    if (base && base.charAt(base.length - 1) !== "/") {
      base += "/";
    }
    return base + pair.image;
  }

  function preloadPicture(theme, pair) {
    if (!theme || !pair) {
      return;
    }
    var src = pictureSrc(theme, pair);
    if (preloadedSrc[src]) {
      return;
    }
    preloadedSrc[src] = true;
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    preloaded.push(img);
  }

  function cardsReadyText(count) {
    if (count === 1) {
      return "1 bricka är klar.";
    }
    return count + " brickor är klara.";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var key;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) {
          continue;
        }
        if (key === "class") {
          node.className = attrs[key];
        } else if (key === "text") {
          node.textContent = attrs[key];
        } else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else if (attrs[key] != null && attrs[key] !== false) {
          node.setAttribute(key, String(attrs[key]));
        }
      }
    }
    (children || []).forEach(function (child) {
      if (child == null || child === false) {
        return;
      }
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function arrowIcon(direction) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    path.setAttribute("d", direction === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function render() {
    var theme = currentTheme();
    if (!state.themeId && theme) {
      state.themeId = theme.id;
    }
    var focusKey = null;
    var active = document.activeElement;
    if (active && active.getAttribute) {
      focusKey = active.getAttribute("data-focus");
    }
    var countInput = document.getElementById("card-count");
    if (countInput) {
      state.print.countText = countInput.value;
    }
    var scrollY = window.scrollY;
    document.body.classList.remove("view-menu", "view-show", "view-print");
    document.body.classList.add("view-" + state.view);
    var app = document.getElementById("app");
    app.textContent = "";
    if (state.view === "show") {
      app.appendChild(renderShow());
    } else if (state.view === "print") {
      app.appendChild(renderPrint());
    } else {
      app.appendChild(renderMenu());
    }
    if (focusKey && /^[a-z0-9-]+$/.test(focusKey)) {
      var again = document.querySelector('[data-focus="' + focusKey + '"]');
      if (again) {
        again.focus();
      }
    }
    if (state.view !== "show" && scrollY) {
      window.scrollTo(0, scrollY);
    }
  }

  function renderMenu() {
    var list = themes();
    var theme = currentTheme();
    var errors = theme ? window.Bingo.validateTheme(theme) : ["Inga teman är laddade."];
    var ready = theme && errors.length === 0;
    var wrap = el("main", { class: "menu" });
    wrap.appendChild(el("p", { class: "eyebrow", text: "För klassrummet" }));
    wrap.appendChild(el("h1", { text: "Rim-bingo" }));
    wrap.appendChild(el("p", {
      class: "lead",
      text: "Barnen har en bricka med rimord. Du visar en bild, till exempel en katt, och de letar efter ordet som rimmar: hatt."
    }));

    if (list.length > 1) {
      var picker = el("label", { class: "theme-picker", text: "Tema" });
      var select = el("select", { id: "theme-select", "data-focus": "theme" });
      list.forEach(function (item) {
        var option = el("option", { value: item.id, text: item.title });
        if (theme && item.id === theme.id) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        state.themeId = select.value;
        render();
      });
      picker.appendChild(select);
      wrap.appendChild(picker);
    } else if (theme) {
      wrap.appendChild(el("p", { class: "theme-name", text: "Tema: " + theme.title }));
    }

    if (!ready) {
      var box = el("div", { class: "errors" });
      errors.forEach(function (message) {
        box.appendChild(el("p", { text: message }));
      });
      wrap.appendChild(box);
    }

    wrap.appendChild(el("div", { class: "actions" }, [
      el("button", {
        class: "button primary",
        type: "button",
        disabled: ready ? null : "disabled",
        onclick: startShow,
        text: "Visa bilder"
      }),
      el("button", {
        class: "button",
        type: "button",
        disabled: ready ? null : "disabled",
        onclick: openPrint,
        text: "Skriv ut brickor"
      })
    ]));
    wrap.appendChild(el("p", {
      class: "hint",
      text: "Tryck på bilden, pilarna eller mellanslag för nästa. Pil vänster går tillbaka. T visar ordet på den stora bilden."
    }));
    return wrap;
  }

  function renderShow() {
    var theme = currentTheme();
    var order = state.show.order;
    var index = state.show.index;
    var atEnd = index >= order.length;
    var current = atEnd ? null : order[index];
    var past = order.slice(0, index);
    var screen = el("section", { class: "show" });

    var counter = el("p", {
      class: "counter",
      "aria-live": "polite",
      text: atEnd ? "Slut" : (index + 1) + " / " + order.length
    });
    var wordButton = el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "word",
      "aria-pressed": state.show.showWord ? "true" : "false",
      onclick: toggleWord,
      text: state.show.showWord ? "Dölj ordet" : "Visa ordet"
    });
    var resetButton = el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "reset",
      onclick: newRound,
      text: state.show.confirmReset ? "Blanda om nu?" : "Ny omgång"
    });
    var exitButton = el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "exit",
      onclick: leaveShow,
      text: state.show.confirmExit ? "Avsluta?" : "Meny"
    });
    screen.appendChild(el("header", { class: "topbar" }, [counter, el("div", { class: "top-actions" }, [wordButton, resetButton, exitButton])]));

    var wordSlot = el("div", { class: "word-slot" });
    if (!atEnd && state.show.showWord) {
      wordSlot.appendChild(el("p", { class: "word-pill", text: current.call.toLocaleUpperCase("sv") }));
    }

    var stageChildren = [];
    if (atEnd) {
      stageChildren.push(el("div", { class: "slut" }, [
        el("h2", { text: "Slut!" }),
        el("p", { text: "Har någon bingo?" })
      ]));
    } else {
      stageChildren.push(el("img", {
        src: pictureSrc(theme, current),
        alt: current.call,
        draggable: "false"
      }));
    }
    stageChildren.push(wordSlot);

    var stage = el("div", { class: atEnd ? "stage is-end" : "stage" }, stageChildren);

    function stopAnd(action) {
      return function (event) {
        event.stopPropagation();
        action();
      };
    }

    var prevButton = el("button", {
      class: "nav prev",
      type: "button",
      "aria-label": "Föregående bild",
      onclick: stopAnd(prev)
    }, [arrowIcon("left")]);
    var nextButton = el("button", {
      class: "nav next",
      type: "button",
      "aria-label": "Nästa bild",
      onclick: stopAnd(next)
    }, [arrowIcon("right")]);
    if (index <= 0) {
      prevButton.disabled = true;
    }
    if (atEnd) {
      nextButton.disabled = true;
    }

    var pictureRow = el("div", { class: "picture-row" }, [prevButton, stage, nextButton]);
    pictureRow.addEventListener("click", function () {
      if (!atEnd) {
        next();
      }
    });
    screen.appendChild(pictureRow);

    var row = el("div", { class: "history-row" });
    past.forEach(function (pair) {
      row.appendChild(el("div", { class: "thumb" }, [
        el("img", {
          src: pictureSrc(theme, pair),
          alt: "",
          draggable: "false"
        })
      ]));
    });
    var history = el("div", {
      class: "history",
      "aria-label": "Redan visade bilder"
    }, [row]);
    history.addEventListener("click", function (event) {
      event.stopPropagation();
    });
    screen.appendChild(history);
    if (order[index + 1]) {
      preloadPicture(theme, order[index + 1]);
    }
    if (order[index + 2]) {
      preloadPicture(theme, order[index + 2]);
    }
    return screen;
  }

  function renderPrint() {
    var theme = currentTheme();
    var page = el("main", { class: "print-page" });
    var controls = el("div", { class: "no-print print-controls" });
    controls.appendChild(el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "print-menu",
      onclick: function () {
        state.print.confirmCreate = false;
        state.view = "menu";
        render();
        window.scrollTo(0, 0);
      },
      text: "Meny"
    }));
    controls.appendChild(el("h1", { text: "Skriv ut brickor" }));
    controls.appendChild(el("p", {
      class: "lead",
      text: "Varje bricka får samma 25 rimord, men i en egen ordning. Först med fem i rad vinner. Utskriften lägger två brickor på varje ark."
    }));

    var countLabel = el("label", { class: "count-label", text: "Antal brickor" });
    var countInput = el("input", {
      id: "card-count",
      type: "number",
      min: "1",
      max: "60",
      inputmode: "numeric",
      value: state.print.countText,
      "data-focus": "count"
    });
    countInput.addEventListener("wheel", function (event) {
      event.preventDefault();
    }, { passive: false });
    countLabel.appendChild(countInput);
    controls.appendChild(countLabel);

    controls.appendChild(el("div", { class: "actions" }, [
      el("button", {
        class: "button primary",
        type: "button",
        "data-focus": "create",
        onclick: createCards,
        text: state.print.confirmCreate ? "Ersätt brickorna?" : "Skapa brickor"
      }),
      el("button", {
        class: "button",
        type: "button",
        "data-focus": "print-cards",
        disabled: state.print.cards.length ? null : "disabled",
        onclick: printCards,
        text: "Skriv ut brickor"
      }),
      el("button", {
        class: "button",
        type: "button",
        "data-focus": "key",
        onclick: toggleKey,
        text: state.print.showKey ? "Dölj lärarblad" : "Visa lärarblad"
      }),
      el("button", {
        class: "button",
        type: "button",
        "data-focus": "print-key",
        onclick: printKey,
        text: "Skriv ut lärarblad"
      })
    ]));
    if (state.print.cards.length) {
      controls.appendChild(el("p", { class: "hint", text: cardsReadyText(state.print.cards.length) }));
    }
    page.appendChild(controls);
    page.appendChild(renderKey(theme));

    var cards = el("div", { class: "cards" });
    var i;
    for (i = 0; i < state.print.cards.length; i += 2) {
      cards.appendChild(renderCardPair(state.print.cards[i], state.print.cards[i + 1]));
    }
    page.appendChild(cards);
    return page;
  }

  function renderCardPair(top, bottom) {
    var pair = el("div", { class: "card-pair" }, [renderCard(top)]);
    if (bottom) {
      pair.appendChild(renderCard(bottom));
    }
    return pair;
  }

  function renderCard(card) {
    var grid = el("div", { class: "grid" });
    card.cells.forEach(function (cell) {
      grid.appendChild(el("div", { class: "cell" }, [
        el("img", {
          src: pictureSrc(currentTheme(), { image: cell.image }),
          alt: "",
          draggable: "false"
        }),
        el("span", { text: cell.word.toLocaleUpperCase("sv") })
      ]));
    });
    return el("article", { class: "bingo-card" }, [grid]);
  }

  function renderKey(theme) {
    var sheet = el("section", { class: state.print.showKey ? "key-sheet is-visible" : "key-sheet" });
    sheet.appendChild(el("h2", { text: "Lärarblad · " + theme.title }));
    sheet.appendChild(el("p", { text: "Till vänster är bilden du visar. Till höger är bilden och ordet på brickan." }));
    var list = el("ul", { class: "key-list" });
    var pairs = theme.pairs.slice().sort(function (a, b) {
      return a.call.localeCompare(b.call, "sv");
    });
    pairs.forEach(function (pair) {
      list.appendChild(el("li", {}, [
        el("img", { src: pictureSrc(theme, pair), alt: "", draggable: "false" }),
        el("span", { class: "call", text: pair.call.toLocaleUpperCase("sv") }),
        el("span", { class: "to", text: "→" }),
        el("img", {
          class: "match",
          src: pictureSrc(theme, { image: pair.cardImage }),
          alt: "",
          draggable: "false"
        }),
        el("strong", { text: pair.card.toLocaleUpperCase("sv") })
      ]));
    });
    sheet.appendChild(list);
    return sheet;
  }

  function startShow() {
    var theme = currentTheme();
    if (!theme || window.Bingo.validateTheme(theme).length) {
      return;
    }
    state.show.order = window.Bingo.shuffle(theme.pairs);
    state.show.index = 0;
    state.show.showWord = false;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    state.view = "show";
    render();
  }

  function leaveShow() {
    var now = Date.now();
    if (!state.show.confirmExit) {
      state.show.confirmExit = true;
      state.show.confirmExitAt = now;
      state.show.confirmReset = false;
      render();
      return;
    }
    if (now - state.show.confirmExitAt < CONFIRM_MS) {
      return;
    }
    state.view = "menu";
    render();
    window.scrollTo(0, 0);
  }

  function next() {
    if (state.view !== "show") {
      return;
    }
    if (state.show.index >= state.show.order.length) {
      return;
    }
    state.show.index += 1;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
  }

  function prev() {
    if (state.view !== "show") {
      return;
    }
    if (state.show.index <= 0) {
      return;
    }
    state.show.index -= 1;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
  }

  function toggleWord() {
    state.show.showWord = !state.show.showWord;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
  }

  function newRound() {
    var now = Date.now();
    if (!state.show.confirmReset) {
      state.show.confirmReset = true;
      state.show.confirmResetAt = now;
      state.show.confirmExit = false;
      render();
      return;
    }
    if (now - state.show.confirmResetAt < CONFIRM_MS) {
      return;
    }
    state.show.order = window.Bingo.shuffle(currentTheme().pairs);
    state.show.index = 0;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
  }

  function openPrint() {
    var theme = currentTheme();
    if (!theme || window.Bingo.validateTheme(theme).length) {
      return;
    }
    state.print.confirmCreate = false;
    state.view = "print";
    render();
    window.scrollTo(0, 0);
  }

  function readCount() {
    var raw = state.print.countText;
    var input = document.getElementById("card-count");
    if (input) {
      raw = input.value;
    }
    var count = parseInt(raw, 10);
    if (!count || count < 1) {
      count = 1;
    }
    if (count > 60) {
      count = 60;
    }
    state.print.count = count;
    state.print.countText = String(count);
    if (input) {
      input.value = state.print.countText;
    }
    return count;
  }

  function createCards() {
    var now = Date.now();
    var theme = currentTheme();
    if (!theme || window.Bingo.validateTheme(theme).length) {
      return;
    }
    if (state.print.cards.length && !state.print.confirmCreate) {
      if (now - state.print.changedAt < CONFIRM_MS) {
        return;
      }
      state.print.confirmCreate = true;
      state.print.confirmCreateAt = now;
      render();
      return;
    }
    if (state.print.confirmCreate && now - state.print.confirmCreateAt < CONFIRM_MS) {
      return;
    }
    var count = readCount();
    var cards = [];
    var seen = {};
    var guard = 0;
    var card;
    var key;
    while (cards.length < count && guard < count * 30) {
      guard += 1;
      card = window.Bingo.makeCard(theme, window.Bingo.randomSeed());
      key = card.cells.map(function (cell) {
        return cell.word;
      }).join("\n");
      if (seen[key]) {
        continue;
      }
      seen[key] = true;
      cards.push(card);
    }
    state.print.cards = cards;
    state.print.confirmCreate = false;
    state.print.changedAt = Date.now();
    render();
  }

  function toggleKey() {
    state.print.confirmCreate = false;
    state.print.showKey = !state.print.showKey;
    render();
    if (state.print.showKey) {
      var sheet = document.querySelector(".key-sheet");
      if (sheet && sheet.scrollIntoView) {
        sheet.scrollIntoView({ block: "nearest" });
      }
    }
  }

  function printCards() {
    if (!state.print.cards.length) {
      return;
    }
    document.body.classList.add("printing-cards");
    document.body.classList.remove("printing-key");
    window.print();
  }

  function printKey() {
    document.body.classList.add("printing-key");
    document.body.classList.remove("printing-cards");
    window.print();
  }

  function typingTarget(target) {
    if (!target || !target.tagName) {
      return false;
    }
    var tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function controlTarget(target) {
    return !!(target && target.closest && target.closest("button, a"));
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (state.view === "show") {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        prev();
        return;
      }
      if ((event.key === " " || event.key === "Enter") && !typingTarget(event.target) && !controlTarget(event.target)) {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "Escape") {
        state.view = "menu";
        render();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        toggleWord();
      }
      return;
    }
    if (event.key === "Escape" && state.view === "print") {
      state.view = "menu";
      render();
    }
  }

  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing-cards", "printing-key");
  });

  if ((location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  render();
})();
