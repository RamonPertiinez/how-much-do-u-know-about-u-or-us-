// Joc 3 — Encerta els ulls (6 persones)
(() => {
  const QUESTIONS = [
    { image: "./images/PERSONA_1.jpeg", options: ["Dani", "Laura", "Marina"], correctIndex: 0 },
    { image: "./images/PERSONA_2.jpeg", options: ["Laura", "Marta", "Ramon"], correctIndex: 0 },
    { image: "./images/PERSONA_3.jpeg", options: ["Marina", "Dani", "Laura"], correctIndex: 0 },
    { image: "./images/PERSONA_4.jpeg", options: ["Marta", "Ramon", "Laura"], correctIndex: 0 },
    { image: "./images/PERSONA_5.jpeg", options: ["Ramon", "Marina", "Dani"], correctIndex: 0 },
    { image: "./images/PERSONA_6.jpeg", options: ["Aneu", "Laura", "Dani"], correctIndex: 0 },
  ];

  // 📸 Fotos de resposta (stills completes) — mateix ordre que les rondes 1..6
  // Ruta coherent amb les PERSONA_X: ./images/...
  const ANSWER_IMAGES = [
    "./images/RESPOSTA_1_DANI.jpeg",
    "./images/RESPOSTA_2_LAURA.jpeg",
    "./images/RESPOSTA_3_MARINA.jpeg",
    "./images/RESPOSTA_4_MARTA.jpeg",
    "./images/RESPOSTA_5_RAMON.jpeg",
    "./images/RESPOSTA_6_ANEU.jpeg",
  ];

  const qs = (s, r=document) => r.querySelector(s);
  const preload = (arr)=>arr.forEach(src=>{ const i=new Image(); i.src=src; });

  const shuffleOptions = (q) => {
    const idxs=[0,1,2];
    for(let i=idxs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idxs[i],idxs[j]]=[idxs[j],idxs[i]]; }
    return { image:q.image, options:idxs.map(i=>q.options[i]), correctIndex: idxs.indexOf(q.correctIndex) };
  };

  const state = { i:0, score:0, answered:false, questions: QUESTIONS.map(shuffleOptions) };
  window.Game3 = state;

  const img = qs("#eyesImg");
  const optionsBox = qs("#options");
  const roundNum = qs("#roundNum");
  const scoreEl = qs("#score");
  const statusEl = qs("#status");
  const nextBtn = qs("#btnNext");
  const finishBtn = qs("#btnFinish");

  // 🔎 elimina la targeta de resposta si existeix
  function clearAnswerCard(){
    const old = qs("#answerCard");
    if (old) old.remove();
  }

  // ✨ mostra la foto + nom de la resposta correcta sota la imatge dels ulls
  function showAnswerPhoto(roundIndex, correctName){
    clearAnswerCard();

    const card = document.createElement("div");
    card.id = "answerCard";
    card.style.marginTop = "12px";
    card.style.padding = "12px";
    card.style.border = "1px solid rgba(255,255,255,.15)";
    card.style.borderRadius = "12px";
    card.style.background = "rgba(255,255,255,.04)";

    const pic = document.createElement("img");
    pic.src = ANSWER_IMAGES[roundIndex] + "?v=" + Date.now(); // cache-bust
    pic.alt = "Resposta correcta";
    pic.style.display = "block";
    pic.style.maxWidth = "420px";
    pic.style.width = "100%";
    pic.style.height = "auto";
    pic.style.borderRadius = "10px";
    pic.style.border = "1px solid rgba(255,255,255,.12)";
    pic.loading = "lazy";

    const cap = document.createElement("div");
    cap.textContent = `És ${correctName}`;
    cap.style.marginTop = "8px";
    cap.style.fontWeight = "700";
    cap.style.opacity = "0.9";

    card.appendChild(pic);
    card.appendChild(cap);

    // Inserim just DESPRÉS de la imatge principal dels ulls
    img.insertAdjacentElement("afterend", card);
    // Scroll suau cap a la targeta
    setTimeout(()=> card.scrollIntoView({behavior:"smooth", block:"start"}), 50);
  }

  function paint(){
    const q = state.questions[state.i];
    roundNum.textContent = `Ronda ${state.i+1}`;
    scoreEl.textContent = state.score;
    img.src = q.image;
    statusEl.className = "status"; statusEl.textContent = "";
    nextBtn.disabled = true;
    state.answered = false;
    clearAnswerCard();

    optionsBox.innerHTML = "";
    q.options.forEach((label, idx)=>{
      const b=document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", ()=>onPick(idx,b));
      optionsBox.appendChild(b);
    });

    nextBtn.textContent = (state.i === state.questions.length-1) ? "Acabar ➜" : "Següent ➜";
  }

  function onPick(idx, btn){
    if (state.answered) return;
    const q = state.questions[state.i];
    const all = [...optionsBox.querySelectorAll("button")];

    if (idx === q.correctIndex){
      state.score++; scoreEl.textContent = state.score;
      statusEl.textContent = "Correcte! 😍"; statusEl.className="status ok";
      btn.style.borderColor = "#39d98a";
      all.forEach(b=>b.disabled=true);
      state.answered = true; nextBtn.disabled = false;

      // 🎉 mostra la foto de la resposta correcta
      const correctName = q.options[q.correctIndex];
      showAnswerPhoto(state.i, correctName);

    } else {
      statusEl.textContent = "Ups! 😅 Torna-ho a intentar."; statusEl.className="status err";
      btn.style.borderColor = "#ff6b6b";
    }
  }

  function next(){
    if (!state.answered) return;
    if (state.i < state.questions.length-1){
      state.i++; paint();
    } else {
      finish();
    }
  }

  function finish(){
    window.dispatchEvent(new CustomEvent("game3:finished"));
    statusEl.textContent = `Fi del joc! 🥳 Has encertat ${state.score}/${state.questions.length}.`;
    statusEl.className = "status ok";
    optionsBox.querySelectorAll("button").forEach(b=>b.disabled=true);
    nextBtn.style.display="none";
    finishBtn.style.display="inline-block";
    try { localStorage.setItem('hmky.g3', 'done'); } catch {}
  }

  nextBtn.addEventListener("click", next);

  // Precarrega tant ulls com respostes
  preload(QUESTIONS.map(q=>q.image));
  preload(ANSWER_IMAGES);

  paint();
})();
