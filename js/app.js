(() => {
  // Utils
  const qs = (s, r=document) => r.querySelector(s);
  const norm = (t) => (t||"").toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLowerCase();

  const VIEWS = { gate: qs("#gate"), hub: qs("#hub"), play: qs("#play"), final: qs("#final") };
  const els = {
    loginForm: qs("#loginForm"), user: qs("#username"), pass: qs("#password"), loginMsg: qs("#loginMsg"),
    progressFill: qs("#progressFill"), scoreNum: qs("#scoreNum"), scoreGoal: qs("#scoreGoal"),
    btnRestart: qs("#btnRestart"),
    gameTitle: qs("#gameTitle"), confetti: qs("#confetti"),
    btnShowRiddle: qs("#btnShowRiddle"), riddleBox: qs("#riddleBox"),
    riddleAnswer: qs("#riddleAnswer"), riddleSubmit: qs("#riddleSubmit"), riddleHint: qs("#riddleHint"),
    riddleMsg: qs("#riddleMsg"), clearCache: qs("#clearCache"),
    finalAudio: qs("#finalAudio"),
  };

  const state = { score: 0, finalShown: false };
  const CONFIG = {
    title: "Tens ganes de saber el teu regal? 😏",
    goal: 3,
    auth: { username: "laura", password: "23062025" },
    gateRiddle: {
      hint: "Llegeix només les majúscules…",
      accept: ["23062025","23/06/2025","23-06-2025","23 de juny del 2025"],
      onCorrect: "revealPassword"
    }
  };

  // ── helpers de jocs externs
  const readExternalFlags = () => ({
    game1_done: localStorage.getItem("game1_done") === "1",
    game2_done: localStorage.getItem("game2_done") === "1",
    game3_done: localStorage.getItem("game3_done") === "1",
  });
  const externalPoints = () => Object.values(readExternalFlags()).filter(Boolean).length;

  // Accepta tant #done=gameX com ?done=gameX
  function applyDoneFromReturn() {
    const url = new URL(location.href);
    const doneSearch = (url.searchParams.get("done") || "").toLowerCase();
    const m = (location.hash || "").match(/done=(game[123])/i);
    const doneHash = (m && m[1] ? m[1] : "").toLowerCase();

    let touched = false;
    const token = doneSearch || doneHash; // "game1" | "game2" | "game3" | ""

    if (token === "game1") { localStorage.setItem("game1_done","1"); touched = true; }
    if (token === "game2") { localStorage.setItem("game2_done","1"); touched = true; }
    if (token === "game3") { localStorage.setItem("game3_done","1"); touched = true; }

    if (touched) {
      try {
        url.searchParams.delete("done");
        history.replaceState(null, "", url.pathname + "#hub");
      } catch {
        location.hash = "#hub";
      }
    }
  }

  // ── vista
  const swap = (v)=>{ Object.values(VIEWS).forEach(el=>el?.classList.remove("active")); v?.classList.add("active"); };

  // ── confetti simple
  function burstConfetti() {
    if (!els.confetti) return;
    els.confetti.innerHTML = "";
    const N = 120;
    for (let i=0;i<N;i++){
      const s = document.createElement("span");
      const x = Math.random()*100;           // vw
      const y = -10 - Math.random()*20;      // start above
      const d = 4000 + Math.random()*2000;   // duration
      const sz = 6 + Math.random()*8;        // px
      s.style.left = x + "vw";
      s.style.top = y + "vh";
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      s.style.background = `hsl(${Math.random()*360},85%,60%)`;
      s.style.position = "fixed";
      s.style.borderRadius = "2px";
      s.style.pointerEvents = "none";
      s.style.transform = `rotate(${Math.random()*360}deg)`;
      s.style.transition = `transform ${d}ms linear, top ${d}ms linear, opacity 600ms ease ${d-600}ms`;
      els.confetti.appendChild(s);
      // start fall next frame
      requestAnimationFrame(()=>{
        s.style.top = (100+Math.random()*10) + "vh";
        s.style.transform = `translateY(0) rotate(${720+Math.random()*720}deg)`;
        setTimeout(()=>{ s.style.opacity = "0"; }, d-600);
        setTimeout(()=>{ s.remove(); }, d+800);
      });
    }
  }

  // ── final
function goFinal() {
  if (state.finalShown || localStorage.getItem("hmky.finalShown")==="1") {
    swap(VIEWS.final);
    try { els.finalAudio?.play?.(); } catch {}
    return;
  }

  state.finalShown = true;
  localStorage.setItem("hmky.finalShown","1");
  swap(VIEWS.final);

  // --- Assegura la pista correcta i autoplay ---
  try {
    if (els.finalAudio) {
      // força la font per si s’ha quedat la vella
      const src = "./assets/audio/Manel%20-%20Aniversari.mp3";
      const cur = els.finalAudio.querySelector("source");
      if (cur) cur.src = src; else {
        const s = document.createElement("source");
        s.src = src; s.type = "audio/mpeg";
        els.finalAudio.appendChild(s);
      }
      els.finalAudio.load();
      // Autoplay: alguns navegadors el bloquegen si no hi ha interacció prèvia
      const p = els.finalAudio.play();
      if (p && typeof p.catch === "function") {
        p.catch(()=>{ /* si falla, queda el botó de play visible */ });
      }
    }
  } catch {}

// Confetti (mateixa versió que et vaig passar)
function burstConfetti() {
  if (!els.confetti) return;
  els.confetti.innerHTML = "";
  const N = 140;
  for (let i=0;i<N;i++){
    const s = document.createElement("span");
    const x = Math.random()*100;
    const y = -10 - Math.random()*20;
    const d = 3600 + Math.random()*2400;
    const sz = 6 + Math.random()*9;
    s.style.left = x + "vw";
    s.style.top = y + "vh";
    s.style.width = sz + "px";
    s.style.height = sz + "px";
    s.style.background = `hsl(${Math.random()*360},85%,60%)`;
    els.confetti.appendChild(s);
    requestAnimationFrame(()=>{
      s.style.transition = `transform ${d}ms linear, top ${d}ms linear, opacity 600ms ease ${d-600}ms`;
      s.style.top = (100+Math.random()*10) + "vh";
      s.style.transform = `translateY(0) rotate(${720+Math.random()*720}deg)`;
      setTimeout(()=>{ s.style.opacity = "0"; }, d-600);
      setTimeout(()=>{ s.remove(); }, d+800);
    });
  }
}

// Espurnes flotants (hearts/stars subtils)
function spawnSparkles(count=32){
  const host = document.getElementById("sparkles");
  if (!host) return;
  host.innerHTML = "";
  const palette = ["#ffd166","#fca5a5","#93c5fd","#a7f3d0","#f5d0fe","#fde68a"];
  for (let i=0;i<count;i++){
    const sp = document.createElement("div");
    sp.className = "sparkle";
    const size = 6 + Math.random()*10;
    sp.style.left = (5 + Math.random()*90) + "vw";
    sp.style.bottom = (-5 + Math.random()*15) + "vh";
    sp.style.width = sp.style.height = size + "px";
    sp.style.background = palette[(Math.random()*palette.length)|0];
    sp.style.borderRadius = Math.random() < 0.4 ? "50%" : "2px"; // cercle o diamant
    const dur = 3500 + Math.random()*3000;
    sp.style.animationDuration = dur + "ms";
    sp.style.boxShadow = `0 0 ${Math.round(size/1.5)}px rgba(255,255,255,.55)`;
    host.appendChild(sp);
    setTimeout(()=> sp.remove(), dur+200);
  }
}

}

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    // Títol i goal
    els.gameTitle && (els.gameTitle.textContent = CONFIG.title);
    els.scoreGoal && (els.scoreGoal.textContent = CONFIG.goal);

    // Botó reset de la pantalla d’entrada
    els.clearCache?.addEventListener("click", ()=>{
      localStorage.clear();
      state.finalShown = false;
      location.href="./index.html";
      setTimeout(()=>location.reload(),150);
    });

    // Riddle
    els.btnShowRiddle?.addEventListener("click", ()=>{
      if (!els.riddleBox) return;
      const hidden = getComputedStyle(els.riddleBox).display === "none";
      els.riddleBox.style.display = hidden ? "block" : "none";
      if (hidden && els.riddleMsg) els.riddleMsg.textContent = "";
    });
    els.riddleHint?.addEventListener("click", ()=>{ els.riddleMsg && (els.riddleMsg.textContent = CONFIG.gateRiddle.hint); });
    els.riddleSubmit?.addEventListener("click", ()=>{
      const val = norm(els.riddleAnswer?.value);
      if (CONFIG.gateRiddle.accept.map(norm).includes(val)) {
        els.riddleMsg && (els.riddleMsg.textContent = "Correcte! 🔓");
        if (CONFIG.gateRiddle.onCorrect === "revealPassword") {
          const pwd = qs("#password"); if (pwd) pwd.value = CONFIG.auth.password;
          const form = qs("#loginForm"); form?.requestSubmit?.();
        }
      } else { els.riddleMsg && (els.riddleMsg.textContent = "No exactament…"); }
    });

    // Login
    els.loginForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const u = norm(els.user?.value), p = els.pass?.value || "";
      if (u === norm(CONFIG.auth.username) && p === CONFIG.auth.password) {
        els.loginMsg && (els.loginMsg.textContent="Benvinguda 💛", els.loginMsg.className="msg ok");
        localStorage.setItem("hmky.hubUnlocked","1");
        setTimeout(()=>{ swap(VIEWS.hub); applyDoneFromReturn(); updateProgress(); }, 200);
      } else {
        els.loginMsg && (els.loginMsg.textContent="Ups! Credencials incorrectes", els.loginMsg.className="msg err");
      }
    });

    // Si ja estava desbloquejat (refresh/retorn dels jocs), entra al hub
    if (localStorage.getItem("hmky.hubUnlocked") === "1") {
      swap(VIEWS.hub);
      applyDoneFromReturn();
      updateProgress();
    }

    // Recalcular barra quan tornes al tab/hub
    const refresh = ()=>{ applyDoneFromReturn(); updateProgress(); };
    window.addEventListener("visibilitychange", ()=>{ if (document.visibilityState === "visible") refresh(); });
    window.addEventListener("focus", refresh);
    window.addEventListener("hashchange", refresh);

    // Final - reinici total
    els.btnRestart?.addEventListener("click", ()=>{
      localStorage.clear();
      state.finalShown = false;
      location.href="./index.html";
      setTimeout(()=>location.reload(),150);
    });

    updateProgress(); // primer càlcul
  }

  function updateProgress(){
    const goal = CONFIG.goal || 3;
    const totalScore = state.score + externalPoints();
    const pct = Math.max(0, Math.min(100, (totalScore/goal)*100));
    els.progressFill && (els.progressFill.style.width = pct + "%");
    els.scoreNum && (els.scoreNum.textContent = String(totalScore));

    // 👉 Quan arribes (o superes) el goal, obre la pantalla final
    if (totalScore >= goal) {
      goFinal();
    }
  }


})();
