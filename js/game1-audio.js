// ===== Joc 1 - Endevina la cançó =====
(() => {
  // --- Utils ---
  const norm = (t) =>
    (t || "")
      .toString()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s]/gi, " ")
      .trim()
      .toLowerCase();
  const $ = (s, r = document) => r.querySelector(s);

  // --- Config del Joc ---
  // 5 pistes de 10s. Posa-hi els teus arxius i respostes vàlides.
  const TRACKS = [
    { file: "audio/game1/track1.mp3", answers: ["ginesta", "l'eva i la jana", "leva i la jana", "estima", "a totes les batalles"] },
    { file: "audio/game1/track2.mp3", answers: ["manel", "benvolgut", "boomerang"] },
    { file: "audio/game1/track3.mp3", answers: ["oques grasses", "oques", "tant se val"] },
    { file: "audio/game1/track4.mp3", answers: ["the tyets", "tyets", "coti x coti", "coti per coti"] },
    { file: "audio/game1/track5.mp3", answers: ["txarango", "una lluna a l'aigua", "una lluna a l aigua", "som un riu"] },
  ];
  const CLIP_SECONDS = 10;

  // --- Estat ---
  let idx = 0;
  let audio = null;
  let playing = false;
  let endTimer = null;

  // --- Elements ---
  const root = $("#game-audio");
  if (!root) return; // si la secció no existeix, sortim silenciosament

  const elPlay  = $("#gaPlay", root);
  const elTimer = $("#gaTimer", root);
  const elForm  = $("#gaForm", root);
  const elInput = $("#gaInput", root);
  const elMsg   = $("#gaMsg", root);
  const elReset = $("#gaReset", root);
  const elBar   = $("#gaProgressFill", root);

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
    setMsg("Escoltant fragment…");
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

  const resetGame = (announce = true) => {
    stopAudio();
    idx = 0;
    elInput.value = "";
    updateProgress();
    elTimer.textContent = `00:${String(CLIP_SECONDS).padStart(2, "0")}`;
    if (announce) setMsg("Tornem a començar! Has de superar 5 cançons seguides.");
    elInput.disabled = false;
    elPlay.disabled = false;
  };

  const nextTrack = () => {
    idx += 1;
    elInput.value = "";
    updateProgress();

    if (idx >= TRACKS.length) {
      // VICTÒRIA
      setMsg("🎉 Brutal! Has encertat les 5 cançons!", "ok");
      window.GameAudioGuess?.onWin?.();   // hook opcional cap al teu app
      elPlay.disabled = true;
      elInput.disabled = true;
      return;
    }
    setMsg("✅ Bé! Endevina la següent.", "ok");
    elPlay.disabled = false;
    elInput.focus();
  };

  const failAndRestart = () => {
    setMsg("❌ Ups! Has fallat una. El joc es reinicia des de la primera.", "err");
    window.GameAudioGuess?.onFail?.();    // hook opcional
    resetGame(false);
  };

  // --- Events ---
  elPlay.addEventListener("click", (e) => {
    e.preventDefault();
    playClip();
  });

  elForm.addEventListener("submit", (e) => {
    e.preventDefault();
    stopAudio();
    const guess = norm(elInput.value);
    if (!guess) return;

    const ok = TRACKS[idx].answers.some((a) => {
      const na = norm(a);
      return guess.includes(na) || na.includes(guess);
    });

    if (ok) nextTrack();
    else    failAndRestart();
  });

  elReset.addEventListener("click", (e) => {
    e.preventDefault();
    resetGame();
  });

  // --- Inicialització ---
  updateProgress();
  elTimer.textContent = `00:${String(CLIP_SECONDS).padStart(2, "0")}`;

  // Exposa API mínima per integrar amb el teu app.js (mostrar/amagar i callbacks)
  window.GameAudioGuess = {
    show() { root.hidden = false; },
    hide() { root.hidden = true;  },
    onWin: null,   // assigna-ho des del teu app per sumar puntuació/avançar
    onFail: null,  // assigna-ho si vols
    reset: resetGame
  };
})();
