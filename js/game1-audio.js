// ===== Joc 1 - Endevina la cançó (fusion: audio OK + multiple-choice + fallback rutes) =====
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // ---- Config bàsica: només posem EL NOM del fitxer ----
  // (el codi ja s'encarrega d'afegir la ruta correcta i fer fallback)
  const TRACKS = [
    { file: "track1.mp3", artist: "Ginestà",
      options: ["Un piset amb tu", "T’estimo molt", "Ulls d’avellana"], correctIndex: 2 },
    { file: "track2.mp3", artist: "Manel",
      options: ["Els guapos són els raros", "En la que el Bernat se’t troba", "Teresa Rampell"], correctIndex: 0 },
    { file: "track3.mp3", artist: "Oques Grasses",
      options: ["La gent que estimo", "Sort de tu", "De bonesh"], correctIndex: 2 },
    { file: "track4.mp3", artist: "The Tyets",
      options: ["Tàndem", "Canilla", "Sushi Poke"], correctIndex: 1 },
    { file: "track5.mp3", artist: "Txarango",
      options: ["La dansa del vestit", "Músic de carrer", "Sou persones"], correctIndex: 2 },
  ];

  // Rutes candidates (1a: amb assets/, 2a: sense)
  const PATHS = ["assets/audio/game1/", "audio/game1/"];
  const CLIP_SECONDS = 10;

  let idx = 0, audio = null, endTimer = null, pathIdx = 0;

  const root   = $("#game-audio");
  if (!root) return;

  const elPlay  = $("#gaPlay", root);
  const elTimer = $("#gaTimer", root);
  const elMsg   = $("#gaMsg", root);
  const elReset = $("#gaReset", root);
  const elBar   = $("#gaProgressFill", root);

  // Crea el contenidor d’opcions si no existeix
  let elChoices = $("#gaChoices", root);
  if (!elChoices) {
    const body = root.querySelector(".ga-body") || root;
    elChoices = document.createElement("div");
    elChoices.id = "gaChoices";
    elChoices.className = "ga-choices";
    body.appendChild(elChoices);
  }

  const setMsg = (txt, cls = "") => { elMsg.className = `ga-msg ${cls}`; elMsg.textContent = txt; };
  const updateProgress = () => { elBar.style.width = `${(idx / TRACKS.length) * 100}%`; };

  const currentSrc = () => PATHS[pathIdx] + TRACKS[idx].file;

  const stopAudio = () => {
    try { audio?.pause(); } catch {}
    clearTimeout(endTimer);
    elPlay.disabled = false;
  };

  // Intenta reproduir; si falla per 404/MIME, prova l’altra ruta
  const playClip = async () => {
    stopAudio();
    audio = new Audio(currentSrc());
    elPlay.disabled = true;
    setMsg(`Escoltant fragment… (${TRACKS[idx].artist})`);

    // listener d'error per canviar de ruta si cal
    let triedFallback = false;
    const onErr = async () => {
      // prova fallback de ruta un sol cop
      if (!triedFallback && pathIdx + 1 < PATHS.length) {
        triedFallback = true;
        pathIdx += 1;
        audio.src = currentSrc();
        try {
          audio.load();
          await audio.play();
          afterPlayCountdown(); // èxit amb fallback
          return;
        } catch { /* si també falla, caurà al catch de sota */ }
      }
      // error definitiu
      setMsg("No puc reproduir l'àudio (ruta o permisos).", "err");
      console.error("Audio error", audio.error, "src:", audio.src);
      elPlay.disabled = false;
    };
    audio.addEventListener("error", onErr, { once: true });

    try {
      audio.load();           // assegura càrrega
      await audio.play();     // primer intent
      afterPlayCountdown();
    } catch (err) {
      // pot ser autoplay bloquejat; demana segon clic
      setMsg("Prem ▶︎ un altre cop per permetre l'àudio 🎧");
      elPlay.disabled = false;
    }
  };

  function afterPlayCountdown() {
    let remain = CLIP_SECONDS;
    elTimer.textContent = `00:${String(remain).padStart(2, "0")}`;
    const tick = setInterval(() => {
      remain -= 1;
      elTimer.textContent = `00:${String(Math.max(remain, 0)).padStart(2, "0")}`;
      if (remain <= 0) clearInterval(tick);
    }, 1000);
    endTimer = setTimeout(() => { stopAudio(); setMsg("Temps!"); }, CLIP_SECONDS * 1000);
  }

  const paintChoices = () => {
    const tr = TRACKS[idx];
    elChoices.innerHTML = "";
    tr.options.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ga-choice";
      btn.textContent = label;
      btn.addEventListener("click", () => onChoice(i));
      elChoices.appendChild(btn);
    });
  };

  const nextTrack = () => {
    idx += 1;
    updateProgress();
    if (idx >= TRACKS.length) {
      setMsg("🎉 Brutal! Has encertat les 5 cançons!", "ok");
      window.GameAudioGuess?.onWin?.();
      elPlay.disabled = true;
      [...elChoices.children].forEach(b => (b.disabled = true));
      return;
    }
    setMsg("✅ Bé! Endevina la següent.", "ok");
    elPlay.disabled = false;
    paintChoices();
  };

  const failAndRestart = () => {
    setMsg("❌ Ups! Has fallat una. El joc es reinicia des de la primera.", "err");
    window.GameAudioGuess?.onFail?.();
    setTimeout(() => resetGame(false), 700);
  };

  const onChoice = (choiceIndex) => {
    stopAudio();
    const correct = TRACKS[idx].correctIndex;
    [...elChoices.children].forEach((b, i) => {
      if (i === correct) b.classList.add("correct");
      if (i === choiceIndex && i !== correct) b.classList.add("wrong");
      b.disabled = true;
    });
    (choiceIndex === correct) ? setTimeout(nextTrack, 600) : setTimeout(failAndRestart, 600);
  };

  const resetGame = (announce = true) => {
    stopAudio();
    idx = 0;
    updateProgress();
    elTimer.textContent = `00:${String(CLIP_SECONDS).padStart(2, "0")}`;
    if (announce) setMsg("Tornem a començar! Has de superar 5 cançons seguides.");
    elPlay.disabled = false;
    paintChoices();
  };

  // Init
  updateProgress();
  paintChoices();
  elTimer.textContent = `00:${String(CLIP_SECONDS).padStart(2, "0")}`;

  // API per integrar amb l'app
  window.GameAudioGuess = {
    show() { root.hidden = false; },
    hide() { root.hidden = true;  },
    onWin: null,
    onFail: null,
    reset: resetGame
  };
})();
