(function () {
  var state = {
    view: "menu",
    themeId: null,
    show: {
      order: [],
      index: 0,
      revealed: -1,
      spin: null,
      drawnOpen: false,
      showWord: false,
      confirmReset: false,
      confirmExit: false
    },
    print: {
      countText: "24",
      cards: [],
      showKey: false,
      confirmCreate: false,
      confirmCreateAt: 0,
      changedAt: 0
    }
  };

  var CONFIRM_MS = 400;
  var MAX_CARDS = 60;
  var SPIN_NUMBER_MS = 1200;
  var SPIN_SYMBOL_MS = 1900;
  var COPY_ROWS = {
    1: [1],
    2: [2],
    3: [2, 1],
    4: [2, 2],
    5: [3, 2],
    6: [3, 3],
    7: [2, 3, 2],
    8: [3, 2, 3],
    9: [3, 3, 3],
    10: [3, 4, 3]
  };
  var preloaded = {};
  var spinToken = 0;
  var pendingSpins = [];

  function themes() {
    return window.BINGO_THEMES || [];
  }

  function isSlot(theme) {
    return window.Bingo.isSlot(theme);
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
    return theme.base.replace(/\/?$/, "/") + pair.image;
  }

  function preloadPicture(theme, pair) {
    if (!theme || !pair) {
      return;
    }
    var src = pictureSrc(theme, pair);
    if (preloaded[src]) {
      return;
    }
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    preloaded[src] = img;
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
    document.body.classList.toggle("kind-slot", isSlot(theme));
    if (theme && theme.heading) {
      document.title = theme.heading;
    }
    var app = document.getElementById("app");
    app.textContent = "";
    if (state.view === "show") {
      app.appendChild(renderShow());
    } else if (state.view === "print") {
      app.appendChild(renderPrint());
    } else {
      app.appendChild(renderMenu());
    }
    runPendingSpins();
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
    wrap.appendChild(el("h1", { text: (theme && theme.heading) || "Bingo" }));
    if (theme && theme.lead) {
      wrap.appendChild(el("p", { class: "lead", text: theme.lead }));
    }

    if (list.length > 1) {
      var picker = el("label", { class: "theme-picker", text: "Tema" });
      var select = el("select", { id: "theme-select", "data-focus": "theme" });
      list.slice().sort(function (a, b) {
        return a.title.localeCompare(b.title, "sv");
      }).forEach(function (item) {
        var option = el("option", { value: item.id, text: item.title });
        if (theme && item.id === theme.id) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        state.themeId = select.value;
        state.print.cards = [];
        state.print.confirmCreate = false;
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
    if (theme && theme.hint) {
      wrap.appendChild(el("p", { class: "hint", text: theme.hint }));
    }
    return wrap;
  }

  function renderShow() {
    var theme = currentTheme();
    var slot = isSlot(theme);
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
    var wordButton = slot ? el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "drawn",
      "aria-pressed": state.show.drawnOpen ? "true" : "false",
      onclick: toggleDrawn,
      text: state.show.drawnOpen ? "Stäng dragna" : "Dragna"
    }) : el("button", {
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
    var soundOn = !window.BingoSound.isMuted();
    var soundButton = theme.sound ? el("button", {
      class: "ghost",
      type: "button",
      "data-focus": "sound",
      "aria-pressed": soundOn ? "true" : "false",
      onclick: toggleSound,
      text: soundOn ? "Ljud på" : "Ljud av"
    }) : null;
    screen.appendChild(el("header", { class: "topbar" }, [counter, el("div", { class: "top-actions" }, [soundButton, wordButton, resetButton, exitButton])]));

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
    } else if (slot) {
      stageChildren.push(renderSlotMachine(theme, current));
    } else {
      stageChildren.push(el("img", {
        src: pictureSrc(theme, current),
        alt: current.call,
        draggable: "false"
      }));
    }
    if (!slot) {
      stageChildren.push(wordSlot);
    }

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
    past.forEach(function (item) {
      row.appendChild(el("div", { class: "thumb" }, [
        el("img", {
          src: pictureSrc(theme, slot ? item.symbol : item),
          alt: "",
          draggable: "false"
        }),
        slot ? el("span", { class: "badge", text: String(item.number) }) : null
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
    if (slot) {
      if (state.show.drawnOpen) {
        screen.appendChild(renderDrawn(theme));
      }
      return screen;
    }
    if (order[index + 1]) {
      preloadPicture(theme, order[index + 1]);
    }
    if (order[index + 2]) {
      preloadPicture(theme, order[index + 2]);
    }
    return screen;
  }

  function renderSlotMachine(theme, combo) {
    var spin = state.show.spin;
    var elapsed = spin ? Date.now() - spin.startedAt : 0;
    var spinning = !!spin;
    var machine = el("div", {
      class: "slot-machine",
      role: "img",
      "aria-label": spinning ? "Hjulen snurrar" : combo.number + " " + combo.symbol.name
    }, [
      renderReel("reel-number", spinning ? spin.numbers : [combo.number], SPIN_NUMBER_MS, elapsed, function (value) {
        return el("span", { class: String(value).length > 1 ? "reel-digit is-wide" : "reel-digit", text: String(value) });
      }),
      renderReel("reel-symbol", spinning ? spin.symbols : [combo.symbol], SPIN_SYMBOL_MS, elapsed, function (symbol) {
        return el("img", { src: pictureSrc(theme, symbol), alt: "", draggable: "false" });
      })
    ]);
    return machine;
  }

  function renderReel(kind, items, duration, elapsed, renderItem) {
    var moving = items.length > 1 && elapsed < duration;
    var shown = moving ? items : [items.length > 1 ? items[items.length - 2] : items[0]];
    var strip = el("div", { class: moving ? "reel-strip is-spinning" : "reel-strip", style: "--n: " + shown.length });
    shown.forEach(function (item) {
      strip.appendChild(el("div", { class: "reel-item" }, [renderItem(item)]));
    });
    if (moving) {
      pendingSpins.push({
        strip: strip,
        end: -100 * (shown.length - 2) / shown.length,
        duration: duration,
        elapsed: elapsed
      });
    }
    return el("div", { class: "reel " + kind }, [strip]);
  }

  function runPendingSpins() {
    var spins = pendingSpins;
    pendingSpins = [];
    spins.forEach(function (spin) {
      if (!spin.strip.animate) {
        return;
      }
      spin.strip.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(" + spin.end + "%)" }
      ], {
        duration: spin.duration,
        delay: -spin.elapsed,
        easing: "cubic-bezier(0.2, 0.75, 0.3, 1.04)",
        fill: "both"
      });
    });
  }

  function cyclicStrip(values, startIndex, targetIndex, loops) {
    var items = [];
    var i = startIndex;
    var steps = 0;
    while (true) {
      items.push(values[i]);
      if (steps >= loops * values.length && i === targetIndex) {
        break;
      }
      i = (i + 1) % values.length;
      steps += 1;
    }
    items.push(values[(targetIndex + 1) % values.length]);
    return items;
  }

  function startSpinIfNeeded() {
    var theme = currentTheme();
    var index = state.show.index;
    var order = state.show.order;
    if (!isSlot(theme) || index >= order.length || index <= state.show.revealed) {
      return;
    }
    if (reducedMotion()) {
      state.show.revealed = index;
      return;
    }
    var numbers = [];
    var n;
    for (n = theme.numbers.min; n <= theme.numbers.max; n += 1) {
      numbers.push(n);
    }
    var target = order[index];
    var before = order[index - 1];
    var symbolIndex = theme.symbols.indexOf(target.symbol);
    var token = spinToken + 1;
    spinToken = token;
    state.show.spin = {
      token: token,
      startedAt: Date.now(),
      numbers: cyclicStrip(
        numbers,
        before ? before.number - theme.numbers.min : Math.floor(Math.random() * numbers.length),
        target.number - theme.numbers.min,
        2
      ),
      symbols: cyclicStrip(
        theme.symbols,
        before ? theme.symbols.indexOf(before.symbol) : Math.floor(Math.random() * theme.symbols.length),
        symbolIndex,
        5
      )
    };
    if (theme.sound) {
      window.BingoSound.play(theme.sound, SPIN_SYMBOL_MS);
    }
    window.setTimeout(function () {
      if (state.view !== "show" || !state.show.spin || state.show.spin.token !== token) {
        return;
      }
      finishSpin();
      render();
    }, SPIN_SYMBOL_MS);
  }

  function finishSpin() {
    if (!state.show.spin) {
      return;
    }
    window.BingoSound.stop();
    state.show.spin = null;
    state.show.revealed = Math.max(state.show.revealed, state.show.index);
  }

  function stopSpin() {
    window.BingoSound.stop();
    state.show.spin = null;
    spinToken += 1;
  }

  function toggleSound() {
    var theme = currentTheme();
    var spin = state.show.spin;
    window.BingoSound.setMuted(!window.BingoSound.isMuted());
    if (spin && theme.sound && !window.BingoSound.isMuted()) {
      var left = SPIN_SYMBOL_MS - (Date.now() - spin.startedAt);
      if (left > 200) {
        window.BingoSound.play(theme.sound, left);
      }
    }
    render();
  }

  function drawnSoFar() {
    return state.show.order.slice(0, state.show.revealed + 1);
  }

  function renderDrawn(theme) {
    var drawn = drawnSoFar();
    var list = el("ul", { class: "drawn-list" });
    theme.symbols.forEach(function (symbol) {
      var numbers = drawn.filter(function (combo) {
        return combo.symbol === symbol;
      }).map(function (combo) {
        return combo.number;
      }).sort(function (a, b) {
        return a - b;
      });
      var numberBox = el("div", { class: "drawn-numbers" });
      if (numbers.length) {
        numbers.forEach(function (number) {
          numberBox.appendChild(el("span", { class: "drawn-number", text: String(number) }));
        });
      } else {
        numberBox.appendChild(el("span", { class: "drawn-none", text: "Inga ännu" }));
      }
      list.appendChild(el("li", {}, [
        el("img", { src: pictureSrc(theme, symbol), alt: "", draggable: "false" }),
        el("span", { class: "drawn-name", text: symbol.name.toLocaleUpperCase("sv") }),
        numberBox
      ]));
    });
    var panel = el("div", {
      class: "drawn-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Dragna"
    }, [
      el("h2", { text: "Dragna" }),
      el("p", { class: "drawn-count", text: drawn.length + " av " + state.show.order.length + " dragna" }),
      list,
      el("button", {
        class: "button primary",
        type: "button",
        "data-focus": "drawn-close",
        onclick: closeDrawn,
        text: "Fortsätt"
      })
    ]);
    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });
    var overlay = el("div", { class: "drawn-overlay" }, [panel]);
    overlay.addEventListener("click", closeDrawn);
    return overlay;
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
    if (theme.printLead) {
      controls.appendChild(el("p", { class: "lead", text: theme.printLead }));
    }

    var countLabel = el("label", { class: "count-label", text: "Antal brickor" });
    var countInput = el("input", {
      id: "card-count",
      type: "number",
      min: "1",
      max: String(MAX_CARDS),
      inputmode: "numeric",
      value: state.print.countText,
      "data-focus": "count"
    });
    countInput.addEventListener("wheel", function (event) {
      event.preventDefault();
    }, { passive: false });
    countInput.addEventListener("input", onCountInput);
    countInput.addEventListener("change", onCountChange);
    countLabel.appendChild(countInput);
    controls.appendChild(countLabel);

    var actions = [
      el("button", {
        class: "button primary",
        type: "button",
        "data-focus": "create",
        onclick: createCards,
        text: createLabel()
      }),
      el("button", {
        class: "button",
        type: "button",
        "data-focus": "print-cards",
        disabled: state.print.cards.length ? null : "disabled",
        onclick: printCards,
        text: "Skriv ut brickor"
      })
    ];
    if (!isSlot(theme)) {
      actions.push(el("button", {
        class: "button",
        type: "button",
        "data-focus": "key",
        onclick: toggleKey,
        text: state.print.showKey ? "Dölj lärarblad" : "Visa lärarblad"
      }));
      actions.push(el("button", {
        class: "button",
        type: "button",
        "data-focus": "print-key",
        onclick: printKey,
        text: "Skriv ut lärarblad"
      }));
    }
    controls.appendChild(el("div", { class: "actions" }, actions));
    controls.appendChild(el("p", {
      id: "cards-ready",
      class: "hint",
      "aria-live": "polite",
      text: state.print.cards.length ? cardsReadyText(state.print.cards.length) : ""
    }));
    page.appendChild(controls);
    if (!isSlot(theme)) {
      page.appendChild(renderKey(theme));
    }
    page.appendChild(renderCards(theme));
    return page;
  }

  function createLabel() {
    return state.print.confirmCreate ? "Ersätt brickorna?" : "Skapa brickor";
  }

  function renderCards(theme) {
    var cards = el("div", { id: "cards", class: isSlot(theme) ? "cards one-per-page" : "cards" });
    var i;
    if (isSlot(theme)) {
      state.print.cards.forEach(function (card) {
        cards.appendChild(el("div", { class: "card-page" }, [renderCard(theme, card)]));
      });
      return cards;
    }
    for (i = 0; i < state.print.cards.length; i += 2) {
      cards.appendChild(renderCardPair(theme, state.print.cards[i], state.print.cards[i + 1]));
    }
    return cards;
  }

  function renderCardPair(theme, top, bottom) {
    var pair = el("div", { class: "card-pair" }, [renderCard(theme, top)]);
    if (bottom) {
      pair.appendChild(renderCard(theme, bottom));
    }
    return pair;
  }

  function renderCard(theme, card) {
    var grid = el("div", { class: "grid" });
    card.cells.forEach(function (cell) {
      if (isSlot(theme)) {
        grid.appendChild(el("div", { class: "cell count-cell" }, [renderCopies(theme, cell)]));
        return;
      }
      grid.appendChild(el("div", { class: "cell" }, [
        el("img", {
          src: pictureSrc(theme, { image: cell.image }),
          alt: "",
          draggable: "false"
        }),
        el("span", { text: cell.word.toLocaleUpperCase("sv") })
      ]));
    });
    return el("article", { class: isSlot(theme) ? "bingo-card slot-card" : "bingo-card" }, [grid]);
  }

  function copyRows(count) {
    if (COPY_ROWS[count]) {
      return COPY_ROWS[count];
    }
    var cols = Math.ceil(Math.sqrt(count));
    var rows = [];
    var left = count;
    while (left > 0) {
      rows.push(Math.min(cols, left));
      left -= cols;
    }
    return rows;
  }

  function renderCopies(theme, cell) {
    var rows = copyRows(cell.count);
    var size = Math.max(rows.length, Math.max.apply(null, rows));
    var src = pictureSrc(theme, { image: cell.image });
    var box = el("div", { class: "copies", style: "--m: " + size });
    rows.forEach(function (count) {
      var row = el("div", { class: "copies-row" });
      var i;
      for (i = 0; i < count; i += 1) {
        row.appendChild(el("img", { src: src, alt: "", draggable: "false" }));
      }
      box.appendChild(row);
    });
    return box;
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

  function resetRound(theme) {
    stopSpin();
    state.show.order = window.Bingo.shuffle(isSlot(theme) ? window.Bingo.slotCombos(theme) : theme.pairs);
    state.show.index = 0;
    state.show.revealed = -1;
    state.show.drawnOpen = false;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    if (isSlot(theme)) {
      theme.symbols.forEach(function (symbol) {
        preloadPicture(theme, symbol);
      });
    }
    startSpinIfNeeded();
  }

  function startShow() {
    var theme = currentTheme();
    if (!theme || window.Bingo.validateTheme(theme).length) {
      return;
    }
    state.show.showWord = false;
    state.view = "show";
    resetRound(theme);
    render();
  }

  function goToMenu() {
    stopSpin();
    state.show.drawnOpen = false;
    state.view = "menu";
    render();
    window.scrollTo(0, 0);
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
    goToMenu();
  }

  function next() {
    if (state.view !== "show" || state.show.drawnOpen) {
      return;
    }
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    if (state.show.spin) {
      finishSpin();
      render();
      return;
    }
    if (state.show.index >= state.show.order.length) {
      return;
    }
    state.show.index += 1;
    startSpinIfNeeded();
    render();
  }

  function prev() {
    if (state.view !== "show" || state.show.drawnOpen) {
      return;
    }
    finishSpin();
    if (state.show.index > 0) {
      state.show.index -= 1;
    }
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
  }

  function toggleDrawn() {
    if (state.show.drawnOpen) {
      closeDrawn();
      return;
    }
    finishSpin();
    state.show.drawnOpen = true;
    state.show.confirmReset = false;
    state.show.confirmExit = false;
    render();
    var close = document.querySelector('[data-focus="drawn-close"]');
    if (close) {
      close.focus();
    }
  }

  function closeDrawn() {
    if (!state.show.drawnOpen) {
      return;
    }
    state.show.drawnOpen = false;
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
    resetRound(currentTheme());
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
    if (count > MAX_CARDS) {
      count = MAX_CARDS;
    }
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
    state.print.cards = fillCards(theme, [], readCount());
    state.print.confirmCreate = false;
    state.print.changedAt = Date.now();
    render();
  }

  function cardKey(card) {
    return card.cells.map(function (cell) {
      return cell.key;
    }).join("\n");
  }

  function fillCards(theme, existing, count) {
    var cards = existing.slice(0, count);
    var seen = {};
    var guard = 0;
    var card;
    var key;
    cards.forEach(function (item) {
      seen[cardKey(item)] = true;
    });
    while (cards.length < count && guard < count * 30) {
      guard += 1;
      card = window.Bingo.makeCard(theme, window.Bingo.randomSeed());
      key = cardKey(card);
      if (seen[key]) {
        continue;
      }
      seen[key] = true;
      cards.push(card);
    }
    return cards;
  }

  function resizeCards(count) {
    if (!state.print.cards.length || count === state.print.cards.length) {
      return;
    }
    state.print.cards = fillCards(currentTheme(), state.print.cards, count);
    state.print.confirmCreate = false;
    refreshCards();
  }

  function refreshCards() {
    var old = document.getElementById("cards");
    if (old) {
      old.parentNode.replaceChild(renderCards(currentTheme()), old);
    }
    var ready = document.getElementById("cards-ready");
    if (ready) {
      ready.textContent = state.print.cards.length ? cardsReadyText(state.print.cards.length) : "";
    }
    var create = document.querySelector('[data-focus="create"]');
    if (create) {
      create.textContent = createLabel();
    }
  }

  function onCountInput(event) {
    var raw = event.target.value.trim();
    state.print.countText = event.target.value;
    if (!/^[0-9]+$/.test(raw)) {
      return;
    }
    var count = parseInt(raw, 10);
    if (count < 1 || count > MAX_CARDS) {
      return;
    }
    resizeCards(count);
  }

  function onCountChange() {
    resizeCards(readCount());
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
    resizeCards(readCount());
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
    var letter = (event.key || "").toLowerCase();
    if (state.view === "show" && state.show.drawnOpen) {
      if (event.key === "Escape" || letter === "d") {
        event.preventDefault();
        closeDrawn();
      }
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
        goToMenu();
        return;
      }
      if (letter === "m" && currentTheme().sound) {
        toggleSound();
        return;
      }
      if (isSlot(currentTheme())) {
        if (letter === "d") {
          toggleDrawn();
        }
        return;
      }
      if (letter === "t") {
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
