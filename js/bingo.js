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

  function validateTheme(theme) {
    var errors = [];
    if (!theme || !theme.pairs || typeof theme.pairs.length !== "number") {
      return ["Temat saknar bildpar."];
    }
    if (theme.pairs.length !== 25) {
      errors.push("Temat måste ha exakt 25 bildpar, inte " + theme.pairs.length + ".");
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
    for (i = 0; i < theme.pairs.length; i += 1) {
      cells.push({
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
    validateTheme: validateTheme,
    makeCard: makeCard
  };
})(typeof window !== "undefined" ? window : globalThis);
