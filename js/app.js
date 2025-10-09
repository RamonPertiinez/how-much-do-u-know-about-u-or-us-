(() => {
  const qs = (s, r=document)=>r.querySelector(s);
  const norm = t => (t||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLowerCase();

  const VIEWS = { gate:qs("#gate"), hub:qs("#hub"), play:qs("#play"), final:qs("#final") };
  const els = {
    loginForm:qs("#loginForm"), user:qs("#username"), pass:qs("#password"), loginMsg:qs("#loginMsg"),
    progressFill:qs("#progressFill"), scoreNum:qs("#scoreNum"), scoreGoal:qs("#scoreGoal"),
    grid:qs("#challengeGrid"), btnShuffle:qs("#btnShuffle"), btnReset:qs("#btnReset"), easterReset:qs("#easterReset"),
    btnBack:qs("#btnBack"), chTitle:qs("#challengeTitle"), chIntro:qs("#challengeIntro"), chContent:qs("#challengeContent"),
    btnSubmit:qs("#btnSubmit"), feedback:qs("#feedback"),
    finalHeading:qs("#finalHeading"), finalSub:qs("#finalSubheading"), finalTitle:qs("#finalTitle"),
    finalBody:qs("#finalBody"), finalAudio:qs("#finalAudio"), btnRestart:qs("#btnRestart"),
    gameTitle:qs("#gameTitle"), confetti:qs("#confetti")
  };

  const storageKey="laura25-state-v1";
  const state={config:null,challenges:[],solved:{},score:0,current:null};

  const DEFAULT_CONFIG={
    title:"Tens ganes de saber el teu regal? 😏",
    goal:8,
    auth:{username:"laura",password:"12072022"},
    final:{
      heading:"🎉 Sorpresa desbloquejada!",
      subheading:"Has superat les proves del meu cor.",
      body:"Al gener, porta la teva roba més elegant. Tinc reservat un lloc especial per sopar junts a Roma. 💛",
      audio:""
    },
    gateRiddle:{
      hint:"Llegeix les majúscules… potser amaguen una pregunta 😉",
      accept:["12072022","12/07/2022","12-07-2022","12 juliol 2022"],
      onCorrect:"revealPassword"
    }
  };

  const DEFAULT_CHALLENGES=[{id:"c1",title:"On va començar tot?",intro:"Recordes el primer lloc on vam dormir junts?",type:"text",emoji:"💭",answer:"poblenou",accept:["poble nou","poblenou"],score:1}];

  const save=()=>localStorage.setItem(storageKey,JSON.stringify({solved:state.solved,score:state.score}));
  const load=()=>{try{const d=JSON.parse(localStorage.getItem(storageKey));if(d){state.solved=d.solved||{};state.score=d.score||0;}}catch(e){}};
  const swap=v=>{Object.values(VIEWS).forEach(x=>x.classList.remove("active"));v.classList.add("active");};
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

  document.addEventListener("DOMContentLoaded",boot);

  async function boot(){
    load();
    const cfg=await fetchJSON("data/config.json",DEFAULT_CONFIG);
    const chs=await fetchJSON("data/challenges.json",DEFAULT_CHALLENGES);
    state.config=cfg; state.challenges=chs;
    document.title=cfg.title; els.gameTitle.textContent=cfg.title; els.scoreGoal.textContent=cfg.goal||8;

    if(cfg.final){ if(cfg.final.heading)els.finalHeading.textContent=cfg.final.heading; if(cfg.final.subheading)els.finalSub.textContent=cfg.final.subheading; if(cfg.final.body)els.finalBody.textContent=cfg.final.body; if(cfg.final.audio){const s=document.createElement("source");s.src=cfg.final.audio;s.type="audio/mpeg";els.finalAudio.appendChild(s);} }
    setupRiddleUI();

    els.loginForm.addEventListener("submit",e=>{
      e.preventDefault();
      const u=norm(els.user.value),p=els.pass.value;
      if(u===norm(cfg.auth.username)&&p===cfg.auth.password){
        els.loginMsg.textContent="Benvinguda 💛";els.loginMsg.className="msg ok";
        setTimeout(()=>{swap(VIEWS.hub);renderGrid();updateProgress();},350);
      }else{els.loginMsg.textContent="Ups! Credencials incorrectes";els.loginMsg.className="msg err";}
    });

    els.btnShuffle?.addEventListener("click",()=>renderGrid(true));
    els.btnReset?.addEventListener("click",()=>{localStorage.removeItem(storageKey);state.solved={};state.score=0;renderGrid();updateProgress();});
    let t;els.easterReset?.addEventListener("pointerdown",()=>t=setTimeout(()=>els.btnReset.hidden=false,800));
    ["pointerup","pointerleave","pointercancel"].forEach(ev=>els.easterReset?.addEventListener(ev,()=>clearTimeout(t)));
    els.btnBack?.addEventListener("click",()=>{swap(VIEWS.hub);renderGrid();});
    els.btnSubmit?.addEventListener("click",onSubmit);
    els.btnRestart?.addEventListener("click",()=>{localStorage.removeItem(storageKey);state.solved={};state.score=0;swap(VIEWS.gate);});
  }

  async function fetchJSON(path,fallback){
    try{const res=await fetch(path,{cache:"no-cache"});if(!res.ok)throw 0;return await res.json();}
    catch{return structuredClone(fallback);}
  }

// --- RIDDLE UI logic (foto + enigma inicial) ---
function setupRiddleUI(){
  const btnShow = document.getElementById('btnShowRiddle');
  const riddleBox = document.getElementById('riddleBox');
  const riddleText = document.getElementById('riddleText');
  const riddleAnswer = document.getElementById('riddleAnswer');
  const riddleSubmit = document.getElementById('riddleSubmit');
  const riddleHintBtn = document.getElementById('riddleHint');
  const riddleMsg = document.getElementById('riddleMsg');
  const passwordInput = document.getElementById('password');

  // Attach toggle ALWAYS (encara que no hi hagi config) 👇
  btnShow?.addEventListener('click', ()=>{
    const hidden = window.getComputedStyle(riddleBox).display === 'none';
    riddleBox.style.display = hidden ? 'block' : 'none';
    if (hidden) riddleMsg.textContent = '';
  });

  // Si no hi ha gateRiddle, no fem la resta (però el toggle ja funciona)
  if (!state.config || !state.config.gateRiddle) return;
  const r = state.config.gateRiddle;

  // Si hi ha 'text' al config, l'escrivim; si no, es respecta l'HTML del index.html
  if (r.text) { riddleText.textContent = r.text; }

  riddleHintBtn?.addEventListener('click', ()=>{
    riddleMsg.textContent = r.hint || 'Pista no disponible.';
  });

  riddleSubmit?.addEventListener('click', ()=>{
    const val = (riddleAnswer.value || '')
      .toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
    const ok = Array.isArray(r.accept) && r.accept
      .map(a=>a.toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase())
      .includes(val);

    if(ok){
      riddleMsg.textContent = 'Correcte! Has descobert la pista. 🔓';
      riddleMsg.style.color = '';
      if (r.onCorrect === 'revealPassword' && state.config.auth?.password){
        passwordInput.value = state.config.auth.password;
        document.querySelector('#loginForm button[type="submit"]')?.focus();
      }
    } else {
      riddleMsg.textContent = 'No exactament... prova un altre cop o demana una pista.';
      riddleMsg.style.color = 'var(--err)';
    }
  });
}
