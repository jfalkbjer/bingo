(function () {
  var state = {
    view: "menu",
    themeId: null,
    show: {
      order: [],
      index: 0,
      revealed: -1,
      spin: null,
      flip: null,
      drawnOpen: false,
      showWord: false,
      confirmReset: false,
      confirmResetAt: 0,
      confirmExit: false,
      confirmExitAt: 0
    },
    print: {
      countText: "30",
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
  var FLIP_MS = 600;
  var FLIP_FIRST_AT = 0;
  var FLIP_SECOND_AT = 900;
  var FLIP_TOTAL_MS = FLIP_SECOND_AT + FLIP_MS;
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

  function isCompound(theme) {
    return window.Bingo.isCompound(theme);
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

  function pictureSrc(theme, image) {
    return window.Bingo.imagePath(theme, image);
  }

  function picture(theme, image, className, alt) {
    return el("img", {
      class: className,
      src: pictureSrc(theme, image),
      alt: alt || "",
      draggable: "false"
    });
  }

  function itemImages(theme, item) {
    if (isCompound(theme)) {
      return [item.firstImage, item.secondImage];
    }
    return [isSlot(theme) ? item.symbol.image : item.image];
  }

  function preloadPicture(theme, image) {
    var src = pictureSrc(theme, image);
    if (preloaded[src]) {
      return;
    }
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    preloaded[src] = img;
  }

  function upper(text) {
    return text.toLocaleUpperCase("sv");
  }

  function sortedBy(items, key) {
    return items.slice().sort(function (a, b) {
      return a[key].localeCompare(b[key], "sv");
    });
  }

  function cardsReadyText(count) {
    if (!count) {
      return "";
    }
    if (count === 1) {
      return "1 bricka är klar.";
    }
    return count + " brickor är klara.";
  }

  function readyTheme() {
    var theme = currentTheme();
    return theme && !window.Bingo.validateTheme(theme).length ? theme : null;
  }

  function stopPropagation(event) {
    event.stopPropagation();
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var key;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key) || attrs[key] == null || attrs[key] === false) {
          continue;
        }
        if (key === "class") {
          node.className = attrs[key];
        } else if (key === "text") {
          node.textContent = attrs[key];
        } else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else {
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

  function button(className, focus, text, onclick, pressed) {
    return el("button", {
      class: className,
      type: "button",
      "data-focus": focus,
      "aria-pressed": pressed == null ? null : String(pressed),
      onclick: onclick,
      text: text
    });
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
      sortedBy(list, "title").forEach(function (item) {
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

    var actions = [
      button("button primary", null, "Visa bilder", startShow),
      button("button", null, "Skriv ut brickor", openPrint)
    ];
    actions.forEach(function (action) {
      action.disabled = !ready;
    });
    wrap.appendChild(el("div", { class: "actions" }, actions));
    if (theme && theme.hint) {
      wrap.appendChild(el("p", { class: "hint", text: theme.hint }));
    }
    return wrap;
  }

  function renderShow() {
    var theme = currentTheme();
    var slot = isSlot(theme);
    var compound = isCompound(theme);
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
    var drawnOpen = state.show.drawnOpen;
    var showWord = state.show.showWord;
    var soundOn = !window.BingoSound.isMuted();
    screen.appendChild(el("header", { class: "topbar" }, [counter, el("div", { class: "top-actions" }, [
      theme.sound ? button("ghost", "sound", soundOn ? "Ljud på" : "Ljud av", toggleSound, soundOn) : null,
      slot ?
        button("ghost", "drawn", drawnOpen ? "Stäng dragna" : "Dragna", toggleDrawn, drawnOpen) :
        button("ghost", "word", showWord ? "Dölj ordet" : "Visa ordet", toggleWord, showWord),
      button("ghost", "reset", state.show.confirmReset ? "Blanda om nu?" : "Ny omgång", newRound),
      button("ghost", "exit", state.show.confirmExit ? "Avsluta?" : "Meny", leaveShow)
    ])]));

    var wordSlot = el("div", { class: "word-slot" });
    if (!atEnd && showWord) {
      wordSlot.appendChild(el("p", {
        class: "word-pill",
        text: upper(compound ? current.first + " + " + current.second : current.call)
      }));
    }

    var stageChildren = [];
    if (atEnd) {
      stageChildren.push(el("div", { class: "slut" }, [
        el("h2", { text: "Slut!" }),
        el("p", { text: "Har någon bingo?" })
      ]));
    } else if (slot) {
      stageChildren.push(renderSlotMachine(theme, current));
    } else if (compound) {
      stageChildren.push(renderFlipCards(theme, current));
    } else {
      stageChildren.push(picture(theme, current.image, null, current.call));
    }
    if (!slot) {
      stageChildren.push(wordSlot);
    }

    var stage = el("div", { class: atEnd ? "stage is-end" : "stage" }, stageChildren);

    function stopAnd(action) {
      return function (event) {
        stopPropagation(event);
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
      var thumb = itemImages(theme, item).map(function (image) {
        return picture(theme, image);
      });
      if (slot) {
        thumb.push(el("span", { class: "badge", text: String(item.number) }));
      }
      row.appendChild(el("div", { class: compound ? "thumb is-pair" : "thumb" }, thumb));
    });
    var history = el("div", {
      class: "history",
      "aria-label": "Redan visade bilder",
      onclick: stopPropagation
    }, [row]);
    screen.appendChild(history);
    if (slot) {
      if (drawnOpen) {
        screen.appendChild(renderDrawn(theme));
      }
      return screen;
    }
    order.slice(index + 1, index + 3).forEach(function (item) {
      itemImages(theme, item).forEach(function (image) {
        preloadPicture(theme, image);
      });
    });
    return screen;
  }

  function renderFlipCards(theme, pair) {
    var flip = state.show.flip;
    var elapsed = flip ? Date.now() - flip.startedAt : 0;
    return el("div", {
      class: "flip-row",
      role: "img",
      "aria-label": flip ? "Korten vänds" : pair.first + " plus " + pair.second
    }, [
      renderFlipCard(theme, pair.firstImage, flip ? FLIP_FIRST_AT - elapsed : null),
      el("span", { class: "flip-plus", text: "+" }),
      renderFlipCard(theme, pair.secondImage, flip ? FLIP_SECOND_AT - elapsed : null)
    ]);
  }

  function renderFlipCard(theme, image, delay) {
    var flipping = delay !== null;
    return el("div", {
      class: flipping ? "flip-card is-flipping" : "flip-card is-open",
      style: flipping ? "--flip-delay: " + delay + "ms; --flip-ms: " + FLIP_MS + "ms" : null
    }, [
      el("div", { class: "flip-inner" }, [
        el("div", { class: "flip-cover" }, [el("span", { text: "?" })]),
        el("div", { class: "flip-face" }, [picture(theme, image)])
      ])
    ]);
  }

  function renderSlotMachine(theme, combo) {
    var spin = state.show.spin;
    var elapsed = spin ? Date.now() - spin.startedAt : 0;
    var spinning = !!spin;
    return el("div", {
      class: "slot-machine",
      role: "img",
      "aria-label": spinning ? "Hjulen snurrar" : combo.number + " " + combo.symbol.name
    }, [
      renderReel("reel-number", spinning ? spin.numbers : [combo.number], SPIN_NUMBER_MS, elapsed, function (value) {
        return el("span", { class: String(value).length > 1 ? "reel-digit is-wide" : "reel-digit", text: String(value) });
      }),
      renderReel("reel-symbol", spinning ? spin.symbols : [combo.symbol], SPIN_SYMBOL_MS, elapsed, function (symbol) {
        return picture(theme, symbol.image);
      })
    ]);
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
    if ((!isSlot(theme) && !isCompound(theme)) || index >= order.length || index <= state.show.revealed) {
      return;
    }
    if (reducedMotion()) {
      state.show.revealed = index;
      return;
    }
    if (isCompound(theme)) {
      startFlip();
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
    var token = nextToken();
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
    afterAnimation(token, SPIN_SYMBOL_MS, function () {
      finishSpin();
      render();
    });
  }

  function nextToken() {
    spinToken += 1;
    return spinToken;
  }

  function animating() {
    return state.show.spin || state.show.flip;
  }

  function startFlip() {
    var token = nextToken();
    state.show.flip = { token: token, startedAt: Date.now() };
    playFlipSound();
    afterAnimation(token, FLIP_SECOND_AT, playFlipSound);
    afterAnimation(token, FLIP_TOTAL_MS, function () {
      finishSpin();
      render();
    });
  }

  function playFlipSound() {
    var theme = currentTheme();
    if (theme.sound) {
      window.BingoSound.play(theme.sound, FLIP_MS);
    }
  }

  function afterAnimation(token, ms, action) {
    window.setTimeout(function () {
      var active = animating();
      if (state.view === "show" && active && active.token === token) {
        action();
      }
    }, ms);
  }

  function clearAnimation() {
    window.BingoSound.stop();
    state.show.spin = null;
    state.show.flip = null;
  }

  function finishSpin() {
    if (!animating()) {
      return;
    }
    clearAnimation();
    state.show.revealed = Math.max(state.show.revealed, state.show.index);
  }

  function stopSpin() {
    clearAnimation();
    nextToken();
  }

  function toggleSound() {
    var theme = currentTheme();
    var spin = state.show.spin;
    window.BingoSound.setMuted(!window.BingoSound.isMuted());
    if (theme.sound && !window.BingoSound.isMuted()) {
      if (spin) {
        var left = SPIN_SYMBOL_MS - (Date.now() - spin.startedAt);
        if (left > 200) {
          window.BingoSound.play(theme.sound, left);
        }
      } else if (state.show.flip) {
        var elapsed = Date.now() - state.show.flip.startedAt;
        var turning = elapsed < FLIP_MS || (elapsed >= FLIP_SECOND_AT && elapsed < FLIP_SECOND_AT + FLIP_MS);
        if (turning) {
          window.BingoSound.play(theme.sound, FLIP_MS);
        }
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
        picture(theme, symbol.image),
        el("span", { class: "drawn-name", text: upper(symbol.name) }),
        numberBox
      ]));
    });
    var panel = el("div", {
      class: "drawn-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Dragna",
      onclick: stopPropagation
    }, [
      el("h2", { text: "Dragna" }),
      el("p", { class: "drawn-count", text: drawn.length + " av " + state.show.order.length + " dragna" }),
      list,
      button("button primary", "drawn-close", "Fortsätt", closeDrawn)
    ]);
    return el("div", { class: "drawn-overlay", onclick: closeDrawn }, [panel]);
  }

  function renderPrint() {
    var theme = currentTheme();
    var page = el("main", { class: "print-page" });
    var controls = el("div", { class: "no-print print-controls" });
    controls.appendChild(button("ghost", "print-menu", "Meny", goToMenu));
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

    var slot = isSlot(theme);
    var printCardsButton = button("button", "print-cards", "Skriv ut brickor", printCards);
    printCardsButton.disabled = !state.print.cards.length;
    controls.appendChild(el("div", { class: "actions" }, [
      button("button primary", "create", createLabel(), createCards),
      printCardsButton,
      slot ? null : button("button", "key", state.print.showKey ? "Dölj lärarblad" : "Visa lärarblad", toggleKey),
      slot ? null : button("button", "print-key", "Skriv ut lärarblad", printKey)
    ]));
    controls.appendChild(el("p", {
      id: "cards-ready",
      class: "hint",
      "aria-live": "polite",
      text: cardsReadyText(state.print.cards.length)
    }));
    page.appendChild(controls);
    if (!slot) {
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
    var slot = isSlot(theme);
    var grid = el("div", { class: "grid" });
    card.cells.forEach(function (cell) {
      if (slot) {
        grid.appendChild(el("div", { class: "cell count-cell" }, [renderCopies(theme, cell)]));
        return;
      }
      grid.appendChild(el("div", { class: "cell" }, [
        picture(theme, cell.image),
        el("span", { class: cell.word.length > 9 ? "is-long" : null, text: upper(cell.word) })
      ]));
    });
    return el("article", { class: slot ? "bingo-card slot-card" : "bingo-card" }, [grid]);
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
    var box = el("div", { class: "copies", style: "--m: " + size });
    rows.forEach(function (count) {
      var row = el("div", { class: "copies-row" });
      var i;
      for (i = 0; i < count; i += 1) {
        row.appendChild(picture(theme, cell.image));
      }
      box.appendChild(row);
    });
    return box;
  }

  function keyCall(theme, image, word, joiner) {
    return [
      picture(theme, image),
      el("span", { class: "call", text: upper(word) }),
      el("span", { class: "to", text: joiner })
    ];
  }

  function renderKey(theme) {
    var compound = isCompound(theme);
    var list = el("ul", { class: compound ? "key-list key-compound" : "key-list" });
    sortedBy(theme.pairs, compound ? "card" : "call").forEach(function (pair) {
      var shown = compound ?
        keyCall(theme, pair.firstImage, pair.first, "+").concat(keyCall(theme, pair.secondImage, pair.second, "=")) :
        keyCall(theme, pair.image, pair.call, "→");
      list.appendChild(el("li", {}, shown.concat([
        picture(theme, pair.cardImage, "match"),
        el("strong", { text: upper(pair.card) })
      ])));
    });
    return el("section", { class: state.print.showKey ? "key-sheet is-visible" : "key-sheet" }, [
      el("h2", { text: "Lärarblad · " + theme.title }),
      el("p", {
        text: compound ?
          "Till vänster är de två bilderna du visar. Till höger är bilden och ordet på brickan." :
          "Till vänster är bilden du visar. Till höger är bilden och ordet på brickan."
      }),
      list
    ]);
  }

  function resetRound(theme) {
    stopSpin();
    state.show.order = window.Bingo.shuffle(isSlot(theme) ? window.Bingo.slotCombos(theme) : theme.pairs);
    state.show.index = 0;
    state.show.revealed = -1;
    state.show.drawnOpen = false;
    clearConfirms();
    if (isSlot(theme)) {
      theme.symbols.forEach(function (symbol) {
        preloadPicture(theme, symbol.image);
      });
    }
    startSpinIfNeeded();
  }

  function startShow() {
    var theme = readyTheme();
    if (!theme) {
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
    state.print.confirmCreate = false;
    state.view = "menu";
    render();
    window.scrollTo(0, 0);
  }

  function clearConfirms() {
    state.show.confirmReset = false;
    state.show.confirmExit = false;
  }

  // A second click within CONFIRM_MS is ignored so a double-click can't confirm by accident.
  function confirmTwice(key, action) {
    var now = Date.now();
    if (!state.show[key]) {
      clearConfirms();
      state.show[key] = true;
      state.show[key + "At"] = now;
      render();
      return;
    }
    if (now - state.show[key + "At"] < CONFIRM_MS) {
      return;
    }
    action();
  }

  function leaveShow() {
    confirmTwice("confirmExit", goToMenu);
  }

  function next() {
    if (state.view !== "show" || state.show.drawnOpen) {
      return;
    }
    clearConfirms();
    if (animating()) {
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
    clearConfirms();
    render();
  }

  function toggleDrawn() {
    if (state.show.drawnOpen) {
      closeDrawn();
      return;
    }
    finishSpin();
    state.show.drawnOpen = true;
    clearConfirms();
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
    clearConfirms();
    render();
  }

  function newRound() {
    confirmTwice("confirmReset", function () {
      resetRound(currentTheme());
      render();
    });
  }

  function openPrint() {
    if (!readyTheme()) {
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
    var count = Math.min(MAX_CARDS, Math.max(1, parseInt(raw, 10) || 1));
    state.print.countText = String(count);
    if (input) {
      input.value = state.print.countText;
    }
    return count;
  }

  function createCards() {
    var now = Date.now();
    var theme = readyTheme();
    if (!theme) {
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
      ready.textContent = cardsReadyText(state.print.cards.length);
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
    printOnly("cards");
  }

  function printKey() {
    printOnly("key");
  }

  function printOnly(part) {
    document.body.classList.toggle("printing-cards", part === "cards");
    document.body.classList.toggle("printing-key", part === "key");
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
      var theme = currentTheme();
      if (letter === "m" && theme.sound) {
        toggleSound();
        return;
      }
      if (isSlot(theme)) {
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
      goToMenu();
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
