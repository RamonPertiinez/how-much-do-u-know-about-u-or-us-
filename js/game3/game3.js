// Joc 3 — Encerta els ulls (6 persones)
(() => {
  // ------- Config -------
  const QUESTIONS = [
    {
      image: "images/PERSONA_1.jpeg",
      options: ["Dani", "Laura", "Marina"],
      correctIndex: 0,
    },
    {
      image: "images/PERSONA_2.jpeg",
      options: ["Laura", "Marta", "Ramon"],
      correctIndex: 0,
    },
    {
      image: "images/PERSONA_3.jpeg",
      options: ["Marina", "Dani", "Laura"],
      correctIndex: 0,
    },
    {
      image: "images/PERSONA_4.jpeg",
      options: ["Marta", "Ramon", "Laura"],
      correctIndex: 0,
    },
    {
      image: "images/PERSONA_5.jpeg",
      options: ["Ramon", "Marina", "Dani"],
      correctIndex: 0,
    },
    {
      image: "images/PERSONA_6.jpeg",
      options: ["Aneu", "Laura", "Dani"],
      correctIndex: 0, // <-- ANEU és la correcta
    },
  ];

  // ------- Helpers -------
  const qs = (s, r = document) => r.querySelector(s);
  const preload = (srcs) => srcs.forEach((s) => { const img = new Image(); img.src = s; });

  // barreja opcions mantenint el correcte
  const shuffleOptions = (q) => {
    const idxs = [0, 1, 2];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    const newOpts = idxs.map((i) => q.options[i]);
    const newCorrect = idxs.indexOf(q.correctIndex);
    return { image: q.image, options: newOpts, correctIndex: newCorrect };
  };

  // ------- State -------
  const state = { i: 0, score: 0, answered: false, questions: QUESTIONS.map(shuffleOptions) };
  window.Game3 = state; // exposa score per al hub

  // ------- DOM -------
  const img = qs("#eyesImg");
  const optionsBox = qs("#options");
  const roundNum = qs("#roundNum");
  const scoreEl = qs("#score");
  const statusEl = qs("#status");
  const nextBtn = qs("#btnNext");
  const finishBtn = qs("#btnFinish");

  // ------- UI -------
  function paint() {
    const q = state.questions[state.i];
    roundNum.textContent = `Ronda ${state.i + 1}`;
    scoreEl.textContent = state.score;
    img.src = q.image;
    statusEl.className = "status";
    statusEl.textContent = "";
    nextBtn.disabled = true;
    optionsBox.innerHTML = "";

    q.options.forEach((label, idx) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.addEventListener("click", () => onPick(idx, btn));
      optionsBox.appendChild(btn);
    });

    nextBtn.textContent = (state.i === state.questions.length - 1) ? "Acabar ➜" : "Següent ➜";
  }

  function onPick(idx, btnEl) {
    if (state.answered) return;
    const q = state.questions[state.i];
    const allBtns = [...optionsBox.querySelectorAll("button")];

    if (idx === q.correctIndex) {
      state.score++;
      scoreEl.textContent = state.score;
      statusEl.textContent = "Correcte! 😍";
      statusEl.className = "status ok";
      btnEl.style.borderColor = "#39d98a";
      allBtns.forEach((b) => (b.disabled = true));
      state.answered = true;
      nextBtn.disabled = false;
    } else {
      statusEl.textContent = "Ups! 😅 Torna-ho a intentar.";
      statusEl.className = "status err";
      btnEl.style.borderColor = "#ff6b6b";
    }
  }

  function next() {
    if (!state.answered) return;
    if (state.i < state.questions.length - 1) {
      state.i++;
      state.answered = false;
      paint();
    } else {
      finish();
    }
  }

  function finish() {
    window.dispatchEvent(new CustomEvent("game3:finished"));
    statusEl.textContent = `Fi del joc! 🥳 Has encertat ${state.score}/${state.questions.length}.`;
    statusEl.className = "status ok";
    optionsBox.querySelectorAll("button").forEach((b) => (b.disabled = true));
    nextBtn.style.display = "none";
    finishBtn.style.display = "inline-block";
  }

  nextBtn.addEventListener("click", next);

  // Init
  preload(state.questions.map((q) => q.image));
  paint();
})();

