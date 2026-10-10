(function (root) {
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fisherYates(items, random) {
    var arr = items.slice();
    var i;
    var j;
    var tmp;
    for (i = arr.length - 1; i > 0; i -= 1) {
      j = Math.floor(random() * (i + 1));
      tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function shuffle(items) {
    return fisherYates(items, Math.random);
  }

  function seededShuffle(items, seed) {
    return fisherYates(items, mulberry32(seed));
  }

  function randomSeed() {
    if (root.crypto && root.crypto.getRandomValues) {
      var buf = new Uint32Array(1);
      root.crypto.getRandomValues(buf);
      return buf[0];
    }
    return Math.floor(Math.random() * 4294967296);
  }

  var CARD_CELLS = 25;

  function isSlot(theme) {
    return !!theme && theme.kind === "slot";
  }

  function slotCombos(theme) {
    var combos = [];
    var min = theme.numbers.min;
    var max = theme.numbers.max;
    var i;
    var n;
    for (i = 0; i < theme.symbols.length; i += 1) {
      for (n = min; n <= max; n += 1) {
        combos.push({ id: theme.symbols[i].id + "-" + n, symbol: theme.symbols[i], number: n });
      }
    }
    return combos;
  }

  function validateSlotTheme(theme) {
    var errors = [];
    if (!theme.id || !theme.title || !theme.base) {
      errors.push("Temat saknar id, namn eller sökväg till bilderna.");
    }
    var numbers = theme.numbers;
    if (!numbers || !isFinite(numbers.min) || !isFinite(numbers.max) || numbers.min < 1 || numbers.max < numbers.min ||
        Math.floor(numbers.min) !== numbers.min || Math.floor(numbers.max) !== numbers.max) {
      errors.push("Temat behöver heltal från och med 1, till exempel numbers: { min: 1, max: 10 }.");
    }
    if (!theme.symbols || typeof theme.symbols.length !== "number" || theme.symbols.length < 3) {
      errors.push("Temat behöver minst 3 bilder.");
      return errors;
    }
    var ids = {};
    var i;
    var symbol;
    for (i = 0; i < theme.symbols.length; i += 1) {
      symbol = theme.symbols[i];
      if (!symbol || !symbol.id || !symbol.name || !symbol.image) {
        errors.push("Bild " + (i + 1) + " saknar id, namn eller bild.");
        continue;
      }
      if (ids[symbol.id]) {
        errors.push("Id \"" + symbol.id + "\" används mer än en gång.");
      }
      ids[symbol.id] = true;
    }
    if (!errors.length && slotCombos(theme).length < CARD_CELLS) {
      errors.push("Temat ger färre än " + CARD_CELLS + " kombinationer av tal och bild.");
    }
    return errors;
  }

  function validateTheme(theme) {
    var errors = [];
    if (isSlot(theme)) {
      return validateSlotTheme(theme);
    }
    if (!theme || !theme.pairs || typeof theme.pairs.length !== "number") {
      return ["Temat saknar bildpar."];
    }
    if (theme.pairs.length !== CARD_CELLS) {
      errors.push("Temat måste ha exakt " + CARD_CELLS + " bildpar, inte " + theme.pairs.length + ".");
    }
    if (!theme.id || !theme.title || !theme.base) {
      errors.push("Temat saknar id, namn eller sökväg till bilderna.");
    }
    var calls = {};
    var cards = {};
    var ids = {};
    var i;
    var pair;
    for (i = 0; i < theme.pairs.length; i += 1) {
      pair = theme.pairs[i];
      if (!pair || !pair.id || !pair.call || !pair.card || !pair.image || !pair.cardImage) {
        errors.push("Bildpar " + (i + 1) + " saknar id, ord eller bild.");
        continue;
      }
      if (ids[pair.id]) {
        errors.push("Id \"" + pair.id + "\" används mer än en gång.");
      }
      if (calls[pair.call]) {
        errors.push("Bildordet \"" + pair.call + "\" används mer än en gång.");
      }
      if (cards[pair.card]) {
        errors.push("Brickordet \"" + pair.card + "\" används mer än en gång.");
      }
      ids[pair.id] = true;
      calls[pair.call] = true;
      cards[pair.card] = true;
    }
    return errors;
  }

  function makeCard(theme, seed) {
    var cells = [];
    var i;
    if (isSlot(theme)) {
      return {
        cells: seededShuffle(slotCombos(theme), seed).slice(0, CARD_CELLS).map(function (combo) {
          return { key: combo.id, image: combo.symbol.image, count: combo.number };
        })
      };
    }
    for (i = 0; i < theme.pairs.length; i += 1) {
      cells.push({
        key: theme.pairs[i].card,
        word: theme.pairs[i].card,
        image: theme.pairs[i].cardImage
      });
    }
    return {
      cells: seededShuffle(cells, seed)
    };
  }

  root.Bingo = {
    shuffle: shuffle,
    seededShuffle: seededShuffle,
    randomSeed: randomSeed,
    isSlot: isSlot,
    slotCombos: slotCombos,
    validateTheme: validateTheme,
    makeCard: makeCard
  };
})(typeof window !== "undefined" ? window : globalThis);
