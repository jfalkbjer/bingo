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

  function isCompound(theme) {
    return !!theme && theme.kind === "compound";
  }

  function imagePath(theme, image) {
    return theme.base.replace(/\/?$/, "/") + image;
  }

  function themeImages(theme) {
    var images = [];
    var seen = {};
    function add(image) {
      if (image && !seen[image]) {
        seen[image] = true;
        images.push(image);
      }
    }
    (theme.pairs || []).forEach(function (pair) {
      add(pair.image);
      add(pair.firstImage);
      add(pair.secondImage);
      add(pair.cardImage);
    });
    (theme.symbols || []).forEach(function (symbol) {
      add(symbol.image);
    });
    return images;
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

  function checkBasics(theme, errors) {
    if (!theme.id || !theme.title || !theme.base) {
      errors.push("Temat saknar id, namn eller sökväg till bilderna.");
    }
  }

  var ID = { key: "id", label: "Id" };
  var CALL = { key: "call", label: "Bildordet" };
  var CARD = { key: "card", label: "Brickordet" };

  function checkItems(items, noun, missing, required, unique, errors) {
    var seen = {};
    var i;
    var item;
    unique.forEach(function (rule) {
      seen[rule.key] = {};
    });
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (!item || required.some(function (key) { return !item[key]; })) {
        errors.push(noun + " " + (i + 1) + " saknar " + missing);
        continue;
      }
      unique.forEach(function (rule) {
        var value = item[rule.key];
        if (seen[rule.key][value]) {
          errors.push(rule.label + " \"" + value + "\" används mer än en gång.");
        }
        seen[rule.key][value] = true;
      });
    }
    return errors;
  }

  function validateSlotTheme(theme) {
    var errors = [];
    checkBasics(theme, errors);
    var numbers = theme.numbers;
    if (!numbers || !isFinite(numbers.min) || !isFinite(numbers.max) || numbers.min < 1 || numbers.max < numbers.min ||
        Math.floor(numbers.min) !== numbers.min || Math.floor(numbers.max) !== numbers.max) {
      errors.push("Temat behöver heltal från och med 1, till exempel numbers: { min: 1, max: 10 }.");
    }
    if (!theme.symbols || typeof theme.symbols.length !== "number" || theme.symbols.length < 3) {
      errors.push("Temat behöver minst 3 bilder.");
      return errors;
    }
    checkItems(theme.symbols, "Bild", "id, namn eller bild.", ["id", "name", "image"], [ID], errors);
    if (!errors.length && theme.symbols.length * (numbers.max - numbers.min + 1) < CARD_CELLS) {
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
    checkBasics(theme, errors);
    if (isCompound(theme)) {
      return checkItems(theme.pairs, "Ordpar", "id, ord eller bild.",
        ["id", "first", "second", "firstImage", "secondImage", "card", "cardImage"], [ID, CARD], errors);
    }
    return checkItems(theme.pairs, "Bildpar", "id, ord eller bild.",
      ["id", "call", "card", "image", "cardImage"], [ID, CALL, CARD], errors);
  }

  function makeCard(theme, seed) {
    if (isSlot(theme)) {
      return {
        cells: seededShuffle(slotCombos(theme), seed).slice(0, CARD_CELLS).map(function (combo) {
          return { key: combo.id, image: combo.symbol.image, count: combo.number };
        })
      };
    }
    return {
      cells: seededShuffle(theme.pairs.map(function (pair) {
        return { key: pair.card, word: pair.card, image: pair.cardImage };
      }), seed)
    };
  }

  root.Bingo = {
    shuffle: shuffle,
    seededShuffle: seededShuffle,
    randomSeed: randomSeed,
    isSlot: isSlot,
    isCompound: isCompound,
    imagePath: imagePath,
    themeImages: themeImages,
    slotCombos: slotCombos,
    validateTheme: validateTheme,
    makeCard: makeCard
  };
})(typeof window !== "undefined" ? window : globalThis);
