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
    riddleMsg: qs("#riddleMsg"), clearCache: qs("#clearCache")
  };

  const state = { score: 0 };
  const CONFIG = {
    title: "Tens ganes de saber el teu regal? 😏",
    goal: 3,
    auth: { username: "laura", password: "23062025" },
    gateRiddle: { hint: "Llegeix només les majúscules…", accept: ["23062025","23/06/2025","23-06-2025","23 de juny del 2025"], onCorrect: "revealPassword" }
  };

  // Llegeix els flags guardats per cada joc
  const readExternalFlags = () => ({
    game1_done: localStorage.getItem("game1_done") === "1",
    game2_done: localStorage.getItem("game2_done") === "1",
    game3_done: localStorage.getItem("game3_done") === "1",
  });
  const externalPoints = () => Object.values(readExternalFlags()).filter(Boolean).length;

  // ✅ Accepta tant #done=gameX com ?done=gameX i marca localStorage
  function applyDoneFromReturn() {
    const url = new URL(location.href);
    const doneSearch = (url.searchParams.get("done") || "").toLowerCase(); // query
    const m = (location.hash || "").match(/done=(game[123])/i);             // hash
    const doneHash = (m && m[1] ? m[1] : "").toLowerCase();

    let touched = false;
    const token = doneSearch || doneHash; // "game1" | "game2" | "game3" | ""

    if (token === "game1") { localStorage.setItem("game1_done","1"); touched = true; }
    if (token === "game2") { localStorage.setItem("game2_done","1"); touched = true; }
    if (token === "game3") { localStorage.setItem("game3_done","1"); touched = true; }

    if (touched) {
      // Neteja query i hash i deixa #hub perquè un refresh no torni a marcar
      try {
        url.searchParams.delete("done");
        history.replaceState(null, "", url.pathname + "#hub");
      } catch {
        location.hash = "#hub";
      }
    }
  }

  // Swap
  const swap = (v)=>{ Object.values(VIEWS).forEach(el=>el?.classList.remove("active")); v?.classList.add("active"); };

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    // Títol i goal
    els.gameTitle && (els.gameTitle.textContent = CONFIG.title);
    els.scoreGoal && (els.scoreGoal.textContent = CONFIG.goal);

    // Botó reset de la pantalla d’entrada
    els.clearCache?.addEventListener("click", ()=>{
      localStorage.clear();
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
      location.href="./index.html";
      setTimeout(()=>location.reload(),150);
    });

    updateProgress();
  }

  function updateProgress(){
    const goal = CONFIG.goal || 3;
    const totalScore = state.score + externalPoints();
    const pct = Math.max(0, Math.min(100, (totalScore/goal)*100));
    els.progressFill && (els.progressFill.style.width = pct + "%");
    els.scoreNum && (els.scoreNum.textContent = String(totalScore));
  }
})();
