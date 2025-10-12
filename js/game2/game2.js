(() => {
  // ------ Config ------
  const CORRECT = "Estany Negre de Cabanes";
  const OPTIONS = [
    "Estany de Sant Maurici",
    "Estany Llong",
    "Estany de Cavallers",
    "Estany de Subenuix",
    "Estany Gento",
    "Estany de Baborte",
    "Estany de Certascan",
    "Estany de Gerber",
    "Estany de Mar",
    "Estany Negre de Cabanes" // ✅ correcte
  ];
  const START_SECONDS = 30;

  // ------ Elements ------
  const els = {
    clip: document.getElementById("clip"),
    start: document.getElementById("btnStart"),
    pause: document.getElementById("btnPause"),
    time: document.getElementById("time"),
    guess: document.getElementById("guess"),
    submit: document.getElementById("btnSubmit"),
    feedback: document.getElementById("feedback"),
    after: document.getElementById("after"),
    replay: document.getElementById("btnReplay"),
  };

  // ------ Estat ------
  let remaining = START_SECONDS;
  let ticker = null;

  // ------ Utils (si no vols utils.js, deixa aquestes 3 funcions aquí) ------
  const z2  = n => n.toString().padStart(2, "0");
  const fmt = s => `${z2(Math.floor(s/60))}:${z2(s%60)}`;
  const setTime = s => { els.time.textContent = fmt(s); };

  const enable = (el, on=true)=>{ el.disabled = !on; };
  const msg = (t, cls="")=>{
    els.feedback.className = `feedback ${cls}`;
    els.feedback.textContent = t;
  };

  const fillOptions = () => {
    const shuffled = OPTIONS.slice().sort(()=>Math.random()-0.5);
    for (const name of shuffled) {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      els.guess.appendChild(opt);
    }
  };

  const lockAnswerUI = (lock=true)=>{
    enable(els.guess, !lock);
    enable(els.submit, !lock);
  };

  const showEnd = ()=>{
    els.after.classList.remove("hidden");
    enable(els.start, false);
    enable(els.pause, false);
    lockAnswerUI(true);
  };

  const resetAll = ()=>{
    clearInterval(ticker); ticker = null;
    remaining = START_SECONDS;
    setTime(remaining);
    msg("");
    els.after.classList.add("hidden");
    enable(els.start, true);
    enable(els.pause, false);
    els.clip.pause();
    els.clip.currentTime = 0;
    els.guess.innerHTML = '<option value="" selected disabled>Selecciona un estany del Pirineu català…</option>';
    fillOptions();
    lockAnswerUI(true);
  };

  const startTimer = ()=>{
    if (ticker) return;
    ticker = setInterval(()=>{
      remaining -= 1;
      setTime(remaining);
      if (remaining <= 0) {
        clearInterval(ticker); ticker = null;
        msg("⏰ Temps esgotat! Prova de nou.", "warn");
        els.clip.pause();
        showEnd();
      }
    }, 1000);
  };

  const pauseTimer = ()=>{
    clearInterval(ticker); ticker = null;
  };

  // ------ Events ------
  els.start.addEventListener("click", async ()=>{
    try { await els.clip.play(); } catch(e) {}
    startTimer();
    enable(els.start, false);
    enable(els.pause, true);
    lockAnswerUI(false);
  });

  els.pause.addEventListener("click", ()=>{
    if (els.clip.paused) return;
    els.clip.pause();
    pauseTimer();
    enable(els.pause, false);
    enable(els.start, true);
  });

  els.clip.addEventListener("play", ()=>{
    if (!ticker) startTimer();
    enable(els.start, false);
    enable(els.pause, true);
    lockAnswerUI(false);
  });

  els.clip.addEventListener("pause", ()=>{ pauseTimer(); });

  els.submit.addEventListener("click", ()=>{
    const val = els.guess.value;
    if (!val) { msg("Tria una opció.", "warn"); return; }

    pauseTimer();
    els.clip.pause();

    if (val === CORRECT) {
      msg("✅ Correcte! Era l’Estany Negre de Cabanes.", "ok");
    } else {
      msg(`❌ Incorrecte. La bona era: ${CORRECT}.`, "err");
    }
    showEnd();
  });

  els.replay?.addEventListener("click", resetAll);

  // ------ Init ------
  setTime(remaining);
  fillOptions();
  lockAnswerUI(true);
})();

