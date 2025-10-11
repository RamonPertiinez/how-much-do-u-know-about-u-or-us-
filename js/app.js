(() => {
  // ---------- Utils ----------
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = (t) => (t || "").toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().toLowerCase();
  const log = (...a)=>{ console.log("[app]", ...a); };
  const fail = (msg,err)=>{ console.error("[app]", msg, err||""); const b=qs("#loginMsg"); if(b){ b.className="msg err"; b.textContent = msg; } };

  const VIEWS = { gate: qs("#gate"), hub: qs("#hub"), play: qs("#play"), final: qs("#final") };
  const els = {
    loginForm: qs("#loginForm"), user: qs("#username"), pass: qs("#password"), loginMsg: qs("#loginMsg"),
    progressFill: qs("#progressFill"), scoreNum: qs("#scoreNum"), scoreGoal: qs("#scoreGoal"),
    grid: qs("#challengeGrid"), btnShuffle: qs("#btnShuffle"), btnReset: qs("#btnReset"), easterReset: qs("#easterReset"),
    btnBack: qs("#btnBack"), chTitle: qs("#challengeTitle"), chIntro: qs("#challengeIntro"), chContent: qs("#challengeContent"),
    btnSubmit: qs("#btnSubmit"), feedback: qs("#feedback"),
    finalHeading: qs("#finalHeading"), finalSub: qs("#finalSubheading"), finalTitle: qs("#finalTitle"),
    finalBody: qs("#finalBody"), finalAudio: qs("#finalAudio"), btnRestart: qs("#btnRestart"),
    gameTitle: qs("#gameTitle"), confetti: qs("#confetti"),
  };

  const storageKey = "laura25-state-v1";
  const state = { config:null, challenges:[], solved:{}, score:0, current:null };

  // ---------- Defaults ----------
  const DEFAULT_CONFIG = {
    title: "Tens ganes de saber el teu regal? 😏",
    goal: 8,
    auth: { username: "laura", password: "08011" },
    final: {
      heading: "🎉 Sorpresa desbloquejada!",
      subheading: "Has superat les proves del meu cor.",
      body: "Al gener, porta la teva roba més elegant. Tinc reservat un lloc especial per sopar junts a Roma. 💛",
      audio: ""
    },
    gateRiddle: {
      hint: "Llegeix només les majúscules que veus pel text… potser amaguen una pregunta 😉",
      secretPhrase: "QUIN DIA ENS VAN FER AQUESTA FOTO",
      accept: ["23062025","23/06/2025","23-06-2025","23 de juny del 2025"],
      onCorrect: "revealPassword"
    }

  };

  const DEFAULT_CHALLENGES = [
    { id:"c1", title:"On va començar tot?", intro:"Recordes el primer lloc on vam dormir junts?", type:"text", emoji:"💭", answer:"poblenou", accept:["poble nou","poblenou"], score:1 },
    { id:"c2", title:"Endevina la cançó", intro:"Escolta el fragment i escriu el títol (pots provar ‘yellow’).", type:"audio", emoji:"🎵", src:"assets/audio/intro.mp3", accept:["yellow","yellow coldplay"], score:1 },
    { id:"c3", title:"Quina foto és?", intro:"Una pista borrosa d'un lloc nostre", type:"image-guess", emoji:"🖼️", src:"assets/images/sample.jpg", accept:["roma","colosseu","colosseum"], score:1 },
    { id:"c4", title:"El detall graciós", intro:"Quina és la meva mania més estranya segons tu?", type:"text", emoji:"😜", answer:"endreçar els coixins", accept:["endreçar coixins","endreçar els coixins","ordenar els coixins"], score:1 },
    { id:"c5", title:"Records en ordre", intro:"Ordena on vam viatjar (més antic → més recent)", type:"choice", emoji:"🧭",
      options:["Roma → Lisboa → Menorca","Lisboa → Menorca → Roma","Menorca → Roma → Lisboa"], answerIndex:2, score:1 }
  ];

  // ---------- Helpers ----------
  const save = ()=>localStorage.setItem(storageKey, JSON.stringify({solved:state.solved, score:state.score}));
  const load = ()=>{ try{ const d=JSON.parse(localStorage.getItem(storageKey)); if(d){ state.solved=d.solved||{}; state.score=d.score||0; } }catch{} };
  const swap = (v)=>{ Object.values(VIEWS).forEach(el=>el.classList.remove("active")); v.classList.add("active"); };
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  async function fetchJSON(path,fallback){
    try{ const res=await fetch(path,{cache:"no-cache"}); if(!res.ok) throw new Error(res.status+" "+res.statusText); return await res.json(); }
    catch(e){ console.warn(`[app] No s'ha trobat ${path}. Carregant per defecte.`, e); return structuredClone(fallback); }
  }

  // --- Amagar frase secreta: QUIN DIA ENS VAN FER AQUESTA FOTO ---
  function injectSecretCaps(root, phrase){
    if(!root) return;
    // 1) treu pista antiga si existís
    const oldClue = root.querySelector('.clue')?.parentElement;
    if (oldClue) oldClue.remove();

    // 2) frase → lletres (sense espais/punts) en majúscules
    const targetLetters = phrase.replace(/[^A-ZÀ-ÖØ-Þ]/gi, '').toUpperCase().split('');

    // 3) camina pels nodes de text i converteix a MAJÚSCULA la següent minúscula que coincideixi
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let i = 0;
    while (walker.nextNode() && i < targetLetters.length){
      const node = walker.currentNode;
      const src = node.nodeValue;
      if (!src || !src.trim()) continue;

      let out = '';
      for (const ch of src){
        const isLetter = /[a-zà-öø-ÿ]/i.test(ch);
        const canUp = isLetter && ch === ch.toLowerCase();
        if (canUp && i < targetLetters.length && ch.toLowerCase() === targetLetters[i].toLowerCase()){
          out += ch.toUpperCase();
          i++;
        } else {
          out += ch;
        }
      }
      if (out !== src) node.nodeValue = out;
    }
    // Si i < targetLetters.length no fem res visible: queda discret encara que no càpiga tot.
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    try{ boot(); }catch(e){ fail("Error iniciant l’app. Prova a fer Reinicia joc 🔄", e); }
  });

  async function boot(){
    load();
    const cfg = await fetchJSON("data/config.json", DEFAULT_CONFIG);
    const chs = await fetchJSON("data/challenges.json", DEFAULT_CHALLENGES);
    state.config = cfg; state.challenges = chs;

    // Apply UI config
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

      // Amaga la frase a la primera pantalla segons el config
      injectSecretCaps(riddleText, r.secretPhrase || "QUIN DIA ENS VAN FER AQUESTA FOTO");


    // Login
    els.loginForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      try{
        const u = norm(els.user.value), p = els.pass.value;
        if(u === norm(cfg.auth.username) && p === cfg.auth.password){
          els.loginMsg.textContent = "Benvinguda 💛"; els.loginMsg.className = "msg ok";
          setTimeout(()=>{ swap(VIEWS.hub); renderGrid(); updateProgress(); }, 350);
        } else {
          els.loginMsg.textContent = "Ups! Credencials incorrectes"; els.loginMsg.className = "msg err";
        }
      }catch(err){ fail("Error al validar credencials", err); }
    });

    // Hub
    els.btnShuffle?.addEventListener("click", ()=>renderGrid(true));
    els.btnReset?.addEventListener("click", ()=>{ localStorage.removeItem(storageKey); state.solved={}; state.score=0; renderGrid(); updateProgress(); });
    let t; els.easterReset?.addEventListener("pointerdown",()=>t=setTimeout(()=>els.btnReset.hidden=false,800));
    ["pointerup","pointerleave","pointercancel"].forEach(ev=>els.easterReset?.addEventListener(ev,()=>clearTimeout(t)));

    // Play
    els.btnBack?.addEventListener("click", ()=>{ swap(VIEWS.hub); renderGrid(); });
    els.btnSubmit?.addEventListener("click", onSubmit);

    // Final
    els.btnRestart?.addEventListener("click", ()=>{ localStorage.removeItem(storageKey); state.solved={}; state.score=0; swap(VIEWS.gate); });

    log("Inici OK");
  }

  // ---------- Riddle ----------
  function setupRiddleUI(){
    const btnShow = document.getElementById('btnShowRiddle');
    const riddleBox = document.getElementById('riddleBox');
    const riddleText = document.getElementById('riddleText');
    const riddleAnswer = document.getElementById('riddleAnswer');
    const riddleSubmit = document.getElementById('riddleSubmit');
    const riddleHintBtn = document.getElementById('riddleHint');
    const riddleMsg = document.getElementById('riddleMsg');
    const passwordInput = document.getElementById('password');

    // Toggle sempre actiu
    btnShow?.addEventListener('click', ()=>{
      const hidden = getComputedStyle(riddleBox).display === 'none';
      riddleBox.style.display = hidden ? 'block' : 'none';
      if (hidden) riddleMsg.textContent = '';
    });

    if (!state.config || !state.config.gateRiddle) return;
    const r = state.config.gateRiddle;

    // Si hi ha 'text' al config, l’escrivim; si no, respectem l’HTML del index.html
    if (r.text) { riddleText.textContent = r.text; }

    // *** NOVETAT: amaga la frase a la primera pantalla ***
    injectSecretCaps(riddleText, "QUIN DIA ENS VAN FER AQUESTA FOTO");

    riddleHintBtn?.addEventListener('click', ()=>{
      riddleMsg.textContent = r.hint || 'Pista no disponible.';
    });

    riddleSubmit?.addEventListener('click', ()=>{
      try{
        const val = norm(riddleAnswer.value);
        const ok = Array.isArray(r.accept) && r.accept.map(norm).includes(val);
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
      }catch(err){ fail("Error comprovant la pista", err); }
    });
  }

  // ---------- Progress / Final ----------
  function updateProgress(){
    const goal = state.config.goal || 8;
    const p = Math.min(100, (state.score/goal)*100);
    els.progressFill.style.width = p+"%";
    els.scoreNum.textContent = state.score;
    if (state.score >= goal){
      celebrate();
      setTimeout(()=>{ swap(VIEWS.final); try{ els.finalAudio?.play().catch(()=>{});}catch{} }, 600);
    }
  }

  function celebrate(){
    const c = els.confetti; c.innerHTML="";
    for(let i=0;i<80;i++){
      const s=document.createElement("span");
      s.style.position="fixed"; s.style.left=Math.random()*100+"vw"; s.style.top="-10px";
      s.style.width=s.style.height=8+Math.random()*8+"px";
      s.style.background=`hsl(${Math.random()*360},80%,60%)`; s.style.opacity=".9"; s.style.borderRadius="2px";
      s.style.transform=`rotate(${Math.random()*360}deg)`; s.style.transition="transform 1.2s ease, top 1.2s ease";
      c.appendChild(s);
      requestAnimationFrame(()=>{ s.style.top="110vh"; s.style.transform=`translateY(100vh) rotate(${Math.random()*720}deg)`; });
      setTimeout(()=>s.remove(),1500);
    }
  }

  // ---------- Hub ----------
  function renderGrid(shuffleNow=false){
    let list = state.challenges.slice(); if(shuffleNow) list = shuffle(list);
    els.grid.innerHTML = "";
    list.forEach(ch=>{
      const t=document.createElement("button");
      t.className="tile"; t.dataset.id=ch.id; t.setAttribute("role","listitem");
      t.innerHTML = `<h3>${ch.emoji||"🎯"} ${ch.title}</h3>
        <div class="badges">
          <span class="badge">${ch.type}</span>
          ${state.solved[ch.id] ? '<span class="badge">✅ Fet</span>' : '<span class="badge">❓</span>'}
        </div>`;
      if (state.solved[ch.id]) t.classList.add("solved");
      t.addEventListener("click", ()=>openChallenge(ch.id));
      els.grid.appendChild(t);
    });
  }

  // ---------- Play ----------
  function openChallenge(id){
    const ch = state.challenges.find(x=>x.id===id); if(!ch) return;
    state.current = ch;

    els.chTitle.classList.toggle("handwritten", !!ch.handTitle);
    els.chTitle.textContent = `${ch.emoji||""} ${ch.title}`;
    els.chIntro.textContent = ch.intro || "";
    els.feedback.textContent = ""; els.feedback.className = "msg";

    const c = els.chContent; c.innerHTML = "";
    if (ch.type==="choice"){
      ch.options.forEach((opt,i)=>{
        const lbl=document.createElement("label"); lbl.className="option";
        lbl.innerHTML=`<input type="radio" name="opt" value="${i}"> ${opt}`;
        c.appendChild(lbl);
      });
    } else if (["text","audio","image-guess"].includes(ch.type)){
      if (ch.type==="audio"){ const au=document.createElement("audio"); au.controls=true; au.className="audio-ctrl"; au.src=ch.src||""; c.appendChild(au); }
      if (ch.type==="image-guess"){ const img=document.createElement("img"); img.src=ch.src||""; img.alt="pista"; img.style.filter="blur(6px)"; c.appendChild(img); }
      const inp=document.createElement("input"); inp.type="text"; inp.placeholder=ch.placeholder||"Escriu la resposta"; inp.id="textAnswer"; c.appendChild(inp);
    } else {
      c.textContent = "Tipus no implementat encara.";
    }
    swap(VIEWS.play);
  }

  // ---------- Validació ----------
  function onSubmit(){
    const ch = state.current; if(!ch) return;
    let ok=false;
    if (ch.type==="choice"){
      const sel=document.querySelector('input[name="opt"]:checked');
      ok = sel && Number(sel.value)===Number(ch.answerIndex);
    } else {
      const el = qs("#textAnswer"); const val = norm(el?.value);
      ok = Array.isArray(ch.accept) ? ch.accept.map(norm).includes(val) : norm(ch.answer)===val;
    }
    if(ok){
      if(!state.solved[ch.id]){ state.solved[ch.id]=true; state.score+=ch.score||1; save(); }
      els.feedback.textContent="Correcte! 🥳"; els.feedback.className="msg ok";
      setTimeout(()=>{ swap(VIEWS.hub); renderGrid(); updateProgress(); }, 600);
    } else {
      els.feedback.textContent="Mmm… intenta-ho una altra vegada!"; els.feedback.className="msg err";
      if(ch.type==="image-guess"){ const img=els.chContent.querySelector("img"); if(img) img.style.filter="blur(3px)"; }
    }
  }
})();
