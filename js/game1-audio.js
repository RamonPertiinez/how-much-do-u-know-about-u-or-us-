// ===== Joc 1 - Endevina la cançó (multiple-choice) =====
// Amb fallback automàtic de rutes: assets/ → audio/ → raw.githubusercontent.com
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // Només indiquem el nom del fitxer; les rutes les resol el codi
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

  // Bases a provar (ordre)
  const RAW_BASE = "https://raw.githubusercontent.com/RamonPertinez/how-much-do-u-know-about-u-or-us-/main/assets/audio/game1/";
  const PATHS = ["assets/audio/game1/", "audio/game1/", RAW_BASE];

  const CLIP_SECONDS = 10;

  let idx = 0, audio = null, endTimer = null, baseIdx = 0;

  const root = $("#game-audio");
  if (!root) return;

  const elPlay  = $("#gaPlay", root);
  const elTimer = $("#gaTimer", root);
  const elMsg   = $("#gaMsg", root);
  const elReset = $("#gaReset", root);
  const elBar   = $("#gaProgressFill", root);

  // contenidor d’opcions
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

  const srcFor = (iBase) => PATHS[iBase] + TRACKS[idx].file;

  const stopAudio = () => {
    try { audio?.pause(); } catch {}
    clearTimeout(endTimer);
    elPlay.disabled = false;
  };

  async function tryPlayWithBase(iBase) {
    return new Promise(async (resolve, reject) => {
      try {
        audio = new Audio(srcFor(iBase));
        audio.preload = "auto";
        audio.addEventListener("canplay", () => resolve("canplay"), { once: true });
        audio.addEventListener("error", () => reject(new Error("audio error")), { once: true });
        audio.load();

        // alguns navegadors no triguen a disparar "canplay"; provem play directament
        await audio.play();
        resolve("playing");
      } catch (e) {
        reject(e);
      }
    });
  }

  const playClip = async () => {
    stopAudio();
    elPlay.disabled = true;
    setMsg(`Escoltant fragment… (${TRACKS[idx].artist})`);

    // Prova seqüencialment totes les bases
    let played = false;
    for (let i = baseIdx; i < PATHS.length; i++) {
      try {
        await tryPlayWithBase(i);
        baseIdx = i;         // recorda la base que ha funcionat
        played = true;
        break;
      } catch (e) {
        // continua amb la següent base
        continue;
      }
    }

    if (!played) {
      setMsg("No puc reproduir l'àudio (404 o permisos).", "err");
      console.error("No playable source for:", TRACKS[idx].file, "tested:", PATHS);
      elPlay.disabled = false;
      return;
    }

    // compte enrere
    let remain = CLIP_SECONDS;
    elTimer.textContent = `00:${String(remain).padStart(2, "0")}`;
    const tick = setInterval(() => {
      remain -= 1;
      elTimer.textContent = `00:${String(Math.max(remain, 0)).padStart(2, "0")}`;
      if (remain <= 0) clearInterval(tick);
    }, 1000);
    endTimer = setTimeout(() => { stopAudio(); setMsg("Temps!"); }, CLIP_SECONDS * 1000);
  };

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

  window.GameAudioGuess = {
    show() { root.hidden = false; },
    hide() { root.hidden = true;  },
    onWin: null,
    onFail: null,
    reset: resetGame
  };
})();
