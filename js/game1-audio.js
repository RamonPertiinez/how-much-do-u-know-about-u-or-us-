// ===== Joc 1 - Endevina la cançó (multiple-choice) =====
(() => {
  // --- Utils ---
  const $ = (s, r = document) => r.querySelector(s);

  // --- Config del Joc ---
  // Cada pista: fitxer d'àudio + 3 opcions + índex correcte (0..2)
  // He copiat literalment les teves notes (les "LA BONA").
  const TRACKS = [
    {
      file: "audio/game1/track1.mp3",
      artist: "Ginestà",
      options: ["Un piset amb tu", "T’estimo molt", "Ulls d’avellana"],
      correctIndex: 2, // <-- la bona
    },
    {
      file: "audio/game1/track2.mp3",
      artist: "Manel",
      options: ["Els guapos són els raros", "En la que el Bernat se’t troba", "Teresa Rampell"],
      correctIndex: 0, // <-- la bona
    },
    {
      file: "audio/game1/track3.mp3",
      artist: "Oques Grasses",
      options: ["La gent que estimo", "Sort de tu", "De bonesh"],
      correctIndex: 2, // <-- la bona (tal com ho tens escrit)
    },
    {
      file: "audio/game1/track4.mp3",
      artist: "The Tyets",
      options: ["Tàndem", "Canilla", "Sushi Poke"],
      correctIndex: 1, // <-- la bona
    },
    {
      file: "audio/game1/track5.mp3",
      artist: "Txarango",
      options: ["La dansa del vestit", "Músic de carrer", "Sou persones"],
      correctIndex: 2, // <-- la bona
    },
  ];

  const CLIP_SECONDS = 10;

  // --- Estat ---
  let idx = 0;
  let audio = null;
  let playing = false;
  let endTimer = null;

  // --- Elements ---
  const root   = $("#game-audio");
  if (!root) return;

  const elPlay  = $("#gaPlay", root);
  const elTimer = $("#gaTimer", root);
  const elMsg   = $("#gaMsg", root);
  const elReset = $("#gaReset", root);
  const elBar   = $("#gaProgressFill", root);
  const elChoices = $("#gaChoices", root);

  // --- Helpers ---
  const updateProgress = () => {
    const p = (idx / TRACKS.length) * 100;
    elBar.style.width = `${p}%`;
  };

  const setMsg = (txt, cls = "") => {
    elMsg.className = `ga-msg ${cls}`;
    elMsg.textContent = txt;
  };

  const stopAudio = () => {
    if (!audio) return;
    try { audio.pause(); } catch {}
    playing = false;
    elPlay.disabled = false;
    clearTimeout(endTimer);
  };

  const playClip = async () => {
    stopAudio();
    audio = new Audio(TRACKS[idx].file);
    elPlay.disabled = true;
    setMsg(`Escoltant fragment… (${TRACKS[idx].artist})`);
    playing = true;

    try {
      await audio.play();
      let remain = CLIP_SECONDS;
      elTimer.textContent = `00:${String(remain).padStart(2, "0")}`;

      const tick = setInterval(() => {
        if (!playing) return clearInterval(tick);
        remain -= 1;
        elTimer.textContent = `00:${String(Math.max(remain, 0)).padStart(2, "0")}`;
        if (remain <= 0) clearInterval(tick);
      }, 1000);

      endTimer = setTimeout(() => {
        stopAudio();
        setMsg("Temps!");
      }, CLIP_SECONDS * 1000);
    } catch (e) {
      setMsg("No puc reproduir l'àudio (permisos del navegador?).", "err");
      elPlay.disabled = false;
    }
  };

  const paintChoices = () => {
    const tr = TRACKS[idx];
    elChoices.innerHTML = "";
    tr.options.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ga-choice";
      btn.textContent = label;
      btn.addEventListener("click", () => onChoice(i, btn));
      elChoices.appendChild(btn);
    });
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

  const nextTrack = () => {
    idx += 1;
    updateProgress();

    if (idx >= TRACKS.length) {
      // VICTÒRIA
      setMsg("🎉 Brutal! Has encertat les 5 cançons!", "ok");
      window.GameAudioGuess?.onWin?.();
      elPlay.disabled = true;
      // bloqueja els clics
      [...elChoices.children].forEach(b => b.disabled = true);
      return;
    }
    setMsg("✅ Bé! Endevina la següent.", "ok");
    elPlay.disabled = false;
    paintChoices();
  };

  const failAndRestart = () => {
    setMsg("❌ Ups! Has fallat una. El joc es reinicia des de la primera.", "err");
    window.GameAudioGuess?.onFail?.();
    // marca visualment i reinicia al cap d'un momentet
    setTimeout(() => resetGame(false), 700);
  };

  const onChoice = (choiceIndex, btnEl) => {
    stopAudio();

    const correct = TRACKS[idx].correctIndex;
    // pinta feedback visual
    [...elChoices.children].forEach((b, i) => {
      if (i === correct) b.classList.add("correct");
      if (i === choiceIndex && i !== correct) b.classList.add("wrong");
      b.disabled = true;
    });

    if (choiceIndex === correct) {
      setTimeout(nextTrack, 600);
    } else {
      setTimeout(failAndRestart, 600);
    }
  };

  // --- Events ---
  elPlay.addEventListener("click", (e) => {
    e.preventDefault();
    playClip();
  });

  elReset.addEventListener("click", (e) => {
    e.preventDefault();
    resetGame();
  });

  // --- Inicialització ---
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
