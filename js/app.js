(() => {
  // Utils
  const qs = (s, r=document) => r.querySelector(s);
  const norm = (t) => (t||"").toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLowerCase();

  const VIEWS = { gate: qs("#gate"), hub: qs("#hub"), play: qs("#play"), final: qs("#final") };
  const els = {
    loginForm: qs("#loginForm"), user: qs("#username"), pass: qs("#password"), loginMsg: qs("#loginMsg"),
    progressFill: qs("#progressFill"), scoreNum: qs("#scoreNum"), scoreGoal: qs("#scoreGoal"),
    btnBack: qs("#btnBack"), finalHeading: qs("#finalHeading"), finalSub: qs("#finalSubheading"),
    finalBody: qs("#finalBody"), finalAudio: qs("#finalAudio"), btnRestart: qs("#btnRestart"),
    gameTitle: qs("#gameTitle"), confetti: qs("#confetti"),
    btnShowRiddle: qs("#btnShowRiddle"), riddleBox: qs("#riddleBox"),
    riddleText: qs("#riddleText"), riddleAnswer: qs("#riddleAnswer"),
    riddleSubmit: qs("#riddleSubmit"), riddleHint: qs("#riddleHint"), riddleMsg: qs("#riddleMsg"),
    clearCache: qs("#clearCache")
  };

  const state = { score: 0 };

  const CONFIG = {
    title: "Tens ganes de saber el teu regal? 😏",
    goal: 8,
    auth: { username: "laura", password: "23062025" },
    gateRiddle: { hint: "Llegeix només les majúscules…", accept: ["23062025","23/06/2025","23-06-2025","23 de juny del 2025"], onCorrect: "revealPassword" }
  };

  // Flags jocs externs
  const readExternalFlags = () => ({
    g1: localStorage.getItem('game1_done') === '1',
    g2: localStorage.getItem('game2_done') === '1',
    g3: localStorage.getItem('game3_done') === '1',
  });
  const externalPoints = () => Object.values(readExternalFlags()).filter(Boolean).length;

  // Swap helper
  const swap = (v) => { Object.values(VIEWS).forEach(el => el?.classList.remove("active")); v?.classList.add("active"); };

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    // Títol i goal
    if (els.gameTitle) els.gameTitle.textContent = CONFIG.title;
    if (els.scoreGoal) els.scoreGoal.textContent = CONFIG.goal;

    // Reinicia joc
    els.clearCache?.addEventListener("click", ()=>{ localStorage.clear(); location.href="./index.html"; setTimeout(()=>location.reload(),150); });

    // Riddle (opcional)
    els.btnShowRiddle?.addEventListener("click", ()=>{
      if (!els.riddleBox) return;
      const hidden = getComputedStyle(els.riddleBox).display === "none";
      els.riddleBox.style.display = hidden ? "block" : "none";
      if (hidden && els.riddleMsg) els.riddleMsg.textContent = "";
    });
    els.riddleHint?.addEventListener("click", ()=>{ if (els.riddleMsg) els.riddleMsg.textContent = CONFIG.gateRiddle.hint; });
    els.riddleSubmit?.addEventListener("click", ()=>{
      const val = norm(els.riddleAnswer?.value);
      if (CONFIG.gateRiddle.accept.map(norm).includes(val)) {
        if (els.riddleMsg) els.riddleMsg.textContent = "Correcte! 🔓";
        if (CONFIG.gateRiddle.onCorrect === "revealPassword") {
          const pwd = qs("#password"); if (pwd) pwd.value = CONFIG.auth.password;
          const form = qs("#loginForm"); if (form?.requestSubmit) form.requestSubmit();
        }
      } else {
        if (els.riddleMsg) els.riddleMsg.textContent = "No exactament…";
      }
    });

    // Login
    els.loginForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const u = norm(els.user?.value), p = els.pass?.value || "";
      if (u === norm(CONFIG.auth.username) && p === CONFIG.auth.password) {
        if (els.loginMsg){ els.loginMsg.textContent="Benvinguda 💛"; els.loginMsg.className="msg ok"; }
        localStorage.setItem("hmky.hubUnlocked","1");
        setTimeout(()=>{ swap(VIEWS.hub); updateProgress(); }, 200);
      } else {
        if (els.loginMsg){ els.loginMsg.textContent="Ups! Credencials incorrectes"; els.loginMsg.className="msg err"; }
      }
    });

    // Si ja estava desbloquejat (refresh), entra al hub
    if (localStorage.getItem("hmky.hubUnlocked") === "1") {
      swap(VIEWS.hub);
      updateProgress();
    }

    // Recalcular barra quan tornes al tab/hub
    const refresh = ()=> updateProgress();
    window.addEventListener("visibilitychange", ()=>{ if (document.visibilityState === "visible") refresh(); });
    window.addEventListener("focus", refresh);
    window.addEventListener("hashchange", refresh);

    // Final restart
    els.btnRestart?.addEventListener("click", ()=>{ localStorage.clear(); location.href="./index.html"; setTimeout(()=>location.reload(),150); });

    updateProgress();
  }

  function updateProgress(){
    const goal = CONFIG.goal || 8;
    const totalScore = state.score + externalPoints();
    const pct = Math.max(0, Math.min(100, (totalScore/goal)*100));
    if (els.progressFill) els.progressFill.style.width = pct + "%";
    if (els.scoreNum) els.scoreNum.textContent = String(totalScore);
    // No canviem de vista automàticament a 'final' aquí per simplicitat
  }
})();
