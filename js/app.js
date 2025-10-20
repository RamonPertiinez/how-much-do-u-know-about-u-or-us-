(() => {
  // ---------- Utils ----------
  const qs = (s, r = document) => r.querySelector(s);
  const norm = (t) => (t || "").toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLowerCase();
  const log = (...a)=>console.log("[app]",...a);
  const fail = (msg,err)=>{ console.error("[app]", msg, err||""); const b=qs("#loginMsg"); if(b){ b.className="msg err"; b.textContent = msg; } };

  const VIEWS = { gate: qs("#gate"), hub: qs("#hub"), play: qs("#play"), final: qs("#final") };
  const els = {
    loginForm: qs("#loginForm"), user: qs("#username"), pass: qs("#password"), loginMsg: qs("#loginMsg"),
    progressFill: qs("#progressFill"), scoreNum: qs("#scoreNum"), scoreGoal: qs("#scoreGoal"),
    grid: qs("#challengeGrid"), btnShuffle: qs("#btnShuffle"), btnReset: qs("#btnReset"), easterReset: qs("#easterReset"),
    btnBack: qs("#btnBack"), chTitle: qs("#challengeTitle"), chIntro: qs("#challengeIntro"), chContent: qs("#challengeContent"),
    btnSubmit: qs("#btnSubmit"), feedback: qs("#feedback"),
    finalHeading: qs("#finalHeading"), finalSub: qs("#finalSubheading"),
    finalBody: qs("#finalBody"), finalAudio: qs("#finalAudio"), btnRestart: qs("#btnRestart"),
    gameTitle: qs("#gameTitle"), confetti: qs("#confetti")
  };

  const storageKey = "laura25-state-v1";
  const state = { config:null, challenges:[], solved:{}, score:0, current:null };

  // ---------- Defaults ----------
  const DEFAULT_CONFIG = {
    title: "Tens ganes de saber el teu regal? 😏",
    goal: 8,
    auth: { username: "laura", password: "23062025" },
    final: { heading: "🎉 Sorpresa desbloquejada!", subheading: "Has superat les proves del meu cor.", body: "Al gener, porta la teva roba més elegant. Tinc reservat un lloc especial per sopar junts a Roma. 💛", audio: "" },
    gateRiddle: { hint: "Llegeix només les majúscules...", accept: ["23062025","23/06/2025","23-06-2025","23 de juny del 2025"], onCorrect: "revealPassword" }
  };

  const DEFAULT_CHALLENGES = []; // (si no tens reptes interns al hub, el deixem buit)

  // ---------- Helpers ----------
  const save = ()=>localStorage.setItem(storageKey, JSON.stringify({solved:state.solved, score:state.score}));
  const load = ()=>{ try{ const d=JSON.parse(localStorage.getItem(storageKey)); if(d){ state.solved=d.solved||{}; state.score=d.score||0; } }catch{} };
  const swap = (v)=>{ Object.values(VIEWS).forEach(el=>el.classList.remove("active")); v.classList.add("active"); };
  async function fetchJSON(path,fallback){
    try{ const res=await fetch(path,{cache:"no-cache"}); if(!res.ok) throw new Error(res.status+" "+res.statusText); return await res.json(); }
    catch{ return structuredClone(fallback); }
  }

  // Flags dels jocs externs (1/2/3)
  function readExternalFlags(){ return {
    g1: localStorage.getItem('game1_done') === '1',
    g2: localStorage.getItem('game2_done') === '1',
    g3: localStorage.getItem('game3_done') === '1',
  }; }
  function externalPoints(){ return Object.values(readExternalFlags()).filter(Boolean).length; }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => { try{ boot(); }catch(e){ fail("Error iniciant l’app.", e); } });

  async function boot(){
    load();
    const cfg = await fetchJSON("data/config.json", DEFAULT_CONFIG);
    const chs = await fetchJSON("data/challenges.json", DEFAULT_CHALLENGES);
    state.config = cfg; state.challenges = chs;

    document.title = cfg.title || document.title;
    els.gameTitle.textContent = cfg.title || "Joc";
    els.scoreGoal.textContent = cfg.goal || 8;

    if (cfg.final){
      els.finalHeading.textContent = cfg.final.heading || els.finalHeading.textContent;
      els.finalSub.textContent = cfg.final.subheading || els.finalSub.textContent;
      els.finalBody.textContent = cfg.final.body || els.finalBody.textContent;
      if (cfg.final.audio){ const s=document.createElement("source"); s.src=cfg.final.audio; s.type="audio/mpeg"; els.finalAudio.appendChild(s); }
    }

    setupRiddleUI();

    // Reinicia joc
    document.getElementById("clearCache")?.addEventListener("click", ()=>{ localStorage.clear(); location.reload(); });

    // Login
    els.loginForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      try{
        const u = norm(els.user.value), p = els.pass.value;
        if (u === norm(cfg.auth.username) && p === cfg.auth.password) {
          els.loginMsg.textContent = "Benvinguda 💛"; els.loginMsg.className = "msg ok";
          localStorage.setItem("hmky.hubUnlocked", "1");
          setTimeout(() => { swap(VIEWS.hub); updateProgress(); }, 300);
        } else {
          els.loginMsg.textContent = "Ups! Credencials incorrectes"; els.loginMsg.className = "msg err";
        }
      }catch(err){ fail("Error al validar credencials", err); }
    });

    // Botó tornar des de la vista 'play'
    els.btnBack?.addEventListener("click", ()=>{ swap(VIEWS.hub); updateProgress(); });

    // Final
    els.btnRestart?.addEventListener("click", ()=>{ localStorage.removeItem(storageKey); state.solved={}; state.score=0; swap(VIEWS.gate); });

    // Si el Hub ja estava desbloquejat (refresh), obre directament
    if (localStorage.getItem("hmky.hubUnlocked") === "1") {
      swap(VIEWS.hub);
      updateProgress();
    }

    // Recalcular barra en tornar al hub (si s'ha jugat a una pestanya)
    const refresh = () => updateProgress();
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    window.addEventListener('focus', refresh);
    window.addEventListener('hashchange', refresh);

    // Esdeveniments opcionals (si algun joc els dispara)
    window.addEventListener('game1:finished', refresh);
    window.addEventListener('game2:finished', refresh);
    window.addEventListener('game3:finished', refresh);

    updateProgress();
  }

  // ---------- Riddle ----------
  function setupRiddleUI(){
    const btnShow = document.getElementById('btnShowRiddle');
    const riddleBox = document.getElementById('riddleBox');
    if (btnShow && riddleBox){
      btnShow.addEventListener('click', ()=>{
        const hidden = getComputedStyle(riddleBox).display === 'none';
        riddleBox.style.display = hidden ? 'block' : 'none';
      });
    }
    const r = DEFAULT_CONFIG.gateRiddle;
    const riddleSubmit = document.getElementById('riddleSubmit');
    const riddleAnswer = document.getElementById('riddleAnswer');
    const riddleMsg = document.getElementById('riddleMsg');
    const passwordInput = document.getElementById('password');

    riddleSubmit?.addEventListener('click', ()=>{
      const val = norm(riddleAnswer?.value);
      const ok = r.accept.map(norm).includes(val);
      if (ok){
        riddleMsg.textContent = 'Correcte! 🔓';
        if (r.onCorrect === 'revealPassword'){
          passwordInput.value = DEFAULT_CONFIG.auth.password;
          document.getElementById('loginForm')?.requestSubmit?.();
        }
      } else {
        riddleMsg.textContent = 'No exactament...';
      }
    });
  }

  // ---------- Barra / Final ----------
  function updateProgress(){
    const goal = state.config?.goal || 8;
    const totalScore = state.score + externalPoints(); // punts interns + jocs 1/2/3
    const p = Math.max(0, Math.min(100, (totalScore/goal)*100));
    if (els.progressFill) els.progressFill.style.width = p + "%";
    if (els.scoreNum) els.scoreNum.textContent = totalScore.toString();

    if (totalScore >= goal){
      celebrate();
      setTimeout(()=>{ swap(VIEWS.final); try{ els.finalAudio?.play().catch(()=>{});}catch{} }, 500);
    }
  }

  function celebrate(){
    const c = els.confetti; if (!c) return;
    c.innerHTML="";
    for(let i=0;i<80;i++){
      const s=document.createElement("span");
      s.style.left=Math.random()*100+"vw"; s.style.top="-10px";
      s.style.width=s.style.height=8+Math.random()*8+"px";
      s.style.background=`hsl(${Math.random()*360},80%,60%)`; s.style.opacity=".9";
      s.style.transform=`rotate(${Math.random()*360}deg)`;
      s.style.transition="transform 1.2s ease, top 1.2s ease";
      c.appendChild(s);
      requestAnimationFrame(()=>{ s.style.top="110vh"; s.style.transform=`translateY(100vh) rotate(${Math.random()*720}deg)`; });
      setTimeout(()=>s.remove(),1500);
    }
  }
})();
