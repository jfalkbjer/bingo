(function () {
  var STORAGE_KEY = "bingo-sound-muted";
  var FADE_S = 0.08;
  var ctx = null;
  var noise = null;
  var current = null;
  var muted = readMuted();

  function readMuted() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function writeMuted(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch (e) {
      // Private mode or storage disabled: the setting just won't persist.
    }
  }

  function context() {
    if (ctx && ctx.state === "closed") {
      ctx = null;
      noise = null;
    }
    if (!ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      try {
        ctx = new Ctor();
      } catch (e) {
        return null;
      }
    }
    // Safari also uses a non-standard "interrupted" state, e.g. after sleep or when another app takes the audio.
    if (ctx.state !== "running" && ctx.resume) {
      ctx.resume();
    }
    return ctx;
  }

  function noiseBuffer(c) {
    if (!noise) {
      noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      var data = noise.getChannelData(0);
      for (var i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return noise;
  }

  function osc(c, type, freq) {
    var node = c.createOscillator();
    node.type = type;
    node.frequency.value = freq;
    return node;
  }

  function gain(c, value) {
    var node = c.createGain();
    node.gain.value = value;
    return node;
  }

  function filter(c, type, freq, q) {
    var node = c.createBiquadFilter();
    node.type = type;
    node.frequency.value = freq;
    node.Q.value = q;
    return node;
  }

  function theremin(c, out, t0, d) {
    function glide(param, scale) {
      param.setValueAtTime(380 * scale, t0);
      param.linearRampToValueAtTime(620 * scale, t0 + d * 0.4);
      param.linearRampToValueAtTime(420 * scale, t0 + d * 0.75);
      param.linearRampToValueAtTime(520 * scale, t0 + d);
    }
    var tone = osc(c, "sine", 380);
    var shimmer = osc(c, "sine", 380);
    shimmer.detune.value = 14;
    glide(tone.frequency, 1);
    glide(shimmer.frequency, 1);
    var lfo = osc(c, "sine", 4.5);
    var depth = gain(c, 25);
    lfo.connect(depth);
    depth.connect(tone.frequency);
    depth.connect(shimmer.frequency);
    var shimmerLevel = gain(c, 0.6);

    var air = c.createBufferSource();
    air.buffer = noiseBuffer(c);
    air.loop = true;
    var breath = filter(c, "bandpass", 380, 6);
    glide(breath.frequency, 1);
    var airLevel = gain(c, 0.5);

    var soft = filter(c, "lowpass", 1800, 0.7);
    var env = gain(c, 0);
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.18, t0 + 0.3);
    env.gain.linearRampToValueAtTime(0.24, t0 + d * 0.5);
    env.gain.linearRampToValueAtTime(0.12, t0 + d);
    tone.connect(soft);
    shimmer.connect(shimmerLevel).connect(soft);
    air.connect(breath).connect(airLevel).connect(soft);
    soft.connect(env);

    var echo = c.createDelay(1);
    echo.delayTime.value = 0.18;
    var feedback = gain(c, 0.35);
    var echoLevel = gain(c, 0.35);
    env.connect(out);
    env.connect(echo);
    echo.connect(feedback).connect(echo);
    echo.connect(echoLevel).connect(out);

    var sources = [tone, shimmer, lfo, air];
    sources.forEach(function (s) {
      s.start(t0);
      s.stop(t0 + d + 0.3);
    });
    return sources;
  }

  var SOUNDS = {
    halloween: theremin
  };

  function stop() {
    if (!current) {
      return;
    }
    var playing = current;
    current = null;
    var now = ctx.currentTime;
    var level = playing.out.gain;
    level.cancelScheduledValues(now);
    level.setValueAtTime(level.value, now);
    level.linearRampToValueAtTime(0, now + FADE_S);
    playing.sources.forEach(function (source) {
      try {
        source.stop(now + FADE_S + 0.02);
      } catch (e) {
        // Older Safari throws on a second stop(); the source is already scheduled to end.
      }
    });
    window.setTimeout(function () {
      playing.out.disconnect();
    }, (FADE_S + 0.1) * 1000);
  }

  function play(soundId, durationMs) {
    stop();
    if (muted || !SOUNDS[soundId]) {
      return;
    }
    var c = context();
    if (!c) {
      return;
    }
    var out = gain(c, 1);
    out.connect(c.destination);
    var t0 = c.currentTime + 0.01;
    current = {
      out: out,
      sources: SOUNDS[soundId](c, out, t0, durationMs / 1000)
    };
  }

  window.BingoSound = {
    play: play,
    stop: stop,
    isMuted: function () {
      return muted;
    },
    setMuted: function (value) {
      muted = !!value;
      writeMuted(muted);
      if (muted) {
        stop();
      } else {
        // Unmuting is a user gesture, which Safari needs before it lets the page play audio.
        context();
      }
    }
  };
})();
