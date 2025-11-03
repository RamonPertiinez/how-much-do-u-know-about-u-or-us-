(() => {
  // ====== Joc 2 multi-nivell: "Endevina la foto borrosa" ======
  // Requereix a l'HTML aquests IDs: clip, btnStart, btnPause, time, guess, btnSubmit, feedback, after

  // --- Elements ---
  const els = {
    clip: document.getElementById('clip'),
    btnStart: document.getElementById('btnStart'),
    btnPause: document.getElementById('btnPause'),
    time: document.getElementById('time'),
    guess: document.getElementById('guess'),
    btnSubmit: document.getElementById('btnSubmit'),
    feedback: document.getElementById('feedback'),
    after: document.getElementById('after'),
  };

  // --- Config ---
  const START_SECONDS = 30;
  let remaining = START_SECONDS;
  let timerId = null;

  // Llista de nivells
  const LEVELS = [
    {
      src: '../../assets/video/game2/reveal.mp4',
      options: [
        'Estany de Sant Maurici','Estany Llong','Estany de Cavallers','Estany de Subenuix',
        'Estany Gento','Estany de Baborte','Estany de Certascan','Estany de Gerber',
        'Estany de Mar','Estany Negre de Cabanes'
      ],
      correct: 'Estany Negre de Cabanes',
      img: '../../assets/images/game2/correctreveal.jpg'
    },
    {
      src: '../../assets/video/game2/reveal2.mp4',
      options: [
        'SURFARIS INN on poppies 2','Theodor at Labuan Bajo','Amel House',
        'NeNa Eat & Sleep Kuta','Nucifera Kuta','Korurua Dijiwa Ubud'
      ],
      correct: 'Theodor at Labuan Bajo',
      img: '../../assets/images/game2/correctreveal2.jpeg'
    },
    {
      src: '../../assets/video/game2/reveal3.mp4',
      options: ['La Masella','Espot','Banhèras de Luishon','La Molina'],
      correct: 'Banhèras de Luishon',
      img: '../../assets/images/game2/correctreveal3.jpeg'
    },
    {
      src: '../../assets/video/game2/reveal4.mp4',
      options: [
        'Mirador de Humboldt, La Orotava','Playa de Benijo, Anaga',
        'Punta de Teno, Buenavista del Norte','Playa de los Guíos, Acantilado de los Gigantes'
      ],
      correct: 'Playa de los Guíos, Acantilado de los Gigantes',
      img: '../../assets/images/game2/correctreveal4.jpeg'
    },
    {
      src: '../../assets/video/game2/reveal5.mp4',
      options: ['Àmsterdam','Budapest','Andorra','Siurana'],
      correct: 'Budapest',
      img: '../../assets/images/game2/correctreveal5.jpeg'
    },
    {
      src: '../../assets/video/game2/reveal6.mp4',
      options: ['Allianz Stadium','Municipal de les Comes','Camp Nou','Camp Municipal de Poboleda'],
      correct: 'Allianz Stadium',
      img: '../../assets/images/game2/correctreveal6.jpeg'
    }
  ];

  let level = 0;
  let answered = false;

  // --- Utils ---
  const fmt = s => {
    s = Math.max(0, Math.floor(s));
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
  };

  function setTime(s){ remaining = s; if (els.time) els.time.textContent = fmt(remaining); }
  function stopTimer(){ clearInterval(timerId); timerId = null; }
  function startTimer(){
    stopTimer();
    timerId = setInterval(() => {
      remaining -= 1;
      setTime(remaining);
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  function msg(text, cls = ''){
    if (!els.feedback) return;
    els.feedback.textContent = text;
    els.feedback.className = `feedback ${cls}`.trim();
  }

  function lockAnswerUI(lock){
    if (!els.guess || !els.btnSubmit) return;
    els.guess.disabled = !!lock;
    els.btnSubmit.disabled = !!lock;
  }

  function fillOptions(opts){
    if (!els.guess) return;
    els.guess.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = ''; ph.textContent = '— Tria una opció —';
    els.guess.appendChild(ph);
    opts.forEach(o => {
      const op = document.createElement('option');
      op.value = o; op.textContent = o;
      els.guess.appendChild(op);
    });
  }

  function setVideo(src){
    if (!els.clip) return;
    els.clip.pause(); els.clip.currentTime = 0;
    els.clip.src = `${src}?v=${Date.now()}`; // cache-bust
    els.clip.load();
  }

  function clearAfter(){
    if (!els.after) return;
    els.after.innerHTML = '';
    els.after.classList.add('hidden');
  }

  // Collapsible amb la imatge correcta
  function showCorrectReveal(L){
    if (!L?.img || !els.clip) return;

    const wrap = document.createElement('section');
    wrap.className = 'reveal-collapsible';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'reveal-toggle';
    toggle.textContent = 'Veure la resposta correcta';

    const body = document.createElement('div');
    body.className = 'reveal-body';

    const card = document.createElement('div');
    card.className = 'reveal-card';

    const img = document.createElement('img');
    img.alt = 'Resposta correcta';
    img.loading = 'lazy';
    img.src = `${L.img}?v=${Date.now()}`;

    const cap = document.createElement('div');
    cap.className = 'cap';
    cap.innerHTML = `<strong>Resposta correcta</strong><br>${L.correct}`;

    card.appendChild(img); card.appendChild(cap);
    body.appendChild(card);
    wrap.appendChild(toggle); wrap.appendChild(body);

    els.clip.insertAdjacentElement('afterend', wrap);

    let open = false;
    const setOpen = (v) => {
      open = v;
      wrap.classList.toggle('open', open);
      body.style.maxHeight = open ? (body.scrollHeight + 'px') : '0px';
    };
    toggle.addEventListener('click', () => setOpen(!open));
    setTimeout(() => { setOpen(true); wrap.scrollIntoView({ behavior:'smooth', block:'start' }); }, 50);
  }

  function loadLevel(i){
    level = i; answered = false;
    stopTimer(); setTime(START_SECONDS);
    msg(''); clearAfter();
    document.querySelectorAll('.reveal-collapsible').forEach(n => n.remove());

    const L = LEVELS[level];
    if (!L) { showFinal(); return; }

    setVideo(L.src);
    fillOptions(L.options);
    lockAnswerUI(false);

    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  }

  // ✅ Marca el joc com fet i prepara els botons de sortida
  function showFinal(){
    try { localStorage.setItem('game2_done','1'); } catch {}
    msg('🎉 Has completat tots els nivells del Joc 2!', 'ok');

    // Botó que torna al Hub amb hash que el Hub entén
    const exitBtn = document.createElement('a');
    exitBtn.className = 'btn';
    exitBtn.textContent = 'Tornar als jocs';
    exitBtn.href = '../../index.html#done=game2';

    const replayBtn = document.createElement('button');
    replayBtn.className = 'btn';
    replayBtn.textContent = 'Repetir Joc 2';
    replayBtn.addEventListener('click', () => loadLevel(0));

    els.after.innerHTML = '';
    els.after.appendChild(exitBtn);
    els.after.appendChild(replayBtn);
    els.after.classList.remove('hidden');

    lockAnswerUI(true);
  }

  // --- Events ---
  els.btnStart?.addEventListener('click', () => {
    els.clip?.play(); startTimer();
    if (els.btnStart) els.btnStart.disabled = true;
    if (els.btnPause) els.btnPause.disabled = false;
    lockAnswerUI(false);
  });

  els.btnPause?.addEventListener('click', () => {
    els.clip?.pause(); stopTimer();
    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  });

  els.clip?.addEventListener('ended', () => {
    stopTimer();
    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  });

  els.btnSubmit?.addEventListener('click', (e) => {
    e.preventDefault();
    if (answered) return;

    const choice = (els.guess?.value || '').trim();
    if (!choice) { msg('Tria una opció abans d’enviar.', 'warn'); return; }

    answered = true; stopTimer();

    const L = LEVELS[level];
    const correct = L && choice === L.correct;

    if (correct) {
      msg('✅ Correcte!', 'ok');
      showCorrectReveal(L);

      const isLast = level >= LEVELS.length - 1;

      if (isLast) {
        // Últim nivell → marquem i oferim sortida
        showFinal();
      } else {
        // Nivell intermedi → botons següent / repetir
        els.after.innerHTML = '';
        const next = document.createElement('button');
        next.className = 'btn';
        next.textContent = 'Següent';
        next.addEventListener('click', () => { clearAfter(); loadLevel(level + 1); });

        const rep = document.createElement('button');
        rep.className = 'btn';
        rep.textContent = 'Repetir aquest nivell';
        rep.addEventListener('click', () => { clearAfter(); loadLevel(level); });

        els.after.appendChild(next);
        els.after.appendChild(rep);
        els.after.classList.remove('hidden');
      }
    } else {
      msg(`❌ Incorrecte. La bona era: ${L?.correct || '—'}.`, 'err');
      els.after.innerHTML = '';
      const retry = document.createElement('button');
      retry.className = 'btn';
      retry.textContent = 'Torna-ho a provar';
      retry.addEventListener('click', () => { clearAfter(); loadLevel(level); });

      const pass = document.createElement('button');
      pass.className = 'btn';
      pass.textContent = 'Passar al següent';
      pass.addEventListener('click', () => { clearAfter(); loadLevel(level + 1); });

      els.after.appendChild(retry);
      els.after.appendChild(pass);
      els.after.classList.remove('hidden');
    }

    lockAnswerUI(true);
  });

  // --- Init ---
  loadLevel(0);
})();
