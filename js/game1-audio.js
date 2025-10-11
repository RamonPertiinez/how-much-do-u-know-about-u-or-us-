// ===== Joc 1 - Endevina la cançó (multiple-choice) =====
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  const TRACKS = [
    { file: "assets/audio/game1/track1.mp3", artist: "Ginestà",
      options: ["Un piset amb tu", "T’estimo molt", "Ulls d’avellana"], correctIndex: 2 },
    { file: "assets/audio/game1/track2.mp3", artist: "Manel",
      options: ["Els guapos són els raros", "En la que el Bernat se’t troba", "Teresa Rampell"], correctIndex: 0 },
    { file: "assets/audio/game1/track3.mp3", artist: "Oques Grasses",
      options: ["La gent que estimo", "Sort de tu", "De bonesh"], correctIndex: 2 },
    { file: "assets/audio/game1/track4.mp3", artist: "The Tyets",
      options: ["Tàndem", "Canilla", "Sushi Poke"], correctIndex: 1 },
    { file: "assets/audio/game1/track5.mp3", artist: "Txarango",
      options: ["La dansa del vestit", "Músic de carrer", "Sou persones"], correctIndex: 2 },
  ];

  const CLIP_SECONDS = 10;

  let idx = 0, audio = null, endTimer = null;

  const root = $("#game-audio");
  if (!root) return;

  const elPlay  = $("#gaPlay", root);
  const elTimer = $("#gaTimer", root);
  const elMsg   = $("#gaMsg", root);
  const elReset = $("#gaReset", root);
  const elBar   = $("#gaProgressFill", root);

  // ⬇️ CREA el contenidor d’opcions si no existeix
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

  const stopAudio = () => { if (audio) try { audio.pause(); } catch {} clearTimeout(endTimer); elPlay.disabled = false; };

  const playClip = async () => {
    stopAudio();
    audio = new Audio(TRACKS[idx].file);
    elPlay.disabled = true;
    setMsg(`Escoltant fragment… (${TRACKS[idx].artist})`);
    try { audio.load(); await audio.play(); }
    catch { setMsg("Prem ▶︎ un altre cop per permetre l'àudio 🎧"); elPlay.disabled = false; return; }

    let remain = CLIP_SECONDS;
    elTimer.textContent = `00:${String(remain).padStart(2, "0")}`;
    const tick = setInterval(() => {
      remain -= 1;
      elTimer.textContent = `00:${String(Math.max(remain, 0)).padStart(2, "0")}`;
      if (remain <= 0) clearInterval(tick);
    }, 1000);
    endTimer = setTimeout(() => { stopAudio(); setMsg("Temps!"); }, CLIP_SECONDS * 1000);

    audio.addEventListener("error", () => {
      setMsg("No he trobat l'àudio: " + TRACKS[idx].file, "err");
      console.error("Audio error", audio.error, "src:", audio.src);
    });
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

  const nextTrack = () => {
    idx += 1;
    updateProgress();
    if (idx >= TRACKS.length) {
      setMsg("🎉 Brutal! Has encertat les 5 cançons!", "ok");
      window.GameAudioGuess?.onWin?.();
      elPlay.disabled = true;
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
    paintChoices(); // ⬅️ força pintar opcions
  };

  // Init
  updateProgress();
  paintChoices();
  elTimer.textContent = `00:${String(CLIP_SECONDS).padStart(2, "0")}`;

  window.GameAudioGuess = {
    show() { root.hidden = false; },
    hide() { root.hidden = true;  },
    onWin: null,
    onFail: null,
    reset: resetGame
  };

  // DEBUG ràpid a la consola si cal:
  // window.GameAudioGuess.reset();
})();
